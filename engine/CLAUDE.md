# Claude Code conventions — engine/

This file orients Claude Code (or any other AI assistant operating on this
codebase) to the engine's conventions. The root `CLAUDE.md` covers the portal;
this one covers everything under `engine/`.

## What lives here

The urayf Engine implements [Playbook v4](docs/PLAYBOOK_v4.md). Python 3.12,
managed with uv, tested with pytest, linted with ruff.

The Engine is six layers; see the README. As of the date of this file, only
Layer 3 (the Calculator) is being actively built — everything else is still
spec.

## Hard rules

1. **The Calculator does no I/O.** No database calls, no HTTP, no file reads,
   no API calls. It is pure functions: data in, data out. Database wrapping
   lives outside the Calculator.

2. **No language model calls in the Calculator.** Ever. The Voice writer
   (Phase 2, separate package) is the only place an LLM appears in this
   codebase. Mixing model output into the Calculator destroys our ability to
   guarantee numerical correctness.

3. **The payload schema is the contract.** When the Calculator emits data,
   it conforms to `schema/report_payload.py`. The TypeScript mirror at
   `../src/lib/report-payload.ts` must change in the same commit when this
   one does.

4. **Money math.** Internal calculations use Python `float`. Round to 2dp
   at the Calculator's output boundary (i.e., when assembling the payload).
   In the database, money is `numeric(12,2)`; the Engine converts at the
   read/write boundary.

5. **Missing is not zero.** A delivery with no DMR side yet has `dmr_cost =
   None`, never `0`. The schema enforces this with `MaybeMoney = float | None`.

6. **Business-date math is store-local, never UTC.** The store's timezone
   is on `stores.timezone` in the database. Use it.

## Soft conventions

- **Tests next to the layer.** Tests for `calculator/hourly.py` live at
  `tests/calculator/test_hourly.py`.

- **One module per responsibility.** Don't pile everything into a single
  giant `calculator.py`. The royalty formula, the labor formula, the
  ledger state machine — each gets its own module.

- **Type hints everywhere.** This is a system that handles money. Pydantic
  models for data; type hints on every function signature.

- **Docstrings cite the playbook.** When implementing a formula, the
  docstring should say which section of Playbook v4 it implements. This
  makes drift between code and spec visible.

  ```python
  def royalty_per_hour(merchandise_sales: float, inventory: float) -> float:
      """
      Compute the royalty for one hour bar.

      Per Playbook v4 §Layer 3: (merchandise_sales − inventory) × 0.54.
      Can be negative when deliveries exceed merchandise sales for the hour.
      """
  ```

- **No clever metaprogramming.** This is operational code. Boring is good.
  If you find yourself reaching for decorators or metaclasses, stop and
  reconsider.

- **Errors are exceptions, not None.** A formula that can't compute should
  raise, not return None. The Engine wrapper handles exceptions; the
  Calculator should not paper over impossible states.

## Workflow

```powershell
uv sync                    # install/update dependencies
uv run pytest              # run all tests
uv run pytest tests/calculator/test_hourly.py    # one file
uv run pytest -k royalty   # tests matching a keyword
uv run ruff check          # lint
uv run ruff check --fix    # autofix what's autofixable
uv run ruff format         # format
```

A change is "done" when:

1. `uv run pytest` passes.
2. `uv run ruff check` reports no issues.
3. `uv run ruff format` reports no changes needed.
4. New behavior has a test.

## When the spec and code disagree

The spec wins. If you find yourself implementing something that contradicts
Playbook v4, stop. Either the spec is wrong (and we update it before
proceeding), or the code is wrong (and we fix it to match the spec). Silent
drift between code and spec is the worst outcome.
