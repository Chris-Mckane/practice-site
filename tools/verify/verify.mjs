/**
 * Verification run for the site.
 *
 *   node verify.mjs [baseUrl] [--no-lighthouse]
 *
 * For each key page it records: page weight (HTML, inline CSS, inline JS, total transfer),
 * the heading outline, axe-core accessibility results (dark and light themes, mobile and
 * desktop), structured data, layout shift, and Lighthouse mobile scores.
 *
 * Results are written to out/report.json and out/report.md.
 * Needs a running site, for example `npm run build && npm run preview` in the project root.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { brotliCompressSync, gzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith("http")) ?? "http://127.0.0.1:4322").replace(/\/$/, "");
const RUN_LIGHTHOUSE = !args.includes("--no-lighthouse");
const CHROME = process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium";

const PAGES = [
	{ name: "Homepage", path: "/" },
	{ name: "About", path: "/about" },
	{ name: "Blog index", path: "/blog" },
	{ name: "Blog post", path: "/blog/placeholder-post-one" },
];
const VIEWPORTS = { mobile: { width: 390, height: 844 }, desktop: { width: 1280, height: 900 } };
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag2aaa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const sum = (list) => list.reduce((total, item) => total + item.length, 0);

async function weights(path) {
	const html = await (await fetch(BASE + path)).text();
	const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
	const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
		.filter((m) => !m[1].includes("ld+json"))
		.map((m) => m[2]);
	const inline = styles.join("") + scripts.join("");
	return {
		htmlRaw: html.length,
		htmlGzip: gzipSync(html, { level: 9 }).length,
		htmlBrotli: brotliCompressSync(html).length,
		inlineCss: sum(styles),
		inlineJs: sum(scripts),
		inlineCssJsGzip: gzipSync(inline, { level: 9 }).length,
		externalStylesheets: (html.match(/<link[^>]+rel="stylesheet"/g) ?? []).length,
		externalScripts: (html.match(/<script[^>]+src=/g) ?? []).length,
	};
}

async function inspect(browser, path, viewport, theme) {
	const context = await browser.newContext({ viewport: VIEWPORTS[viewport] });
	if (theme === "light") await context.addInitScript(() => localStorage.setItem("theme", "light"));
	await context.addInitScript(() => {
		window.__cls = 0;
		window.__lcp = 0;
		new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value;
		}).observe({ type: "layout-shift", buffered: true });
		new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) window.__lcp = entry.startTime;
		}).observe({ type: "largest-contentful-paint", buffered: true });
	});
	const page = await context.newPage();
	const transfers = [];
	page.on("response", async (response) => {
		try {
			const body = await response.body();
			transfers.push({ url: response.url().replace(BASE, ""), type: response.request().resourceType(), bytes: body.length });
		} catch {}
	});
	await page.goto(BASE + path, { waitUntil: "load" });
	await page.evaluate(() => document.fonts.ready);
	// Scroll through the page so lazy images load and any late layout shift is caught.
	await page.evaluate(async () => {
		for (let y = 0; y < document.body.scrollHeight; y += 600) {
			window.scrollTo(0, y);
			await new Promise((resolve) => setTimeout(resolve, 60));
		}
		window.scrollTo(0, 0);
	});
	await page.waitForTimeout(600);

	const data = await page.evaluate(() => ({
		cls: window.__cls,
		lcp: window.__lcp,
		lang: document.documentElement.lang,
		title: document.title,
		headings: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({ level: Number(h.tagName[1]), text: h.textContent.trim().replace(/\s+/g, " ") })),
		jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)),
		robots: document.querySelector('meta[name="robots"]')?.content ?? null,
		canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
		description: document.querySelector('meta[name="description"]')?.content ?? null,
		smallTargets: [...document.querySelectorAll("a, button")]
			.filter((el) => {
				const box = el.getBoundingClientRect();
				// Links inside a sentence are exempt from the target size rule (WCAG 2.5.5 "Inline").
				const inline = getComputedStyle(el).display === "inline" && el.closest("p, li, dd, figcaption") && el.parentElement.textContent.trim() !== el.textContent.trim();
				return box.width > 0 && !inline && (box.width < 44 || box.height < 44);
			})
			.map((el) => `${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`),
	}));

	await page.addScriptTag({ content: axeSource });
	const axe = await page.evaluate((tags) => window.axe.run(document, { runOnly: { type: "tag", values: tags } }), AXE_TAGS);
	await context.close();

	return {
		...data,
		transfers,
		axe: {
			violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(" ")).slice(0, 5) })),
			passes: axe.passes.length,
			incomplete: axe.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
		},
	};
}

/** Merges JSON-LD nodes that share an "@id", the way search engines read them. */
function mergeGraph(blocks) {
	const nodes = new Map();
	for (const block of blocks) {
		for (const node of block["@graph"] ?? [block]) {
			const id = node["@id"] ?? JSON.stringify(node);
			nodes.set(id, { ...(nodes.get(id) ?? {}), ...node });
		}
	}
	return [...nodes.values()];
}

function outlineProblems(headings) {
	const problems = [];
	if (headings.filter((h) => h.level === 1).length !== 1) problems.push("page must have exactly one H1");
	if (headings[0]?.level !== 1) problems.push("first heading must be the H1");
	headings.forEach((h, i) => {
		if (i > 0 && h.level > headings[i - 1].level + 1) problems.push(`skips from H${headings[i - 1].level} to H${h.level} at "${h.text}"`);
	});
	return problems;
}

async function lighthouseRun(path) {
	const { default: lighthouse } = await import("lighthouse");
	const { launch } = await import("chrome-launcher");
	const chrome = await launch({ chromePath: CHROME, chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"] });
	try {
		const result = await lighthouse(BASE + path, { port: chrome.port, output: "json", logLevel: "error" });
		const { categories, audits } = result.lhr;
		return {
			performance: Math.round(categories.performance.score * 100),
			accessibility: Math.round(categories.accessibility.score * 100),
			bestPractices: Math.round(categories["best-practices"].score * 100),
			seo: Math.round(categories.seo.score * 100),
			fcp: audits["first-contentful-paint"].displayValue,
			lcp: audits["largest-contentful-paint"].displayValue,
			tbt: audits["total-blocking-time"].displayValue,
			cls: audits["cumulative-layout-shift"].displayValue,
			speedIndex: audits["speed-index"].displayValue,
			failed: Object.values(audits)
				.filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== "informative" && a.scoreDisplayMode !== "manual" && a.scoreDisplayMode !== "notApplicable")
				.map((a) => `${a.id}: ${a.title}${a.displayValue ? ` (${a.displayValue})` : ""}`),
		};
	} finally {
		await chrome.kill();
	}
}

const browser = await chromium.launch();
const report = { base: BASE, date: new Date().toISOString(), pages: [] };

for (const { name, path } of PAGES) {
	const result = { name, path, weights: await weights(path), runs: {} };
	for (const viewport of Object.keys(VIEWPORTS)) {
		for (const theme of ["dark", "light"]) {
			result.runs[`${viewport}-${theme}`] = await inspect(browser, path, viewport, theme);
		}
	}
	const mobile = result.runs["mobile-dark"];
	result.headings = mobile.headings;
	result.outlineProblems = outlineProblems(mobile.headings);
	result.graph = mergeGraph(mobile.jsonld);
	const byType = (type) => mobile.transfers.filter((t) => t.type === type).reduce((total, t) => total + t.bytes, 0);
	result.transfer = { document: byType("document"), font: byType("font"), image: byType("image"), other: mobile.transfers.filter((t) => !["document", "font", "image"].includes(t.type)).reduce((total, t) => total + t.bytes, 0), requests: mobile.transfers.length };
	if (RUN_LIGHTHOUSE) result.lighthouse = await lighthouseRun(path);
	report.pages.push(result);
	console.log(`checked ${name}`);
}
await browser.close();

// ---------- Markdown summary ----------
const md = [];
md.push("### Lighthouse (mobile, simulated slow 4G and 4x CPU slowdown)\n");
if (RUN_LIGHTHOUSE) {
	md.push("| Page | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS | Speed Index |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
	for (const p of report.pages) {
		const l = p.lighthouse;
		md.push(`| ${p.name} | ${l.performance} | ${l.accessibility} | ${l.bestPractices} | ${l.seo} | ${l.fcp} | ${l.lcp} | ${l.tbt} | ${l.cls} | ${l.speedIndex} |`);
	}
	for (const p of report.pages) if (p.lighthouse.failed.length) md.push(`\n${p.name}: audits below 90: ${p.lighthouse.failed.join("; ")}`);
}
md.push("\n### axe-core (WCAG 2.0, 2.1, 2.2 at A, AA and AAA, plus best practices)\n", "| Page | Mobile dark | Mobile light | Desktop dark | Desktop light | Rules passed |", "| --- | --- | --- | --- | --- | --- |");
for (const p of report.pages) {
	const cell = (key) => `${p.runs[key].axe.violations.length} violations`;
	md.push(`| ${p.name} | ${cell("mobile-dark")} | ${cell("mobile-light")} | ${cell("desktop-dark")} | ${cell("desktop-light")} | ${p.runs["mobile-dark"].axe.passes} |`);
}
for (const p of report.pages) {
	for (const [key, run] of Object.entries(p.runs)) {
		for (const v of run.axe.violations) md.push(`\n- ${p.name} (${key}): **${v.id}** (${v.impact}): ${v.help}: ${v.nodes.join(", ")}`);
		if (run.smallTargets.length) md.push(`\n- ${p.name} (${key}): targets under 44x44: ${run.smallTargets.join("; ")}`);
	}
}
md.push("\n### Page weight\n", "| Page | HTML (raw) | HTML (gzip) | HTML (Brotli) | Inline CSS | Inline JS | Inline CSS + JS (gzip) | External CSS / JS files | Fonts | Images | Total transferred (uncompressed bodies) | Requests |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
for (const p of report.pages) {
	const w = p.weights;
	const t = p.transfer;
	md.push(`| ${p.name} | ${kb(w.htmlRaw)} | ${kb(w.htmlGzip)} | ${kb(w.htmlBrotli)} | ${kb(w.inlineCss)} | ${kb(w.inlineJs)} | ${kb(w.inlineCssJsGzip)} | ${w.externalStylesheets} / ${w.externalScripts} | ${kb(t.font)} | ${kb(t.image)} | ${kb(t.document + t.font + t.image + t.other)} | ${t.requests} |`);
}
md.push("\n### Layout shift and LCP measured in the browser (no throttling)\n", "| Page | CLS mobile | CLS desktop | LCP mobile | LCP desktop |", "| --- | --- | --- | --- | --- |");
for (const p of report.pages) {
	md.push(`| ${p.name} | ${p.runs["mobile-dark"].cls.toFixed(4)} | ${p.runs["desktop-dark"].cls.toFixed(4)} | ${(p.runs["mobile-dark"].lcp / 1000).toFixed(2)} s | ${(p.runs["desktop-dark"].lcp / 1000).toFixed(2)} s |`);
}
md.push("\n### Heading outline\n");
for (const p of report.pages) {
	md.push(`**${p.name}** (\`${p.path}\`)${p.outlineProblems.length ? ` PROBLEMS: ${p.outlineProblems.join("; ")}` : ": valid (one H1, no skipped levels)"}\n`, "```");
	for (const h of p.headings) md.push(`${"  ".repeat(h.level - 1)}H${h.level}  ${h.text}`);
	md.push("```\n");
}
md.push("### Structured data (JSON-LD, merged by @id)\n", "| Page | Types present | Checks |", "| --- | --- | --- |");
for (const p of report.pages) {
	const types = p.graph.map((n) => [n["@type"]].flat().join("/"));
	const post = p.graph.find((n) => n["@type"] === "BlogPosting");
	const checks = [`lang=${p.runs["mobile-dark"].lang}`, `canonical=${p.runs["mobile-dark"].canonical ? "yes" : "MISSING"}`];
	if (post) checks.push(`BlogPosting has headline=${Boolean(post.headline)}, datePublished=${Boolean(post.datePublished)}, author=${Boolean(post.author)}, publisher=${Boolean(post.publisher)}`);
	md.push(`| ${p.name} | ${types.join(", ")} | ${checks.join("; ")} |`);
}

mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
writeFileSync(new URL("./out/report.json", import.meta.url), JSON.stringify(report, null, 1));
writeFileSync(new URL("./out/report.md", import.meta.url), md.join("\n") + "\n");
console.log(md.join("\n"));

const failures = report.pages.flatMap((p) => [
	...p.outlineProblems,
	...Object.values(p.runs).flatMap((run) => run.axe.violations.map((v) => v.id)),
	...Object.values(p.runs).flatMap((run) => (run.cls > 0 ? ["layout shift"] : [])),
	...Object.values(p.runs).flatMap((run) => run.smallTargets),
]);
if (failures.length) {
	console.error(`\n${failures.length} problem(s) found.`);
	process.exit(1);
}
