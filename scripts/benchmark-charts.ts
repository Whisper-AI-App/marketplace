import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const benchResultsDir = resolve(rootDir, "benchmarks", "results");

// ─── Colour palette ──────────────────────────────────────────

const COLOURS = {
	primary: "#6366f1", // indigo
	primaryLight: "#818cf8",
	success: "#22c55e",
	danger: "#ef4444",
	muted: "#94a3b8",
	text: "#1e293b",
	textLight: "#64748b",
	bg: "#ffffff",
	bgSubtle: "#f8fafc",
	border: "#e2e8f0",
	barPassed: "#6366f1",
	barFailed: "#e2e8f0",
};

// ─── SVG Helpers ─────────────────────────────────────────────

function escapeXml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Category Bar Chart ──────────────────────────────────────

function generateCategoryBarChart(data: {
	model: string;
	categories: Record<string, { passed: number; total: number }>;
}): string {
	const entries = Object.entries(data.categories);
	const barHeight = 32;
	const gap = 12;
	const labelWidth = 180;
	const barMaxWidth = 320;
	const padding = 24;
	const titleHeight = 72;
	const width = labelWidth + barMaxWidth + padding * 2 + 60;
	const height = titleHeight + entries.length * (barHeight + gap) + padding * 2;

	let bars = "";
	entries.forEach(([category, { passed, total }], i) => {
		const y = titleHeight + padding + i * (barHeight + gap);
		const passRate = total > 0 ? passed / total : 0;
		const passedWidth = Math.round(passRate * barMaxWidth);
		const label = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

		// Background bar (total)
		bars += `<rect x="${labelWidth + padding}" y="${y}" width="${barMaxWidth}" height="${barHeight}" rx="6" fill="${COLOURS.barFailed}" />`;
		// Passed bar
		if (passedWidth > 0) {
			bars += `<rect x="${labelWidth + padding}" y="${y}" width="${passedWidth}" height="${barHeight}" rx="6" fill="${COLOURS.barPassed}" />`;
		}
		// Label
		bars += `<text x="${labelWidth + padding - 12}" y="${y + barHeight / 2 + 5}" text-anchor="end" font-family="system-ui, sans-serif" font-size="13" fill="${COLOURS.text}">${escapeXml(label)}</text>`;
		// Score
		bars += `<text x="${labelWidth + padding + barMaxWidth + 8}" y="${y + barHeight / 2 + 5}" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="${COLOURS.text}">${passed}/${total}</text>`;
	});

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<rect width="${width}" height="${height}" fill="${COLOURS.bg}" rx="12" />
<text x="${padding}" y="${padding + 20}" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="${COLOURS.text}">Benchmark Results by Category</text>
<text x="${padding}" y="${padding + 38}" font-family="system-ui, sans-serif" font-size="12" fill="${COLOURS.textLight}">${escapeXml(data.model)}</text>
${bars}
</svg>`;
}

// ─── Radar / Spider Chart ────────────────────────────────────

function generateRadarChart(data: {
	model: string;
	categories: Record<string, { passed: number; total: number }>;
}): string {
	const entries = Object.entries(data.categories);
	const n = entries.length;
	const padding = 28;
	const titleBlockHeight = 70;
	const radius = 150;
	const labelMargin = 40; // space between radar edge and labels
	const textMargin = 150; // space for longest label on either side (e.g. "Instruction Following")
	const width = padding + textMargin + labelMargin + radius * 2 + labelMargin + textMargin + padding;
	const cx = width / 2;
	const cy = titleBlockHeight + padding + labelMargin + radius + 16;
	const height = cy + radius + labelMargin + padding + 20;

	const angleStep = (2 * Math.PI) / n;
	// Rotate so first axis points up
	const startAngle = -Math.PI / 2;

	// Grid rings — place percentage labels along a diagonal axis to avoid overlapping top label
	let grid = "";
	// Pick an axis between the first and second category for percentage labels
	const pctLabelAngle = startAngle + angleStep * 0.5;
	for (const ring of [0.25, 0.5, 0.75, 1.0]) {
		const r = radius * ring;
		const points = Array.from({ length: n }, (_, i) => {
			const angle = startAngle + i * angleStep;
			return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
		}).join(" ");
		grid += `<polygon points="${points}" fill="none" stroke="${COLOURS.border}" stroke-width="1" />`;
		const pctX = cx + r * Math.cos(pctLabelAngle);
		const pctY = cy + r * Math.sin(pctLabelAngle);
		grid += `<text x="${pctX + 6}" y="${pctY - 4}" font-family="system-ui, sans-serif" font-size="10" fill="${COLOURS.muted}">${Math.round(ring * 100)}%</text>`;
	}

	// Axis lines
	let axes = "";
	entries.forEach(([_category, _], i) => {
		const angle = startAngle + i * angleStep;
		const x = cx + radius * Math.cos(angle);
		const y = cy + radius * Math.sin(angle);
		axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${COLOURS.border}" stroke-width="1" />`;
	});

	// Data polygon
	const dataPoints = entries.map(([_, { passed, total }], i) => {
		const rate = total > 0 ? passed / total : 0;
		const r = radius * rate;
		const angle = startAngle + i * angleStep;
		return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
	}).join(" ");

	// Category labels — push further out and adjust vertical position for top/bottom
	let labels = "";
	entries.forEach(([category], i) => {
		const angle = startAngle + i * angleStep;
		const labelRadius = radius + labelMargin;
		let x = cx + labelRadius * Math.cos(angle);
		let y = cy + labelRadius * Math.sin(angle);
		const label = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

		let anchor: string;
		if (Math.abs(Math.cos(angle)) < 0.15) {
			// Top or bottom — centre the label
			anchor = "middle";
			// Push top label up and bottom label down to avoid grid overlap
			y += Math.sin(angle) > 0 ? 14 : -6;
		} else {
			anchor = Math.cos(angle) > 0 ? "start" : "end";
			y += 4;
		}

		labels += `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="system-ui, sans-serif" font-size="11" fill="${COLOURS.text}">${escapeXml(label)}</text>`;
	});

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<rect width="${width}" height="${height}" fill="${COLOURS.bg}" rx="12" />
<text x="${cx}" y="${padding + 18}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="${COLOURS.text}">Category Strengths</text>
<text x="${cx}" y="${padding + 36}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="${COLOURS.textLight}">${escapeXml(data.model)}</text>
${grid}
${axes}
<polygon points="${dataPoints}" fill="${COLOURS.primary}" fill-opacity="0.2" stroke="${COLOURS.primary}" stroke-width="2" />
${labels}
</svg>`;
}

// ─── Summary Stats Card ─────────────────────────────────────

function generateSummaryCard(data: {
	model: string;
	timestamp: string;
	summary: {
		total: number;
		passed: number;
		failed: number;
		passRate: number;
		avgLatencyMs: number;
		avgJudgeScore: number;
		judgeModel: string;
		avgTokensPerSecond?: number;
	};
}): string {
	const { summary } = data;
	const width = 520;
	const height = 260;
	const padding = 32;

	const passPercent = Math.round(summary.passRate * 100);
	const date = new Date(data.timestamp).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

	// Pass rate colour
	const rateColour = passPercent >= 80 ? COLOURS.success : passPercent >= 50 ? "#eab308" : COLOURS.danger;

	const tokPerSec = summary.avgTokensPerSecond != null ? `${summary.avgTokensPerSecond}` : "—";

	const stats = [
		{ label: "Passed", value: `${summary.passed}` },
		{ label: "Failed", value: `${summary.failed}` },
		{ label: "Judge Score", value: `${summary.avgJudgeScore}/10` },
		{ label: "Avg tok/s", value: tokPerSec },
	];

	const statWidth = (width - padding * 2) / stats.length;
	let statsSvg = "";
	stats.forEach((s, i) => {
		const x = padding + i * statWidth + statWidth / 2;
		const y = 170;
		statsSvg += `<text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="${COLOURS.text}">${s.value}</text>`;
		statsSvg += `<text x="${x}" y="${y + 20}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="${COLOURS.textLight}">${s.label}</text>`;
	});

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<rect width="${width}" height="${height}" fill="${COLOURS.bg}" rx="12" stroke="${COLOURS.border}" stroke-width="1" />
<text x="${padding}" y="${padding + 20}" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="${COLOURS.text}">${escapeXml(data.model)}</text>
<text x="${padding}" y="${padding + 40}" font-family="system-ui, sans-serif" font-size="12" fill="${COLOURS.textLight}">Benchmark — ${date} — Judge: ${escapeXml(summary.judgeModel)}</text>
<text x="${width - padding}" y="${padding + 30}" text-anchor="end" font-family="system-ui, sans-serif" font-size="36" font-weight="800" fill="${rateColour}">${passPercent}%</text>
<text x="${width - padding}" y="${padding + 48}" text-anchor="end" font-family="system-ui, sans-serif" font-size="11" fill="${COLOURS.textLight}">pass rate</text>
<line x1="${padding}" y1="120" x2="${width - padding}" y2="120" stroke="${COLOURS.border}" stroke-width="1" />
${statsSvg}
</svg>`;
}

// ─── Latency by Category Chart ───────────────────────────────

function generateLatencyChart(data: {
	model: string;
	results: Array<{ category: string; latencyMs: number }>;
}): string {
	// Compute average latency per category
	const categoryLatencies: Record<string, { total: number; count: number }> = {};
	for (const r of data.results) {
		if (!categoryLatencies[r.category]) {
			categoryLatencies[r.category] = { total: 0, count: 0 };
		}
		categoryLatencies[r.category].total += r.latencyMs;
		categoryLatencies[r.category].count += 1;
	}

	const entries = Object.entries(categoryLatencies).map(([cat, { total, count }]) => ({
		category: cat,
		avgMs: Math.round(total / count),
	}));

	const maxMs = Math.max(...entries.map((e) => e.avgMs));
	const barHeight = 32;
	const gap = 12;
	const labelWidth = 180;
	const barMaxWidth = 320;
	const padding = 24;
	const titleHeight = 72;
	const width = labelWidth + barMaxWidth + padding * 2 + 80;
	const height = titleHeight + entries.length * (barHeight + gap) + padding * 2;

	let bars = "";
	entries.forEach(({ category, avgMs }, i) => {
		const y = titleHeight + padding + i * (barHeight + gap);
		const barWidth = maxMs > 0 ? Math.round((avgMs / maxMs) * barMaxWidth) : 0;
		const label = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

		// Background bar
		bars += `<rect x="${labelWidth + padding}" y="${y}" width="${barMaxWidth}" height="${barHeight}" rx="6" fill="${COLOURS.bgSubtle}" />`;
		// Latency bar
		if (barWidth > 0) {
			bars += `<rect x="${labelWidth + padding}" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="${COLOURS.primaryLight}" />`;
		}
		// Label
		bars += `<text x="${labelWidth + padding - 12}" y="${y + barHeight / 2 + 5}" text-anchor="end" font-family="system-ui, sans-serif" font-size="13" fill="${COLOURS.text}">${escapeXml(label)}</text>`;
		// Value
		bars += `<text x="${labelWidth + padding + barMaxWidth + 8}" y="${y + barHeight / 2 + 5}" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="${COLOURS.text}">${avgMs}ms</text>`;
	});

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<rect width="${width}" height="${height}" fill="${COLOURS.bg}" rx="12" />
<text x="${padding}" y="${padding + 20}" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="${COLOURS.text}">Average Latency by Category</text>
<text x="${padding}" y="${padding + 38}" font-family="system-ui, sans-serif" font-size="12" fill="${COLOURS.textLight}">${escapeXml(data.model)}</text>
${bars}
</svg>`;
}

// ─── Main ────────────────────────────────────────────────────

// Find all model directories with benchmark results
let modelDirs: string[];
try {
	modelDirs = readdirSync(benchResultsDir, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);
} catch {
	console.error("Error: No benchmarks/results/ directory found.");
	process.exit(1);
}

if (modelDirs.length === 0) {
	console.error("No benchmark results found. Run benchmarks first.");
	process.exit(1);
}

for (const modelDir of modelDirs) {
	const modelResultsDir = resolve(benchResultsDir, modelDir);
	const files = readdirSync(modelResultsDir).filter(
		(f) => f.startsWith("benchmark-") && f.endsWith(".json"),
	);

	if (files.length === 0) continue;

	// Use the latest benchmark
	files.sort();
	const latestFile = files[files.length - 1];
	const raw = JSON.parse(
		readFileSync(resolve(modelResultsDir, latestFile), "utf-8"),
	);

	const modelLabel = raw.model ?? modelDir;
	const chartData = {
		model: modelLabel,
		timestamp: raw.timestamp,
		summary: raw.summary,
		categories: raw.categories,
	};

	const chartsDir = resolve(modelResultsDir, "charts");
	mkdirSync(chartsDir, { recursive: true });

	// Generate all charts
	writeFileSync(
		resolve(chartsDir, "categories.svg"),
		generateCategoryBarChart(chartData),
	);
	console.log(`  Generated: benchmarks/results/${modelDir}/charts/categories.svg`);

	writeFileSync(
		resolve(chartsDir, "radar.svg"),
		generateRadarChart(chartData),
	);
	console.log(`  Generated: benchmarks/results/${modelDir}/charts/radar.svg`);

	writeFileSync(
		resolve(chartsDir, "summary.svg"),
		generateSummaryCard(chartData),
	);
	console.log(`  Generated: benchmarks/results/${modelDir}/charts/summary.svg`);

	// Latency chart (requires per-test results with latencyMs)
	if (Array.isArray(raw.results) && raw.results.length > 0) {
		writeFileSync(
			resolve(chartsDir, "latency.svg"),
			generateLatencyChart({ model: modelLabel, results: raw.results }),
		);
		console.log(`  Generated: benchmarks/results/${modelDir}/charts/latency.svg`);
	}

	console.log(`\nCharts generated for ${modelDir}`);
}
