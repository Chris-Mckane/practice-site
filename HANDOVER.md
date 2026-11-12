# Handover: continue the website from here

Written at the end of the first build session for the next AI session (and for Chris).
Read this first, then `AGENTS.md` (project rules) and `GUIDE.md` (the owner's manual).

## 1. The one thing that matters

**The engineering is done and verified. The visual design was rejected by the owner.**
Chris's verdict after seeing screenshots: "you failed in the styling. It looks exactly like a
generic Claude site."

So the next job is a **real redesign of the look**, without breaking what works underneath.
Do not restart the project. Do not re-research the platform (section 5 has everything learned).

## 2. Where things stand

- **Repository:** `Chris-Mckane/practice-site`. Work branch: `claude/trusting-johnson-jv2x9n`.
- **Pull request:** draft, https://github.com/Chris-Mckane/practice-site/pull/1 (not merged; `main` still has only the original "Hello world" commit).
- **Not deployed.** Deploying needs Chris's Cloudflare login. Everything was verified on a local
  production build inside Cloudflare's runtime (workerd).
- **The original brief** is the first message of the previous session. Its essentials are restated in
  `AGENTS.md` ("Rules that must keep holding") and in section 6 below. Ask Chris to paste the full brief
  into the new session if it is not there.

### Works and verified locally (see `VERIFICATION.md`)

| Area | State |
| --- | --- |
| Stack | Astro 7.4.11, EmDash 1.5.0, `@astrojs/cloudflare` 14.4.7, Wrangler 4.160.1, exact pins. Build, type check (0 errors) and `wrangler deploy --dry-run` all pass |
| Content model | `seed/seed.json`: collections `pages`, `posts`, `site_options`; 11 block types; `category` taxonomy; `primary` and `footer` menus; one byline; Lorem ipsum content. Validates and applies cleanly to an empty database |
| Pages | `/` (page slug `home`), `/[slug]` (any other page, e.g. `/about`), `/blog` (+ `/page/N`, `/category/slug`), `/blog/[slug]`, `/rss.xml`, `/sitemap.xml`, 404 |
| Availability mode | Server-rendered from the `site_options` entry. Only status line, primary CTA and contact wording change. Tested |
| Indexing switch | EmDash's Staging/Live setting drives the meta tag; `src/middleware.ts` adds `X-Robots-Tag` and `Disallow: /`. Hidden unless explicitly live. Tested both ways |
| Edge cache | `cacheCloudflare()` provider, route rules, cache tags from every query. Headers confirmed locally; real hits and purges untested until deployed |
| SEO | Titles, descriptions, canonical, OG/Twitter (via `<EmDashHead>`), JSON-LD graph, sitemap, RSS |
| Accessibility | 0 axe violations (4 pages x 2 themes x 2 viewports), AAA contrast, 44px targets, skip link, reduced motion |
| Performance | Lighthouse mobile 100/100/100/100; CLS 0; JS 1.9 KB home / 0.7 KB elsewhere; inline CSS 10.8 to 14.2 KB; homepage HTML 7.4 KB gzip |
| Docs | `GUIDE.md` (owner manual with click-by-click Cloudflare steps), `VERIFICATION.md`, `AGENTS.md` |

### Known gaps

1. **Design rejected** (section 3).
2. **LCP on image-led pages:** About 1.5 s, post with featured image 1.8 s on Lighthouse slow-4G
   (target under 1.0 s). Text-led pages 0.8 s. Local images were unoptimised; production serves AVIF.
3. **Alt text** is enforced by not rendering an image without it, not by blocking the save in the CMS
   (EmDash 1.5 has no such option). A small native plugin with a `content:beforeSave` hook throwing
   `ContentSaveRejectedError` would do it properly.
4. **Small visual bug:** category links on `/blog` are unevenly spaced because `.link` has
   `min-width: 2.75rem` (short labels like "SEO" get extra space after them).
5. **Unverified until deployed:** AVIF conversion, cache hits/purge, Cloudflare Access, auto-creation
   of D1/R2/KV, setup wizard with a real passkey, the seed's placeholder image download.
6. **Two facts to confirm:** Cloudflare Access free tier (50 users), and that the proof badge's
   methodology link `https://sustainablewebdesign.org/estimating-digital-emissions/` resolves.

## 3. The design problem, honestly

### What was built

Dark navy page, mint accent, big bold grotesque H1 top-left, serif lead paragraph under it, mint
gradient pill button plus an arrow text link, a small status line with a dot, then a stack of
identical sections separated by hairlines, each laid out "heading in a left column, content in a
right column". Post lists and route links are rows with hairlines. A rounded "surface" box for the
author. Footer in three columns.

### Why it reads as generic AI output

I avoided every item on the brief's banned list and still landed on the *other* default template.
The specific tells:

- **One layout idea repeated seven times.** Every section is the same 4/8 two-column "ledger" with a
  hairline on top. No section has its own composition, so nothing is memorable.
- **Hero is the standard formula:** huge H1, muted lead, pill CTA + text link, tiny status line.
  The performance badge was meant to be the signature element but is styled as a quiet 2x2 stat grid
  off to the side. It is the most ordinary part of the page.
- **Timid type.** Two sizes do all the work. Schibsted Grotesk at weight 700/800 with tight tracking
  is the "safe distinctive" choice. Literata is used only as body text, never expressively.
- **Even, polite spacing everywhere.** Same vertical rhythm for every section, generous and uniform.
  No tension, no density changes, no scale contrast.
- **Colour used the default way.** Navy background, white text, mint links, mint button. Surface
  colour appears once (author box). Mint is "an accent" in the least imaginative sense.
- **No idea specific to Chris.** He is a strategist in WPO, SEO, design and CRO who talks about
  *holistic* organic growth. Nothing in the layout expresses measurement, search, systems, or a point
  of view. Swap the name and it is anyone's site.
- **No graphic element at all.** No diagram, mark, pattern, rule system or typographic device.

### What the brief fixes, and what is free

**Fixed by the brief (do not change without asking Chris):**

- Dark by default, light via the toggle. Palette "ink and mint", exact hexes in `src/styles/global.css`
  (dark: bg `#050A18`, text `#FFFFFF`, muted `#D0D8EE`, accent `#5CF2C0`, surface `#0E1832`, lines `#2A3556`;
  light: bg `#F3F2EC`, text `#050A18`, muted `#222C4A`, accent `#004D38`, surface `#E7E5DC`, lines `#B9B6AA`).
  Mint is an accent only, never a large surface. No light blue.
- Sans-serif headings, serif body. At most two families, self-hosted, woff2, Latin subset, about 40 KB a file.
  Not Inter, Roboto, Open Sans, Poppins, Montserrat, DM Sans, Space Grotesk or Playfair Display.
- Buttons are rounded; primary button has a mint/emerald gradient that flows on hover and focus with a
  soft light sweep behind the label, and lifts slightly.
- **Banned:** coloured left borders; grids of rounded cards with grey borders; orange/amber/beige;
  an italic serif accent word inside a sans headline; uppercase letter-spaced eyebrow labels;
  "01 / 02 / 03" numbering; pill badges everywhere; glowing gradient blobs; emoji icons.
- Homepage order: who Chris is (H1 with name and role), short intro, approach with heavy organic-growth
  focus, routes (blog, about, freelance contact), latest 3 posts, contact CTA.
- Blog index: paginated list, category links, **no cards**.
- "Engaging and pleasant to spend time on through typography, rhythm, spacing and purposeful
  micro-interactions, not gimmicks." "Make it feel designed for this specific person."

**Free to change (this is where the redesign lives):**

- Composition of every section, the grid, asymmetry, density, alignment, full-bleed vs contained.
- The type system: the families themselves (within the rules above), scale, weight contrast, width,
  case, measure, how the serif is used (it could carry far more of the personality).
- How surface and line colours are used; large areas of `--surface`; inverted bands.
- A graphic device drawn in CSS or inline SVG (no JS needed, tiny): for example something derived from
  measurement, search results, waterfalls, growth curves, grids or rulers. It must be purposeful.
- The hero composition and how prominent and characterful the live performance badge is.
- Header and footer treatment. Section transitions. Micro-interactions.

### Guidance for the redesign

- **Start from a concept, not components.** Write two or three one-line concepts tied to who Chris is,
  pick one, and let it dictate type, grid and motif. Show Chris the direction early (screenshots)
  before polishing all four pages.
- **Give sections different compositions.** If two sections share a layout, one of them is wrong.
- **Push contrast in scale and weight.** Very large against very small; light against heavy.
- **Make the badge the hero**, or drop its prominence entirely. Not the middle.
- **Replace, do not add.** Inline CSS is at 13.6 to 14.2 KB against a 15 KB budget. A redesign must
  rewrite the section styles, not layer on top.
- **Ask Chris for references** (two or three sites he admires) if he has them. It was not asked last time.

## 4. Technical guard rails for the redesign

Break none of these. They are all measured by `tools/verify/verify.mjs`.

- **CLS must stay exactly 0.** Fonts use `font-display: optional` + preload (heading and body regular).
  With `swap` the hero shifted by 0.02 when the web font arrived, because the intro paragraph re-wrapped.
  Anything that fills in after load needs reserved space (see `ProofBadge.astro` / `badge.css`).
- **CSS under 15 KB inline per page, JS under 3 KB total, no external CSS/JS, no third parties.**
  CSS is plain files in `src/styles/`, imported by the component that needs them, so Astro inlines only
  what each page uses. Do not use Astro scoped `<style>` blocks (they add `data-astro-cid` weight).
- **`astro.config.mjs` has a small Vite plugin (`trimEmDashStyles`)** that deletes the CSS EmDash's
  rich-text components ship (about 12 KB). `src/styles/prose.css` styles rich text instead.
  Importing anything from `emdash/ui` pulls all of those styles into the bundle, which is why the plugin exists.
- **EmDash's edit toolbar is off** (`toolbar: false`); the client toolbar adds about 4 KB of JS.
- **One H1 per page:** `PageSections.astro` picks the first block listed in `H1_BLOCKS`
  (`hero`, `profile`, `page_header`) via `Astro.locals.h1Key`; block components call `headingTag()`.
  Heading size comes from classes, never the tag.
- **Fonts:** files in `src/assets/fonts/`, configured in `astro.config.mjs` with `fontProviders.local()`
  (no network at build). To change a family: `npm i --no-save @fontsource-variable/<name>`, subset with
  `scripts/subset-fonts.py <in.woff2> <out.woff2> <minWeight> <maxWeight>` (needs `pip install fonttools brotli`),
  then update the config. Do **not** put `font-variant-numeric: tabular-nums` on running text in
  Schibsted Grotesk: it widens the comma and full stop.
- **Images:** always through `src/components/Photo.astro` with an explicit display `width`
  (otherwise the `srcset` balloons to 3,200px variants).
- **Contrast:** run `npm run check:contrast` after any colour change; it reads the tokens from `global.css`.
  If you add new pairings (for example text on `--surface` bands, or new hover states), add them to
  `scripts/contrast.mjs`.
- **Touch targets:** stand-alone links and buttons at least 44 x 44 px (the verify script checks).
- **Use `site.url` for absolute URLs**, never `Astro.url.origin` (Cloudflare's Workers Cache is keyed by
  path, not hostname, so a page rendered on `workers.dev` can be served on the custom domain).
- **If you change block fields**, edit `tools/local/generate-seed.mjs`, run it, run `npm run check:seed`,
  wipe the local database and re-apply (section 7). `emdash-env.d.ts` regenerates when `npm run dev` starts.

## 5. Platform knowledge already gathered (do not re-research)

### This sandbox

- `docs.emdashcms.com`, `developers.cloudflare.com`, `docs.astro.build` are **blocked** (curl and WebFetch).
- The npm registry and `raw.githubusercontent.com` work, and **`git clone` of public GitHub repos works**:
  - EmDash docs: `git clone --depth 1 --filter=blob:none --sparse https://github.com/emdash-cms/emdash.git` then `git sparse-checkout set docs` (pages under `docs/src/content/docs/`).
  - EmDash templates: `https://github.com/emdash-cms/templates` (`blog-cloudflare`, `marketing-cloudflare` are the useful ones).
  - Cloudflare docs: `https://github.com/cloudflare/cloudflare-docs` (sparse; pages under `src/content/docs/`).
- EmDash's own source is readable at `node_modules/emdash/src/` and is the fastest way to answer API questions.
- **workerd has no DNS here**, so the seed's `$media` image downloads fail locally (gracefully: fields
  stay empty). Use the helper scripts in section 7 to put images in.
- Playwright and Chromium are pre-installed (`require('playwright')` from CommonJS; do not install another copy).
  `tools/verify` deliberately has no local Playwright: it resolves the global one.
- No Cloudflare credentials: cannot deploy. `npx wrangler deploy --dry-run` works for validation.

### EmDash 1.5 facts that shaped the build

- Schema lives in the database; `seed/seed.json` is applied once at first setup. The setup wizard only
  applies **content** if "Sample content" is chosen (it is preselected when the seed has content).
- Site settings are a **fixed schema** (`title`, `tagline`, `logo`, `favicon`, `url`, `staging`,
  `postsPerPage`, `dateFormat`, `timezone`, `social`, `seo`). Custom settings therefore live in the
  one-entry `site_options` collection.
- `staging` is built in: Settings > General > Site Status > Go live. `<EmDashHead>` adds the noindex meta.
  EmDash serves `/robots.txt` itself; `src/middleware.ts` intercepts it only while staging.
- `blocks` field type with versioned block types exists. Render with `<Blocks>` + `defineBlockComponents`.
  Block fields cannot contain references, JSON or nested blocks. Field-naming conventions affect the editor
  layout (`{base}_label` + `{base}_url` share a row; `anchor_id` goes under Advanced; first
  headline/heading/title field is drawn large).
- No option to require alt text on image fields. No option to restrict heading levels in Portable Text.
- Taxonomy name is `category` (singular) in queries. `entry.id` is the slug; `entry.data.id` is the database ID.
- Offset pagination: `getEmDashCollection("posts", { limit, offset })` returns `hasMore` (no total count).
- `<EmDashHead>` emits one JSON-LD node (BlogPosting for articles if a canonical is passed, WebSite if
  `siteName` is passed). This site passes no `siteName` and no author, and adds its own `@graph` in
  `Base.astro` whose BlogPosting shares the same `@id`.
- Seed `$media` needs a **public URL** on Workers (local files unsupported). The seed points at
  `raw.githubusercontent.com/Chris-Mckane/practice-site/main/seed/assets/...`, so those files must be on
  `main` and the repo public when the setup wizard runs.
- Passkeys are bound to the hostname where they were created. Moving from `workers.dev` to the custom
  domain uses Settings > General > Change domain, then "Continue on <new domain>" to register a new passkey.
- Local shortcut: under `npm run dev`, `/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin` runs
  migrations, applies the seed with content and signs in as `dev@emdash.local`. It does **not** set
  `staging`, which is one reason the site treats "not explicitly live" as hidden.
- REST: `POST /_emdash/api/media` (multipart `file`, `alt`), `PUT /_emdash/api/content/{collection}/{id}`
  with `{ data: {...} }`, `POST .../publish`, `POST /_emdash/api/settings`. Writes need header `X-EmDash-Request: 1`.

### Cloudflare facts

- Workers Cache: enabled automatically when Astro's `cache.provider` is `cacheCloudflare()`. Keyed by
  path + query + Worker version (not host). Purge by tag is limited to 5 a minute (burst 25).
  A response with `Set-Cookie` is not cached. Each deploy starts with an empty cache.
- The adapter adds the `SESSION` KV namespace and the `IMAGES` binding to the generated config
  (`dist/server/wrangler.json`). D1, R2 and KV are auto-provisioned by `wrangler deploy` when no IDs are given.
  R2 must be activated on the account first (needs a card).
- Workers Free: 100,000 requests/day, 10 ms CPU per request. Paid: $5/month, 10M requests, 30M CPU ms.
  Recommendation given to Chris: Workers Paid.
- Workers Builds: project name must equal `name` in `wrangler.jsonc` (`practice-site`). Build command
  `npm run build`, deploy command `npx wrangler deploy`. Disable preview builds.
- Access: Worker > Access tab > "Protect this Worker behind Access" > All traffic > policy "Cloudflare account".
- Image transformations: 5,000 unique a month free; each published image uses about 14 (7 widths x 2 formats).

## 6. Decisions and the reasoning behind them

The full list (46 items) is in `GUIDE.md` section 11, and platform deviations in section 12.
The ones a new session is most likely to trip over:

- **`font-display: optional`, both fonts preloaded.** The brief said "preload only the LCP font" and
  "CLS 0.00". Those conflict in practice: with `swap`, metric-matched fallbacks still re-wrap text.
  `optional` guarantees zero shift, but an un-preloaded optional font almost never shows on a first
  visit, so the body font is preloaded too. Measured LCP effect: none (text paints without fonts).
- **Toolbar off, EmDash styles trimmed:** both were needed to meet the JS and CSS budgets.
- **Custom `/sitemap.xml`:** EmDash's would list the homepage as `/home` (pages use `urlPattern: "/{slug}"`).
  A seeded redirect sends `/home` to `/`.
- **Worker named `practice-site`:** Cloudflare refuses builds when the project name and config name differ.
- **`updated_date` is a manual field:** typo fixes should not change `dateModified`.
- **`Disallow: /` while staging** was requested by the brief even though EmDash deliberately avoids it
  (it hides the noindex from crawlers). Flagged to Chris in `GUIDE.md` section 6 as his call.
- **Hidden unless explicitly live** (`staging !== false`): covers the window before setup completes.

## 7. Running it locally

```bash
npm install
npm run dev                       # http://localhost:4321 (Cloudflare runtime; first start takes ~25 s)
```

First run, or after `rm -rf .wrangler/state` (which wipes the local database):

```bash
curl "http://127.0.0.1:4321/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin"   # applies the seed
node tools/local/upload-placeholders.cjs      # uploads seed/assets/*.png through the API
node tools/local/attach-placeholders.cjs      # attaches them to home, about and three posts
node tools/local/test-indexing-switch.cjs     # toggles staging on then off (leaves the site "live" locally)
```

Other helpers in `tools/local/` (all expect the dev server on port 4321 unless noted):

| Script | Use |
| --- | --- |
| `screenshot.cjs <url> <out.png> [width] [height] [dark\|light] [fullPage 1\|0]` | Screenshots. Look at these constantly while redesigning |
| `trace-layout-shift.cjs <url> [width] [height]` | Lists every layout shift with the element that moved |
| `test-availability-mode.cjs` | Switches mode both ways and diffs the homepage text |
| `test-interactions.cjs` | Theme switch, badge, skip link, reduced motion (expects preview on 4322) |
| `generate-seed.mjs` | Regenerates `seed/seed.json` |

Full verification (production build):

```bash
npm run build && npx astro preview --port 4322 --host 127.0.0.1 &
cd tools/verify && npm install && rm -rf node_modules/playwright node_modules/playwright-core && node verify.mjs
```

(The `rm` matters in this sandbox only: a locally installed Playwright cannot find the pre-installed browser.)
Stop servers with `npx astro dev stop` / `npx astro preview stop`.

Before committing: `npm run typecheck`, `npm run check:contrast`, the verify run, then update
`VERIFICATION.md` (numbers) and `GUIDE.md` (anything the owner would notice, plus the Decisions log).

## 8. File map

See the table in `AGENTS.md`. For the redesign the files that matter are:

- `src/styles/global.css` (tokens, base type, header, footer, buttons, the shared `.section` layout)
- `src/styles/sections.css`, `badge.css`, `posts.css`, `post.css`, `listing.css`, `crumbs.css`, `prose.css`
- `src/components/blocks/*.astro` (one per section type), `Header.astro`, `Footer.astro`, `ProofBadge.astro`,
  `PostList.astro`, `BlogListing.astro`, `AuthorBox.astro`, `src/pages/blog/[slug].astro`
- `astro.config.mjs` (fonts)

## 9. Suggested opening prompt for the next session

> Read HANDOVER.md, AGENTS.md and GUIDE.md in this repository (branch `claude/trusting-johnson-jv2x9n`).
> The engineering is finished and verified; the visual design was rejected as generic. Redesign the look
> of the homepage, About, blog index and blog post within the constraints in HANDOVER.md sections 3 and 4.
> Start by proposing two or three distinct design concepts specific to me, with a screenshot of the
> homepage hero for each, and wait for me to choose before building the rest. Keep every budget and
> check in VERIFICATION.md passing, then update the docs. [Paste the original brief here, and links to
> two or three sites whose design you admire.]
