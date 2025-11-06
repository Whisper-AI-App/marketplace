import fs from "node:fs";
import { whisperLLMCardsJson } from "../src";

fs.writeFileSync("./cards.json", JSON.stringify(whisperLLMCardsJson, null, 4));
