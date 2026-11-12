// Local-only helper: the sandbox cannot reach GitHub, so upload the seed placeholders through
// the EmDash API and attach them to the same entries the seed would have.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const H = { 'X-EmDash-Request': '1' };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.goto(BASE + '/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin', { waitUntil: 'domcontentloaded' }).catch(e => console.log('nav', e.message));
  const r = ctx.request;
  const up = async (file, alt, width, height) => {
    const res = await r.post(BASE + '/_emdash/api/media', { headers: H, multipart: { file: { name: file, mimeType: 'image/png', buffer: fs.readFileSync(require('path').join(__dirname, '../../seed/assets', file)) }, alt, width: String(width), height: String(height) } });
    const j = await res.json(); console.log('upload', file, res.status(), JSON.stringify(j).slice(0, 300)); return j.data?.item ?? j.data ?? j;
  };
  const wide = await up('placeholder-16x9.png', 'Placeholder image with a 16:9 aspect ratio', 1600, 900);
  const tall = await up('placeholder-4x5.png', 'Placeholder portrait photo with a 4:5 aspect ratio', 1200, 1500);
  fs.writeFileSync(require('path').join(__dirname, 'media.json'), JSON.stringify({ wide, tall }, null, 1));
  const list = async (c) => (await (await r.get(`${BASE}/_emdash/api/content/${c}?limit=50`)).json());
  const pages = await list('pages'); console.log('pages', JSON.stringify(pages).slice(0, 400));
  await b.close();
})();
