/* ============================================================================
   config-translate.js — make one saved config work in either front end.
   ----------------------------------------------------------------------------
   The Dynamic Generator and the Manual Walkthrough are, deliberately, two
   separate tools with their own pages and their own option sets. They already
   share a JSON envelope:

       { schema, version, source, created, answers: { … } }

   but until now the `answers` inside were shaped differently and had no keys in
   common, so a config exported from one configured nothing in the other:

       generator    { selects:{firmware:…}, inputs:{…}, checkboxes:{…} }   (DOM-shaped)
       walkthrough  { firmware:…, disk:…, encryption:… }                  (flat)

   This module translates between the two. It is a *mapping*, not a merge —
   neither tool changes, and each keeps options the other does not have.

   Design rules, in order of importance:

     1. **Never invent an answer.** A field the source config did not specify is
        left unset rather than defaulted, so translating cannot silently change
        what someone chose. Unmapped keys are reported, not dropped quietly.

     2. **Never translate a destructive setting into a different one.** Where
        the two tools' vocabularies do not line up exactly (LUKS variants, the
        duress actions), the mapping is explicit and conservative: if there is
        no exact equivalent, the field is left unset so the target tool asks
        again, rather than guessing at something that repartitions a disk.

     3. **Round-trip stability.** translate(translate(x)) must equal
        translate(x) for every mapped field. Covered by tests.
   ========================================================================= */

'use strict';

(function (root) {

    /* ── Field map ───────────────────────────────────────────────────────────
       walkthrough key  ->  { gen: <generator control id>, group: selects|inputs
                              |checkboxes, values?: {walkthrough: generator} } */
    var MAP = [
        { wl: 'firmware',       gen: 'firmware',        group: 'selects' },
        { wl: 'filesystem',     gen: 'filesystem',      group: 'selects' },
        { wl: 'disk',           gen: 'target-disk',     group: 'inputs'  },
        { wl: 'bootloader',     gen: 'bootloader',      group: 'selects' },
        { wl: 'desktop',        gen: 'desktop',         group: 'selects' },
        { wl: 'display_server', gen: 'display_server',  group: 'selects' },
        { wl: 'firewall',       gen: 'firewall',        group: 'selects' },
        { wl: 'swap',           gen: 'swap_size',       group: 'selects' },
        { wl: 'microcode',      gen: 'cpu_brand',       group: 'selects',
          values: { 'intel-ucode': 'intel', 'amd-ucode': 'amd', 'none': 'none' } },
        { wl: 'libre',          gen: 'software_type',   group: 'selects',
          values: { 'yes': 'libre', 'no': 'proprietary' } },
        // Encryption: the generator's `partitioning` select carries the LUKS
        // choice. Only exact equivalents are mapped — anything else is left for
        // the target tool to ask about rather than guessed at, because this
        // decides whether a disk gets encrypted.
        { wl: 'encryption',     gen: 'partitioning',    group: 'selects',
          values: { 'luks2': 'luks2', 'luks1': 'luks1', 'none': 'unencrypted' } },
        { wl: 'apps',           gen: 'post_apps',       group: 'checkboxes' },
        // Wallpapers. The ids and the option values are deliberately identical
        // on both sides, so there is nothing to translate — which is the point:
        // a value map is a place for the two to disagree.
        { wl: 'wallpapers',       gen: 'wallpapers',       group: 'selects' },
        { wl: 'wallpaper_count',  gen: 'wallpaper_count',  group: 'selects' },
        { wl: 'wallpaper_split',  gen: 'wallpaper_split',  group: 'selects' },

        /* Duress PINs. The two front ends model this differently and only three
           states have an exact equivalent, so only those three are carried.
           `wlIsList` says the walkthrough side is an array of one.

           The walkthrough sets up to three *separate passwords*, one per
           behaviour. The generator picks one action for one password. So
           "duress and decoy, as two different PINs" has no generator
           equivalent, and the generator's "shutdown" has no walkthrough one —
           both are reported as unmapped rather than approximated. Guessing here
           would silently change what a password does under coercion. */
        // Auto-lock and the Input Guard response. Same ids and same option
        // values on both sides, so there is nothing to translate and no value
        // map for the two to disagree in.
        { wl: 'luks_autolock',  gen: 'modal_aem_autolock', group: 'selects' },
        { wl: 'ducky_response', gen: 'ducky_response',     group: 'selects' },

        { wl: 'duress_pins', gen: 'luks_duress_action', group: 'selects',
          wlIsList: true,
          values: { 'duress': 'wipe-keys',
                    'decoy': 'decoy-only',
                    'both': 'wipe-keys-decoy' } }
    ];

    function invert(values) {
        if (!values) return null;
        var out = {};
        Object.keys(values).forEach(function (k) { out[values[k]] = k; });
        return out;
    }

    /** Is this a generator-shaped answers object? */
    function isGeneratorShape(a) {
        return !!(a && typeof a === 'object' &&
                  (a.selects || a.inputs || a.checkboxes));
    }

    /**
     * Generator answers -> walkthrough answers.
     * Returns { answers, mapped, unmapped } so a caller can tell the user what
     * did and did not carry over instead of implying a clean import.
     */
    function generatorToWalkthrough(gen) {
        var out = {}, mapped = [], unmapped = [];
        var selects = (gen && gen.selects) || {};
        var inputs = (gen && gen.inputs) || {};
        var checks = (gen && gen.checkboxes) || {};

        MAP.forEach(function (m) {
            var src = m.group === 'selects' ? selects
                    : m.group === 'inputs'  ? inputs : checks;
            if (!Object.prototype.hasOwnProperty.call(src, m.gen)) return;
            var v = src[m.gen];
            if (v === '' || v === undefined || v === null) return;
            if (m.values) {
                var back = invert(m.values);
                if (!Object.prototype.hasOwnProperty.call(back, v)) {
                    // No exact equivalent: leave unset so the walkthrough asks.
                    unmapped.push(m.gen + '=' + v);
                    return;
                }
                v = back[v];
            }
            out[m.wl] = m.wlIsList ? [v] : v;
            mapped.push(m.wl);
        });

        // Anything the generator held that has no walkthrough equivalent.
        Object.keys(selects).forEach(function (k) {
            if (!MAP.some(function (m) { return m.gen === k; })) unmapped.push(k);
        });

        return { answers: out, mapped: mapped, unmapped: unmapped };
    }

    /** Walkthrough answers -> generator answers (DOM-shaped). */
    function walkthroughToGenerator(wl) {
        var out = {
            version: 2,
            generator: 'arch-guides-dynamic',
            schema: 'arch-guides-dynamic/config',
            selects: {}, inputs: {}, checkboxes: {}
        };
        var mapped = [], unmapped = [];

        MAP.forEach(function (m) {
            if (!Object.prototype.hasOwnProperty.call(wl, m.wl)) return;
            var v = wl[m.wl];
            if (v === '' || v === undefined || v === null) return;
            if (m.wlIsList) {
                // A list the generator can only express as one value. Empty is
                // simply "not set"; more than one has no equivalent at all, and
                // picking one of them would silently change what a password
                // does under coercion.
                if (!Array.isArray(v) || v.length === 0) return;
                if (v.length > 1) {
                    unmapped.push(m.wl + '=[' + v.join(',') + '] (generator holds one action)');
                    return;
                }
                v = v[0];
            }
            if (m.values) {
                if (!Object.prototype.hasOwnProperty.call(m.values, v)) {
                    unmapped.push(m.wl + '=' + v);
                    return;
                }
                v = m.values[v];
            }
            out[m.group][m.gen] = v;
            mapped.push(m.gen);
        });

        Object.keys(wl).forEach(function (k) {
            if (!MAP.some(function (m) { return m.wl === k; })) unmapped.push(k);
        });

        return { answers: out, mapped: mapped, unmapped: unmapped };
    }

    /**
     * Translate a full envelope for a target tool. Returns the envelope
     * unchanged when it is already the right shape, so calling this
     * unconditionally on import is safe.
     *
     * @param {object} envelope  {schema,version,source,created,answers}
     * @param {'dynamic-generator'|'manual-walkthrough'} target
     */
    function translateEnvelope(envelope, target) {
        var answers = (envelope && envelope.answers) ? envelope.answers : envelope;
        var isGen = isGeneratorShape(answers);
        var wantGen = target === 'dynamic-generator';

        if (isGen === wantGen) {
            return { answers: answers, mapped: [], unmapped: [], translated: false };
        }
        var r = isGen ? generatorToWalkthrough(answers)
                      : walkthroughToGenerator(answers);
        r.translated = true;
        return r;
    }

    var API = {
        MAP: MAP,
        isGeneratorShape: isGeneratorShape,
        generatorToWalkthrough: generatorToWalkthrough,
        walkthroughToGenerator: walkthroughToGenerator,
        translateEnvelope: translateEnvelope
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = API;
    root.ConfigTranslate = API;

})(typeof window !== 'undefined' ? window : globalThis);
