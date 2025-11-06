import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Ensure dist directory exists
mkdirSync("dist", { recursive: true });

// Copy cards.json to dist
copyFileSync(
	join(process.cwd(), "cards.json"),
	join(process.cwd(), "dist", "cards.json"),
);

console.log("✓ Build complete: cards.json copied to dist/");
