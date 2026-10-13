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
	pending = fetchGated(0);
	return pending;
}

async function fetchGated(attempt: number): Promise<GatedPayload | null> {
	const page = new URLSearchParams({ page: location.pathname });
	try {
		const response = await fetch(`/api/gated?${page}`);
		if (response.ok) return (await response.json()) as GatedPayload;
		if (response.status === 401 && attempt < 4) {
			await wait(200 * (attempt + 1));
			return fetchGated(attempt + 1);
		}
	} catch {
		if (attempt < 4) {
			await wait(200 * (attempt + 1));
			return fetchGated(attempt + 1);
		}
	}
	pending = null;
	return null;
}

function wait(ms: number) {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
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
