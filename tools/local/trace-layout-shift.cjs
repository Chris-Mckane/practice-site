// usage: node cls.cjs <url> [width] [height]  -> prints layout shifts with their sources
const { chromium } = require('playwright');
(async () => {
  const [url, w = 390, h = 844] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  await p.addInitScript(() => {
    window.__ls = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ls.push({ v: e.value, t: Math.round(e.startTime), src: (e.sources || []).map(s => ({ n: s.node ? (s.node.nodeName + '.' + (s.node.className || '') + ' ' + (s.node.textContent || '').slice(0, 30)) : null, from: [s.previousRect.x, s.previousRect.y, s.previousRect.width, s.previousRect.height].map(Math.round), to: [s.currentRect.x, s.currentRect.y, s.currentRect.width, s.currentRect.height].map(Math.round) })) }); }).observe({ type: 'layout-shift', buffered: true });
  });
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  console.log(JSON.stringify(await p.evaluate(() => window.__ls), null, 1));
  await b.close();
})();
