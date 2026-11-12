/**
 * Colour contrast check (WCAG 2.2).
 *
 * Reads the design tokens straight from src/styles/global.css, so it always tests
 * the colours the site really uses, and checks every text and interface pairing in
 * both themes, including hover states and the animated button.
 *
 * Text must reach 7:1 (AAA). Interface parts that are not text (focus ring, switch)
 * must reach 3:1 (WCAG 1.4.11). Run with: npm run check:contrast
 * Add --markdown to print the table used in VERIFICATION.md.
 */
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");

/** Extracts the custom properties declared inside the first block that follows `selector`. */
function tokens(selector) {
	const start = css.indexOf(selector);
	const block = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
	return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const dark = tokens(":root {");
const themes = { Dark: dark, Light: { ...dark, ...tokens(':root[data-theme="light"]') } };

function parse(value) {
	const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
	if (hex) {
		const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
		return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), alpha: 1 };
	}
	const rgb = value.match(/^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/);
	if (rgb) return { rgb: rgb.slice(1, 4).map(Number), alpha: rgb[4] === undefined ? 1 : Number(rgb[4]) };
	throw new Error(`Cannot read colour: ${value}`);
}

/** Paints a translucent colour over an opaque one. */
const over = (top, bottom) => top.rgb.map((c, i) => c * top.alpha + bottom.rgb[i] * (1 - top.alpha));

function luminance(rgb) {
	const [r, g, b] = rgb.map((c) => {
		const s = c / 255;
		return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

const rows = [];
let failed = false;

for (const [name, t] of Object.entries(themes)) {
	const c = (token) => parse(t[token]).rgb;
	const sweepOn = (token) => over(parse(t["--btn-sweep"]), parse(t[token]));
	const check = (what, fg, bg, min) => {
		const value = ratio(fg, bg);
		const pass = value >= min;
		if (!pass) failed = true;
		rows.push({ theme: name, what, value, min, pass });
	};

	// Text: 7:1
	check("Body text on page background", c("--text"), c("--bg"), 7);
	check("Body text on surface (author box, code)", c("--text"), c("--surface"), 7);
	check("Muted text on page background", c("--muted"), c("--bg"), 7);
	check("Muted text on surface", c("--muted"), c("--surface"), 7);
	check("Links and badge figures (accent) on page background", c("--accent"), c("--bg"), 7);
	check("Links (accent) on surface", c("--accent"), c("--surface"), 7);
	check("Link hover (text colour) on page background", c("--text"), c("--bg"), 7);
	check("Link hover (text colour) on surface", c("--text"), c("--surface"), 7);
	check("Button label on gradient start", c("--btn-text"), c("--btn-a"), 7);
	check("Button label on gradient middle (hover and focus)", c("--btn-text"), c("--btn-b"), 7);
	check("Button label on gradient start with light sweep", c("--btn-text"), sweepOn("--btn-a"), 7);
	check("Button label on gradient middle with light sweep", c("--btn-text"), sweepOn("--btn-b"), 7);
	check("Skip link (page background colour on text colour)", c("--bg"), c("--text"), 7);
	check("Selected text (page background colour on accent)", c("--bg"), c("--accent"), 7);

	// Interface parts that are not text: 3:1
	check("Focus ring (accent) against page background", c("--accent"), c("--bg"), 3);
	check("Focus ring (accent) against surface", c("--accent"), c("--surface"), 3);
	check("Theme switch outline (text colour) against page background", c("--text"), c("--bg"), 3);
	check("Theme switch knob and status marker (accent) against page background", c("--accent"), c("--bg"), 3);
	check("Photo placeholder outline (muted) against surface", c("--muted"), c("--surface"), 3);

	// Decorative only: reported for transparency, no minimum applies.
	check("Divider lines against page background (decorative)", c("--line"), c("--bg"), 0);
}

if (process.argv.includes("--markdown")) {
	console.log("| Theme | Pairing | Ratio | Required | Result |\n| --- | --- | --- | --- | --- |");
	for (const r of rows) {
		console.log(`| ${r.theme} | ${r.what} | ${r.value.toFixed(2)}:1 | ${r.min ? `${r.min}:1` : "none"} | ${r.min ? (r.pass ? "Pass" : "FAIL") : "n/a"} |`);
	}
} else {
	for (const r of rows) {
		console.log(`${r.pass ? "pass" : "FAIL"}  ${r.theme.padEnd(5)} ${r.value.toFixed(2).padStart(5)}:1  (needs ${r.min}:1)  ${r.what}`);
	}
}

if (failed) {
	console.error("\nContrast check failed.");
	process.exit(1);
}
