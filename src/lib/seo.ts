/** Resolves the SEO values for a content entry, honouring its SEO panel in the admin. */
import { getContentSeo, getSeoMeta, type ContentEntry } from "emdash";
import type { Site } from "./site";

export interface EntrySeo {
	/** SEO panel title if set, otherwise the entry's own title. No site name appended. */
	title: string;
	/** True when the editor typed a custom title into the SEO panel. */
	hasCustomTitle: boolean;
	description: string | null;
	canonical: string | null;
	image: string | null;
}

export function entrySeo(
	site: Site,
	entry: ContentEntry<Record<string, any>>,
	path: string,
	defaults: { description?: string | null; image?: string | null } = {},
): EntrySeo {
	const meta = getSeoMeta(entry, {
		siteUrl: site.url,
		path,
		defaultDescription: defaults.description || undefined,
		defaultOgImage: defaults.image || undefined,
	});
	return {
		title: meta.ogTitle,
		hasCustomTitle: Boolean(getContentSeo(entry)?.title),
		description: meta.description,
		canonical: meta.canonical,
		image: meta.ogImage,
	};
}

/** Absolute URL for an image from the media library, for social sharing tags. */
export function mediaUrl(
	site: Site,
	image: { id?: string; src?: string; meta?: Record<string, unknown> } | null | undefined,
): string | null {
	if (!image) return null;
	const key = typeof image.meta?.storageKey === "string" ? image.meta.storageKey : image.id;
	const src = image.src || (key ? `/_emdash/api/media/file/${key}` : "");
	if (!src) return null;
	return src.startsWith("http") ? src : `${site.url}${src}`;
}
