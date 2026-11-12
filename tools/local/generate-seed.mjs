// Regenerates seed/seed.json. Run: node tools/local/generate-seed.mjs && npm run check:seed
import { writeFileSync } from "node:fs";

const RAW = "https://raw.githubusercontent.com/Chris-Mckane/practice-site/main/seed/assets";
const LINK_PATTERN = "^(?:$|(?:https?://|mailto:|tel:|/(?!/)|#).+)$";
const LINK_HINT = "starts with /, https://, mailto: or #";

let k = 0;
const key = () => `k${(++k).toString(36)}`;
const span = (text, marks) => ({ _type: "span", _key: key(), text, ...(marks ? { marks } : {}) });
const block = (style, text) => ({ _type: "block", _key: key(), style, markDefs: [], children: [span(text)] });
const p = (text) => block("normal", text);
const h2 = (text) => block("h2", text);
const h3 = (text) => block("h3", text);
const li = (text) => ({ ...block("normal", text), listItem: "bullet", level: 1 });

const L = [
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
	"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
	"Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
	"Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
	"Curabitur pretium tincidunt lacus, nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit.",
	"Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat.",
	"Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus.",
	"Phasellus ultrices nulla quis nibh. Quisque a lectus. Donec consectetuer ligula vulputate sem tristique cursus.",
];
const lorem = (i, n = 1) => Array.from({ length: n }, (_, j) => L[(i + j) % L.length]).join(" ");

const media = (file, alt) => ({ $media: { url: `${RAW}/${file}`, alt, filename: file } });

const link = (base, label) => [
	{ slug: `${base}_label`, label, type: "string" },
	{
		slug: `${base}_url`,
		label: `${label}: link (${LINK_HINT})`,
		type: "string",
		validation: { pattern: LINK_PATTERN },
	},
];

const blockType = (slug, label, description, icon, fields) => ({
	slug,
	label,
	description,
	icon,
	category: "Page sections",
	currentVersion: 1,
	versions: [{ version: 1, fields }],
});

const blockTypes = [
	blockType(
		"hero",
		"Hero (homepage introduction)",
		"The opening of the homepage: the main H1 headline, a short introduction, the availability status line, the primary button and the live performance badge.",
		"star",
		[
			{
				slug: "headline",
				label: "Headline (the page's H1: include your name and role)",
				type: "string",
				required: true,
			},
			{ slug: "intro", label: "Introduction (one or two sentences)", type: "text" },
			{
				slug: "show_status",
				label: "Show the availability status line (wording comes from Site options)",
				type: "boolean",
				defaultValue: true,
			},
			{
				slug: "show_primary_cta",
				label: "Show the primary button (label and link come from Site options and follow the availability mode)",
				type: "boolean",
				defaultValue: true,
			},
			...link("secondary", "Secondary link"),
			{
				slug: "show_proof_badge",
				label: "Show the live performance badge (LCP, CLS, page weight, CO2e)",
				type: "boolean",
				defaultValue: true,
			},
			...link("methodology", "Performance badge methodology link"),
		],
	),
	blockType(
		"page_header",
		"Page header",
		"A simple page opening for any page that is not the homepage or About page: the H1 headline and an optional lead paragraph.",
		"text-h-one",
		[
			{ slug: "headline", label: "Headline (the page's H1)", type: "string", required: true },
			{ slug: "lead", label: "Lead paragraph", type: "text" },
		],
	),
	blockType(
		"about_intro",
		"About intro",
		"A short introduction to Chris with an optional photo and a link to the full About page.",
		"user",
		[
			{ slug: "heading", label: "Heading (H2)", type: "string", required: true },
			{ slug: "body", label: "Body text", type: "portableText" },
			{ slug: "image", label: "Photo (alt text is required: images without it are not shown)", type: "image" },
			...link("link", "Link"),
		],
	),
	blockType(
		"approach",
		"Approach (organic growth focus)",
		"Explains the digital marketing approach as a heading, an introduction and a list of principles. Each principle has a title (H3) and a description.",
		"plant",
		[
			{ slug: "heading", label: "Heading (H2)", type: "string", required: true },
			{ slug: "intro", label: "Introduction", type: "text" },
			{
				slug: "principles",
				label: "Principles",
				type: "repeater",
				validation: {
					minItems: 1,
					maxItems: 8,
					subFields: [
						{ slug: "title", label: "Title (H3)", type: "string", required: true },
						{ slug: "description", label: "Description", type: "text" },
					],
				},
			},
		],
	),
	blockType(
		"route_links",
		"Route links",
		"Signposts to the main destinations (for example Blog and About). Optionally ends with the primary call to action from Site options, which follows the availability mode.",
		"signpost",
		[
			{ slug: "heading", label: "Heading (H2)", type: "string", required: true },
			{ slug: "intro", label: "Introduction", type: "text" },
			{
				slug: "routes",
				label: "Routes",
				type: "repeater",
				validation: {
					minItems: 1,
					maxItems: 6,
					subFields: [
						{ slug: "label", label: "Link text", type: "string", required: true },
						{ slug: "description", label: "Short description", type: "string" },
						{
							slug: "url",
							label: `Link (${LINK_HINT})`,
							type: "string",
							required: true,
							validation: { pattern: LINK_PATTERN },
						},
					],
				},
			},
			{
				slug: "include_primary_cta",
				label: "Add the primary call to action from Site options as the final route",
				type: "boolean",
				defaultValue: true,
			},
		],
	),
	blockType(
		"latest_posts",
		"Latest posts",
		"Lists the most recent blog posts automatically, with a link to the full blog.",
		"newspaper",
		[
			{ slug: "heading", label: "Heading (H2)", type: "string", required: true },
			{
				slug: "count",
				label: "Number of posts to show",
				type: "integer",
				defaultValue: 3,
				validation: { min: 1, max: 6 },
			},
			...link("link", "Link to all posts"),
		],
	),
	blockType(
		"contact_cta",
		"Contact call to action",
		"The closing contact section. Its heading, text and button come from Site options and change with the availability mode, so there is nothing to keep in sync here.",
		"envelope",
		[
			{
				slug: "show_email",
				label: "Show the contact email address as a link",
				type: "boolean",
				defaultValue: true,
			},
			{
				slug: "show_social",
				label: "Show the social profile links",
				type: "boolean",
				defaultValue: true,
			},
			{
				slug: "anchor_id",
				label: "Section ID (lowercase, used for links such as /#contact)",
				type: "string",
				defaultValue: "contact",
				validation: { pattern: "^(?:$|[a-z][a-z0-9_-]*)$" },
			},
		],
	),
	blockType(
		"profile",
		"Profile (About page introduction)",
		"The opening of the About page: the H1 headline, a lead paragraph, a portrait photo and the biography. Also switches on Person structured data for the page.",
		"identification-card",
		[
			{ slug: "headline", label: "Headline (the page's H1)", type: "string", required: true },
			{ slug: "lead", label: "Lead paragraph", type: "text" },
			{ slug: "photo", label: "Portrait photo (alt text is required: images without it are not shown)", type: "image" },
			{ slug: "photo_caption", label: "Photo caption", type: "string" },
			{ slug: "body", label: "Biography", type: "portableText" },
		],
	),
	blockType(
		"experience",
		"Experience",
		"A list of roles: role title (H3), organisation, period and a short summary.",
		"briefcase",
		[
			{ slug: "heading", label: "Heading (H2)", type: "string", required: true },
			{ slug: "intro", label: "Introduction", type: "text" },
			{
				slug: "roles",
				label: "Roles",
				type: "repeater",
				validation: {
					maxItems: 20,
					subFields: [
						{ slug: "role", label: "Role title (H3)", type: "string", required: true },
						{ slug: "organisation", label: "Organisation", type: "string" },
						{ slug: "period", label: "Period (for example 2021 to 2024)", type: "string" },
						{ slug: "summary", label: "Summary", type: "text" },
					],
				},
			},
		],
	),
	blockType(
		"credentials",
		"Credentials",
		"A list of qualifications, certifications or memberships: name, issuer and year.",
		"certificate",
		[
			{ slug: "heading", label: "Heading (H2)", type: "string", required: true },
			{ slug: "intro", label: "Introduction", type: "text" },
			{
				slug: "items",
				label: "Credentials",
				type: "repeater",
				validation: {
					maxItems: 30,
					subFields: [
						{ slug: "name", label: "Credential", type: "string", required: true },
						{ slug: "issuer", label: "Issuer", type: "string" },
						{ slug: "year", label: "Year", type: "string" },
					],
				},
			},
		],
	),
	blockType(
		"rich_text",
		"Text section",
		"A general-purpose section of rich text with an optional H2 heading. Use H3 for sub-headings inside the body.",
		"text-align-left",
		[
			{ slug: "heading", label: "Heading (H2, optional)", type: "string" },
			{ slug: "body", label: "Body text", type: "portableText" },
		],
	),
];

const collections = [
	{
		slug: "pages",
		label: "Pages",
		labelSingular: "Page",
		description:
			"Standalone pages built from reorderable sections (blocks). The page with the slug “home” is the homepage and the page with the slug “blog” is the introduction shown above the list of posts at /blog. Every other page is served at /its-slug, for example /about.",
		icon: "file-text",
		sortOrder: 1,
		urlPattern: "/{slug}",
		supports: ["drafts", "revisions", "preview", "seo"],
		fields: [
			{
				slug: "title",
				label: "Title (used in the admin, the browser tab and search results; the visible H1 comes from the first Hero or Profile section)",
				type: "string",
				required: true,
				searchable: true,
			},
			{
				slug: "layout",
				label: "Page sections",
				type: "blocks",
				validation: { allowedTypes: blockTypes.map((b) => b.slug), maxItems: 20 },
			},
		],
	},
	{
		slug: "posts",
		label: "Posts",
		labelSingular: "Post",
		description:
			"Blog posts, served at /blog/their-slug. Reading time is calculated automatically. The author is set with the Byline panel and the category with the Categories panel.",
		icon: "article",
		sortOrder: 2,
		urlPattern: "/blog/{slug}",
		dateField: "publishedAt",
		supports: ["drafts", "revisions", "preview", "search", "seo"],
		fields: [
			{ slug: "title", label: "Title (the post's H1)", type: "string", required: true, searchable: true },
			{
				slug: "excerpt",
				label: "Excerpt (one or two sentences: shown in lists and used as the default meta description)",
				type: "text",
				searchable: true,
			},
			{
				slug: "featured_image",
				label: "Featured image (optional; alt text is required: images without it are not shown)",
				type: "image",
			},
			{
				slug: "content",
				label: "Body (use Heading 2 and Heading 3 only; the title is the only H1)",
				type: "portableText",
				searchable: true,
			},
			{
				slug: "updated_date",
				label: "Last updated (optional: set this when you make a substantial update; shown to readers and search engines)",
				type: "datetime",
			},
		],
	},
	{
		slug: "site_options",
		label: "Site options",
		labelSingular: "Site options",
		description:
			"One entry that controls site-wide behaviour: the availability mode (freelance or employed), the primary call to action for each mode, contact wording, contact email and social profiles. Edit the single “Global site options” entry; do not add more.",
		icon: "sliders-horizontal",
		sortOrder: 3,
		routable: false,
		supports: ["drafts", "revisions"],
		admin: { quickCreate: false },
		fields: [
			{ slug: "title", label: "Name of this entry (admin only)", type: "string", required: true },
			{
				slug: "availability_mode",
				label: "Availability mode (freelance = open for freelance work; employed = blog and thought leadership)",
				type: "select",
				required: true,
				defaultValue: "employed",
				validation: { options: ["freelance", "employed"] },
			},
			{ slug: "person_name", label: "Your name (used in the author box and structured data)", type: "string", required: true },
			{ slug: "person_job_title", label: "Your job title or role (used in structured data)", type: "string" },
			{ slug: "status_freelance", label: "Status line when in freelance mode", type: "string" },
			{ slug: "status_employed", label: "Status line when in employed mode", type: "string" },
			{ slug: "cta_freelance_label", label: "Primary button text when in freelance mode", type: "string" },
			{
				slug: "cta_freelance_url",
				label: `Primary button link when in freelance mode (${LINK_HINT})`,
				type: "string",
				validation: { pattern: LINK_PATTERN },
			},
			{ slug: "cta_employed_label", label: "Primary button text when in employed mode", type: "string" },
			{
				slug: "cta_employed_url",
				label: `Primary button link when in employed mode (${LINK_HINT})`,
				type: "string",
				validation: { pattern: LINK_PATTERN },
			},
			{ slug: "contact_freelance_heading", label: "Contact section heading when in freelance mode", type: "string" },
			{ slug: "contact_freelance_text", label: "Contact section text when in freelance mode", type: "text" },
			{ slug: "contact_employed_heading", label: "Contact section heading when in employed mode", type: "string" },
			{ slug: "contact_employed_text", label: "Contact section text when in employed mode", type: "text" },
			{
				slug: "contact_email",
				label: "Contact email address",
				type: "string",
				validation: { pattern: "^(?:$|[^@\\s]+@[^@\\s]+\\.[^@\\s]+)$" },
			},
			{
				slug: "social_profiles",
				label: "Social profiles (shown in the footer and contact section, and listed in structured data)",
				type: "repeater",
				validation: {
					maxItems: 10,
					subFields: [
						{ slug: "label", label: "Network name (for example LinkedIn)", type: "string", required: true },
						{ slug: "url", label: "Profile URL", type: "url", required: true },
					],
				},
			},
			{ slug: "footer_note", label: "Footer note (optional short line of text)", type: "string" },
		],
	},
];

const postBody = (i) => [
	p(lorem(i, 2)),
	h2("Lorem ipsum dolor sit amet"),
	p(lorem(i + 1, 3)),
	p(lorem(i + 3, 2)),
	h3("Consectetur adipiscing elit"),
	p(lorem(i + 2, 2)),
	li("Sed do eiusmod tempor incididunt ut labore."),
	li("Ut enim ad minim veniam, quis nostrud exercitation."),
	li("Duis aute irure dolor in reprehenderit in voluptate."),
	h3("Sed do eiusmod tempor"),
	p(lorem(i + 4, 3)),
	h2("Ut enim ad minim veniam"),
	p(lorem(i + 5, 3)),
	p(lorem(i + 6, 2)),
	h2("Duis aute irure dolor"),
	p(lorem(i + 7, 3)),
];

const posts = [
	["one", "seo", true],
	["two", "web-performance", false],
	["three", "cro", true],
	["four", "seo", false],
	["five", "web-performance", true],
	["six", "cro", false],
	["seven", "seo", false],
].map(([n, cat, img], i) => ({
	id: `post-${n}`,
	slug: `placeholder-post-${n}`,
	status: "published",
	data: {
		title: `Placeholder post ${n}: lorem ipsum dolor sit amet`,
		excerpt: `[Placeholder excerpt] ${L[i % L.length]}`,
		...(img ? { featured_image: media("placeholder-16x9.png", "Placeholder image with a 16:9 aspect ratio") } : {}),
		content: postBody(i),
	},
	bylines: [{ byline: "byline-chris" }],
	taxonomies: { category: [cat] },
}));

const seed = {
	$schema: "https://emdashcms.com/seed.schema.json",
	version: "1",
	defaultLocale: "en",
	meta: {
		name: "Chris McKane",
		description:
			"Personal brand site: homepage, about page and blog. All copy is Lorem ipsum placeholder text to be replaced in the admin.",
		author: "Chris McKane",
	},
	settings: {
		title: "Chris McKane",
		tagline: "Digital marketing strategist",
		postsPerPage: 5,
		dateFormat: "d MMMM yyyy",
		timezone: "Europe/London",
		seo: { titleSeparator: "|" },
	},
	blockTypes,
	collections,
	taxonomies: [
		{
			name: "category",
			label: "Categories",
			labelSingular: "Category",
			hierarchical: true,
			collections: ["posts"],
			terms: [
				{ slug: "seo", label: "SEO", description: "[Placeholder category description] Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
				{ slug: "web-performance", label: "Web performance", description: "[Placeholder category description] Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
				{ slug: "cro", label: "CRO", description: "[Placeholder category description] Ut enim ad minim veniam, quis nostrud exercitation ullamco." },
			],
		},
	],
	bylines: [
		{
			id: "byline-chris",
			slug: "chris-mckane",
			displayName: "Chris McKane",
			bio: "[Placeholder author bio] Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
		},
	],
	menus: [
		{
			name: "primary",
			label: "Primary navigation (header)",
			items: [
				{ type: "custom", label: "Blog", url: "/blog" },
				{ type: "custom", label: "About", url: "/about" },
			],
		},
		{
			name: "footer",
			label: "Footer navigation",
			items: [
				{ type: "custom", label: "Home", url: "/" },
				{ type: "custom", label: "Blog", url: "/blog" },
				{ type: "custom", label: "About", url: "/about" },
				{ type: "custom", label: "RSS feed", url: "/rss.xml" },
			],
		},
	],
	redirects: [{ source: "/home", destination: "/", type: 301, enabled: true, groupName: "Site structure" }],
	content: {
		site_options: [
			{
				id: "site-options-global",
				slug: "global",
				status: "published",
				data: {
					title: "Global site options",
					availability_mode: "freelance",
					person_name: "Chris McKane",
					person_job_title: "Digital marketing strategist",
					status_freelance: "[Placeholder status] Available for freelance projects",
					status_employed: "[Placeholder status] Not taking on freelance work at the moment",
					cta_freelance_label: "Start a project",
					cta_freelance_url: "/#contact",
					cta_employed_label: "Read the blog",
					cta_employed_url: "/blog",
					contact_freelance_heading: "[Placeholder] Lorem ipsum: work with me",
					contact_freelance_text: `[Placeholder freelance contact text] ${L[0]}`,
					contact_employed_heading: "[Placeholder] Lorem ipsum: say hello",
					contact_employed_text: `[Placeholder employed contact text] ${L[1]}`,
					contact_email: "hello@example.com",
					social_profiles: [
						{ label: "LinkedIn", url: "https://example.com/replace-with-your-linkedin-profile" },
						{ label: "GitHub", url: "https://example.com/replace-with-your-github-profile" },
					],
					footer_note: "[Placeholder footer note] Lorem ipsum dolor sit amet.",
				},
			},
		],
		pages: [
			{
				id: "page-home",
				slug: "home",
				status: "published",
				data: {
					title: "Chris McKane, digital marketing strategist",
					layout: [
						{
							_type: "hero",
							_version: 1,
							_key: "home-hero",
							headline: "Chris McKane, digital marketing strategist",
							intro: `[Placeholder introduction] ${L[0]}`,
							show_status: true,
							show_primary_cta: true,
							secondary_label: "More about Chris",
							secondary_url: "/about",
							show_proof_badge: true,
							methodology_label: "How this is measured",
							methodology_url: "https://sustainablewebdesign.org/estimating-digital-emissions/",
						},
						{
							_type: "about_intro",
							_version: 1,
							_key: "home-about",
							heading: "[Placeholder] Lorem ipsum: a short introduction",
							body: [p(lorem(1, 2)), p(lorem(3, 2))],
							image: media("placeholder-4x5.png", "Placeholder portrait photo with a 4:5 aspect ratio"),
							link_label: "Read the full story on the About page",
							link_url: "/about",
						},
						{
							_type: "approach",
							_version: 1,
							_key: "home-approach",
							heading: "[Placeholder] An approach built on organic growth",
							intro: `[Placeholder approach introduction] ${lorem(2, 2)}`,
							principles: [
								{ title: "[Placeholder] Organic search", description: L[3] },
								{ title: "[Placeholder] Web performance", description: L[4] },
								{ title: "[Placeholder] Design and experience", description: L[5] },
								{ title: "[Placeholder] Conversion", description: L[6] },
							],
						},
						{
							_type: "route_links",
							_version: 1,
							_key: "home-routes",
							heading: "[Placeholder] Find what you came for",
							intro: "",
							routes: [
								{ label: "Read the blog", description: "[Placeholder] Lorem ipsum dolor sit amet, consectetur.", url: "/blog" },
								{ label: "About Chris", description: "[Placeholder] Sed do eiusmod tempor incididunt.", url: "/about" },
							],
							include_primary_cta: true,
						},
						{
							_type: "latest_posts",
							_version: 1,
							_key: "home-latest",
							heading: "Latest from the blog",
							count: 3,
							link_label: "Browse all posts",
							link_url: "/blog",
						},
						{
							_type: "contact_cta",
							_version: 1,
							_key: "home-contact",
							show_email: true,
							show_social: true,
							anchor_id: "contact",
						},
					],
				},
			},
			{
				id: "page-blog",
				slug: "blog",
				status: "published",
				data: {
					title: "Blog",
					layout: [
						{
							_type: "page_header",
							_version: 1,
							_key: "blog-header",
							headline: "Blog",
							lead: `[Placeholder blog introduction] ${L[2]}`,
						},
					],
				},
			},
			{
				id: "page-about",
				slug: "about",
				status: "published",
				data: {
					title: "About Chris McKane",
					layout: [
						{
							_type: "profile",
							_version: 1,
							_key: "about-profile",
							headline: "About Chris McKane",
							lead: `[Placeholder lead paragraph] ${L[0]}`,
							photo: media("placeholder-4x5.png", "Placeholder portrait photo with a 4:5 aspect ratio"),
							photo_caption: "[Placeholder caption] Lorem ipsum dolor sit amet.",
							body: [p(lorem(1, 3)), p(lorem(4, 3)), p(lorem(7, 2))],
						},
						{
							_type: "experience",
							_version: 1,
							_key: "about-experience",
							heading: "Experience",
							intro: `[Placeholder experience introduction] ${L[2]}`,
							roles: [
								{ role: "[Placeholder role title]", organisation: "[Placeholder organisation]", period: "[Year] to present", summary: L[3] },
								{ role: "[Placeholder role title]", organisation: "[Placeholder organisation]", period: "[Year] to [year]", summary: L[4] },
								{ role: "[Placeholder role title]", organisation: "[Placeholder organisation]", period: "[Year] to [year]", summary: L[5] },
							],
						},
						{
							_type: "credentials",
							_version: 1,
							_key: "about-credentials",
							heading: "Credentials",
							intro: `[Placeholder credentials introduction] ${L[6]}`,
							items: [
								{ name: "[Placeholder credential]", issuer: "[Placeholder issuer]", year: "[Year]" },
								{ name: "[Placeholder credential]", issuer: "[Placeholder issuer]", year: "[Year]" },
								{ name: "[Placeholder credential]", issuer: "[Placeholder issuer]", year: "[Year]" },
							],
						},
						{
							_type: "contact_cta",
							_version: 1,
							_key: "about-contact",
							show_email: true,
							show_social: true,
							anchor_id: "contact",
						},
					],
				},
			},
		],
		posts,
	},
};

writeFileSync(new URL("../../seed/seed.json", import.meta.url), JSON.stringify(seed, null, "\t") + "\n");
console.log("seed written:", JSON.stringify(seed).length, "bytes");
