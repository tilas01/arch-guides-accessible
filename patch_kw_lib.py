import re

with open('security-tools/kernel-watcher/src/lib.rs', 'r', encoding='utf-8') as f:
    text = f.read()

if 'pub mod process_monitor;' not in text:
    text = text.replace('pub mod gui;\n', 'pub mod gui;\npub mod process_monitor;\n')

start_monitor_call = '    process_monitor::start_process_monitor();\n'
if start_monitor_call not in text:
    text = text.replace('    println!("Starting Kernel Watcher (Semi-EDR File Monitor)...");\n', 
                        '    println!("Starting Kernel Watcher (Semi-EDR File Monitor)...");\n' + start_monitor_call)

with open('security-tools/kernel-watcher/src/lib.rs', 'w', encoding='utf-8') as f:
    f.write(text)

print("kernel-watcher lib.rs patched.")
