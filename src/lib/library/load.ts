import { assembleCatalog } from "./catalog";

const texModules = import.meta.glob("../../../21-127.com-data/**/*.tex", {
	eager: true,
	import: "default",
	query: "?raw",
});

const yamlModules = import.meta.glob("../../../21-127.com-data/**/*.yaml", {
	eager: true,
	import: "default",
	query: "?raw",
});

function filesFrom(modules: Record<string, unknown>) {
	return Object.entries(modules).map(([key, text]) => {
		if (typeof text !== "string") {
			throw new Error(`expected raw text for ${key}`);
		}
		return { path: toDataPath(key), text };
	});
}

function toDataPath(globKey: string): string {
	const normalized = globKey.replaceAll("\\", "/");
	const marker = "21-127.com-data/";
	const index = normalized.lastIndexOf(marker);
	if (index < 0) throw new Error(`unexpected library path ${globKey}`);
	return normalized.slice(index + marker.length);
}

export const catalog = assembleCatalog([
	...filesFrom(texModules),
	...filesFrom(yamlModules),
]);

export { firstEntry, getEntry, isKind, KINDS } from "./catalog";
export type { Catalog, Entry, Kind, Topic } from "./catalog";
