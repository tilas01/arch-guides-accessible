// Per-page runtime audit in jsdom: does each page load its scripts without
// throwing, are tooltips bound, are the shared controls present?
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const WEB = process.argv[2] || 'website';
const pages = fs.readdirSync(WEB).filter(f => f.endsWith('.html'));
let totalErr = 0;

for (const page of pages) {
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', e => errors.push(String(e.message || e).split('\n')[0]));
  vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ').slice(0,120)));
  const dom = await JSDOM.fromFile(path.join(WEB, page), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'http://localhost:8731/' + page, virtualConsole: vc,
  });
  await new Promise(r => setTimeout(r, 700));
  const d = dom.window.document;
  const tt = d.querySelectorAll('[data-title]').length;
  const nav = d.querySelectorAll('.main-nav .nav-link, .nav-bar .nav-link').length;
  const manual = !!d.querySelector('a[href="manual.html"]');
  const viewport = !!d.querySelector('meta[name="viewport"]');
  const realErrs = errors.filter(e => !/Not implemented|Could not load|ENOENT|css/i.test(e));
  totalErr += realErrs.length;
  console.log(`${page.padEnd(22)} nav=${String(nav).padStart(2)} tooltips=${String(tt).padStart(3)} manual=${manual?'Y':'n'} viewport=${viewport?'Y':'n'} errors=${realErrs.length}`);
  realErrs.slice(0,2).forEach(e => console.log('      ! ' + e.slice(0,110)));
  dom.window.close();
}
console.log(totalErr === 0 ? '\nNO RUNTIME ERRORS ON ANY PAGE' : `\n${totalErr} runtime errors`);
process.exit(totalErr ? 1 : 0);
