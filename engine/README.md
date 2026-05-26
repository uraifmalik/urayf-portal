# urayf Engine

The Engine implements [Playbook v4](docs/PLAYBOOK_v4.md) — the daily, weekly,
and monthly report pipeline for urayf clients.

This is the Python half of the urayf monorepo. The Next.js portal lives at the
repo root; the Engine lives here. They share data through Supabase and through
the JSON payload schema (mirrored in both languages).

## Architecture

Six layers, executed in this order:

```
Layer 1 — Collection            (Playwright reads 7BOSS + 7REPORTS)
Layer 2 — Data Entry            (Playwright writes back to 7BOSS)
Layer 3 — Computation           (Pure Python — the Calculator)
Layer 4 — Report Generation     (Voice writer fills prose; Template renders HTML)
Layer 6 — Supervisor            (Verifies layers 1–4; gates Layer 5)
Layer 5 — Delivery              (Portal + optional Gmail draft)
```

See [docs/PLAYBOOK_v4.md](docs/PLAYBOOK_v4.md) for the full specification.

## Layout

```
engine/
├── pyproject.toml      Project metadata, dependencies, ruff + pytest config
├── README.md           This file
├── CLAUDE.md           Conventions for in-repo Claude Code sessions
├── .python-version     Pin to 3.12 (uv reads this)
├── docs/
│   └── PLAYBOOK_v4.md  Engine specification (canonical)
├── schema/
│   └── report_payload.py   Pydantic models — the payload contract
├── calculator/         (Phase 1) The Calculator — pure Python, no LLM
├── voice/              (Phase 2) Voice writer — calls the Anthropic API
├── template/           (Phase 3) Template renderer
├── collector/          (Phase 5) Playwright collection for Layer 1
├── writeback/          (Phase 6) Playwright write-back for Layer 2
├── supervisor/         (Phase 6) Layer 6 verification
├── delivery/           (Phase 5/7) Portal + Gmail dispatch
└── tests/              pytest suite — one test module per package
```

The empty folders (voice, template, collector, etc.) appear as we build each
phase. Phase 1 only creates `calculator/`.

## Setup

You'll need Python 3.12+ and [uv](https://github.com/astral-sh/uv).

```powershell
# From the engine/ directory:
uv sync                    # install dependencies into .venv/
uv run pytest              # run the test suite
uv run ruff check          # lint
uv run ruff format         # format
```

`uv` automatically creates and manages a virtual environment in `.venv/`. You
don't need to activate it; `uv run <command>` runs the command inside it.

## Development workflow

The Calculator (Phase 1) is the part of the Engine being built right now. The
working pattern is:

1. Pick the next formula or check from [Playbook v4 §Layer 3](docs/PLAYBOOK_v4.md#layer-3--computation--reconciliation).
2. Write a test in `tests/` describing what the formula should produce for
   specific inputs.
3. Implement the formula in `calculator/`.
4. Run `uv run pytest` until it's green.
5. Commit.

The Calculator does no I/O. It takes data in, returns data out. The wrapper
that reads from Supabase and writes results back lives outside the Calculator
(coming in a later phase).

## Not in this directory

- The Next.js portal — repo root and `src/`.
- The TypeScript mirror of the payload schema — `src/lib/report-payload.ts`.
  When you change `engine/schema/report_payload.py`, update the TS file in
  the same commit so they don't drift.
- Supabase migrations — `supabase/migrations/`.

## License

Proprietary. © urayf LLC.
