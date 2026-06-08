#!/bin/bash
# Advanced Evil Maid Detection & Remediation
# Hashes the /efi partition on shutdown and verifies on boot.
# If tampering is detected, it secretly backs up the tampered files for analysis
# and restores the known-good files from the encrypted root.

ESP_DIR="/efi"
SECURE_DIR="/var/lib/evilmaid"
HASH_FILE="$SECURE_DIR/esp_hash.sha256"
BACKUP_DIR="$SECURE_DIR/backup"
COMPROMISED_DIR="$SECURE_DIR/compromised"
BAIT_FILE="$ESP_DIR/tripwire.txt"

mkdir -p "$SECURE_DIR" "$BACKUP_DIR" "$COMPROMISED_DIR"

case "$1" in
    setup)
        echo "Setting up Advanced Evil Maid Detector..."
        echo "This is a bait file. Do not modify." > "$BAIT_FILE"
        
        cat << 'EOF' > /etc/systemd/system/evil-maid-hash.service
[Unit]
Description=Hash and Backup ESP for Evil Maid Detection
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
Description=Verify and Restore ESP for Evil Maid Detection
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
        # Calculate hash of ESP and backup files securely inside encrypted root
        find "$ESP_DIR" -type f -exec sha256sum {} + | sort > "$HASH_FILE"
        rsync -a --delete "$ESP_DIR/" "$BACKUP_DIR/"
        ;;
    verify)
        if [ ! -f "$HASH_FILE" ]; then
            echo "WARNING: No hash file found! Has the system been tampered with?" | wall
            exit 1
        fi
        
        TMP_HASH=$(mktemp)
        find "$ESP_DIR" -type f -exec sha256sum {} + | sort > "$TMP_HASH"
        
        if ! cmp -s "$HASH_FILE" "$TMP_HASH"; then
            TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
            ANALYSIS_DIR="$COMPROMISED_DIR/$TIMESTAMP"
            mkdir -p "$ANALYSIS_DIR"
            
            # Secretly backup the compromised files for analysis
            cp -r "$ESP_DIR/"* "$ANALYSIS_DIR/"
            
            # Generate diff between known-good backup and compromised files
            diff -urN "$BACKUP_DIR" "$ANALYSIS_DIR" > "$ANALYSIS_DIR/tamper.diff" || true
            
            # Restore the real, uncompromised files to the ESP
            rsync -a --delete "$BACKUP_DIR/" "$ESP_DIR/"
            
            # Alert the user
            echo "CRITICAL ALERT: EVIL MAID DETECTED!" | wall
            echo "The /efi partition was modified offline. The compromised files have been saved to $ANALYSIS_DIR for analysis." | wall
            echo "The known-good boot files have been automatically restored to protect the system." | wall
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
