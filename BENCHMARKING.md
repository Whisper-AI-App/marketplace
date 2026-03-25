# Benchmarking

Local model quality benchmarking using [nanotune](https://github.com/Nano-Collective/nanotune). Runs test prompts against a model and evaluates responses using both exact matching and LLM-as-a-judge scoring.

## Prerequisites

Install and run [Ollama](https://ollama.com), then pull the judge model:

```bash
ollama pull qwen3.5:397b-cloud
```

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Initialise nanotune

Run a benchmark to generate the `.nanotune/` directory and download the model. This will fail on the first run because the judge isn't configured yet — that's expected:

```bash
pnpm benchmark
```

Select a model when prompted. The script downloads the GGUF into `.nanotune/models/` (cached for future runs), creates `.nanotune/config.json`, and copies test data into `.nanotune/benchmarks/`.

### 3. Configure the LLM judge

```bash
pnpm benchmark:judge
```

When prompted, select **ollama** as the provider template and configure it to use `qwen3.5:397b-cloud`.

This stores your judge configuration locally in `.nanotune/` (gitignored).

## Usage

```bash
# Interactive model selection (defaults to high preset, 512 max tokens)
pnpm benchmark

# Specify a model directly
pnpm benchmark --model lfm2.5-1.2b-instruct-q4_k_m

# Specify a hardware preset
pnpm benchmark --model qwen3.5-4b-q4_k_m --preset low

# Override max token output
pnpm benchmark --model qwen3.5-4b-q4_k_m --max-tokens 1024
```

### Defaults

When no flags are provided, the script defaults to:
- **Preset:** `high` (performance hardware configuration)
- **Max tokens:** `2048` (overrides the preset's own limit for fuller responses)

Specifying `--preset` explicitly uses that preset's own `max-tokens` limit unless `--max-tokens` is also provided.

### Available presets

| Preset   | Description          | Max tokens |
| -------- | -------------------- | ---------- |
| `low`    | Constrained hardware | 50         |
| `medium` | Balanced             | 100        |
| `high`   | Performance hardware | 150        |
| `ultra`  | Maximum quality      | 200        |

### Available models

| Flag value                     | Name                                   | Parameters | Size    |
| ------------------------------ | -------------------------------------- | ---------- | ------- |
| `lfm2.5-1.2b-instruct-q4_k_m` | Whisper AI (LFM2.5 1.2B I Q4_K_M)     | 1.2B       | 0.731 GB |
| `qwen3.5-4b-q4_k_m`           | Whisper AI Vision (Qwen3.5 4B Q4_K_M) | 4B         | 2.74 GB |

## Test cases

Test data lives in `benchmarks/tests.json`. All 79 tests use **`llm-judge`** matching — each response is sent to the judge model (Ollama `qwen3.5:397b-cloud`) for scoring against criteria like `helpful`, `accurate`, `concise`, and `safe`. Tests require a pass threshold of 7/10.

## Reports

After a benchmark run, nanotune generates JSON and Markdown reports in `.nanotune/benchmarks/` (gitignored).

To export the latest results into git-tracked storage:

```bash
pnpm benchmark:export
```

This copies the most recent JSON and Markdown reports into `benchmarks/results/<model-name>/`, e.g.:

```
benchmarks/results/lfm2.5-1.2b-instruct-q4_k_m/benchmark-2026-03-11T15-02-10-183Z.json
benchmarks/results/lfm2.5-1.2b-instruct-q4_k_m/benchmark-2026-03-11T15-02-10-183Z.md
```

## Scripts

| Command                 | Description                               |
| ----------------------- | ----------------------------------------- |
| `pnpm benchmark`        | Run benchmarks (interactive model picker) |
| `pnpm benchmark:judge`  | Configure the LLM judge provider          |
| `pnpm benchmark:export` | Export latest results to git-tracked dir  |
