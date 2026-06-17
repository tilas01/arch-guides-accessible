import re

html_path = 'website/wiki.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

libre_otp_wiki = """
        <h3 id="advanced-config-libre-otp">Libre-OTP Configuration</h3>
        <p>Libre-OTP allows you to integrate Time-Based One-Time Passwords (TOTP) natively into Linux Pluggable Authentication Modules (PAM). This enforces 2FA physically onto your machine.</p>
        <ul>
            <li><strong>OTP Mode:</strong> Choose which operations require an OTP code. Selecting <code>Boot/Login only</code> will ask for an OTP immediately after LUKS decryption but before giving you a shell. Selecting <code>All</code> will prompt for OTP on every <code>sudo</code>, <code>su</code>, SSH login, and boot sequence.</li>
            <li><strong>Bypass Uses:</strong> Set the number of times you can bypass the OTP prompt using a fallback recovery code (e.g., in case you lose your phone). Maximum allowed is 10.</li>
        </ul>
"""

# Inject before </section> of advanced-config if it doesn't already exist
if 'id="advanced-config-libre-otp"' not in html:
    html = html.replace('</section>\n\n<footer', libre_otp_wiki + '\n    </section>\n\n<footer')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Injected Libre-OTP wiki documentation.")
else:
    print("Libre-OTP wiki already exists.")
