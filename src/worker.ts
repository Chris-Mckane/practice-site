/**
 * Cloudflare Worker entry point.
 *
 * Hands every web request to Astro + EmDash and wires up the once-a-minute
 * scheduled task (scheduled publishing and housekeeping).
 */
import handler, { createScheduledHandler, PluginBridge } from "@emdash-cms/cloudflare/worker";

export { PluginBridge };

export default {
	...handler,
	scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
