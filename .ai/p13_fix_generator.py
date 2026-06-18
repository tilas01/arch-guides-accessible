import codecs

with codecs.open('website/script.js', 'r', 'utf-8', errors='ignore') as f:
    js = f.read()

# First, modify saveAppConfig to actually save the values to DOM dataset
save_target = """function saveAppConfig(appId) {
    closeAppConfigModal(appId);
    
    // Find the checkbox and mark it as configured
    const cb = document.querySelector(`input[type="checkbox"][value="${appId}"]`);"""

save_replacement = """function saveAppConfig(appId) {
    closeAppConfigModal(appId);
    
    // Find the checkbox and mark it as configured
    const cb = document.querySelector(`input[type="checkbox"][value="${appId}"]`);
    
    // Save Libre-OTP config to dataset if applicable
    if (appId === 'libre-otp') {
        const mode = document.getElementById('modal_otp_mode')?.value || 'both';
        const bypass = document.getElementById('modal_otp_bypass')?.value || '0';
        const display = document.getElementById('modal_otp_display')?.value || 'discreet';
        cb.dataset.otpMode = mode;
        cb.dataset.otpBypass = bypass;
        cb.dataset.otpDisplay = display;
    }
"""

js = js.replace(save_target, save_replacement)

# Now, find generateScript and inject the logic for libre-otp and the auto-updater
# We need to find `function generateScript`
gen_idx = js.find('function generateScript')
if gen_idx != -1:
    print("Found generateScript!")
    
    # Let's just find where it loops over post_apps: `if(cb.value === 'libre-otp')` or similar
    # It usually looks like this:
    # postApps.forEach(app => {
    #     script += `echo "Installing ${app}..."\n`;
    # });
    
    # We can just append the logic at the end of generateScript, right before `return script;` or setting the output.
    # Wait, the user already has a generateScript. Let's see what it contains.
    
    with codecs.open('.ai/p13_gen_check.txt', 'w', 'utf-8') as f:
        f.write(js[gen_idx:gen_idx+2000])

with codecs.open('website/script.js', 'w', 'utf-8') as f:
    f.write(js)
