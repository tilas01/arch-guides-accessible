# Arch Linux Command Cheatsheet

> [!TIP]
> Keep your system updated frequently to avoid rolling-release breakages.

## Package Management (pacman)
- **Update System**: `sudo pacman -Syu`
- **Install Package**: `sudo pacman -S package_name`
- **Search Package**: `pacman -Ss search_term`
- **Remove Package (and unneeded dependencies)**: `sudo pacman -Rns package_name`
- **Clear Package Cache**: `sudo pacman -Scc`

## Package Management (AUR / paru)

> [!WARNING]
> AUR packages are user-produced content. Read the PKGBUILD before installing.

- **Install AUR Package**: `paru -S package_name`
- **Update System + AUR**: `paru -Syu`

## System Services (systemd)
- **Start Service**: `sudo systemctl start service_name`
- **Enable Service (Starts on Boot)**: `sudo systemctl enable service_name`
- **Check Status**: `systemctl status service_name`
- **View Logs (Journalctl)**: `journalctl -u service_name -e`

## BTRFS Snapshots (snapper)

> [!NOTE]
> Snapshots are your safety net. Always snapshot before major updates!

- **List Snapshots**: `sudo snapper ls`
- **Create Snapshot**: `sudo snapper create -c timeline -d "Manual backup"`
- **Rollback System**: Reboot, select snapshot from GRUB/Systemd-boot, and run `sudo snapper rollback`

## Security Suite Tools
- **Verify ISO**: `arch-iso-verifier`
- **Libre OTP Configuration**: `libre-otp-cli generate --username <user>`
- **Check Input Guard Logs**: `journalctl -u input-guard -e`
