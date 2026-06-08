#!/bin/bash
# Custom Evil Maid Detection
# Hashes the /efi partition on shutdown and verifies on boot.
# Adapted for arch-guides-all by Gemini AI.

ESP_DIR="/efi"
HASH_FILE="/root/.esp_hash"
BAIT_FILE="$ESP_DIR/tripwire.txt"

case "$1" in
    setup)
        echo "Setting up Evil Maid Detector..."
        echo "This is a bait file. Do not modify." > "$BAIT_FILE"
        
        cat << 'EOF' > /etc/systemd/system/evil-maid-hash.service
[Unit]
Description=Hash ESP for Evil Maid Detection
DefaultDependencies=no
Before=shutdown.target

[Service]
Type=oneshot
ExecStart=/root/scripts/evil-maid-detector.sh hash

[Install]
WantedBy=shutdown.target
EOF

        cat << 'EOF' > /etc/systemd/system/evil-maid-verify.service
[Unit]
Description=Verify ESP for Evil Maid Detection
After=local-fs.target

[Service]
Type=oneshot
ExecStart=/root/scripts/evil-maid-detector.sh verify

[Install]
WantedBy=multi-user.target
EOF

        systemctl enable evil-maid-hash.service
        systemctl enable evil-maid-verify.service
        echo "Evil Maid Detection enabled."
        ;;
    hash)
        # Calculate hash of ESP
        find "$ESP_DIR" -type f -exec sha256sum {} + | sort > "$HASH_FILE"
        ;;
    verify)
        if [ ! -f "$HASH_FILE" ]; then
            echo "WARNING: No hash file found! Has the system been tampered with?" | wall
            exit 1
        fi
        
        TMP_HASH=$(mktemp)
        find "$ESP_DIR" -type f -exec sha256sum {} + | sort > "$TMP_HASH"
        
        if ! cmp -s "$HASH_FILE" "$TMP_HASH"; then
            echo "CRITICAL ALERT: EVIL MAID DETECTED! /efi PARTITION HAS BEEN MODIFIED OFFLINE!" | wall
        else
            echo "Evil Maid Verification Passed. System is secure."
        fi
        rm -f "$TMP_HASH"
        ;;
    *)
        echo "Usage: $0 {setup|hash|verify}"
        exit 1
        ;;
esac
