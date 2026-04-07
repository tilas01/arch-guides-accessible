---
title: 06. Setup Wi-Fi with iwd and NetworkManager
author: tilas01 (Gemini Code Assist)
date: 2026-04-07
---

# 06. Setup Wi-Fi with iwd and NetworkManager

This guide provides instructions for setting up Wi-Fi connectivity using `iwd` as the backend for `NetworkManager`, and configuring `systemd-resolved` for robust DNS management. This setup is recommended for reliable and secure network access after your Arch Linux installation.

## 1. Install NetworkManager and iwd

These packages should ideally be installed during the `pacstrap` phase of your Arch Linux installation. If you missed them, you can install them now while in `arch-chroot` or by booting from your Arch installation medium and `arch-chroot`ing into your system.

```bash
pacman -S networkmanager iwd
```

## 2. Enable NetworkManager and iwd Services

Enable the necessary systemd services.

```bash
systemctl enable NetworkManager
systemctl enable iwd
```

## 3. Configure NetworkManager to use iwd as Wi-Fi Backend

Create a configuration file to tell NetworkManager to use `iwd` for Wi-Fi.

Create the file `/etc/NetworkManager/conf.d/wifi_backend.conf`:

```diff
--- /dev/null
+++ b/arch-guides-all-new/docs/etc/NetworkManager/conf.d/wifi_backend.conf
@@ -0,0 +1,2 @@
+[device]
+wifi.backend=iwd
```

## 4. Restart NetworkManager and iwd

Apply the changes by restarting the services.

```bash
sudo systemctl restart NetworkManager
sudo systemctl restart iwd # May not be strictly necessary, but good practice
```

## 5. Connect to Wi-Fi with `nmcli`

Use `nmcli` (NetworkManager Command Line Interface) to list available Wi-Fi networks and connect.

```bash
nmcli device wifi list # List available Wi-Fi networks
nmcli device wifi connect "{ssid}" --ask # Replace {ssid} with your network name
```
You will be prompted for your Wi-Fi password.

## 6. Confirm Your Connection

Verify that you are connected to the internet.

```bash
nmcli # Confirm "Connected to {ssid}" at the top
ping archlinux.org
```

## 7. Setup Local DNS Caching, DoT, DoH with `systemd-resolved`

This section configures `systemd-resolved` for enhanced DNS management, including local caching, DNS over TLS (DoT), DNS over HTTPS (DoH), and disabling LLMNR/Multicast DNS for improved security and privacy.

**Note:** While `systemd-resolved` is a robust solution, alternatives like `dnsmasq` or `unbound` are also available. Consult the Arch Wiki if you prefer a different DNS resolver.

### Install `systemd-resolved` (if not already installed)

It should typically be installed as part of the `base` group.

```bash
pacman -Sy systemd-resolved
```

### Configure NetworkManager to use `systemd-resolved`

Create the file `/etc/NetworkManager/conf.d/dns.conf`:

```diff
--- /dev/null
+++ b/arch-guides-all-new/docs/etc/NetworkManager/conf.d/dns.conf
@@ -0,0 +1,2 @@
+[main]
+dns=systemd-resolved
```

### Link System `resolv.conf` to `systemd-resolved`

Create a symbolic link for `resolv.conf` to point to `systemd-resolved`'s stub resolver.

```bash
ln -sf /run/systemd/resolve/stub-resolv.conf /etc/resolv.conf
```

### Create Configuration File for `systemd-resolved`

This file (`/etc/systemd/resolved.conf`) will contain your DNS settings. The example below uses Quad9 for privacy and filtering.

Create the file `/etc/systemd/resolved.conf`:

```diff
--- /dev/null
+++ b/arch-guides-all-new/docs/etc/systemd/resolved.conf
@@ -0,0 +1,12 @@
+[Resolve]
+# Example using Quad9 DNS servers (replace with your preferred DNS providers)
+# DNS=9.9.9.9#dns.quad9.net 149.112.112.112#dns.quad9.net
+# FallbackDNS=2620:fe::fe 2620:fe::9
+DNS=9.9.9.9 149.112.112.112
+FallbackDNS=2620:fe::fe 2620:fe::9
+DNSSEC=true
+DNSOverTLS=yes
+# DNSOverHTTPS=yes # Uncomment if you prefer DoH over DoT, or use both
+Cache=yes
+LLMNR=no
+MulticastDNS=no
+DNSStubListener=yes
```

**Explanation of settings:**

*   `DNS`: Primary DNS servers. You can specify DoT hostnames (e.g., `9.9.9.9#dns.quad9.net`) or just IP addresses.
*   `FallbackDNS`: Secondary DNS servers.
*   `DNSSEC=true`: Enables DNS Security Extensions for validating DNS responses.
*   `DNSOverTLS=yes`: Encrypts DNS queries using TLS.
*   `DNSOverHTTPS=yes`: Encrypts DNS queries using HTTPS (alternative to DoT).
*   `Cache=yes`: Enables local DNS caching for faster lookups.
*   `LLMNR=no`: Disables Link-Local Multicast Name Resolution (security measure).
*   `MulticastDNS=no`: Disables Multicast DNS (security measure).
*   `DNSStubListener=yes`: Enables the local stub resolver at `127.0.0.53:53`.

### Enable and Start `systemd-resolved`

```bash
sudo systemctl enable systemd-resolved.service
sudo systemctl start systemd-resolved.service
```

### Restart NetworkManager and systemd-resolved

```bash
sudo systemctl restart NetworkManager systemd-resolved
```

### Check DNS Stub Listener

Confirm that the DNS stub listener is active on `127.0.0.53:53`.

```bash
ss -tulpn | grep 53
```
You should see output indicating `systemd-resolved` listening on `127.0.0.53:53`. If not, reboot and check again.

## Troubleshooting

If you experience connectivity issues, try restarting your system and all relevant network services (`NetworkManager`, `iwd`, `systemd-resolved`). Ensure all network-related services are enabled.

*   NetworkManager Arch Wiki Page
*   DNS Management with NetworkManager
*   iwd Arch Wiki Page
*   systemd-resolved Arch Wiki Page

#### Credits
*   **Author:** tilas01 (Gemini Code Assist)
*Please do not remove credits when sharing, modifying, or publishing this guide.*