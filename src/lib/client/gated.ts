export type GatedSolution = {
	id: string;
	label: string;
	html: string;
};

export type GatedPayload = {
	solutions: GatedSolution[];
	cards: unknown[];
};

let pending: Promise<GatedPayload | null> | null = null;

export function loadGated(): Promise<GatedPayload | null> {
	if (pending) return pending;
	const page = new URLSearchParams({ page: location.pathname });
	pending = fetch(`/api/gated?${page}`)
		.then(async (response) => {
			if (!response.ok) {
				pending = null;
				return null;
			}
			return (await response.json()) as GatedPayload;
		})
		.catch(() => {
			pending = null;
			return null;
		});
	return pending;
}

export function revealSolutions(solutions: GatedSolution[]) {
	const byId = new Map(solutions.map((item) => [item.id, item]));
	for (const node of document.querySelectorAll("[data-gated]")) {
		if (!(node instanceof HTMLElement)) continue;
		const block = byId.get(node.dataset.gated ?? "");
		if (!block) continue;
		const details = document.createElement("details");
		details.className = "solution";
		const summary = document.createElement("summary");
		summary.textContent = block.label;
		const prose = document.createElement("div");
		prose.className = "prose";
		prose.innerHTML = block.html;
		details.append(summary, prose);
		node.replaceWith(details);
	}
}
