# Prompt Optimizer

JavaScript-only pnpm workspace for the Prompt Optimizer product.

## Workspace

- `packages/optimizer` — pure JavaScript optimizer package; no React or Next.js.
- `apps/web` — Next.js app and API routes.

## Groq

The optimizer uses Groq structured outputs. Copy `.env.example` to `.env` and set:

```bash
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

`GROQ_MODEL` is optional; `openai/gpt-oss-20b` is the default.

## Commands

```bash
pnpm install
pnpm eval
pnpm dev
```

The first milestone is to run the five evals and inspect the generated prompts manually before wiring the optimizer into the web route.
