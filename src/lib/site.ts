/**
 * Site-wide data used by every page: settings, the "Site options" entry
 * (availability mode, calls to action, contact details) and the menus.
 *
 * Everything here is fetched once per request and registered with the edge cache,
 * so saving a setting, a menu or the Site options entry refreshes every cached page.
 */
import type { AstroGlobal } from "astro";
import {
	getEmDashCollection,
	getMenuWithCacheHint,
	getSiteSettingsWithCacheHint,
	sanitizeHref,
	type MenuItem,
} from "emdash";

export type Mode = "freelance" | "employed";

export interface Cta {
	label: string;
	url: string;
}

export interface Site {
	/** Site name from Settings > General. */
	name: string;
	tagline: string;
	/** Public address with no trailing slash, e.g. https://holistic-seo.co.uk */
	url: string;
	titleSeparator: string;
	timezone: string;
	postsPerPage: number;
	/** True while the site is in staging: search engines are asked to stay away. */
	staging: boolean;
	mode: Mode;
	/** Status line for the current availability mode. */
	status: string;
	/** Primary call to action for the current availability mode. */
	cta: Cta | null;
	contact: { heading: string; text: string; email: string };
	person: { name: string; jobTitle: string };
	social: Cta[];
	footerNote: string;
	primaryMenu: MenuItem[];
	footerMenu: MenuItem[];
}

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/** Edge-cache lifetime shared by every public page (see astro.config.mjs). */
export const CACHE = { maxAge: 86_400, swr: 604_800 } as const;

export async function getSite(Astro: AstroGlobal): Promise<Site> {
	const locals = Astro.locals as { site?: Promise<Site> };
	locals.site ??= loadSite(Astro);
	return locals.site;
}

async function loadSite(Astro: AstroGlobal): Promise<Site> {
	const [settings, options, primary, footer] = await Promise.all([
		getSiteSettingsWithCacheHint(),
		getEmDashCollection("site_options", { status: "published", limit: 1 }),
		getMenuWithCacheHint("primary"),
		getMenuWithCacheHint("footer"),
	]);

	if (Astro.cache?.enabled) {
		for (const hint of [settings.cacheHint, options.cacheHint, primary.cacheHint, footer.cacheHint]) {
			Astro.cache.set(hint);
		}
	}

	const s = settings.data;
	const o = (options.entries[0]?.data ?? {}) as Record<string, unknown>;
	const mode: Mode = o.availability_mode === "freelance" ? "freelance" : "employed";
	const name = text(s.title) || text(o.person_name);
	const ctaLabel = text(o[`cta_${mode}_label`]);
	const ctaUrl = sanitizeHref(text(o[`cta_${mode}_url`]));
	const social = Array.isArray(o.social_profiles) ? (o.social_profiles as Record<string, unknown>[]) : [];

	return {
		name,
		tagline: text(s.tagline),
		url: (text(s.url) || Astro.url.origin).replace(/\/+$/, ""),
		titleSeparator: text(s.seo?.titleSeparator) || "|",
		timezone: text(s.timezone) || "Europe/London",
		postsPerPage: Number(s.postsPerPage) > 0 ? Number(s.postsPerPage) : 10,
		staging: s.staging === true,
		mode,
		status: text(o[`status_${mode}`]),
		cta: ctaLabel && ctaUrl && ctaUrl !== "#" ? { label: ctaLabel, url: ctaUrl } : null,
		contact: {
			heading: text(o[`contact_${mode}_heading`]),
			text: text(o[`contact_${mode}_text`]),
			email: text(o.contact_email),
		},
		person: { name: text(o.person_name) || name, jobTitle: text(o.person_job_title) },
		social: social
			.map((item) => ({ label: text(item.label), url: sanitizeHref(text(item.url)) }))
			.filter((item) => item.label && item.url && item.url !== "#"),
		footerNote: text(o.footer_note),
		primaryMenu: primary.data?.items ?? [],
		footerMenu: footer.data?.items ?? [],
	};
}

/** Builds the browser-tab title: "Page | Site name". */
export function pageTitle(site: Site, title?: string | null): string {
	return title && title !== site.name ? `${title} ${site.titleSeparator} ${site.name}` : site.name;
}

/** Turns a site-relative path into an absolute URL on the public address. */
export function absoluteUrl(site: Site, path: string): string {
	return path.startsWith("http") ? path : `${site.url}${path === "/" ? "/" : path}`;
}
