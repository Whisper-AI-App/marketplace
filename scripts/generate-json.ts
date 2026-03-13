import fs from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { whisperLLMCardsJson } from "../src";
import type { BenchmarkSummary } from "../src";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const benchResultsDir = resolve(rootDir, "benchmarks", "results");
const repoUrl = "https://github.com/Whisper-AI-App/marketplace";

// Read benchmark results for a given card key and return culled summaries
function loadBenchmarks(cardKey: string): BenchmarkSummary[] {
	const cardBenchDir = resolve(benchResultsDir, cardKey);

	let files: string[];
	try {
		files = fs.readdirSync(cardBenchDir).filter(
			(f) => f.startsWith("benchmark-") && f.endsWith(".json"),
		);
	} catch {
		return [];
	}

	return files.map((file) => {
		const raw = JSON.parse(
			fs.readFileSync(resolve(cardBenchDir, file), "utf-8"),
		);

		// Compute perf averages from per-test results when available
		const results: Array<Record<string, unknown>> = raw.results ?? [];
		const tokPerSecValues = results
			.map((r) => r.tokensPerSecond as number | undefined)
			.filter((v): v is number => typeof v === "number");
		const ttftValues = results
			.map((r) => r.ttftMs as number | undefined)
			.filter((v): v is number => typeof v === "number");

		const avgTokensPerSec = tokPerSecValues.length > 0
			? Math.round((tokPerSecValues.reduce((a, b) => a + b, 0) / tokPerSecValues.length) * 100) / 100
			: undefined;
		const avgTtftMs = ttftValues.length > 0
			? Math.round(ttftValues.reduce((a, b) => a + b, 0) / ttftValues.length)
			: undefined;

		// Cull to summary-only: strip results[], failures[], and model path
		const culled: BenchmarkSummary = {
			timestamp: raw.timestamp,
			...(raw.deviceProfile ? { deviceProfile: raw.deviceProfile } : {}),
			summary: {
				...raw.summary,
				...(avgTokensPerSec !== undefined ? { avgTokensPerSec } : {}),
				...(avgTtftMs !== undefined ? { avgTtftMs } : {}),
			},
			categories: raw.categories,
			reportUrl: `${repoUrl}/blob/main/benchmarks/results/${cardKey}/${file}`,
		};

		return culled;
	});
}

// Enrich cards with benchmark data
const output = structuredClone(whisperLLMCardsJson);

for (const cardKey of Object.keys(output.cards)) {
	const benchmarks = loadBenchmarks(cardKey);
	if (benchmarks.length > 0) {
		output.cards[cardKey].benchmarks = benchmarks;
	}
}

fs.writeFileSync("./cards.json", JSON.stringify(output, null, 4));
