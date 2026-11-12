// Local-only helper: attach the uploaded placeholders to the entries the seed would have filled.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const H = { 'X-EmDash-Request': '1', 'Content-Type': 'application/json' };
const { wide, tall } = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'media.json'), 'utf8'));
const val = (m) => ({ id: m.id, src: m.url, alt: m.alt, width: m.width, height: m.height, provider: 'local', meta: { storageKey: m.storageKey }, blurhash: m.blurhash, dominantColor: m.dominantColor });
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.goto(BASE + '/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin', { waitUntil: 'domcontentloaded' }).catch(() => {});
  const r = ctx.request;
  const list = async (c) => (await (await r.get(`${BASE}/_emdash/api/content/${c}?limit=50`)).json()).data.items;
  const save = async (c, item, data) => {
    const u = await r.put(`${BASE}/_emdash/api/content/${c}/${item.id}`, { headers: H, data: { data } });
    const pub = await r.post(`${BASE}/_emdash/api/content/${c}/${item.id}/publish`, { headers: H, data: {} });
    console.log(c, item.slug, u.status(), pub.status(), u.ok() ? '' : (await u.text()).slice(0, 300));
  };
  for (const page of await list('pages')) {
    let changed = false;
    const layout = (page.data.layout || []).map((blk) => {
      if (blk._type === 'profile') { changed = true; return { ...blk, photo: val(tall) }; }
      if (blk._type === 'about_intro') { changed = true; return { ...blk, image: val(tall) }; }
      return blk;
    });
    if (changed) await save('pages', page, { layout });
  }
  for (const post of await list('posts')) {
    if (/-(one|three|five)$/.test(post.slug)) await save('posts', post, { featured_image: val(wide) });
  }
  await b.close();
})();
