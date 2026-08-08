<!-- Part of the Unix Security Suite. -->

# AUR Guard

Reads an AUR `PKGBUILD` and its `.install` files **before `makepkg` runs any of
them**, and points at the parts worth reading yourself.

An AUR package is a build script a stranger wrote. There is no review process,
and `makepkg` runs it as your user before anything is installed. Your helper
will pull a malicious commit pushed today to a package that was clean for two
years, without comment.

## What it does

Static, read-only. It never executes the `PKGBUILD`, never needs root, and
never touches the network.

```bash
aur-guard ./PKGBUILD
aur-guard --dir ~/.cache/paru/clone/some-package
aur-guard --json ./PKGBUILD | jq          # for hooking into a helper
```

It reads `PKGBUILD`, any `*.install`, and any `*.sh` or `*.hook` alongside them.
`.install` files matter more than the build script, not less — they run **as
root** at install time.

## What it looks for

| Pattern | Why it is worth stopping for |
|---|---|
| `curl … \| sh`, `wget … \| bash` | Executes whatever the server returns at that moment. The code you reviewed is not the code that runs. |
| `sha256sums=('SKIP')` | Downloads are not verified at all. With an unpinned `git+https://` source you get whatever the branch points at. |
| `sudo`/`su`/`doas` inside a build function | Build functions have no business escalating. Legitimate root work belongs in the `.install` file. |
| Writes outside `$srcdir` / `$pkgdir` | Escaping the packaging model — `$HOME`, `/etc`, `/usr/bin` during `build()`. |
| `~/.ssh`, `~/.gnupg`, `authorized_keys`, `.bashrc`, `crontab`, `/etc/sudoers` | Reaching for credentials or persistence. |
| `base64 -d`, `eval`, runs of `\x` escapes | Obfuscation. Build scripts have no legitimate need to hide their contents. |
| Network access in `package()` | `package()` should only move already-built files into place. |
| Source host unrelated to the package | A `-bin` package pulling from a personal file host is exactly how this goes wrong. |
| `git+https://` with no `#commit=` / `#tag=` | Builds whatever the branch points at when you run it. |
| `systemctl enable/start`, `udevadm` | The difference between "a program on disk" and "a program that runs". |

Each finding names the file, the 1-indexed line, the function it sits in, and a
stable id you can script against.

## Honest limitations

**It will never tell you a package is safe.** A report with no findings means
*no known-bad pattern matched* — a much weaker statement than "this is fine".

- It is a substring scanner, not a shell parser. Anyone writing a deliberately
  malicious `PKGBUILD` can evade it; shell is far too flexible for this class of
  tool to be a verdict. Splitting a string across variables defeats it.
- Scope tracking is brace counting, so it is wrong on braces inside strings.
  That downgrades a finding's *context*, it does not hide the finding — the
  checks that do not care about scope run on every line regardless.
- It does not evaluate variables, follow `source`d files, or understand
  `$(...)` substitution.
- It says nothing about the *maintainer*. Ownership transfer is a normal part of
  a supply-chain attack; check the AUR page's comments and history yourself.

### The exit codes are deliberately awkward

| Code | Meaning |
|---|---|
| `1` | Something matched at **STOP** |
| `3` | Something matched at **REVIEW** or **NOTE** |
| `2` | **Nothing matched** |

`2`, not `0`, when nothing matched — on purpose. The obvious thing to type is
`aur-guard && makepkg`, and if a clean scan exited 0 that pipeline would
silently authorise the build. That is exactly the "it said it was fine" failure
this tool exists to prevent. Making it non-zero means the decision stays yours.

`--exit-zero-when-clean` overrides this if you have read the above and still
want it in a pipeline.

Anything it could not read is listed under "NOT analysed" rather than skipped
quietly, because "I did not look at that file" is information you need.

## The most effective hardening is wanting fewer AUR packages

Check the official repositories and Flatpak first. Prefer source-built packages
over `-bin` ones — you can at least read what is being compiled. For anything
you only need occasionally, a container or a VM costs less than trusting a build
script. And use a helper that shows you the diff on update:

```bash
paru --review            # or: yay --answerdiff All
```

## Verifying a release binary

```bash
gpg --import tilas01.asc
gpg --fingerprint 5CC1B2BED4D05F65E9E965423AA74BEC12F3D5ED   # compare against the root README
gpg --verify aur-guard.sig aur-guard
sha512sum -c aur-guard.sha512
```

## Licence

See the repository root.
