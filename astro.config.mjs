// @ts-check

import cloudflare from "@astrojs/cloudflare";
import clerk from "@clerk/astro";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	integrations: [clerk()],
	adapter: cloudflare(),
	output: "server",
	session: false,
});
