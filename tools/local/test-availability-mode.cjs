// Local test of the availability mode: switches Site options between modes and reports what changes.
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:4321';
const H = { 'X-EmDash-Request': '1', 'Content-Type': 'application/json' };
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  await p.goto(BASE + '/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin', { waitUntil: 'domcontentloaded' }).catch(() => {});
  const r = ctx.request;
  const item = (await (await r.get(BASE + '/_emdash/api/content/site_options?limit=5')).json()).data.items[0];
  const out = {};
  for (const mode of ['employed', 'freelance']) {
    const u = await r.put(`${BASE}/_emdash/api/content/site_options/${item.id}`, { headers: H, data: { data: { availability_mode: mode } } });
    const pub = await r.post(`${BASE}/_emdash/api/content/site_options/${item.id}/publish`, { headers: H, data: {} });
    const anon = await b.newContext();
    const html = await (await anon.request.get(BASE + '/')).text();
    out[mode] = strip(html); await anon.close();
    console.log(mode, u.status(), pub.status(), 'h1:', (html.match(/<h1[^>]*>(.*?)<\/h1>/) || [])[1], '| header btn:', (html.match(/class="btn" href="([^"]+)">([^<]+)/) || []).slice(1).join(' '));
  }
  const a = new Set(out.employed), f = new Set(out.freelance);
  console.log('only in employed:', out.employed.filter(x => !f.has(x)));
  console.log('only in freelance:', out.freelance.filter(x => !a.has(x)));
  console.log('shared text nodes:', out.freelance.filter(x => a.has(x)).length);
  await b.close();
})();
