# Guide to your site

Written for Chris. Plain English throughout; any jargon is explained where it first appears.

**Contents**

1. [What you have](#1-what-you-have)
2. [What it costs and which Cloudflare plan you need](#2-what-it-costs-and-which-cloudflare-plan-you-need)
3. [Getting it live: your steps](#3-getting-it-live-your-steps)
4. [Editing content in EmDash](#4-editing-content-in-emdash)
5. [Switching availability mode](#5-switching-availability-mode)
6. [Turning indexing on at launch](#6-turning-indexing-on-at-launch)
7. [How caching works](#7-how-caching-works)
8. [Working on the site with Claude Code or GitHub](#8-working-on-the-site-with-claude-code-or-github)
9. [Letting an AI edit content (MCP)](#9-letting-an-ai-edit-content-mcp)
10. [Troubleshooting](#10-troubleshooting)
11. [Decisions log](#11-decisions-log)
12. [Where the brief and the platform disagreed](#12-where-the-brief-and-the-platform-disagreed)

The measurements (Lighthouse, accessibility, contrast, page weights, heading outlines) are in [VERIFICATION.md](VERIFICATION.md).

---

## 1. What you have

| Part | What it is | Where it lives |
| --- | --- | --- |
| **The code** | The templates, styles and settings that turn content into web pages. | This GitHub repository. |
| **Astro** | The framework that builds the pages. It renders HTML on the server and sends almost no JavaScript to visitors. | Inside the code. |
| **EmDash** | The content management system (CMS): the admin screens where you write and edit. | Inside the code. You reach it at `/_emdash/admin` on your site. |
| **Cloudflare Worker** | The small server that runs the site. Cloudflare runs it in its data centres worldwide. | Your Cloudflare account, named `practice-site`. |
| **D1** | The database. All text, settings, menus and users. | Your Cloudflare account. Created automatically on first deploy. |
| **R2** | File storage for images you upload. | Your Cloudflare account. Created automatically on first deploy. |
| **KV** | A small store that remembers admin logins. | Your Cloudflare account. Created automatically on first deploy. |
| **Workers Cache** | Cloudflare keeps a finished copy of each page close to visitors, so most visits never touch the database. | Automatic. See [section 7](#7-how-caching-works). |
| **Seed file** | `seed/seed.json`. Describes every content type, section type, menu and the Lorem ipsum placeholder content. It is applied once, the first time you set the site up. | This repository. |

**How a change reaches the live site**

- **Content** (words, images, menus, settings): you edit in the EmDash admin and press Publish. Live within seconds. No code, no deploy.
- **Design or features** (code): a change is pushed to the `main` branch on GitHub, Cloudflare notices, rebuilds and deploys automatically in a couple of minutes.

**Pages that exist now**

| Address | What it shows |
| --- | --- |
| `/` | Homepage, built from the page with the slug `home`. |
| `/about` | About page, built from the page with the slug `about`. |
| `/blog` | Blog index. Its heading and introduction come from the page with the slug `blog`. |
| `/blog/page/2` ... | Further pages of the blog index. |
| `/blog/category/seo` ... | Posts in one category. |
| `/blog/your-post-slug` | A single post. |
| `/rss.xml`, `/sitemap.xml`, `/robots.txt` | Feed, sitemap and crawler instructions. |
| `/any-new-page` | Any new page you create in the Pages collection appears at `/its-slug` automatically. |

("Slug" means the short, web-address version of a title, for example `about`.)

---

## 2. What it costs and which Cloudflare plan you need

**Short version: plan on Workers Paid at US$5 a month. Everything else stays on free tiers.**

You can start on the free plan to confirm everything works, then upgrade. Here is why I recommend paying the $5:

- The free Workers plan allows only **10 milliseconds of processor time per request**. EmDash builds pages on the server and its admin screens do real work. Cloudflare's own documentation says server rendering typically uses 10 to 20 ms, so on the free plan some requests (most likely in the admin) can fail with "Error 1102: Worker exceeded resource limits".
- Workers Paid raises that to 30 seconds per request and includes far more than this site will use.

| Service | Free allowance | On Workers Paid ($5/month) | Will you exceed it? |
| --- | --- | --- | --- |
| Workers (runs the site) | 100,000 requests a day, 10 ms CPU each | 10 million requests and 30 million CPU ms a month included | The 10 ms limit is the reason to upgrade. |
| D1 (database) | 5 GB, 5 million rows read a day, 100,000 rows written a day | 25 billion rows read and 50 million written a month included | No. |
| R2 (images) | 10 GB stored, 1 million writes a month, no bandwidth charges | Same free allowance, then $0.015 per GB a month | No. Needs a payment card on file to switch on, even at $0. |
| KV (logins) | 100,000 reads and 1,000 writes a day | 10 million reads and 1 million writes a month included | No. |
| Image resizing | 5,000 unique resized images a month | Same (a separate Images plan exists if you ever need more) | Unlikely. Each image you publish uses about 14. |
| Workers Builds (auto-deploy from GitHub) | 3,000 build minutes a month | 6,000 build minutes a month | No. Each build takes a few minutes. |
| Workers Cache | Included, no separate charge | Included | n/a |
| Domain on Cloudflare (DNS, SSL) | Free plan | Free plan | n/a |
| Cloudflare Access (keeps staging private) | Free for up to 50 users | Free for up to 50 users | No. |

Sources, read on 11 November 2026 from Cloudflare's own documentation: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [KV pricing](https://developers.cloudflare.com/kv/platform/pricing/), [Images pricing](https://developers.cloudflare.com/images/pricing/), [Workers Builds limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/), [Workers Cache pricing](https://developers.cloudflare.com/workers/cache/#pricing).

One figure I could not check from this session: the Cloudflare Access free tier (50 users) comes from Cloudflare's [Zero Trust plans page](https://www.cloudflare.com/plans/zero-trust-services/), which this environment could not open. Please glance at it before relying on it.

---

## 3. Getting it live: your steps

These are the only things that need you. They are grouped so you can do them in three sittings:

- **Sitting 1 (about 30 minutes):** steps A to E. The site is live on a free `workers.dev` address and private.
- **Sitting 2 (10 minutes, then wait up to 24 hours):** step F. Start moving the domain.
- **Sitting 3 (15 minutes):** steps G and H. Point the domain at the new site.

Never paste passwords, tokens or keys into a chat with me. Nothing below needs you to: every sign-in happens on GitHub's or Cloudflare's own pages.

### A. Merge the work into `main` on GitHub

All the work is on a branch (a separate copy) so nothing changed until you approve it.

1. Open the pull request (the link is in my summary message, or go to `github.com/Chris-Mckane/practice-site` and click the **Pull requests** tab).
2. If it says "Draft", click **Ready for review**.
3. Click **Merge pull request**, then **Confirm merge**.
4. You should see a purple "Merged" label. The code is now on `main`.

### B. Create your Cloudflare account and switch on R2

1. Go to `https://dash.cloudflare.com/sign-up` and create an account (or log in).
2. In the left menu choose **Storage & databases**, then **R2 Object Storage**.
3. Follow the prompt to activate R2. It asks for a payment card. The free allowance (10 GB) is far more than this site needs, so you should not be charged.
4. You should see an empty list of "buckets". That is correct: the bucket is created for you in step C.

Why now: the first deploy creates the image storage automatically, and it fails if R2 has never been switched on.

Optional but recommended now: upgrade to Workers Paid. Left menu **Workers & Pages**, then **Plans** (or the "Upgrade" prompt on the overview page), choose **Workers Paid**, $5 a month.

### C. Connect GitHub to Cloudflare (automatic deploys)

1. In the Cloudflare dashboard, left menu: **Workers & Pages**.
2. Click **Create application**.
3. Choose **GitHub** (it may be worded "Import a repository" or "Continue with GitHub").
4. A GitHub window opens asking you to authorise "Cloudflare Workers and Pages". Choose **Only select repositories**, pick `practice-site`, then **Install & Authorize**.
5. Back in Cloudflare, select the `practice-site` repository.
6. On the configuration screen set:
   - **Project name:** `practice-site` (exactly this; it must match the name in the code or the build is refused).
   - **Production branch:** `main`.
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - Leave everything else as it is.
7. Click **Save and Deploy** (it may say **Create and deploy**).
8. Wait about 2 to 4 minutes. You should see a green "Success" and a web address like `https://practice-site.YOUR-NAME.workers.dev`.
9. Then go to the Worker's **Settings** tab, **Build** section, **Branch control**, and untick **Enable Preview Builds**. (Previews would try to build every branch with a separate empty database. You do not need them.)

If the build fails, see [Troubleshooting](#10-troubleshooting).

### D. Keep it private with Cloudflare Access (do this before setup)

Until setup is finished, whoever reaches the admin first could create the administrator account. So lock the door first. Cloudflare Access puts a Cloudflare login page in front of the whole site.

1. **Workers & Pages**, click `practice-site`.
2. Open the **Access** tab.
3. Click **Protect this Worker behind Access**. If Cloudflare says Zero Trust is not set up yet, follow its prompt: pick any team name, choose the **Free** plan (it may ask for a card), then come back to this tab.
4. Choose **All traffic**.
5. Under **Authentication policy** choose **Cloudflare account**. That means only people who can log in to your Cloudflare account (you) can see the site.
6. Click **Apply Access**.
7. Check it worked: open the `workers.dev` address in a private browser window. You should get a Cloudflare login page, not the site.

This one setting covers the `workers.dev` address and, later, your custom domain.

Two things to know while Access is on:
- Search engines and social networks cannot see the site at all (which is what you want for staging).
- Outside tools cannot reach the site either. That includes AI tools connecting to the CMS (section 9) and the "Check and switch" domain test in step H.

### E. First-time setup of the CMS

1. Open `https://practice-site.YOUR-NAME.workers.dev/_emdash/admin` and pass the Cloudflare login.
2. The setup wizard appears.
   - **Site title** and **tagline:** already filled in ("Chris McKane", "Digital marketing strategist"). Change them if you like.
   - **Start with:** choose **Sample content** (it should already be selected). This is essential: it creates the homepage, About page, blog page, Site options and the Lorem ipsum posts. Without it the site is empty.
3. **Create your account.** EmDash uses a *passkey* instead of a password. A passkey is a login stored by your device and unlocked with your fingerprint, face or device PIN. Enter your name and email, click to create the passkey and approve the prompt from your browser or phone.
4. You should land on the EmDash dashboard with a **Staging** badge in the header. Staging means search engines are being told to stay away.
5. Open the `workers.dev` address (without `/_emdash/admin`). You should see the homepage with placeholder text, the live performance badge and, after a moment, the placeholder photos.

About the placeholder images: during setup the site downloads two grey placeholder images from this GitHub repository (`seed/assets`). That only works while the repository is public and step A is done. If they are missing, nothing is broken: upload any image in the admin and select it.

A passkey only works on the web address where it was created. Step H covers creating one for your real domain.

### F. Move holistic-seo.co.uk onto Cloudflare (start)

This changes who answers "where is this domain?" (its *nameservers*) from your current provider to Cloudflare. Your DigitalOcean site keeps working throughout this step.

1. Cloudflare dashboard, left menu: **Domains** (or **Websites**), then **Onboard a domain** (or **Add a domain**).
2. Enter `holistic-seo.co.uk`. Keep the option to **scan for DNS records automatically**. Click **Continue**.
3. Choose the **Free** plan.
4. **Review the DNS records carefully.** DNS records are the address book for your domain. Cloudflare copies what it can find, but it can miss some.
   - Open your current DNS provider (DigitalOcean, or wherever the domain's DNS is managed) in another tab and compare line by line.
   - **Email is the one to protect.** Look for records of type **MX** (where email is delivered) and **TXT** records that start with `v=spf1`, or have names containing `_dmarc` or `_domainkey` (these prove your email is genuine). Every one of them must exist in Cloudflare with exactly the same values. Add any that are missing with **Add record**.
   - Records for the website itself (type **A** or **CNAME** for `holistic-seo.co.uk` and `www`) will show an orange cloud ("Proxied"). Leave them for now. They still point to DigitalOcean.
   - MX and TXT records have no cloud icon. That is normal.
5. Click **Continue**. Cloudflare shows you **two nameservers** (for example `ada.ns.cloudflare.com`). Keep this tab open.
6. Log in to the company where you **registered** the domain (where you pay the yearly renewal).
   - If **DNSSEC** is switched on there, switch it off first and wait an hour. (DNSSEC is a signing feature; changing nameservers while it is on can take the domain offline.)
   - Find the **Nameservers** setting, remove the existing ones and enter Cloudflare's two, copied exactly.
7. Back in Cloudflare, click **Done, check nameservers** (or just wait).
8. Wait for an email from Cloudflare saying the domain is **Active**. Usually an hour or two, at most 24.

What you should see when it worked: on the Cloudflare **Domains** page, `holistic-seo.co.uk` has a green **Active** status. Your DigitalOcean site and your email still work.

### G. Point the domain at the new site

**This is the moment the DigitalOcean site stops being served on holistic-seo.co.uk.** The droplet itself keeps running (and costing money) until you delete it at DigitalOcean. Do that only once you are happy.

1. Cloudflare dashboard: **Domains**, click `holistic-seo.co.uk`, then **DNS**, **Records**.
2. Find the website records that point to DigitalOcean: type **A** (and **AAAA** if present) named `holistic-seo.co.uk` or `@`, and anything named `www`. Delete those. **Do not touch MX or TXT records.**
3. Go to **Workers & Pages**, click `practice-site`, **Settings**, **Domains & Routes**, **Add**, **Custom Domain**.
4. Enter `holistic-seo.co.uk` and click **Add Custom Domain**. Cloudflare creates the DNS record and the security certificate for you.
5. Wait a minute or two, then open `https://holistic-seo.co.uk`. You should get the Cloudflare Access login, then the new site.

Optional tidy-up: in the same **Domains & Routes** panel you can switch off the `workers.dev` address so the site has one address only. Do that after step H.

### H. Tell EmDash its new address and create a passkey there

1. Log in to the admin at the **old** address: `https://practice-site.YOUR-NAME.workers.dev/_emdash/admin`.
2. Go to **Settings**, **General**. Next to **Site URL** click **Change domain**.
3. Enter `holistic-seo.co.uk` and click **Check and switch**.
   - Because Cloudflare Access is in front of the site, the automatic check will probably fail. That is expected. First confirm in another tab that `https://holistic-seo.co.uk` really shows this site, then choose **Use holistic-seo.co.uk anyway**.
4. Still in **Settings**, **General**, click **Continue on holistic-seo.co.uk** (below Site URL), then **Continue** on the page that opens.
5. **Settings**, **Security** opens on the new address. Click **Register Passkey** and approve the prompt.
6. From now on, log in at `https://holistic-seo.co.uk/_emdash/admin`.

Why this matters: the Site URL is what the site uses for canonical links, the sitemap and social sharing tags. If it still says `workers.dev`, those would point to the wrong address.

### Later: launching on chrismckane.co.uk

When you are ready, the same three steps apply (F for the new domain, then G and H), followed by [section 6](#6-turning-indexing-on-at-launch). Ask Claude Code to walk you through it at the time. It should also set up a redirect from `www` to the main address and from holistic-seo.co.uk to the new domain.

---

## 4. Editing content in EmDash

Log in at `/_emdash/admin`. The left menu has everything.

### The golden rule

Edit, then press **Publish**. Until you publish, visitors see the previous version. Each save keeps a revision you can go back to.

### Pages (homepage, About, blog introduction)

1. **Pages**, then click a page: **Chris McKane, digital marketing strategist** (the homepage, slug `home`), **About Chris McKane** (`about`) or **Blog** (`blog`).
2. The **Page sections** field is a stack of blocks. Click a block to open it and edit its fields.
3. **Reorder** by dragging a block up or down. **Remove** with the block's delete control. **Add** with the add button and pick a type.
4. Press **Publish**.

The section types:

| Section | Use it for |
| --- | --- |
| **Hero (homepage introduction)** | The homepage opening: H1 headline, introduction, primary button, secondary link, status line, performance badge. |
| **Page header** | A simple H1 and lead paragraph for any other page. |
| **About intro** | Short introduction with an optional photo and a link. |
| **Approach (organic growth focus)** | A heading, an introduction and a list of principles. |
| **Route links** | Large signpost links (Blog, About). Can end with the primary call to action automatically. |
| **Latest posts** | The newest posts, fetched automatically. You choose how many. |
| **Contact call to action** | The closing contact section. Its words come from Site options (see below). |
| **Profile (About page introduction)** | About page opening: H1, lead, portrait and biography. |
| **Experience** | A list of roles. |
| **Credentials** | A table of qualifications. |
| **Text section** | General text with an optional heading. |

Headings look after themselves: the first Hero, Profile or Page header on a page becomes the single H1. Section headings are H2 and items inside them are H3. You cannot accidentally create a second H1.

To **add a new page**: **Pages**, **New**, give it a title and a slug (for example `services`), add a **Page header** section first, then other sections, and publish. It appears at `/services`. Add it to a menu if you want it in the navigation.

### Blog posts

1. **Posts**, **New** (or click an existing post).
2. Fill in:
   - **Title:** becomes the H1.
   - **Excerpt:** one or two sentences. Shown in lists and used as the meta description unless you set one in the SEO panel.
   - **Featured image:** optional. See "Images" below.
   - **Body:** the editor. Use **Heading 2** and **Heading 3** only. (If a Heading 1 or Heading 4 slips in, the site quietly converts it to keep the outline valid.)
   - **Last updated:** leave empty for a new post. When you make a substantial update later, set the date. Readers and search engines then see "Updated".
3. In the side panels: choose a **Category**, check the **Byline** (author) is you, and optionally open **SEO** to set a custom title, description, social image, canonical URL or "Hide from search engines".
4. Press **Publish**. You can also schedule a post for later.

Reading time is worked out automatically from the word count. Related posts are chosen automatically from the same category.

### Images

- Upload in the field itself or in **Media**.
- **Alt text is required.** Alt text is the description read out to people who cannot see the image. If an image has no alt text, the site does not show it at all. Write what the image shows, in a short sentence.
- You do not need to resize anything. The site serves the right size for each screen in modern formats (AVIF, with WebP as a fallback).

### Site options (availability, buttons, contact details)

**Site options**, then **Global site options**. One entry controls:

- **Availability mode** (see [section 5](#5-switching-availability-mode)).
- Your name and job title (used in the author box and in structured data for search engines).
- The **status line**, **primary button** text and link, and the **contact section** heading and text, each with a freelance version and an employed version.
- **Contact email**, **social profiles** and the **footer note**.

There must be exactly one Site options entry. Do not add a second.

### Settings (name, tagline, SEO defaults, going live)

**Settings** in the left menu:

- **General:** site title, tagline, **Site Status** (staging or live), Site URL, posts per page, timezone.
- **SEO:** title separator, default social sharing image, Google and Bing verification codes, custom `robots.txt`.

### Menus

**Menus**: **Primary navigation (header)** and **Footer navigation**. Add, rename, reorder or remove items. If a menu item points to the same place as the primary button, the header hides the button to avoid showing the same link twice.

### Categories and author

- **Categories:** add or rename, and give each a **description**. The description appears under the heading on that category's page and is its meta description.
- **Bylines:** your author profile. The **bio** appears in the author box under every post.

---

## 5. Switching availability mode

1. Admin, **Site options**, **Global site options**.
2. Change **Availability mode** to **freelance** or **employed**.
3. Press **Publish**.

Within seconds, on every page:

| | Freelance | Employed |
| --- | --- | --- |
| Status line (homepage) | The freelance status text | The employed status text |
| Primary button (header, homepage, author box) | Freelance button text and link | Employed button text and link |
| Final route link on the homepage | Follows the primary button | Follows the primary button |
| Contact section | Freelance heading and text | Employed heading and text |

Everything else stays word for word the same: headings, body copy, posts, addresses, titles and descriptions. That is deliberate, so switching modes does not disturb your rankings. I tested it: 75 pieces of text on the homepage are identical in both modes and only the items above change.

The switch happens on the server, so search engines and visitors without JavaScript see the right version.

---

## 6. Turning indexing on at launch

While the site is in **staging** (the default after setup), three things tell search engines to stay away:

1. Every page, feed and sitemap is sent with the header `X-Robots-Tag: noindex, nofollow`.
2. Every page has `<meta name="robots" content="noindex, nofollow">`.
3. `/robots.txt` says `Disallow: /`.

To go live:

1. If Cloudflare Access is still on, remove it first: **Workers & Pages**, `practice-site`, **Access** tab, turn the protection off. (Otherwise search engines only ever see a login page.)
2. Admin, **Settings**, **General**, under **Site Status** click **Go live**.

All three signals reverse at once: the header and meta tag disappear and `robots.txt` switches to "allow everything except the admin" with a link to the sitemap. Cached pages are refreshed automatically. **Switch back to staging** on the same screen reverses it again.

Then, as you know better than I do: submit `/sitemap.xml` in Google Search Console and Bing Webmaster Tools (verification codes go in **Settings**, **SEO**).

One thing worth your judgement as an SEO: `Disallow: /` stops crawlers fetching pages, which means they cannot read the `noindex` on them. For a brand-new staging address that is belt and braces. But holistic-seo.co.uk already has a site, so some URLs may be in Google's index today. Disallowed URLs that are already indexed can linger as bare links. With Cloudflare Access on, this is academic (crawlers get a login page). I built all three signals as the brief asked; if you would rather drop the `Disallow` so crawlers can see the `noindex`, it is a three-line change in `src/middleware.ts`.

---

## 7. How caching works

**The problem:** building a page means several round trips to the database. Doing that for every visitor would be slow.

**The solution:** the first time anyone requests a page, the Worker builds it and Cloudflare keeps the finished HTML in its edge cache (Workers Cache), in data centres near visitors. Everyone after that gets the stored copy without the Worker or database running at all.

**Staying fresh:**

- Each cached page carries labels ("tags") for the content it shows: the entry, its collection, the menus and the settings.
- When you publish, EmDash tells Cloudflare to throw away every cached page with a matching tag. This usually takes a few seconds.
- As a safety net, a cached page is treated as fresh for 1 day, and for a further 7 days Cloudflare serves the old copy instantly while fetching a new one in the background.
- Every code deploy starts with an empty cache, so design changes are never mixed with old pages.
- Browsers are told to check back with Cloudflare on each visit rather than reuse an old copy, so you never need to tell anyone to "clear their cache".

**What is never cached:** the admin, previews of unpublished drafts, "page not found" responses and `robots.txt`.

**Limits worth knowing:** Cloudflare allows 5 cache purges a minute (with a burst of 25). One publish is one purge, so normal editing is fine. If you published dozens of things within a minute, a few pages might show the old version for up to a day. Republish to fix, or just wait.

The rules are in `astro.config.mjs` under `routeRules`.

---

## 8. Working on the site with Claude Code or GitHub

### With Claude Code (recommended)

1. Open Claude Code (web, desktop or terminal) and choose the `practice-site` repository.
2. Describe what you want in plain English, for example: "Add a Services page section type with three columns of text" or "Make the homepage headline smaller on phones".
3. Claude makes the change on a branch and opens a pull request.
4. Review, then **Merge** on GitHub. Cloudflare deploys it automatically within a few minutes.

Helpful to know:

- `AGENTS.md` tells any AI assistant how this project is put together and its rules (budgets, accessibility, heading rules). Claude reads it automatically.
- `.agents/skills/` contains EmDash's own instructions for AI assistants.
- Ask Claude to "run the verification" after design changes. It re-measures everything in VERIFICATION.md.

### Directly on GitHub

For a small text change in code (rare, since all copy is in the CMS): open the file on github.com, click the pencil icon, edit, and choose **Commit changes** on `main`. Cloudflare deploys automatically.

### What lives where

| You want to change | Where |
| --- | --- |
| Words, images, menus, buttons, SEO fields | EmDash admin. No code. |
| Colours, fonts, spacing | `src/styles/global.css` (the tokens at the top). |
| How a section looks | `src/styles/sections.css` and `src/components/blocks/`. |
| A new section type | Add the block type in the admin (**Content Types**) or ask Claude Code, which will add its component too. |
| Cache times, fonts, EmDash options | `astro.config.mjs`. |
| Cloudflare settings | `wrangler.jsonc`. |

### Changing the content model after launch

The seed file only applies once, at first setup. Later changes to collections or fields are made in the admin under **Content Types**, or by asking Claude Code (which should also update `seed/seed.json` so a fresh install would match).

### Backups

The database has point-in-time recovery built in (Cloudflare calls it "Time Travel"): 7 days on the free plan, 30 days on Workers Paid. Uploaded images in R2 are not covered by it. Before any big restructure, ask Claude Code to walk you through taking a database export and a copy of the images.

---

## 9. Letting an AI edit content (MCP)

EmDash has a built-in MCP server. MCP is a standard way for AI assistants such as Claude to use a tool: here, to read and edit your content, menus and settings directly, with your permission.

- Address: `https://YOUR-SITE/_emdash/api/mcp`
- It always requires you to approve access. When you connect, a browser window asks you to log in and choose what the AI may do (read content, write content, manage menus and so on).
- To connect Claude: in Claude's settings add a custom connector with the address above and approve the prompt. EmDash's guide is at `https://docs.emdashcms.com/guides/ai-tools/`.
- Every collection, field and section type has a plain-English label and description, so an AI can tell what each is for. For example it can be asked to "switch the site to employed mode" or "draft a post in the SEO category".

**While Cloudflare Access is on**, outside tools cannot reach the site, so MCP will not connect. Use it after launch, or ask Claude Code to set up an Access "service token" for it.

---

## 10. Troubleshooting

| What you see | Likely cause | What to do |
| --- | --- | --- |
| Build fails mentioning R2 or "enable R2" | R2 was never activated on the account. | Do step B, then in **Workers & Pages**, `practice-site`, **Deployments**, retry the build. |
| Build fails with "Worker name" mismatch | The project name in Cloudflare is not `practice-site`. | Rename it in the Worker's settings, or recreate it with that exact name. |
| "Error 1102: Worker exceeded resource limits" | The free plan's 10 ms CPU limit. | Upgrade to Workers Paid ($5 a month). |
| Site is empty after setup | "Sample content" was not chosen in the wizard. | Ask Claude Code to help reset the database, or create the pages by hand (slugs `home`, `about`, `blog`) and a Site options entry. |
| Placeholder photos missing | The setup download from GitHub failed. | Upload any image in the admin and select it. |
| Images stopped appearing and show errors | The free allowance of 5,000 resized images in a month was used up. | Wait for the next month or add an Images plan. Very unlikely on this site. |
| A page still shows old content a minute after publishing | A cache purge was missed. | Publish again. Worst case it corrects itself within a day. |
| Passkey does not work | Passkeys are tied to one web address. | Log in at the address where you created it, then follow step H to create one for the new address. |
| Locked out completely | Lost device, no passkey. | Ask Claude Code. Recovery is possible through the database but needs care. Adding a second passkey on another device now (**Settings**, **Security**) avoids this. |
| The custom domain vanished after a deploy | Rare: Cloudflare settings and code disagree. | Ask Claude Code to record the domain in `wrangler.jsonc`. |

Logs: **Workers & Pages**, `practice-site`, **Logs** shows every request and error. Build logs are under **Deployments**.

---

## 11. Decisions log

Choices I made without asking, with the reason for each.

**Platform and structure**

1. **Versions pinned exactly:** Astro 7.4.11, EmDash 1.5.0, `@astrojs/cloudflare` 14.4.7, Wrangler 4.160.1, React 19.2.4 (used only by the admin screens). Upgrades are a deliberate act, not a surprise.
2. **npm, not pnpm.** Cloudflare's builder supports it out of the box and it is one less tool.
3. **Worker named `practice-site`** to match the repository, because Cloudflare refuses to build if the two names differ. Visitors never see this name once a custom domain is attached.
4. **Compatibility date `2026-02-24`,** the date EmDash's own templates use and test against.
5. **Co-editing, comments, search page and sandboxed plugins left off.** None are in scope, and each adds weight or needs a paid feature. They can be switched on later.
6. **Admin uses system fonts** (`fonts: false`). EmDash would otherwise download Noto Sans from Google during every build.
7. **Verification tooling lives in `tools/verify`** with its own dependency list, so Cloudflare's builds never install Lighthouse.

**Content model**

8. **"Site options" is a one-entry collection, not part of EmDash's Settings screen.** EmDash's Settings have a fixed set of fields and cannot hold custom ones (see section 12).
9. **Both the homepage and About page are built from blocks,** not just the homepage. One mechanism to learn, and you can restructure About without code.
10. **The blog index heading and introduction come from a `blog` page,** so nothing on `/blog` is hard-coded.
11. **A generic `/[slug]` route** serves any page you create. New pages need no code.
12. **"Last updated" is a field you set, not automatic.** Fixing a typo should not tell Google the post was updated.
13. **Author is an EmDash "byline",** the platform's own author feature, linked to the About page.
14. **Social profiles are a list of name and URL** in Site options. EmDash's built-in social settings only store usernames for six fixed networks.
15. **Category descriptions** double as the visible intro and the meta description on category pages.
16. **Placeholder identity:** the brief gave your name and role, so those are real. Everything else is Lorem ipsum or marked `[Placeholder]`. Email is `hello@example.com` and social links are `example.com` addresses so no false profile is ever published.
17. **Seed sets availability to freelance** so you see the fuller version first. The field's default for a new entry is employed.

**Design**

18. **Fonts: Schibsted Grotesk (headings and interface) and Literata (body).** Schibsted Grotesk was drawn for a news publisher: crisp, confident, slightly idiosyncratic. Literata was designed for long-form reading on screens and holds up well in white on dark. I compared Schibsted against Familjen Grotesk and Bricolage Grotesque in a rendered specimen before choosing. Both are open source (SIL Open Font License; licences in `src/assets/fonts`).
19. **Font files:** subset to Latin, weight ranges trimmed (headings 500 to 800, body 400 to 700), woff2: 34.6 KB, 31.6 KB and 32.1 KB (italic, loaded only when a page uses italics). Recreate with `scripts/subset-fonts.py`.
20. **The "ledger" layout:** hairline rules, section heading on the left, content on the right, heading stays in view as you scroll on wide screens. Chosen instead of card grids.
21. **The performance badge is the hero's signature element** on wide screens, sitting beside the headline. It is the proof of what you do.
22. **Status line is plain text with a small mint dot,** not a pill badge.
23. **Mint appears only on** links, focus rings, the primary button, the badge figures, list markers, the theme switch knob and the status dot.
24. **Micro-interactions:** the button's gradient and light sweep, links whose underline thickens, arrows that nudge, the theme switch knob, sticky section headings and a soft cross-fade between pages (in browsers that support it, no JavaScript). All are disabled when the visitor's device asks for reduced motion.
25. **No hamburger menu.** With two links, the navigation fits on a phone. Zero JavaScript.
26. **The theme switch is hidden when JavaScript is unavailable** (it could not work), and the site stays dark.
27. **Secondary actions are text links with an arrow,** so pills stay special.
28. **Favicon:** a simple "C" with a mint dot, replaceable in **Settings**, **General**.

**Performance**

29. **`font-display: optional` with preload** (see section 12 for the reasoning). This is what guarantees zero layout shift.
30. **Unused EmDash styles are removed at build time.** EmDash's rich-text component ships about 12 KB of CSS for galleries, columns, embeds and so on. A small build step in `astro.config.mjs` drops them. Paragraphs, headings, lists, quotes, links, images, code and tables are styled by the site's own stylesheet. If you start using galleries or embeds in posts, tell Claude Code and it can re-enable those styles.
31. **No on-page edit toolbar** (see section 12).
32. **CSS is split by page type** so a post does not carry homepage styles: about 11 KB on posts, about 14 KB elsewhere.
33. **Images are sized to their display width,** so the browser is never offered a 3,200 pixel file for a 350 pixel slot.
34. **Cache lifetime 1 day plus 7 days stale-while-revalidate,** the values EmDash's documentation recommends, because publishing purges immediately anyway.
35. **Browsers revalidate HTML on every visit** (`Cache-Control: no-cache`); the edge answers.
36. **CO2e is shown in milligrams.** A page this light produces a few thousandths of a gram, which reads as "0.00 g".
37. **The badge shows "cached"** instead of a size when the browser reused files it already had and nothing was transferred.

**SEO and accessibility**

38. **A custom `/sitemap.xml`** replaces EmDash's, so the homepage is listed as `/` (not `/home`) and the blog index and category pages are included. It respects "Hide from search engines".
39. **`/home` redirects to `/`** (301) so the homepage has one address.
40. **Paginated and category pages are indexable with self-referencing canonicals,** in line with Google's guidance.
41. **Structured data:** WebSite and Person on every page, ProfilePage on About, CollectionPage on listings, BlogPosting on posts (author and publisher are you, linked to the Person), BreadcrumbList on everything below the homepage.
42. **Page descriptions fall back sensibly:** the SEO panel first, then the excerpt (posts) or the introduction under the H1 (pages).
43. **The site stays hidden unless explicitly live.** Even in the minutes before setup is finished, the `noindex` header and `Disallow` are sent.
44. **Links never open new tabs.** Predictable for everyone, and required for some AAA criteria.
45. **Every stand-alone link and button is at least 44 by 44 pixels.** Links inside a sentence are exempt under WCAG, as the rule allows.
46. **Abbreviations on the badge are expanded** (`LCP`, `CLS`) for screen readers.

---

## 12. Where the brief and the platform disagreed

The brief said to follow the platform where they conflict and explain. Here is each case.

| The brief asked for | What the platform does | What I did |
| --- | --- | --- |
| Availability mode, CTAs, contact email and social URLs in **Site settings** | EmDash's Settings screen has a fixed list of fields. | A one-entry **Site options** collection. Same editing experience, also editable by AI. Site name, tagline and the indexing switch stay in EmDash's own Settings. |
| An **indexing on/off toggle** | EmDash has a built-in **Site Status: Staging / Live** switch that adds the `noindex` meta tag. | Used EmDash's switch and added the `X-Robots-Tag` header and the `Disallow: /` robots.txt to it, so one click controls all three. |
| `robots.txt` with `Disallow: /` while hidden | EmDash deliberately keeps robots.txt open in staging so crawlers can read the `noindex`. | Followed the brief. The trade-off is explained in section 6. |
| **Alt text required** in the CMS | EmDash 1.5 has no "alt text required" validation for images. | The field labels say it is required, and the site refuses to display an image without alt text, so a missing description is noticed immediately. A stricter save-time block is possible with a small plugin; I recommend it as a next step. |
| Post body limited to **H2 and H3** | The editor offers all heading levels and cannot be restricted. | The site converts on output: H1 becomes H2; H4 to H6 become H3. The outline is always valid. |
| Seed with **placeholder images** | On Cloudflare, seed images must be downloaded from a public web address at setup time; local files are not supported. | The two placeholders are committed in `seed/assets` and fetched from this repository's public GitHub address during setup. |
| **Preload only the font the LCP element uses** | With `font-display: optional` (needed for exactly zero layout shift), a font that is not preloaded will almost never appear on a first visit. | Both the heading font and the regular body font are preloaded (about 66 KB together). The italic is not. Measured effect on LCP: none, because text paints without waiting for fonts. To follow the brief to the letter, remove `preload` from the body font in `src/layouts/Base.astro`; first-time visitors would then usually see body text in the fallback serif. |
| **Only** the theme toggle and proof badge as client JavaScript | EmDash's on-page "Edit" toolbar adds about 4 KB of inline JavaScript for every visitor. | Switched the toolbar off. You edit in the admin. One line in `astro.config.mjs` (`toolbar: "client"`) brings it back if you would rather have it. |
| **Deployed to workers.dev** by me | Deploying needs your Cloudflare login, which I do not have and should not have. | Everything is ready for the automatic GitHub connection (step C). All measurements were taken on a local production build running in Cloudflare's own runtime. |
| **KV** in the stack | EmDash itself does not need KV. | Astro's Cloudflare adapter uses a KV namespace for admin login sessions and creates it automatically. EmDash's optional KV "object cache" is not enabled: with the edge cache in front it would mostly speed up the admin, and can be added later. |
| LCP under 1.0 s **on every page** | A page whose largest element is an image needs a second request. | Text-led pages (homepage, blog index, posts without a featured image) measure 0.8 s in Lighthouse's slow-4G lab test. Pages led by an image (About, posts with a featured image) measured 1.5 s and 1.8 s locally with unoptimised placeholder files. See VERIFICATION.md for what to expect in production. |
