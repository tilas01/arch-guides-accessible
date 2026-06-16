import re

with open('website/script.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the SSD wiping logic inside the mkinitcpio hook
old_logic = r"""#   _disk_basename=\$\(basename \$disk\)
    #   if \[ "\$\(cat /sys/block/\$_disk_basename/queue/rotational 2>/dev/null\)" = "0" \]; then
    #       # SSD detected: Use blkdiscard \(NVMe Secure Erase\) \+ 1 fallback shred pass
    #       nohup blkdiscard -s -f \$disk \|\| blkdiscard -f \$disk >/dev/null 2>&1
    #       nohup shred -n 1 -z \$disk >/dev/null 2>&1 &
    #   else"""

new_logic = r"""#   _disk_basename=$(basename $disk)
    #   if [ "$(cat /sys/block/$_disk_basename/queue/rotational 2>/dev/null)" = "0" ]; then
    #       # SSD detected: Use blkdiscard (NVMe Secure Erase) 10 times (0 wear and tear)
    #       for i in {1..10}; do
    #           nohup blkdiscard -s -f $disk || blkdiscard -f $disk >/dev/null 2>&1
    #       done
    #   else"""

text = re.sub(old_logic, new_logic, text)

with open('website/script.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("script.js patched with 10-pass blkdiscard SSD logic.")
