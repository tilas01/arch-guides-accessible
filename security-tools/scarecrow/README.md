# Scarecrow Decoy System

![Icon](img/icon.png)

![Banner](img/banner.png)

Creates a fully convincing, fake Windows/Linux environment when a Duress PIN is entered. Simultaneously triggers a background 20-pass DoD shred (`blkdiscard` + `shred`) of the physical LUKS header, permanently destroying all real data.


## ⚖️ Legal Disclaimer

**USE AT YOUR OWN RISK.**
This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. 
The author (tilas01) is not responsible for any system lockouts, data loss, bricked installations, or damages resulting from the use of this tool. These are advanced security mechanisms that interact directly with the Linux kernel, PAM, and the bootloader. Ensure you have adequate backups, fallback recovery keys, and understand the tools before deploying them in a production environment.
