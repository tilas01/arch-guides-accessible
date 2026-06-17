import re

css_path = 'website/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

single_column_css = """
/* ─── Post-Install App Grid (Single Column List) ─── */
.app-grid-container {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--bg-dark);
    padding: 0.6rem;
    border: 1px solid var(--accent-purple);
    border-radius: 8px;
}

.app-category-header {
    font-weight: bold;
    color: var(--accent-blue);
    padding: 0.8rem 0.5rem 0.3rem 0.5rem;
    border-bottom: 2px solid var(--border-color);
    margin-bottom: 0.2rem;
    margin-top: 0.5rem;
}
.app-category-header:first-child {
    margin-top: 0;
}

.app-card {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem 0.8rem;
    border-bottom: 1px solid var(--bg-lighter);
    transition: background 0.2s;
    cursor: pointer;
    font-size: 0.9rem;
    width: 100%;
}
.app-card:last-child {
    border-bottom: none;
}
.app-card:hover {
    background: rgba(255, 255, 255, 0.05);
}
.app-card input[type="checkbox"] {
    margin: 0;
    cursor: pointer;
    transform: scale(1.2);
}
.app-card .app-icon {
    font-size: 1.1rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 24px;
}
.app-card a {
    font-weight: bold;
    color: var(--fg-color);
    text-decoration: none;
    min-width: 140px;
    display: inline-block;
}
.app-card a:hover {
    color: var(--accent-purple);
    text-decoration: underline;
}
.app-card .app-desc {
    color: #8b949e;
    font-size: 0.85rem;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.app-card .gear-config-btn {
    font-size: 1.2rem;
    padding: 0.2rem;
    transition: transform 0.2s;
    margin-left: auto;
}
.app-card .gear-config-btn:hover {
    transform: scale(1.1) rotate(15deg);
}
"""

if ".app-grid-container" not in css:
    with open(css_path, 'a', encoding='utf-8') as f:
        f.write("\n" + single_column_css)
    print("Injected single column CSS successfully.")
else:
    # If it is in there, maybe we just append the app-card logic?
    if ".app-card" not in css:
        with open(css_path, 'a', encoding='utf-8') as f:
            f.write("\n" + single_column_css)
        print("Injected app-card CSS successfully.")
    else:
        print("CSS already exists.")
