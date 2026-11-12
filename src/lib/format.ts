/** Formatting helpers: dates, reading time and safe link handling. */
import { extractPlainText, sanitizeHref, type PortableTextBlock } from "emdash";

/** Average adult silent reading speed for English non-fiction, in words per minute. */
const WORDS_PER_MINUTE = 238;

export function formatDate(date: Date, timeZone: string): string {
	return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone }).format(date);
}

export function wordCount(blocks: PortableTextBlock[] | undefined): number {
	const words = extractPlainText(blocks ?? []).trim();
	return words ? words.split(/\s+/).length : 0;
}

/** Reading time in whole minutes (minimum 1), computed from the post body. */
export function readingMinutes(blocks: PortableTextBlock[] | undefined): number {
	return Math.max(1, Math.round(wordCount(blocks) / WORDS_PER_MINUTE));
}

/** Returns a safe href, or null when the value is empty or unsafe (so nothing is rendered). */
export function href(value: unknown): string | null {
	if (typeof value !== "string" || !value.trim()) return null;
	const safe = sanitizeHref(value.trim());
	return safe === "#" && value.trim() !== "#" ? null : safe;
}

/** Splits plain text into paragraphs at blank lines. */
export function paragraphs(value: unknown): string[] {
	return typeof value === "string"
		? value
				.split(/\n\s*\n/)
				.map((part) => part.trim())
				.filter(Boolean)
		: [];
}
