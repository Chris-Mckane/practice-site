/**
 * Registers EmDash's database-backed content with Astro.
 * Boilerplate: the same in every EmDash project. Do not edit.
 */
import { defineLiveCollection } from "astro:content";
import { emdashLoader } from "emdash/runtime";

export const collections = {
	_emdash: defineLiveCollection({ loader: emdashLoader() }),
};
