# Anti-Evil Maid Integrator

![Icon](img/icon.png)

![Banner](img/banner.png)

Automated toolkit that records TPM PCRs, EFI variables, and the `boot` partition structure to detect Evil Maid / physical tampering attacks on next boot. Integrates with Libre-OTP for verifiable boot screens.


## ⚖️ Legal Disclaimer

**USE AT YOUR OWN RISK.**
This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. 
The author (tilas01) is not responsible for any system lockouts, data loss, bricked installations, or damages resulting from the use of this tool. These are advanced security mechanisms that interact directly with the Linux kernel, PAM, and the bootloader. Ensure you have adequate backups, fallback recovery keys, and understand the tools before deploying them in a production environment.
