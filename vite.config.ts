import { defineConfig } from "vite-plus";

export default defineConfig({
	fmt: {
		useTabs: true,
		singleQuote: false,
		sortImports: {},
		astro: true,
		ignorePatterns: [
			"dist/**",
			".astro/**",
			"bun.lock",
			"skills-lock.json",
			"21-127.com-data/**",
			".agents/**",
		],
	},
	lint: {
		options: {
			typeAware: true,
			typeCheck: true,
		},
		ignorePatterns: ["dist/**", ".astro/**", "21-127.com-data/**", ".agents/**"],
	},
	staged: {
		"*": "vp check --fix",
	},
	test: {
		include: ["src/**/*.test.ts"],
	},
});
