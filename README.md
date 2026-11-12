# Chris McKane: personal site

Personal brand site and blog for Chris McKane. Built with [EmDash CMS](https://emdashcms.com) on
[Astro](https://astro.build), hosted on Cloudflare Workers (D1, R2, KV, Workers Cache).

- **[GUIDE.md](GUIDE.md):** what everything is, how to get it live, how to edit content, switch
  availability mode and turn indexing on. Start here.
- **[VERIFICATION.md](VERIFICATION.md):** Lighthouse, accessibility, contrast, page weight and
  heading outline results.
- **[AGENTS.md](AGENTS.md):** project rules for AI assistants such as Claude Code.

Content is edited in the admin at `/_emdash/admin`. Code changes merged into `main` deploy
automatically through Cloudflare.

```bash
npm install
npm run dev      # http://localhost:4321
```
