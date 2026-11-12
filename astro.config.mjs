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

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	trailingSlash: "never",

	// Inline every stylesheet into the HTML: no render-blocking CSS request.
	build: { inlineStylesheets: "always" },

	image: {
		layout: "constrained",
		responsiveStyles: true,
	},

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
			// Public HTML is identical for everyone, so it can be cached. Signed-in editors
			// get a small "Edit" pill that loads a fresh, uncached editing view.
			toolbar: "client",
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
