const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:4322';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await p.waitForTimeout(800);
  const t = p.locator('#theme');
  const box = await t.boundingBox();
  const before = { theme: await p.evaluate(() => document.documentElement.dataset.theme ?? 'dark'), checked: await t.getAttribute('aria-checked'), role: await t.getAttribute('role'), name: await t.getAttribute('aria-label'), size: `${box.width}x${box.height}` };
  await t.click();
  const after = { theme: await p.evaluate(() => document.documentElement.dataset.theme ?? 'dark'), checked: await t.getAttribute('aria-checked'), stored: await p.evaluate(() => localStorage.getItem('theme')), bg: await p.evaluate(() => getComputedStyle(document.body).backgroundColor) };
  await p.reload({ waitUntil: 'load' });
  const reloaded = { theme: await p.evaluate(() => document.documentElement.dataset.theme ?? 'dark'), checked: await p.locator('#theme').getAttribute('aria-checked') };
  const badge = await p.evaluate(() => [...document.querySelectorAll('#proof dd')].map(d => d.textContent.trim()));
  // keyboard: first Tab lands on the skip link, and it becomes visible
  await p.keyboard.press('Tab');
  const focus = await p.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return { text: e.textContent.trim(), top: Math.round(r.top), outline: s.outlineWidth + ' ' + s.outlineStyle }; });
  await ctx.close();
  const rm = await b.newContext({ reducedMotion: 'reduce' }); const q = await rm.newPage();
  await q.goto(BASE + '/', { waitUntil: 'load' });
  const motion = await q.evaluate(() => ({ btn: getComputedStyle(document.querySelector('.btn')).transitionDuration, link: getComputedStyle(document.querySelector('a')).transitionDuration, sweep: getComputedStyle(document.querySelector('.btn'), '::before').display }));
  console.log(JSON.stringify({ before, after, reloaded, badge, focus, motion }, null, 1));
  await b.close();
})();
