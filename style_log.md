commit 9e7c11306f907bb141ee051279999eb96bb75609
Author: tilas01 <>
Date:   Wed Jun 17 21:19:35 2026 +1000

    fix: app config modals, ui alignment, and live editor ssh guide uploads

diff --git a/website/style.css b/website/style.css
index 2fd46dc..247e0ee 100644
--- a/website/style.css
+++ b/website/style.css
@@ -484,3 +484,17 @@ input:checked + .slider:before {
     flex: 1 1 200px;
     max-width: 300px;
 }
+
+
+/* ─── Checkbox Grid ─── */
+.checkbox-grid {
+    display: grid;
+    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
+    gap: 12px;
+    margin-top: 10px;
+}
+.checkbox-item {
+    display: flex;
+    align-items: center;
+    font-size: 0.9rem;
+}

commit 9b480c70437c3b822ab91eca460dfa8f50e3a03b
Author: tilas01 <>
Date:   Wed Jun 17 00:38:29 2026 +1000

    feat: phase 8 ui polish, verbosity levels, animated progress bar, tty tokyo night theme, systemd oneshot automation

diff --git a/website/style.css b/website/style.css
index b7fc144..2fd46dc 100644
--- a/website/style.css
+++ b/website/style.css
@@ -472,3 +472,15 @@ input:checked + .slider {
 input:checked + .slider:before {
   transform: translateX(16px);
 }
+
+.btn-container {
+    display: flex;
+    flex-wrap: wrap;
+    gap: 1rem;
+    justify-content: center;
+    margin-top: 2rem;
+}
+.btn-container .btn {
+    flex: 1 1 200px;
+    max-width: 300px;
+}

commit 0fdb09c8d9801c46a991050b7861117a9dadccff
Author: tilas01 <>
Date:   Tue Jun 16 22:03:46 2026 +1000

    feat(ui): Phase 3 - Fixed Live Editor Flow, Clear Selections Confirm, Static Fallback, Firejail, Cross-Browser CSS

diff --git a/website/style.css b/website/style.css
index 1205523..b7fc144 100644
--- a/website/style.css
+++ b/website/style.css
@@ -84,7 +84,7 @@ header { text-align: center; margin-bottom: 2rem; position: relative; }
     flex-wrap: wrap;
     margin-top: 0.5rem;
 }
-.nav-sep { color: var(--bg-lighter); font-size: 1.1rem; user-select: none; }
+.nav-sep { color: var(--bg-lighter); font-size: 1.1rem; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
 
 h1, h2, h3 { color: var(--heading-color); margin-bottom: 0.8rem; }
 

commit 93eac6b2f0bf683c615868ed9aade297c35626d0
Author: tilas01 <>
Date:   Mon Jun 15 00:53:32 2026 +1000

    feat(ui, ebpf): fix generator logic, apply tokyo night parity, remove info icons, scaffold aya ebpf firewall and kernel watcher

diff --git a/website/style.css b/website/style.css
index 40cc943..1205523 100644
--- a/website/style.css
+++ b/website/style.css
@@ -11,7 +11,7 @@
     --accent-orange: #ff9e64;
     --bg-darker: #16161e;
     --bg-lighter: #24283b;
-    --font-mono: "JetBrains Mono", "Fira Code", Consolas, monospace;
+    --font-mono: "JetBrains Mono", "Fira Code", Consolas, monospace, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
 }
 
 * { box-sizing: border-box; margin: 0; padding: 0; }

commit 4c9ffa2d5bacf9c5f360648a448b874ba1b1ba20
Author: tilas01 <>
Date:   Sun Jun 14 00:32:24 2026 +1000

    fix(ui): route generator to live preview, update toggle colors, and fix transparent banner

diff --git a/website/style.css b/website/style.css
index cd767cf..40cc943 100644
--- a/website/style.css
+++ b/website/style.css
@@ -453,7 +453,7 @@ noscript .js-only { display: none !important; }
   position: absolute;
   cursor: pointer;
   top: 0; left: 0; right: 0; bottom: 0;
-  background-color: var(--bg-lighter);
+  background-color: var(--accent-red); /* Red when off */
   transition: .4s;
   border-radius: 20px;
 }
@@ -467,7 +467,7 @@ noscript .js-only { display: none !important; }
   border-radius: 50%;
 }
 input:checked + .slider {
-  background-color: var(--accent-green);
+  background-color: var(--accent-blue); /* Blue when on */
 }
 input:checked + .slider:before {
   transform: translateX(16px);
