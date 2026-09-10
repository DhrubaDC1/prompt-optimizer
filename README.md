# Prompt Optimizer

JavaScript-only pnpm workspace for the Prompt Optimizer product.

## Workspace

- `packages/optimizer` — pure JavaScript optimizer package; no React or Next.js.
- `apps/web` — Next.js app and API routes.

## Gemini

The optimizer uses Google AI Studio (Gemini) structured outputs via its OpenAI-compatible endpoint. Copy `.env.example` to `.env` and set:

```bash
GOOGLE_API_KEY=your_key_here
GOOGLE_MODEL=gemini-flash-lite-latest
```

`GOOGLE_MODEL` is optional; `gemini-flash-lite-latest` is the default.

## Commands

```bash
pnpm install
pnpm eval
pnpm dev
```

The first milestone is to run the five evals and inspect the generated prompts manually before wiring the optimizer into the web route.
