import { describe, expect, test } from "bun:test";
import { parseQuestion } from "./atoms";
import { assembleCatalog, type SourceFile } from "./catalog";
import { hideCount } from "./recall";

const question = `
parts:
  0: "for each "
  1: "$a$"
  2: " in "
  3: "$A$"
wrong:
  1: ["$b$", "$A$"]
  3: ["$B$", "$a$"]
`;

describe("parseQuestion", () => {
	test("joining parts rebuilds the statement", () => {
		const parsed = parseQuestion(question, "function.yaml");
		expect(parsed.statement).toBe("for each $a$ in $A$");
		expect(parsed.atoms.map((atom) => atom.index)).toEqual([1, 3]);
		expect(parsed.parts[1]).toBe("$a$");
	});

	test("a wrong-answer key must be a part index", () => {
		expect(() =>
			parseQuestion(
				`
parts:
  0: "Let "
  1: "$A$"
wrong:
  2: ["$B$"]
`,
				"function.yaml",
			),
		).toThrow("key 2 is not a part index");
	});

	test("a wrong string equal to that part fails", () => {
		expect(() =>
			parseQuestion(
				`
parts:
  0: "$A$"
wrong:
  0: ["$A$", "$B$"]
`,
				"function.yaml",
			),
		).toThrow("repeats the part");
	});
});

describe("hideCount", () => {
	test("rounds to the nearest count and hides at least one", () => {
		expect(hideCount(1, 0.25)).toBe(1);
		expect(hideCount(4, 0.25)).toBe(1);
		expect(hideCount(4, 0.5)).toBe(2);
		expect(hideCount(4, 0.75)).toBe(3);
		expect(hideCount(4, 1)).toBe(4);
		expect(hideCount(0, 0.5)).toBe(0);
	});
});

describe("assembleCatalog", () => {
	test("a missing question file fails", () => {
		expect(() => assembleCatalog(libraryWithoutQuestion())).toThrow(
			"missing question file functions/definitions/function.yaml",
		);
	});
});

function libraryWithoutQuestion(): SourceFile[] {
	return [
		{
			path: "topics.yaml",
			text: "topics:\n  - functions\n",
		},
		{
			path: "functions/topic.yaml",
			text: `title: Functions
subtopics:
  - slug: fundamentals
    title: Fundamentals
    definitions:
      - function
    techniques: []
    theorems: []
    problems: []
`,
		},
		{
			path: "functions/definitions/function.tex",
			text: `\\begin{document}
\\section*{Function}
Let $A$ be a set.
\\end{document}
`,
		},
	];
}
