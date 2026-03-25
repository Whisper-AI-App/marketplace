import { readdirSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const nanotuneBenchDir = resolve(rootDir, ".nanotune", "benchmarks");
const exportBaseDir = resolve(rootDir, "benchmarks", "results");

// Optional --device-profile arg to stamp into exported results
const args = process.argv.slice(2);
const dpIdx = args.indexOf("--device-profile");
const deviceProfile = dpIdx !== -1 ? args[dpIdx + 1] : undefined;

// Find the latest benchmark JSON result
let files: string[];
try {
	files = readdirSync(nanotuneBenchDir).filter(
		(f) => f.startsWith("benchmark-") && f.endsWith(".json"),
	);
} catch {
	console.error("Error: No .nanotune/benchmarks/ directory found. Run a benchmark first.");
	process.exit(1);
}

if (files.length === 0) {
	console.error("Error: No benchmark results found in .nanotune/benchmarks/.");
	console.error("Run a benchmark first: pnpm benchmark");
	process.exit(1);
}

// Sort by filename (timestamp-based) and take the latest
files.sort();
const latestJson = files[files.length - 1];
const latestMd = latestJson.replace(".json", ".md");

// Read the JSON to extract the model name
const resultData = JSON.parse(
	readFileSync(resolve(nanotuneBenchDir, latestJson), "utf-8"),
);

// Derive model directory name from the model field
const modelRaw: string = resultData.model ?? "unknown";
const modelName = modelRaw.split("/").pop()?.replace(/\.gguf$/i, "").toLowerCase() ?? "unknown";

const exportDir = resolve(exportBaseDir, modelName);
mkdirSync(exportDir, { recursive: true });

// Sanitise the model field — strip local path, keep only filename
if (resultData.model) {
	resultData.model = basename(resultData.model);
}

// Stamp device profile if provided
if (deviceProfile) {
	resultData.deviceProfile = deviceProfile;
}

// Write sanitised JSON (not a raw copy)
const exportJsonPath = resolve(exportDir, latestJson);
writeFileSync(exportJsonPath, JSON.stringify(resultData, null, 2));
console.log(`Exported: benchmarks/results/${modelName}/${latestJson}`);

try {
	copyFileSync(resolve(nanotuneBenchDir, latestMd), resolve(exportDir, latestMd));
	console.log(`Exported: benchmarks/results/${modelName}/${latestMd}`);
} catch {
	// MD report may not exist
}

console.log(`\nResults exported to benchmarks/results/${modelName}/`);
