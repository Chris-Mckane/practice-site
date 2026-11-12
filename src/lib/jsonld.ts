/**
 * Structured data (JSON-LD) for search engines.
 *
 * EmDash's <EmDashHead> already outputs the core BlogPosting node for posts
 * (headline, description, image, dates), driven by each entry's SEO panel.
 * This module adds the rest of the graph: the WebSite, the Person behind it,
 * the page itself and its breadcrumb trail. Nodes are linked by "@id", so the
 * BlogPosting from EmDash and the extra details here describe the same thing.
 */
import { absoluteUrl, type Site } from "./site";

export interface Crumb {
	label: string;
	/** Site-relative path, e.g. "/blog". */
	path: string;
}

type Node = Record<string, unknown>;

export const personId = (site: Site) => `${site.url}/#person`;
export const websiteId = (site: Site) => `${site.url}/#website`;

export function personNode(site: Site, extra: Node = {}): Node {
	return {
		"@type": "Person",
		"@id": personId(site),
		name: site.person.name,
		...(site.person.jobTitle ? { jobTitle: site.person.jobTitle } : {}),
		url: absoluteUrl(site, "/about"),
		...(site.social.length ? { sameAs: site.social.map((profile) => profile.url) } : {}),
		...extra,
	};
}

export function websiteNode(site: Site): Node {
	return {
		"@type": "WebSite",
		"@id": websiteId(site),
		name: site.name,
		...(site.tagline ? { description: site.tagline } : {}),
		url: `${site.url}/`,
		inLanguage: "en-GB",
		publisher: { "@id": personId(site) },
	};
}

export function breadcrumbNode(site: Site, crumbs: Crumb[]): Node {
	return {
		"@type": "BreadcrumbList",
		"@id": `${absoluteUrl(site, crumbs.at(-1)?.path ?? "/")}#breadcrumb`,
		itemListElement: crumbs.map((crumb, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: crumb.label,
			item: absoluteUrl(site, crumb.path),
		})),
	};
}

export function graph(nodes: Node[]): Node {
	return { "@context": "https://schema.org", "@graph": nodes };
}
