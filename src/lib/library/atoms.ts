import { parse } from "yaml";

export type Atom = {
	index: number;
	text: string;
	wrong: string[];
};

export type Question = {
	parts: string[];
	atoms: Atom[];
	statement: string;
};

export function parseQuestion(text: string, file: string): Question {
	const doc = asRecord(parse(text), file);
	const extra = Object.keys(doc).filter(
		(key) => key !== "parts" && key !== "wrong",
	);
	if (extra.length > 0) {
		throw new Error(`${file}: unknown keys ${extra.join(", ")}`);
	}

	const parts = readParts(doc.parts, file);
	const wrong = readWrong(doc.wrong, file, parts);
	const atoms = [...wrong.entries()]
		.sort((a, b) => a[0] - b[0])
		.map(([index, choices]) => ({ index, text: parts[index], wrong: choices }));

	return { parts, atoms, statement: parts.join("") };
}

function readParts(value: unknown, file: string): string[] {
	const where = `${file}: parts`;
	const map = readIndexMap(value, where);
	if (map.size === 0) throw new Error(`${where} must be a non-empty list`);
	const parts: string[] = [];
	for (let index = 0; index < map.size; index++) {
		const text = map.get(index);
		if (typeof text !== "string") {
			throw new Error(`${where} must be contiguous from 0`);
		}
		if (text === "") throw new Error(`${where}[${index}] must be non-empty`);
		parts.push(text);
	}
	return parts;
}

function readWrong(
	value: unknown,
	file: string,
	parts: string[],
): Map<number, string[]> {
	const where = `${file}: wrong`;
	if (value === undefined) return new Map();
	const map = readIndexMap(value, where);
	const wrong = new Map<number, string[]>();
	for (const [index, item] of map) {
		if (index >= parts.length) {
			throw new Error(`${where} key ${index} is not a part index`);
		}
		if (!Array.isArray(item) || item.length === 0) {
			throw new Error(`${where}[${index}] must be a non-empty list`);
		}
		const choices: string[] = [];
		for (const choice of item) {
			if (typeof choice !== "string" || choice === "") {
				throw new Error(`${where}[${index}] must be non-empty strings`);
			}
			if (choice === parts[index]) {
				throw new Error(`${where}[${index}] repeats the part`);
			}
			if (choices.includes(choice)) {
				throw new Error(`${where}[${index}] has a duplicate`);
			}
			choices.push(choice);
		}
		wrong.set(index, choices);
	}
	return wrong;
}

function readIndexMap(value: unknown, where: string): Map<number, unknown> {
	const doc = asRecord(value, where);
	const map = new Map<number, unknown>();
	for (const [raw, item] of Object.entries(doc)) {
		if (!/^(0|[1-9]\d*)$/.test(raw)) {
			throw new Error(`${where} key ${raw} must be an index`);
		}
		const index = Number(raw);
		if (map.has(index)) throw new Error(`${where} key ${index} is duplicated`);
		map.set(index, item);
	}
	return map;
}

function asRecord(value: unknown, where: string): Record<string, unknown> {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${where}: expected a mapping`);
	}
	return value as Record<string, unknown>;
}
