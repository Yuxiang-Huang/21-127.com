export type ClozePick = {
	partIndex: number;
	answer: string;
	picked?: string;
};

const andGap = /^\s+and an?\s+$/;

export function clozeMarks(holes: ClozePick[], parts: string[]): boolean[] {
	const partner = new Map<number, number>();
	for (let i = 0; i < holes.length; i++) {
		for (let j = i + 1; j < holes.length; j++) {
			const left = Math.min(holes[i].partIndex, holes[j].partIndex);
			const right = Math.max(holes[i].partIndex, holes[j].partIndex);
			if (!andGap.test(parts.slice(left + 1, right).join(""))) continue;
			partner.set(i, j);
			partner.set(j, i);
		}
	}
	return holes.map((hole, i) => {
		if (!hole.picked) return false;
		if (hole.picked === hole.answer) return true;
		const other = partner.get(i);
		if (other === undefined) return false;
		const mate = holes[other];
		return hole.picked === mate.answer && mate.picked === hole.answer;
	});
}

export function hideCount(count: number, rate: number): number {
	if (count === 0) return 0;
	if (rate >= 1) return count;
	return Math.min(count, Math.max(1, Math.round(count * rate)));
}
