/** Shared types and helpers for page sections (blocks). */
import type { AstroGlobal } from "astro";

export interface Block {
	_type: string;
	_key: string;
	_version?: number;
	[field: string]: unknown;
}

export interface BlockProps {
	value: Block;
	index: number;
	blockKey: string;
}

/** Block types that can carry the page's single H1. */
export const H1_BLOCKS = ["hero", "profile", "page_header"];

/** "h1" for the block chosen to carry the page's H1, otherwise "h2". */
export function headingTag(Astro: AstroGlobal, blockKey: string): "h1" | "h2" {
	return (Astro.locals as { h1Key?: string }).h1Key === blockKey ? "h1" : "h2";
}

export const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

export const rows = (value: unknown): Record<string, unknown>[] =>
	Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
