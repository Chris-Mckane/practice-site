/**
 * The indexing switch.
 *
 * EmDash has a built-in "Site status" setting (Settings > General): Staging or Live.
 * While the site is in staging, EmDash adds <meta name="robots" content="noindex, nofollow">
 * to every page. This middleware adds the other two signals:
 *
 *   1. an "X-Robots-Tag: noindex, nofollow" response header on every public response, and
 *   2. a robots.txt that says "Disallow: /".
 *
 * Choosing "Go live" in the admin reverses all three at once. Until then (including
 * before first-time setup has been completed) the site stays hidden.
 */
import { defineMiddleware } from "astro:middleware";
import { getSiteSettings } from "emdash";

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	// The admin and its API look after themselves.
	if (pathname.startsWith("/_emdash")) return next();

	// Hidden unless the site has explicitly been switched to live. That also covers the
	// moments before first-time setup is finished, when the setting does not exist yet.
	const staging = await getSiteSettings()
		.then((settings) => settings.staging !== false)
		.catch(() => true);
	if (!staging) return next();

	if (pathname === "/robots.txt") {
		return new Response("User-agent: *\nDisallow: /\n", {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": "no-store",
				"X-Robots-Tag": "noindex, nofollow",
			},
		});
	}

	const response = await next();
	response.headers.set("X-Robots-Tag", "noindex, nofollow");
	return response;
});
