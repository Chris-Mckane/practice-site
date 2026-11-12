/**
 * XML sitemap at /sitemap.xml.
 *
 * Replaces EmDash's default sitemap so the homepage is listed as "/" (not "/home")
 * and the blog index and category pages are included. Entries marked
 * "Hide from search engines" in their SEO panel are left out.
 */
import type { APIRoute } from "astro";
import { getContentSeo, getEmDashCollection, getSiteSettingsWithCacheHint, getTaxonomyTermsWithCacheHint } from "emdash";

const day = (date: unknown) => (date instanceof Date ? date.toISOString().slice(0, 10) : undefined);

export const GET: APIRoute = async ({ url, cache }) => {
	const [settings, pages, posts, categories] = await Promise.all([
		getSiteSettingsWithCacheHint(),
		getEmDashCollection("pages", { status: "published", limit: 500 }),
		getEmDashCollection("posts", { status: "published", limit: 2000, orderBy: { published_at: "desc" } }),
		getTaxonomyTermsWithCacheHint("category"),
	]);
	if (cache?.enabled) {
		for (const hint of [settings.cacheHint, pages.cacheHint, posts.cacheHint, categories.cacheHint]) cache.set(hint);
	}

	const site = (settings.data.url || url.origin).replace(/\/+$/, "");
	const indexable = <T extends { data: Record<string, any> }>(entry: T) => !getContentSeo(entry as never)?.noIndex;
	const latestPost = day(posts.entries[0]?.data.updatedAt);

	const urls: { path: string; lastmod?: string }[] = [
		...pages.entries.filter(indexable).map((page) => ({
			path: page.id === "home" ? "/" : `/${page.id}`,
			lastmod: page.id === "blog" ? (latestPost ?? day(page.data.updatedAt)) : day(page.data.updatedAt),
		})),
		...categories.data
			.filter((term) => (term.count ?? 1) > 0)
			.map((term) => ({ path: `/blog/category/${term.slug}` })),
		...posts.entries.filter(indexable).map((post) => ({
			path: `/blog/${post.id}`,
			lastmod: day(post.data.updated_date ? new Date(post.data.updated_date) : post.data.updatedAt),
		})),
	];

	const body = urls
		.map(({ path, lastmod }) => `<url><loc>${site}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`)
		.join("");

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`,
		{ headers: { "Content-Type": "application/xml; charset=utf-8" } },
	);
};
