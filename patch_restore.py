def patch_restore():
    with open('website/index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    restore_script = """
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const restoredConfigStr = sessionStorage.getItem('arch_restore_config');
            if (restoredConfigStr) {
                try {
                    const config = JSON.parse(restoredConfigStr);
                    for (const key in config) {
                        const el = document.getElementById(key);
                        if (el) {
                            if (el.tagName === 'SELECT' || el.tagName === 'INPUT') {
                                // For text/select
                                if (el.type !== 'checkbox') {
                                    el.value = config[key];
                                }
                            }
                        } else if (key === 'post_apps') {
                            // handle checkboxes
                            const cbs = document.querySelectorAll('input[name="post_apps"]');
                            cbs.forEach(cb => {
                                if (config[key].includes(cb.value)) {
                                    cb.checked = true;
                                } else {
                                    cb.checked = false;
                                }
                            });
                        }
                    }
                    // Trigger generate manually after restore? Or just let user review
                    sessionStorage.removeItem('arch_restore_config');
                } catch(e) {
                    console.error("Failed to restore config", e);
                }
            }
        });
    </script>
</body>
"""
    if 'arch_restore_config' not in content:
        content = content.replace('</body>', restore_script)

    with open('website/index.html', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    patch_restore()
    print("Restore logic injected")
