/// <reference types="@clerk/astro/env" />

interface ImportMetaEnv {
	readonly OPENROUTER_API_KEY?: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}
