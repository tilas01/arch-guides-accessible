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
