# Verification report

Measured on 12 November 2026 against the production build of this repository.

## Read this first: how these numbers were produced

- **Where:** a local production build (`npm run build`, then `npm run preview`) running inside Cloudflare's
  own Workers runtime (workerd), with a local D1 database and R2 bucket filled from `seed/seed.json`.
- **Not measured on Cloudflare itself.** Deploying needs the owner's Cloudflare login, so the site has not
  been deployed yet. Three things differ in production and are flagged where they matter:
  1. **Compression.** The local server sends HTML uncompressed. Cloudflare compresses it (Brotli), so real
     transfer sizes are the "Brotli" column, not the "raw" one. Lighthouse's "Document request latency"
     note below is this and nothing else.
  2. **Image optimisation.** Locally the image endpoint passes the original PNG placeholders through
     unchanged. In production Cloudflare's image service converts them to AVIF or WebP at the right size.
     Lighthouse's "Improve image delivery" note below is this. It also means the LCP figures for the two
     image-led pages (About, Blog post) are pessimistic.
  3. **Edge cache.** Locally every request renders from the database. In production, repeat requests are
     served from Cloudflare's edge cache without running the Worker.
- **Lab, not field.** Core Web Vitals at the 75th percentile are field measurements that only exist once
  real visitors arrive. What follows is lab evidence that the budgets are achievable.
- **To repeat it:** `npm run build && npm run preview`, then in another terminal
  `cd tools/verify && npm install && node verify.mjs`. After the first deploy, run it against the live
  address: `node verify.mjs https://your-address`.

## Summary against the brief's budgets

| Budget | Target | Result | Status |
| --- | --- | --- | --- |
| Lighthouse mobile: Performance, Accessibility, Best practices, SEO | as high as possible | 100, 100, 100, 100 on all four pages | Met |
| LCP, text-led pages (Homepage, Blog index) | under 1.0 s | 0.8 s (Lighthouse, simulated slow 4G) | Met in lab |
| LCP, image-led pages (About, Blog post with featured image) | under 1.0 s | 1.5 s and 1.8 s in the same lab test, with unoptimised local images | Not met in this lab setup. See note 2 above and "LCP on image-led pages" below |
| CLS | 0.00 | 0.0000 on every page, both themes, mobile and desktop, after scrolling the full page | Met |
| INP | under 100 ms | Not measurable in a lab. Total Blocking Time, its lab proxy, is 0 to 50 ms | On track |
| Client JavaScript | under 3 KB, inline, theme toggle and proof badge only | 1.9 KB on the homepage, 0.7 KB elsewhere. No external scripts, no framework | Met |
| Inline CSS per page | under 15 KB | 10.8 to 14.2 KB (figures include the font-face rules) | Met |
| Homepage HTML + CSS + JS | under 30 KB compressed | 7.4 KB gzip, 6.4 KB Brotli (everything is inline, so this is the whole page) | Met |
| Font files | two families, woff2, Latin subset, about 40 KB or less each | 34.6 KB, 31.6 KB, 32.1 KB (italic, only loaded when used) | Met |
| Third-party requests | none | none | Met |
| axe-core violations | zero | zero across 16 runs (4 pages, 2 themes, 2 screen sizes), WCAG A, AA and AAA rules plus best practices | Met |
| Text contrast | 7:1 (AAA) for every pairing, both themes, including hover states | lowest is 7.32:1 | Met |
| Touch targets | 44 by 44 px | no stand-alone link or button below 44 by 44 px at either screen size | Met |
| Headings | one H1, no skipped levels | valid on every page | Met |

### LCP on image-led pages

On the homepage, blog index and posts without a featured image, the largest element is the H1 text, which
paints as soon as the HTML arrives: 0.8 s on Lighthouse's simulated slow 4G, which is close to the floor
for that test (it spends about 0.6 s on connection setup alone).

On the About page (portrait) and on posts with a featured image, the largest element is an image, and an
image needs its own request. Both images are marked high priority and are found in the first bytes of
HTML. What is left is file size and one extra round trip. Locally the files were unoptimised PNGs
(30 KB and 55 KB); in production they are served as AVIF at the displayed size, which should bring these
closer to 1.0 to 1.3 s on the same test. I cannot promise under 1.0 s for image-led pages on slow 4G
until it is measured on Cloudflare. If it matters after launch, the reliable fixes are a smaller
portrait on phones, or showing the featured image below the first paragraph so the headline stays the
largest element.

## Functional checks

| Check | Result |
| --- | --- |
| Fresh install from the seed (empty database, apply seed, render every route) | Pass. `/`, `/about`, `/blog`, `/blog/page/2`, `/blog/category/seo`, a post, `/rss.xml`, `/sitemap.xml` all return 200; `/home` redirects (301) to `/`; unknown addresses return 404 |
| Seed file validation (`npm run check:seed`) | Pass |
| Type check (`npm run typecheck`) | 0 errors, 0 warnings, 0 hints across 44 files |
| Indexing switch, staging on | `X-Robots-Tag: noindex, nofollow` on pages and feeds, `<meta name="robots" content="noindex, nofollow">` once per page, `robots.txt` is `User-agent: *` / `Disallow: /` |
| Indexing switch, live | Header absent, meta tag absent, `robots.txt` allows everything except `/_emdash/` and lists the sitemap |
| Availability mode switch | Changing the mode and publishing changes only the status line, primary button label and link, final route link and contact wording. 75 text fragments on the homepage are identical in both modes. H1, title and all body copy unchanged |
| Edge cache headers | Pages send `Cloudflare-CDN-Cache-Control: public, max-age=86400, stale-while-revalidate=604800` and `Cache-Tag` values for the collection, the entry, settings and both menus. Browsers receive `Cache-Control: no-cache` |
| Theme | Dark by default with no flash; the switch has `role="switch"`, `aria-checked`, a 44 by 44 px target and persists in `localStorage` |
| Reduced motion | All transitions, the button sweep and page cross-fade are disabled under `prefers-reduced-motion: reduce` |

Not verified, because they need the real Cloudflare account: automatic creation of D1, R2 and KV on first
deploy, the GitHub-to-Cloudflare build, image conversion to AVIF, cache hits and purge-on-publish at the
edge, Cloudflare Access, and the setup wizard with a real passkey (locally a development shortcut applied
the same seed). The guide's steps for these follow Cloudflare's and EmDash's current documentation.

## Detailed results

### Lighthouse (mobile, simulated slow 4G and 4x CPU slowdown)

| Page | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS | Speed Index |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Homepage | 100 | 100 | 100 | 100 | 0.8 s | 0.8 s | 20 ms | 0 | 0.8 s |
| About | 100 | 100 | 100 | 100 | 0.8 s | 1.5 s | 20 ms | 0 | 0.8 s |
| Blog index | 100 | 100 | 100 | 100 | 0.8 s | 0.8 s | 0 ms | 0 | 0.8 s |
| Blog post | 100 | 100 | 100 | 100 | 0.8 s | 1.8 s | 50 ms | 0 | 0.8 s |

Notes from Lighthouse (all four are artefacts of the local server, explained at the top):

- Homepage: document-latency-insight: Document request latency (Est savings of 18 KiB); image-delivery-insight: Improve image delivery (Est savings of 22 KiB)
- About: document-latency-insight: Document request latency (Est savings of 16 KiB); image-delivery-insight: Improve image delivery (Est savings of 28 KiB)
- Blog index: document-latency-insight: Document request latency (Est savings of 14 KiB)
- Blog post: document-latency-insight: Document request latency (Est savings of 15 KiB); image-delivery-insight: Improve image delivery (Est savings of 46 KiB)

### axe-core (WCAG 2.0, 2.1, 2.2 at A, AA and AAA, plus best practices)

| Page | Mobile dark | Mobile light | Desktop dark | Desktop light | Rules passed |
| --- | --- | --- | --- | --- | --- |
| Homepage | 0 violations | 0 violations | 0 violations | 0 violations | 45 |
| About | 0 violations | 0 violations | 0 violations | 0 violations | 46 |
| Blog index | 0 violations | 0 violations | 0 violations | 0 violations | 40 |
| Blog post | 0 violations | 0 violations | 0 violations | 0 violations | 43 |

### Page weight

| Page | HTML (raw) | HTML (gzip) | HTML (Brotli) | Inline CSS | Inline JS | Inline CSS + JS (gzip) | External CSS / JS files | Fonts | Images | Total transferred (uncompressed bodies) | Requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Homepage | 26.5 KB | 7.4 KB | 6.4 KB | 13.6 KB | 1.9 KB | 4.3 KB | 0 / 0 | 66.2 KB | 30.2 KB | 123.0 KB | 4 |
| About | 24.0 KB | 6.6 KB | 5.7 KB | 13.6 KB | 0.7 KB | 3.9 KB | 0 / 0 | 66.2 KB | 30.2 KB | 120.5 KB | 4 |
| Blog index | 21.6 KB | 5.9 KB | 5.1 KB | 14.2 KB | 0.7 KB | 3.9 KB | 0 / 0 | 66.2 KB | 0.0 KB | 87.8 KB | 3 |
| Blog post | 22.8 KB | 6.3 KB | 5.4 KB | 10.8 KB | 0.7 KB | 3.4 KB | 0 / 0 | 66.2 KB | 55.1 KB | 144.1 KB | 4 |

### Layout shift and LCP measured in the browser (no throttling)

| Page | CLS mobile | CLS desktop | LCP mobile | LCP desktop |
| --- | --- | --- | --- | --- |
| Homepage | 0.0000 | 0.0000 | 0.18 s | 0.11 s |
| About | 0.0000 | 0.0000 | 0.08 s | 0.11 s |
| Blog index | 0.0000 | 0.0000 | 0.08 s | 0.08 s |
| Blog post | 0.0000 | 0.0000 | 0.11 s | 0.09 s |

### Heading outline

**Homepage** (`/`): valid (one H1, no skipped levels)

```
H1  Chris McKane, digital marketing strategist
  H2  [Placeholder] Lorem ipsum: a short introduction
  H2  [Placeholder] An approach built on organic growth
    H3  [Placeholder] Organic search
    H3  [Placeholder] Web performance
    H3  [Placeholder] Design and experience
    H3  [Placeholder] Conversion
  H2  [Placeholder] Find what you came for
  H2  Latest from the blog
    H3  Placeholder post seven: lorem ipsum dolor sit amet
    H3  Placeholder post six: lorem ipsum dolor sit amet
    H3  Placeholder post five: lorem ipsum dolor sit amet
  H2  [Placeholder] Lorem ipsum: work with me
```

**About** (`/about`): valid (one H1, no skipped levels)

```
H1  About Chris McKane
  H2  Experience
    H3  [Placeholder role title]
    H3  [Placeholder role title]
    H3  [Placeholder role title]
  H2  Credentials
  H2  [Placeholder] Lorem ipsum: work with me
```

**Blog index** (`/blog`): valid (one H1, no skipped levels)

```
H1  Blog
  H2  Placeholder post seven: lorem ipsum dolor sit amet
  H2  Placeholder post six: lorem ipsum dolor sit amet
  H2  Placeholder post five: lorem ipsum dolor sit amet
  H2  Placeholder post four: lorem ipsum dolor sit amet
  H2  Placeholder post three: lorem ipsum dolor sit amet
```

**Blog post** (`/blog/placeholder-post-one`): valid (one H1, no skipped levels)

```
H1  Placeholder post one: lorem ipsum dolor sit amet
  H2  Lorem ipsum dolor sit amet
    H3  Consectetur adipiscing elit
    H3  Sed do eiusmod tempor
  H2  Ut enim ad minim veniam
  H2  Duis aute irure dolor
  H2  About the author: Chris McKane
  H2  Related posts
    H3  Placeholder post seven: lorem ipsum dolor sit amet
    H3  Placeholder post four: lorem ipsum dolor sit amet
```

### Structured data (JSON-LD, merged by @id)

| Page | Types present | Checks |
| --- | --- | --- |
| Homepage | WebSite, Person, WebPage | lang=en-GB; canonical=yes |
| About | WebSite, Person, ProfilePage, BreadcrumbList | lang=en-GB; canonical=yes |
| Blog index | WebSite, Person, CollectionPage, BreadcrumbList | lang=en-GB; canonical=yes |
| Blog post | BlogPosting, WebSite, Person, BreadcrumbList | lang=en-GB; canonical=yes; BlogPosting has headline=true, datePublished=true, author=true, publisher=true |

### Colour contrast (WCAG 2.2)

Computed by `npm run check:contrast` directly from the colour tokens in `src/styles/global.css`.
The "light sweep" rows composite the translucent sweep over the button gradient at its brightest point,
which is the worst case for the light theme.

| Theme | Pairing | Ratio | Required | Result |
| --- | --- | --- | --- | --- |
| Dark | Body text on page background | 19.75:1 | 7:1 | Pass |
| Dark | Body text on surface (author box, code) | 17.57:1 | 7:1 | Pass |
| Dark | Muted text on page background | 13.86:1 | 7:1 | Pass |
| Dark | Muted text on surface | 12.33:1 | 7:1 | Pass |
| Dark | Links and badge figures (accent) on page background | 14.03:1 | 7:1 | Pass |
| Dark | Links (accent) on surface | 12.48:1 | 7:1 | Pass |
| Dark | Link hover (text colour) on page background | 19.75:1 | 7:1 | Pass |
| Dark | Link hover (text colour) on surface | 17.57:1 | 7:1 | Pass |
| Dark | Button label on gradient start | 14.03:1 | 7:1 | Pass |
| Dark | Button label on gradient middle (hover and focus) | 16.29:1 | 7:1 | Pass |
| Dark | Button label on gradient start with light sweep | 15.78:1 | 7:1 | Pass |
| Dark | Button label on gradient middle with light sweep | 17.51:1 | 7:1 | Pass |
| Dark | Skip link (page background colour on text colour) | 19.75:1 | 7:1 | Pass |
| Dark | Selected text (page background colour on accent) | 14.03:1 | 7:1 | Pass |
| Dark | Focus ring (accent) against page background | 14.03:1 | 3:1 | Pass |
| Dark | Focus ring (accent) against surface | 12.48:1 | 3:1 | Pass |
| Dark | Theme switch outline (text colour) against page background | 19.75:1 | 3:1 | Pass |
| Dark | Theme switch knob and status marker (accent) against page background | 14.03:1 | 3:1 | Pass |
| Dark | Photo placeholder outline (muted) against surface | 12.33:1 | 3:1 | Pass |
| Dark | Divider lines against page background (decorative) | 1.64:1 | none | n/a |
| Light | Body text on page background | 17.61:1 | 7:1 | Pass |
| Light | Body text on surface (author box, code) | 15.65:1 | 7:1 | Pass |
| Light | Muted text on page background | 12.26:1 | 7:1 | Pass |
| Light | Muted text on surface | 10.90:1 | 7:1 | Pass |
| Light | Links and badge figures (accent) on page background | 8.84:1 | 7:1 | Pass |
| Light | Links (accent) on surface | 7.85:1 | 7:1 | Pass |
| Light | Link hover (text colour) on page background | 17.61:1 | 7:1 | Pass |
| Light | Link hover (text colour) on surface | 15.65:1 | 7:1 | Pass |
| Light | Button label on gradient start | 8.84:1 | 7:1 | Pass |
| Light | Button label on gradient middle (hover and focus) | 10.56:1 | 7:1 | Pass |
| Light | Button label on gradient start with light sweep | 7.32:1 | 7:1 | Pass |
| Light | Button label on gradient middle with light sweep | 8.65:1 | 7:1 | Pass |
| Light | Skip link (page background colour on text colour) | 17.61:1 | 7:1 | Pass |
| Light | Selected text (page background colour on accent) | 8.84:1 | 7:1 | Pass |
| Light | Focus ring (accent) against page background | 8.84:1 | 3:1 | Pass |
| Light | Focus ring (accent) against surface | 7.85:1 | 3:1 | Pass |
| Light | Theme switch outline (text colour) against page background | 17.61:1 | 3:1 | Pass |
| Light | Theme switch knob and status marker (accent) against page background | 8.84:1 | 3:1 | Pass |
| Light | Photo placeholder outline (muted) against surface | 10.90:1 | 3:1 | Pass |
| Light | Divider lines against page background (decorative) | 1.81:1 | none | n/a |

Divider lines are decorative separators between sections. They carry no information and are not the
boundary of any control, so no minimum applies (WCAG 1.4.11). Controls use the text or accent colour for
their outlines instead.
