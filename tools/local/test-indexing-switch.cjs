// Local test of the indexing switch: flips EmDash's "staging" setting and checks all three signals.
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:4321';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  await p.goto(BASE + '/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin', { waitUntil: 'domcontentloaded' }).catch(() => {});
  const r = ctx.request;
  for (const staging of [true, false]) {
    const s = await r.post(BASE + '/_emdash/api/settings', { headers: { 'X-EmDash-Request': '1', 'Content-Type': 'application/json' }, data: { staging } });
    const anon = await b.newContext(); const q = anon.request;
    const home = await q.get(BASE + '/'); const html = await home.text();
    const robots = await q.get(BASE + '/robots.txt');
    const feed = await q.get(BASE + '/rss.xml');
    console.log(JSON.stringify({ staging, save: s.status(), header: home.headers()['x-robots-tag'] ?? null, feedHeader: feed.headers()['x-robots-tag'] ?? null, meta: (html.match(/<meta name="robots"[^>]*>/) || [null])[0], robots: (await robots.text()).replace(/\n/g, ' | '), cacheControl: home.headers()['cache-control'] }));
    await anon.close();
  }
  await b.close();
})();
