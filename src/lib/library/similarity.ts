export function cosineSimilarity(left: number[], right: number[]): number {
	if (left.length === 0 || left.length !== right.length) {
		throw new Error("embedding length mismatch");
	}
	let dot = 0;
	let leftNorm = 0;
	let rightNorm = 0;
	for (let i = 0; i < left.length; i++) {
		dot += left[i] * right[i];
		leftNorm += left[i] * left[i];
		rightNorm += right[i] * right[i];
	}
	const scale = Math.sqrt(leftNorm) * Math.sqrt(rightNorm);
	if (scale === 0) throw new Error("embedding length mismatch");
	return dot / scale;
}
