#!/usr/bin/env bash
#
# security-alert.sh — deliver a security alert on any Arch setup.
#
# The problem this solves: a notification that only works on one display stack is
# a notification you cannot rely on. notify-send needs a session bus and a running
# notification daemon, so it silently does nothing on a bare TTY, during early
# boot, or over SSH. This tries every channel available and always leaves a
# durable record.
#
# Channels, in order — all of them are attempted, not just the first that works:
#   1. Desktop notification (Wayland or Xorg) via notify-send, for every logged-in
#      user, with the correct DBUS_SESSION_BUS_ADDRESS discovered per user.
#   2. A blocking GUI dialog (zenity / kdialog / yad), so a critical alert cannot
#      be missed as a transient toast.
#   3. systemd-ask-password, which reaches plymouth and the console during boot.
#   4. wall, so every TTY and SSH session sees it.
#   5. Direct writes to /dev/tty1..6 for the case where wall is unavailable.
#   6. logger -> journald, always, as the durable record.
#   7. An on-disk log at /var/log/arch-security-alerts.log.
#
# Usage:
#   security-alert.sh <severity> <title> <body> [detail-file]
#     severity: info | warning | critical
#
# Example:
#   security-alert.sh critical "Boot integrity failed" \
#       "/boot hash does not match the recorded baseline." /tmp/aem-report.txt
#
# Author: tilas01 · CC BY-NC-SA 4.0 · Provided AS IS, no warranty.

set -uo pipefail

SEVERITY="${1:-warning}"
TITLE="${2:-Security Alert}"
BODY="${3:-}"
DETAIL_FILE="${4:-}"

readonly LOG_FILE=/var/log/arch-security-alerts.log
readonly SPOOF_NOTICE="This alert can itself be spoofed by malware already running
on this machine. Treat it as a prompt to investigate, not as proof. Verify from
a known-good system or live medium before trusting any instruction it gives you.
You act at your own risk."

case "$SEVERITY" in
    critical) URGENCY=critical; ICON=dialog-error;   PREFIX="CRITICAL" ;;
    warning)  URGENCY=critical; ICON=dialog-warning; PREFIX="WARNING"  ;;
    *)        URGENCY=normal;   ICON=dialog-information; PREFIX="INFO" ;;
esac

DETAIL=""
if [[ -n "$DETAIL_FILE" && -r "$DETAIL_FILE" ]]; then
    DETAIL="$(cat "$DETAIL_FILE")"
fi

FULL_TEXT="[$PREFIX] $TITLE

$BODY
${DETAIL:+
$DETAIL
}
$SPOOF_NOTICE"

# ── 7. Durable log first, so the record exists even if everything else fails ──
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
{
    printf '=== %s | %s | %s ===\n' "$(date -Is 2>/dev/null || date)" "$PREFIX" "$TITLE"
    printf '%s\n\n' "$FULL_TEXT"
} >> "$LOG_FILE" 2>/dev/null || true
chmod 600 "$LOG_FILE" 2>/dev/null || true

# ── 6. journald ──
if command -v logger >/dev/null 2>&1; then
    printf '%s\n' "$FULL_TEXT" | logger -t arch-security -p "auth.${SEVERITY/critical/crit}" 2>/dev/null || true
fi

# ── 1 & 2. Per-user desktop notification and dialog ──
# Works on both Wayland and Xorg: the session bus address is read from the user's
# own environment rather than assumed, which is what makes this display-agnostic.
notify_graphical_users() {
    command -v loginctl >/dev/null 2>&1 || return 0

    local uid user
    while read -r uid user; do
        [[ -z "${uid:-}" ]] && continue
        local bus="unix:path=/run/user/${uid}/bus"
        [[ -S "/run/user/${uid}/bus" ]] || continue

        # Desktop toast.
        if command -v notify-send >/dev/null 2>&1; then
            sudo -u "$user" \
                DBUS_SESSION_BUS_ADDRESS="$bus" \
                XDG_RUNTIME_DIR="/run/user/${uid}" \
                notify-send --urgency="$URGENCY" --icon="$ICON" \
                    --app-name="Arch Security" \
                    "$PREFIX: $TITLE" "$BODY

$SPOOF_NOTICE" 2>/dev/null || true
        fi

        # Blocking dialog for anything critical, so it cannot be missed.
        if [[ "$SEVERITY" == "critical" ]]; then
            local dialog=""
            for candidate in zenity kdialog yad; do
                command -v "$candidate" >/dev/null 2>&1 && { dialog="$candidate"; break; }
            done
            case "$dialog" in
                zenity)
                    sudo -u "$user" DBUS_SESSION_BUS_ADDRESS="$bus" \
                        XDG_RUNTIME_DIR="/run/user/${uid}" \
                        zenity --error --width=520 --title="$PREFIX: $TITLE" \
                               --text="$FULL_TEXT" >/dev/null 2>&1 &
                    ;;
                kdialog)
                    sudo -u "$user" DBUS_SESSION_BUS_ADDRESS="$bus" \
                        XDG_RUNTIME_DIR="/run/user/${uid}" \
                        kdialog --error "$FULL_TEXT" --title "$PREFIX: $TITLE" >/dev/null 2>&1 &
                    ;;
                yad)
                    sudo -u "$user" DBUS_SESSION_BUS_ADDRESS="$bus" \
                        XDG_RUNTIME_DIR="/run/user/${uid}" \
                        yad --error --width=520 --title="$PREFIX: $TITLE" \
                            --text="$FULL_TEXT" >/dev/null 2>&1 &
                    ;;
            esac
        fi
    done < <(loginctl list-sessions --no-legend 2>/dev/null | awk '{print $2, $3}' | sort -u)
}
notify_graphical_users

# ── 3. Boot-time / console prompt ──
# systemd-ask-password reaches plymouth and the console, which is the only thing
# that works before a session exists.
if [[ "$SEVERITY" == "critical" ]] && command -v systemd-ask-password >/dev/null 2>&1; then
    if [[ ! -d /run/systemd/system ]] || [[ -n "${ARCH_SECURITY_BOOT_ALERT:-}" ]]; then
        systemd-ask-password --timeout=60 --echo=no \
            "$PREFIX: $TITLE — $BODY (press Enter to acknowledge)" >/dev/null 2>&1 || true
    fi
fi

# ── 4. Every TTY and SSH session ──
if command -v wall >/dev/null 2>&1; then
    printf '%s\n' "$FULL_TEXT" | wall -n 2>/dev/null || printf '%s\n' "$FULL_TEXT" | wall 2>/dev/null || true
fi

# ── 5. Direct TTY writes, for when wall is not available ──
for tty in /dev/tty1 /dev/tty2 /dev/tty3 /dev/tty4 /dev/tty5 /dev/tty6; do
    [[ -w "$tty" ]] || continue
    {
        printf '\n\033[1;31m'
        printf '########################################################\n'
        printf '##  %-50s##\n' "$PREFIX: $TITLE"
        printf '########################################################\033[0m\n'
        printf '%s\n\n' "$BODY"
        [[ -n "$DETAIL" ]] && printf '%s\n\n' "$DETAIL"
        printf '\033[0;33m%s\033[0m\n\n' "$SPOOF_NOTICE"
    } > "$tty" 2>/dev/null || true
done

# ── Interactive acknowledgement when run from a terminal ──
# Only when there is a real TTY on stdin; never blocks a daemon.
if [[ "$SEVERITY" == "critical" && -t 0 ]]; then
    printf '\n\033[1;31m%s: %s\033[0m\n' "$PREFIX" "$TITLE"
    printf '%s\n\n' "$BODY"
    [[ -n "$DETAIL" ]] && printf '%s\n\n' "$DETAIL"
    printf '\033[0;33m%s\033[0m\n\n' "$SPOOF_NOTICE"
    printf 'Type ACK to acknowledge, or anything else to abort: '
    read -r _ack
    [[ "$_ack" == "ACK" ]] || exit 2
fi

exit 0
