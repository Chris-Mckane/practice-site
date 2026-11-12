/** RSS feed of the 20 most recent posts, at /rss.xml. */
import type { APIRoute } from "astro";
import { getEmDashCollection, getSiteSettingsWithCacheHint } from "emdash";

const escapeXml = (value: string) =>
	value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char]!);

export const GET: APIRoute = async ({ url, cache }) => {
	const [settings, posts] = await Promise.all([
		getSiteSettingsWithCacheHint(),
		getEmDashCollection("posts", { status: "published", limit: 20, orderBy: { published_at: "desc" } }),
	]);
	if (cache?.enabled) {
		cache.set(settings.cacheHint);
		cache.set(posts.cacheHint);
	}

	const site = (settings.data.url || url.origin).replace(/\/+$/, "");
	const title = settings.data.title || "Blog";
	const items = posts.entries
		.filter((post) => post.data.publishedAt)
		.map((post) => {
			const link = `${site}/blog/${post.id}`;
			return `<item><title>${escapeXml(String(post.data.title))}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><pubDate>${(post.data.publishedAt as Date).toUTCString()}</pubDate><description>${escapeXml(String(post.data.excerpt ?? ""))}</description></item>`;
		})
		.join("");

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(title)}</title><link>${site}/</link><description>${escapeXml(settings.data.tagline || title)}</description><language>en-GB</language><atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`,
		{ headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
	);
};
