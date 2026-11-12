// @ts-check
import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

/**
 * How long Cloudflare's edge cache may keep a rendered page.
 *
 * maxAge: the page is served straight from the cache for a day.
 * swr ("stale while revalidate"): for a further week, a visitor still gets the cached copy
 * instantly while Cloudflare refreshes it in the background.
 *
 * Editors never wait this long: EmDash purges the affected pages the moment content,
 * menus or settings change. These numbers only matter if a purge is ever missed.
 */
const DAY = 86_400;
const WEEK = 604_800;
const cached = (/** @type {string[]} */ ...tags) => ({ maxAge: DAY, swr: WEEK, tags: [...tags, "all"] });

/**
 * EmDash's rich text renderer ships styles for every block the editor can insert
 * (galleries, columns, embeds, buttons, cover images and so on): about 12 KB that would
 * be inlined into every page whether used or not. This drops them at build time.
 * Paragraphs, headings, lists, quotes, links, images, code and tables are styled by
 * this site's own src/styles/prose.css instead.
 *
 * To use another block's built-in look (for example "Gallery"), add its component name
 * to KEEP, or style it in src/styles/prose.css.
 */
const KEEP = ["Block"];
const EMDASH_STYLE = /\/emdash\/src\/components\/(?:widgets\/)?(\w+)\.astro\?.*type=style/;
const trimEmDashStyles = {
	name: "trim-emdash-styles",
	enforce: /** @type {const} */ ("pre"),
	/** @param {string} _code @param {string} id */
	transform(_code, id) {
		const component = id.match(EMDASH_STYLE)?.[1];
		if (component && !KEEP.includes(component)) return { code: "", map: null };
	},
};

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	trailingSlash: "never",

	// Inline every stylesheet into the HTML: no render-blocking CSS request.
	build: { inlineStylesheets: "always" },

	image: { layout: "constrained" },

	vite: { plugins: [trimEmDashStyles] },

	// Edge caching of rendered HTML (Cloudflare "Workers Cache"). See GUIDE.md, "Caching".
	cache: { provider: cacheCloudflare() },
	routeRules: {
		"/": cached("pages", "posts", "site_options"),
		"/about": cached("pages", "site_options"),
		"/blog": cached("posts", "site_options"),
		"/blog/page/[page]": cached("posts", "site_options"),
		"/blog/category/[slug]": cached("posts", "site_options"),
		"/blog/category/[slug]/page/[page]": cached("posts", "site_options"),
		"/blog/[slug]": cached("posts", "site_options"),
		"/rss.xml": cached("posts"),
		"/sitemap.xml": cached("posts", "pages"),
		"/sitemap-[collection].xml": cached("posts", "pages"),
	},

	integrations: [
		react(), // Required by the EmDash admin screens only. No React is sent to site visitors.
		emdash({
			database: d1({ binding: "DB", session: "auto", coalesce: true }),
			storage: r2({ binding: "MEDIA" }),
			// No on-page editing toolbar: it would add about 4 KB of JavaScript to every page
			// for every visitor. Editing happens in the admin at /_emdash/admin. Public HTML is
			// therefore identical for everyone, which is also what makes it safe to cache.
			toolbar: false,
			// Use system fonts in the admin instead of downloading Noto Sans from Google at build time.
			fonts: false,
		}),
	],

	// Self-hosted fonts. Files live in src/assets/fonts and are served from our own domain.
	// Astro generates metric-matched fallback fonts (size-adjust, ascent/descent overrides).
	// "optional" means a font is used only if it is ready when the page first paints
	// (it nearly always is: the files are preloaded, then cached for a year). Text never
	// re-flows after it has been drawn, which is what keeps layout shift at exactly zero.
	fonts: [
		{
			provider: fontProviders.local(),
			name: "Schibsted Grotesk",
			cssVariable: "--font-heading",
			fallbacks: ["Arial", "sans-serif"],
			options: {
				variants: [
					{
						src: ["./src/assets/fonts/schibsted-grotesk-latin-500-800-normal.woff2"],
						weight: "500 800",
						style: "normal",
						display: "optional",
					},
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: "Literata",
			cssVariable: "--font-body",
			fallbacks: ["Georgia", "serif"],
			options: {
				variants: [
					{
						src: ["./src/assets/fonts/literata-latin-400-700-normal.woff2"],
						weight: "400 700",
						style: "normal",
						display: "optional",
					},
					{
						src: ["./src/assets/fonts/literata-latin-400-700-italic.woff2"],
						weight: "400 700",
						style: "italic",
						display: "optional",
					},
				],
			},
		},
	],

	devToolbar: { enabled: false },
});
