/* Emoji use has to be all-or-nothing within a group.
 *
 * A list where four items start with an icon and three do not reads as an
 * unfinished job rather than a design — the eye follows the column of icons and
 * then hits a gap. This walks every <ul>/<ol> and every grid of cards in the
 * site and fails when a group is split, naming the odd ones out.
 *
 * The rule is per group, not per page: a section may sensibly have none at all.
 * It may not have some.
 */
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const WEB = process.argv[2] || '../website';
const pages = fs.readdirSync(WEB).filter(f => f.endsWith('.html'));

// Leading pictographic character, optional variation selector / ZWJ sequence.
const LEADS_WITH_EMOJI = /^\s*(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)+/u;

// Groups small enough that a split is plausibly deliberate are still reported —
// two items where one has an icon is exactly the case that looks like a slip.
const MIN_GROUP = 2;

let groups = 0;
const problems = [];

for (const page of pages) {
  const dom = new JSDOM(fs.readFileSync(path.join(WEB, page), 'utf8'));
  const doc = dom.window.document;

  const containers = [
    ...doc.querySelectorAll('ul, ol'),
    ...doc.querySelectorAll('.contents-grid, .ways, .app-grid-container, .tab-bar'),
  ];

  for (const box of containers) {
    // Only direct children, so a nested list is judged on its own terms.
    const items = [...box.children].filter(el => {
      if (!/^(LI|A|BUTTON)$/.test(el.tagName)) return false;
      // A list item that is only a nested list has no label of its own.
      return el.textContent.trim().length > 0 && !el.querySelector(':scope > ul, :scope > ol');
    });
    if (items.length < MIN_GROUP) continue;

    // The label is the item's own leading text — for a card that is its
    // <strong>, for a list entry the anchor it starts with.
    const label = el => {
      const head = el.querySelector(':scope > strong, :scope > a, :scope > .tab-label');
      return (head || el).textContent.replace(/\s+/g, ' ').trim();
    };

    const withEmoji = items.filter(el => LEADS_WITH_EMOJI.test(label(el)));
    groups++;
    if (withEmoji.length === 0 || withEmoji.length === items.length) continue;

    // Report the minority — those are the ones to change.
    const odd = (withEmoji.length * 2 > items.length
      ? items.filter(el => !LEADS_WITH_EMOJI.test(label(el)))
      : withEmoji).map(el => label(el).slice(0, 46));

    problems.push({
      page,
      where: box.closest('section, .contents-card, nav, main')?.querySelector('h1, h2, h3')
              ?.textContent.trim() || box.className || box.tagName.toLowerCase(),
      have: withEmoji.length,
      total: items.length,
      odd,
    });
  }
  dom.window.close();
}

console.log(`emoji-consistency: ${groups} groups across ${pages.length} pages, ${problems.length} split`);
for (const p of problems) {
  console.log(`  ✗ ${p.page} · "${p.where}" — ${p.have}/${p.total} have an icon`);
  p.odd.forEach(o => console.log(`      · ${o}`));
}
process.exit(problems.length ? 1 : 0);
