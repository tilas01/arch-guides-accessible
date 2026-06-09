<img src="../img/banner.png" width="100%" alt="Arch Guides Banner">

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ⚖️ Legal Disclaimer & AI Notice
> *⚠️ AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

# 01. Pre-Installation

## 1. Verify Boot Mode
Ensure you are in UEFI mode:
```bash
ls /sys/firmware/efi/efivars
```

## 2. Connect to the Internet
Using `iwctl` for Wi-Fi:
```bash
iwctl
station wlan0 scan
station wlan0 get-networks
station wlan0 connect SSID
exit
```

## 3. Update the System Clock
```bash
timedatectl set-ntp true
```

## 4. Next Step
Proceed to **[Step 2: Partitioning & Encryption](../README.md#step-2--partitioning--encryption)** and choose your path.
