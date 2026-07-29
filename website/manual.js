/* ============================================================================
   manual.js — the manual install walkthrough.
   ----------------------------------------------------------------------------
   Renders the question set in manual-data.js one step at a time, and builds a
   guide as you answer. Nothing here knows anything about Arch: it draws
   questions, collects answers, and asks the emitters for commands. Adding an
   option is a change to manual-data.js alone.

   Parity with the dynamic generator is the point. Same options, same locking
   rules, same validation, and the same three exports — markdown, bash and JSON
   — so a walkthrough and a generated script describe the same install.
   ========================================================================= */

'use strict';

(function () {

    /* ── State ──────────────────────────────────────────────────────────── */

    var state = {};
    var visited = [];            // ids answered, in order
    var STORAGE_KEY = 'arch_manual_state';

    function save() {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ state: state, visited: visited })); }
        catch (_) { /* private mode; the walkthrough still works, it just will not resume */ }
    }
    function restore() {
        try {
            var raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed.state !== 'object') return false;
            state = parsed.state;
            visited = Array.isArray(parsed.visited) ? parsed.visited : [];
            return visited.length > 0;
        } catch (_) { return false; }
    }

    /* ── Step selection ─────────────────────────────────────────────────── */

    function applies(step) {
        if (typeof step.when !== 'function') return true;
        try { return !!step.when(state); } catch (_) { return false; }
    }

    /** Steps that currently apply, in declaration order. */
    function activeSteps() {
        return STEPS.filter(applies);
    }

    /** Options within a step can have their own `when` too. */
    function activeOptions(step) {
        return (step.options || []).filter(function (o) {
            if (typeof o.when !== 'function') return true;
            try { return !!o.when(state); } catch (_) { return false; }
        });
    }

    /** Value DuskyOS forces for this question, or null. */
    function lockedValue(step) {
        if (state.desktop !== 'dusky') return null;
        return Object.prototype.hasOwnProperty.call(DUSKY_LOCKS, step.id)
            ? DUSKY_LOCKS[step.id] : null;
    }

    function nextUnanswered() {
        var steps = activeSteps();
        for (var i = 0; i < steps.length; i++) {
            var s = steps[i];
            var v = state[s.id];
            var answered = s.type === 'multi'
                ? Array.isArray(v)
                : (v !== undefined && v !== null && v !== '');
            if (!answered) return s;
        }
        return null;
    }

    /* ── Rendering ──────────────────────────────────────────────────────── */

    function h(tag, attrs, children) {
        var el = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (k) {
            if (k === 'class') el.className = attrs[k];
            else if (k === 'text') el.textContent = attrs[k];
            else if (k === 'html') el.innerHTML = attrs[k];
            else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
            else if (attrs[k] !== null && attrs[k] !== undefined) el.setAttribute(k, attrs[k]);
        });
        (children || []).forEach(function (c) { if (c) el.appendChild(c); });
        return el;
    }

    function optionCard(step, opt, locked) {
        var isMulti = step.type === 'multi';
        var current = state[step.id];
        var selected = isMulti
            ? (Array.isArray(current) && current.indexOf(opt.value) !== -1)
            : current === opt.value;

        var badges = [];
        if (opt.recommended) badges.push(h('span', { class: 'badge badge-rec', text: 'recommended' }));
        if (opt.danger) badges.push(h('span', { class: 'badge badge-danger', text: 'destructive' }));

        var card = h('button', {
            type: 'button',
            class: 'opt-card nav-tooltip' + (selected ? ' selected' : '') + (locked ? ' locked' : ''),
            'aria-pressed': String(selected),
            'data-title': opt.label,
            'data-desc': opt.desc + (opt.note ? ' — ' + opt.note : ''),
            disabled: locked ? 'disabled' : null
        }, [
            h('span', { class: 'opt-head' }, [
                h('span', { class: 'opt-label', text: opt.label })
            ].concat(badges)),
            h('span', { class: 'opt-desc', text: opt.desc }),
            opt.note ? h('span', { class: 'opt-note', text: '⚠ ' + opt.note }) : null,
            opt.danger ? h('span', { class: 'opt-danger', text: '🔴 ' + opt.danger }) : null
        ]);

        if (!locked) {
            card.addEventListener('click', function () {
                if (isMulti) {
                    var arr = Array.isArray(state[step.id]) ? state[step.id].slice() : [];
                    var at = arr.indexOf(opt.value);
                    if (at === -1) arr.push(opt.value); else arr.splice(at, 1);
                    state[step.id] = arr;
                    renderStep(step);          // multi stays put so you can keep picking
                    rebuildGuide();
                    save();
                } else {
                    answer(step, opt.value);
                }
            });
        }
        return card;
    }

    function renderStep(step) {
        var host = document.getElementById('question-host');
        host.innerHTML = '';
        if (!step) { renderDone(); return; }

        var locked = lockedValue(step);
        if (locked !== null && state[step.id] !== locked) {
            state[step.id] = locked;
        }

        var steps = activeSteps();
        var idx = steps.indexOf(step) + 1;

        var card = h('div', { class: 'q-card', id: 'q-' + step.id }, [
            h('div', { class: 'q-meta' }, [
                h('span', { class: 'q-section', text: step.section }),
                h('span', { class: 'q-count', text: 'Question ' + idx + ' of ' + steps.length })
            ]),
            h('h2', { class: 'q-title' }, [
                document.createTextNode(step.title),
                h('a', {
                    class: 'q-wiki nav-tooltip',
                    href: 'wiki.html#' + step.wiki,
                    target: '_blank',
                    rel: 'noopener',
                    'data-title': 'Read this in the wiki',
                    'data-desc': 'Opens the wiki section that explains this option in full, ' +
                                 'in a new tab. Right-clicking any control here does the same.',
                    text: '📖'
                })
            ]),
            h('p', { class: 'q-help', text: step.help })
        ]);

        if (locked !== null) {
            card.appendChild(h('div', { class: 'q-locked' }, [
                h('strong', { text: '🔒 Fixed by DuskyOS. ' }),
                document.createTextNode(
                    'DuskyOS ships this preconfigured, so the walkthrough will not fight it. ' +
                    'Choose a different desktop to decide this yourself.')
            ]));
        }

        var grid = h('div', { class: 'opt-grid' });
        activeOptions(step).forEach(function (o) {
            grid.appendChild(optionCard(step, o, locked !== null && locked !== o.value ? true
                                                : (locked !== null)));
        });

        if (step.type === 'text') {
            var input = h('input', {
                type: 'text',
                class: 'q-text',
                id: 'input-' + step.id,
                placeholder: step.placeholder || '',
                value: state[step.id] || '',
                spellcheck: 'false',
                autocomplete: 'off',
                'aria-describedby': 'err-' + step.id
            });
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); submitText(step, input.value); }
            });
            card.appendChild(input);
            card.appendChild(h('div', { class: 'q-error', id: 'err-' + step.id, hidden: 'hidden' }));
            card.appendChild(h('button', {
                type: 'button', class: 'btn q-next', text: 'Continue →',
                onclick: function () { submitText(step, input.value); }
            }));
        } else {
            card.appendChild(grid);
            card.appendChild(h('div', { class: 'q-error', id: 'err-' + step.id, hidden: 'hidden' }));
            if (step.type === 'multi') {
                card.appendChild(h('button', {
                    type: 'button', class: 'btn q-next', text: 'Continue →',
                    onclick: function () { submitMulti(step); }
                }));
            }
        }

        var nav = h('div', { class: 'q-nav' });
        if (visited.length) {
            nav.appendChild(h('button', {
                type: 'button', class: 'btn btn-ghost', text: '← Back',
                onclick: goBack
            }));
        }
        card.appendChild(nav);

        host.appendChild(card);
        requestAnimationFrame(function () { card.classList.add('q-in'); });

        if (typeof window.refreshTooltips === 'function') window.refreshTooltips();
        var focusTarget = card.querySelector('.q-text, .opt-card:not([disabled])');
        if (focusTarget) focusTarget.focus({ preventScroll: true });
        updateProgress();
    }

    function showError(step, message) {
        var box = document.getElementById('err-' + step.id);
        if (!box) return;
        box.hidden = false;
        box.innerHTML = '';
        box.appendChild(h('span', { text: '⚠ ' + message + ' ' }));
        box.appendChild(h('a', {
            href: 'wiki.html#' + step.wiki, target: '_blank', rel: 'noopener',
            text: 'What does this mean? →'
        }));
        var card = document.getElementById('q-' + step.id);
        if (card) {
            card.classList.add('q-invalid');
            setTimeout(function () { card.classList.remove('q-invalid'); }, 600);
        }
    }

    function submitText(step, raw) {
        var value = String(raw || '').trim();
        if (!value) return showError(step, 'This one needs an answer.');
        if (step.validate) {
            var msg = step.validate(value, state);
            if (msg) return showError(step, msg);
        }
        answer(step, value);
    }

    function submitMulti(step) {
        var value = Array.isArray(state[step.id]) ? state[step.id] : [];
        if (step.validate) {
            var msg = step.validate(value, state);
            if (msg) return showError(step, msg);
        }
        if (!value.length && !step.optional) {
            return showError(step, 'Pick at least one, or this question would not be here.');
        }
        state[step.id] = value;
        advance(step);
    }

    function answer(step, value) {
        state[step.id] = value;
        advance(step);
    }

    function advance(step) {
        if (visited.indexOf(step.id) === -1) visited.push(step.id);
        // Choosing a desktop can lock later questions; clear anything that is
        // no longer reachable so a stale answer cannot leak into the output.
        pruneUnreachable();
        rebuildGuide();
        save();
        renderStep(nextUnanswered());
    }

    function pruneUnreachable() {
        var live = {};
        activeSteps().forEach(function (s) { live[s.id] = true; });
        Object.keys(state).forEach(function (k) {
            if (!live[k]) {
                delete state[k];
                var at = visited.indexOf(k);
                if (at !== -1) visited.splice(at, 1);
            }
        });
    }

    function goBack() {
        var last = visited.pop();
        if (last === undefined) return;
        delete state[last];
        pruneUnreachable();
        rebuildGuide();
        save();
        var step = null;
        for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === last) step = STEPS[i];
        renderStep(applies(step) ? step : nextUnanswered());
    }

    function updateProgress() {
        var steps = activeSteps();
        var done = steps.filter(function (s) {
            var v = state[s.id];
            return s.type === 'multi' ? Array.isArray(v) : (v !== undefined && v !== '');
        }).length;
        var pct = steps.length ? (done / steps.length) * 100 : 0;
        var bar = document.getElementById('manual-progress');
        if (bar) {
            bar.style.width = pct.toFixed(1) + '%';
            bar.setAttribute('aria-valuenow', pct.toFixed(0));
        }
        var label = document.getElementById('manual-progress-text');
        if (label) label.textContent = done + ' of ' + steps.length + ' answered';
    }

    function renderDone() {
        var host = document.getElementById('question-host');
        host.innerHTML = '';
        host.appendChild(h('div', { class: 'q-card q-done q-in' }, [
            h('h2', { class: 'q-title', text: '✅ That is everything.' }),
            h('p', {
                class: 'q-help',
                text: 'Your guide is below, with every command in order and a ' +
                      'reason for each one. Read it before you run any of it — ' +
                      'especially the partitioning, which is aimed at ' +
                      (state.disk || 'your disk') + ' and does not ask twice.'
            }),
            h('div', { class: 'q-nav' }, [
                h('button', { type: 'button', class: 'btn btn-ghost', text: '← Change an answer', onclick: goBack }),
                h('button', { type: 'button', class: 'btn', text: '↺ Start over', onclick: resetAll })
            ])
        ]));
        updateProgress();
    }

    function resetAll() {
        if (!confirm('Clear every answer and start the walkthrough again?')) return;
        state = {};
        visited = [];
        save();
        rebuildGuide();
        renderStep(activeSteps()[0]);
    }

    /* ── Guide construction ─────────────────────────────────────────────── */

    function rebuildGuide() {
        var md = window.buildManualGuide(state);
        var out = document.getElementById('guide-out');
        if (!out) return;
        out.textContent = md;
        var empty = document.getElementById('guide-empty');
        if (empty) empty.hidden = visited.length > 0;
        var wrap = document.getElementById('guide-wrap');
        if (wrap) wrap.hidden = visited.length === 0;
    }

    function download(name, text, mime) {
        var blob = new Blob([text], { type: mime + ';charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        if (typeof window.markHistorySaved === 'function') window.markHistorySaved();
    }

    function wireExports() {
        var md = document.getElementById('dl-md');
        var sh = document.getElementById('dl-sh');
        var js = document.getElementById('dl-json');
        var cp = document.getElementById('copy-guide');
        var live = document.getElementById('open-live');

        if (md) md.addEventListener('click', function () {
            download('arch-manual-guide.md', window.buildManualGuide(state), 'text/markdown');
        });
        if (sh) sh.addEventListener('click', function () {
            download('arch-manual-install.sh', window.buildManualScript(state), 'text/x-shellscript');
        });
        if (js) js.addEventListener('click', function () {
            // JSON, not the old .sc format: it is a real, documented, diffable
            // interchange format that any tool can read, and the generator
            // accepts the same file.
            download('arch-config.json', JSON.stringify({
                schema: 'arch-guides-dynamic/config',
                version: 2,
                created: new Date().toISOString(),
                source: 'manual-walkthrough',
                answers: state
            }, null, 2), 'application/json');
        });
        if (cp) cp.addEventListener('click', function () {
            navigator.clipboard.writeText(window.buildManualGuide(state)).then(function () {
                cp.textContent = '✅ Copied';
                setTimeout(function () { cp.textContent = '📋 Copy guide'; }, 1500);
            }, function () {
                cp.textContent = '❌ Clipboard blocked';
                setTimeout(function () { cp.textContent = '📋 Copy guide'; }, 2000);
            });
        });
        if (live) live.addEventListener('click', function () {
            try {
                sessionStorage.setItem('live_md', window.buildManualGuide(state));
                sessionStorage.setItem('live_sh', window.buildManualScript(state));
            } catch (_) { /* nothing to do; the editor will show its empty state */ }
            window.open('live.html', '_blank', 'noopener');
        });

        var imp = document.getElementById('import-json');
        if (imp) imp.addEventListener('change', function () {
            var f = imp.files && imp.files[0];
            if (!f) return;
            var r = new FileReader();
            r.onload = function () {
                try {
                    var parsed = JSON.parse(String(r.result));
                    var answers = parsed && parsed.answers ? parsed.answers : parsed;
                    if (!answers || typeof answers !== 'object') throw new Error('no answers object');
                    // A config exported from the Dynamic Generator is shaped
                    // differently. Translate it rather than silently importing
                    // nothing, and say plainly what did not carry over.
                    if (window.ConfigTranslate) {
                        var t = window.ConfigTranslate.translateEnvelope(parsed, 'manual-walkthrough');
                        answers = t.answers;
                        if (t.translated) {
                            var note = 'Imported a Dynamic Generator config. ' +
                                t.mapped.length + ' settings carried over.';
                            if (t.unmapped.length) {
                                note += '\n\nThese had no equivalent here and were left ' +
                                        'unanswered, so the walkthrough will ask:\n  ' +
                                        t.unmapped.slice(0, 12).join(', ');
                            }
                            alert(note);
                        }
                    }
                    state = answers;
                    visited = activeSteps()
                        .filter(function (s) { return state[s.id] !== undefined; })
                        .map(function (s) { return s.id; });
                    pruneUnreachable();
                    rebuildGuide();
                    save();
                    renderStep(nextUnanswered());
                } catch (err) {
                    alert('That file is not a config this page understands.\n\n' + err.message);
                }
                imp.value = '';
            };
            r.readAsText(f);
        });
    }

    /* ── Boot ───────────────────────────────────────────────────────────── */

    function init() {
        var resumed = restore();
        wireExports();
        rebuildGuide();
        renderStep(resumed ? (nextUnanswered() || null) : activeSteps()[0]);

        /* Right-click anywhere on a question opens its wiki section, matching
           the generator. tooltip.js does this for elements it knows about; this
           covers the question cards, which it does not. */
        document.addEventListener('contextmenu', function (e) {
            var card = e.target.closest ? e.target.closest('.q-card') : null;
            if (!card || !card.id) return;
            var id = card.id.replace(/^q-/, '');
            var step = null;
            for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) step = STEPS[i];
            if (!step) return;
            e.preventDefault();
            window.open('wiki.html#' + step.wiki, '_blank', 'noopener');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
