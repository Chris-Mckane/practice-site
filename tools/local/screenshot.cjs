// usage: node shot.cjs <url> <out.png> [width] [height] [theme] [fullPage]
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = 1280, h = 900, theme = 'dark', full = '1'] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  if (theme === 'light') await ctx.addInitScript(() => localStorage.setItem('theme', 'light'));
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  await p.screenshot({ path: out, fullPage: full === '1' });
  await b.close();
})();
