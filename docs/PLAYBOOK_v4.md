# 7-Eleven Engine Specification (Playbook v4)

**Version:** v4
**Status:** Active specification — the Engine implements this document.
**Audience:** Engineers building the urayf Engine (Phases 1–8 of the urayf
software buildout).
**Predecessor:** v3 (May 2026). v3 was an operator's manual for the manual
Cowork workflow; v4 is the contract the Engine fulfills.
**Last Updated:** _to fill in on commit_

---

## What this document is

This is the **specification** for the daily, weekly, and monthly franchisee
report pipeline that the urayf Engine runs end-to-end. It tells the Engine
exactly what data to collect, what to compute, what to write back to the
client's systems, what to put in front of the client, and what to verify
before publishing.

This is not a how-to. The how-to is the code. This document says **what**
must happen and **why**, in enough detail that two engineers reading it
independently produce systems that agree on every figure to the cent.

## What this document is not

- It is not a script for Claude to walk through inside Cowork. (The v3 of
  this document was; v4 is not.) The Engine is the executor now.
- It is not a description of the report's visual design. That lives in the
  brand spec and the locked HTML report template. This document specifies
  the **data**; the template specifies the **presentation**.
- It is not the source of truth for individual client configuration. Client
  rosters, pay rates, shift timings, store numbers, etc. live in the Vault
  (the `clients`, `stores`, and related tables in Supabase) and are read
  by the Engine at runtime, not hardcoded here.

## What changed from v3

- **Reframe.** The document is no longer instructions for a human-supervised
  AI agent. It's the contract the Engine implements.
- **New Layer 6 — Supervisor.** A verification pass that runs after Layer 4
  and gates Layer 5. No report reaches the client unless the Supervisor
  signs off.
- **Layer 4 redefined.** Layer 4 no longer "designs" anything. It generates
  a JSON payload conforming to the canonical schema (see _Report Payload
  Contract_ below) and hands it to the Template renderer, which is owned by
  the brand spec, not this document.
- **Calculator / Voice split formalized.** Layer 3 (computation) and the
  small prose-writing portion of Layer 4 (section intros and ledger notes)
  are explicitly separated: the Calculator does math without ever calling a
  language model; the Voice writer does prose without ever doing math.
- **Layer 2 risk acknowledged.** Layer 2 writes back to the client's 7BOSS
  system. v4 requires idempotency keys on every write and an audit log of
  every action taken, so reruns are safe and bookkeeping errors are
  traceable.
- **Layer 5 demoted.** Email delivery is no longer Layer 5; the Portal is.
  Email is now a secondary delivery channel under Layer 5.

---

## Glossary

| Term | Meaning |
|---|---|
| 7BOSS | The client's primary operations portal — https://remoteportal.ris.7-eleven.com |
| 7REPORTS | The reporting portal — https://7-reports.cabnit.com |
| EJ | Electronic Journal (transaction log) |
| ISR | Invoice Summary Report (from 7BOSS) |
| DMR | Daily Merchandise Report (from 7REPORTS) |
| Business Date | A 7-Eleven business day runs 7:00 AM to 6:59 AM the following calendar day. |
| "Yesterday" | The previous business date — see _Business Date Rules_. |
| Ledger | Persistent record in the Vault tracking every ISR and DMR row seen across runs, to handle timing mismatches. |
| Run | One end-to-end execution of the pipeline for one (store, business_date) pair. Identified by `run_id`. |
| Engine | The umbrella term for the software that implements this specification. |
| Calculator | The deterministic computation component. Pure Python, no language model. |
| Voice writer | The prose-generation component. Calls the Anthropic API. |
| Template renderer | The component that fills the locked HTML report template from the payload. |
| Supervisor | The verification component (Layer 6) that gates Portal publication. |
| Vault | The Supabase Postgres database — the system's authoritative state. |
| Payload | The JSON object conforming to `DailyReportPayload` (see schema/report-payload.ts). The contract between the Engine and the Portal. |

---

## Architecture overview

The Engine is a six-layer pipeline. Each layer reads from the previous and
writes to the Vault; nothing is held only in memory between layers, so any
layer can be replayed against the same inputs and produce the same outputs.

```
Layer 1 — Collection            (Playwright reads 7BOSS + 7REPORTS)
   ↓ writes raw_snapshots
Layer 2 — Data Entry            (Playwright writes back to 7BOSS)
   ↓ writes audit_log
Layer 3 — Computation           (Pure Python; reads + mutates ledger)
   ↓ writes payload_figures
Layer 4 — Report Generation     (Voice writer fills prose; Template renders HTML)
   ↓ writes reports
Layer 6 — Supervisor            (Verifies layers 1–4; may block publication)
   ↓ writes supervisor_status
Layer 5 — Delivery              (Portal + optional Gmail draft)
```

Layer 6 appears between Layer 4 and Layer 5 because verification is what
earns the right to publish. The numbering reflects the order it was added
to the spec, not the order of execution.

### Where the Vault sits

The Vault is the system of record. Each layer's outputs land in it before
the next layer begins. Tables (Phase 0 schema):

- `clients`, `stores`, `profiles` — who, where, plan tier
- `raw_snapshots` — Layer 1 output, one row per (store, business_date)
- `audit_log` — Layer 2 writebacks, immutable
- `invoice_ledger` — Layer 3 persistent state, mutated in place
- `runs` — one row per Engine execution, links every layer's output
- `reports` — Layer 4 output (payload JSON + rendered HTML path)
- `supervisor_findings` — Layer 6 output, linked to a run

---

## Business Date Rules

> ⚠️ **Critical — read before touching any date field.**

The 7-Eleven business day runs **7:00 AM to 6:59 AM the next calendar day.**

| If the run starts at... | Current business date is... | "Yesterday" (target date) is... |
|---|---|---|
| 7:00 AM on May 12 | May 12 | May 11 |
| 7:00 AM on May 1 | May 1 | April 30 |

Daily runs are scheduled to start at 7:00 AM in the store's local timezone.
At that moment the previous business day has just ended (6:59 AM). The
target date for the report is the **calendar day before the run starts.**

The Engine MUST:

1. Compute the target business date at run-start and freeze it for the
   duration of the run. Date drift mid-run is a bug.
2. Persist the target business date on the `runs` row so reruns and the
   Supervisor reference the same value.
3. On Screen 1.1 (Cash Summary), verify the displayed business date matches
   the expected target before collecting any data. Mismatch is a blocking
   error.

---

## Report Payload Contract

The Engine's job, ultimately, is to produce a payload conforming to the
canonical schema. Everything else is plumbing. The schema lives at:

- TypeScript (source of truth for shape): `src/lib/report-payload.ts`
- Python (validation rules): `schema/report_payload.py`

Key rules from the schema (full detail in the schema file itself):

- **Numbers are numbers, not strings.** `6537.97`, not `"$6,537.97"`. The
  template formats; the Engine computes.
- **Percentages are in percent units.** `10.7` means 10.7%, not 1070%.
- **Missing values are `null`, never `0` or `-1`.** Conflating zero with
  "not yet observed" is the bug we will not ship.
- **Money is rounded to 2 decimals at the Calculator's output boundary.**
  Floats are used internally; rounding happens once, at emission.
- **Figures and prose are structurally separate.** Each section has a
  `figures` block (from the Calculator) and a `prose` block (from the
  Voice writer). Prose may reference figures but may not invent or modify
  them. A post-Voice validator enforces this.

The schema version is part of the payload. When the shape changes, the
version bumps; old reports remain renderable by their original template
version.

---

## Layer 1 — Collection

> Each screen is visited **once.** Collect everything listed under that
> screen before moving on. Output is written to `raw_snapshots` as one JSON
> document keyed by `(store_id, business_date)`.

### Screen 1.1 — Cash Summary

**Path:** 7BOSS > Hamburger Menu > Cash Management > Cash Summary Process > Cash Summary
**Date:** target business date — double-click the date field, enter the
date, click Apply.
**Pre-flight check:** Displayed business date matches the run's target.
Mismatch aborts the run.

Collect:

- Deposit Adjustment Total $
- Sales Including Commissions Total $
- Commissions Total $
- Merchandise Sales Total $
- List of Commission Types with their Total $ _(click Commissions)_
- Volume Sales under Day Totals _(click Gas Sales)_

### Screen 1.2 — POS / Shift Worksheet

**Path:** 7BOSS > Cash Management > Cash Summary Process > POS / Shift Worksheet
**Date:** target business date — double-click the date field, enter the
date, click Apply.

Steps:

1. Click **Expand All** to reveal individual POS register rows under each
   shift.
2. For each shift, read each register's POS Over/Short column.
3. Hover over each employee avatar to reveal the full name via tooltip.

Collect, per shift (1, 2, 3):

- Variance amount per register (signed)
- Cashiers responsible (via hover tooltip; first name only — see
  _Name Matching_ in the appendix)

### Screen 1.3 — Write-Off Review (Transmitted)

**Path:** 7BOSS > Hamburger Menu > Inventory Management > Performance Reports > Write-Off Review > Transmitted
**Date:** Set Transmit Date to the target business date **literally**.
Surfaced entries will be stamped one calendar day earlier — this is
expected behavior, not an error.

Collect:

- Write-Off Extended Retail $ Total (from the Total Store row)
- Write-Off Extended Cost $ Total (from the Total Store row)

### Screen 1.4 — Electronic Journal

**Path:** 7BOSS > Hamburger Menu > Cash Management > Accountability > Electronic Journal
**Date:** target business date — double-click the date field, enter the
date, click Create Report.

The EJ uses AG-Grid with virtualized rendering. The Engine MUST follow this
loading sequence:

1. **Force full server-side load.** After Create Report renders, scroll the
   grid all the way to the bottom. This pulls every chunk from the server
   into the client-side cache. Wait for any "Loading…" rows to resolve
   before proceeding.
2. **Return to the top.** Scroll back to the top of the grid.
3. **Scroll-and-scan iteratively.** Walk the grid from top to bottom in
   steps of ~200–400 pixels. After each scroll, capture currently rendered
   rows from `.ag-center-cols-container .ag-row`. Use the `row-index`
   attribute as a unique key in an accumulator so duplicates don't get
   re-added.
4. **Backfill missed rows.** After the first pass, identify missing row
   indices and target-scroll to those positions. Repeat with smaller scroll
   deltas until the accumulator size matches the reported `Total
   transactions: N`.

> **DOM scraping is authoritative.** Do not intercept API calls or refresh
> the page during extraction. The reported `Total transactions: N` is the
> verification target.

#### Per-hour bucketing

Once all transactions are in the accumulator:

1. Group transactions into 24 hour bars (e.g., 7am on day D maps to bar 0;
   6:59am on day D+1 maps to bar 23).
2. **Out-of-range filter:** discard transactions before 7:00 AM on the
   business date or at/after 7:00 AM the next calendar day.

Per hour, collect:

- **Merchandise Sales per hour** — see _Merchandise Filtering_ below
- **Commissions per hour** — sum of commission line items per Cash
  Summary commission types
- **Employees working that hour** — distinct first names from EJ
  transactions, excluding Administrator and the store owner

#### Merchandise Filtering

Raw `SALE` transaction totals include sales tax, lottery/lotto sales, money
orders, prepaid cards, gift cards, financial services fees, and
inside-paid gas — none of which count as merchandise. To get true
merchandise sales per hour, the Engine MUST drill into each SALE
transaction's line items:

1. Programmatically expand each row via the expand chevron in the leftmost
   column (DOM toggle, not API).
2. Classify each line item:
   - **Merchandise** — taxable or non-taxable retail goods → INCLUDE
   - **Sales Tax** → EXCLUDE
   - **Lottery / Lotto sales (not commission)** → EXCLUDE
   - **Money Order purchases** → EXCLUDE
   - **Financial Services / Prepaid Card / Gift Card / Money Order Fee**
     → EXCLUDE (commissions captured separately)
   - **Gas (inside-paid)** → EXCLUDE (gas tracked separately)
3. Sum merchandise-classified line items per transaction, then aggregate
   per hour.

> **Validation:** Sum of `Merchandise Sales per hour` across all 24 hours
> MUST reconcile (within $0.01) to Cash Summary `Merchandise Sales Total $`
> from Screen 1.1. The Supervisor checks this in Layer 6.

### Screen 1.5 — DMR (Daily Merchandise Report)

**Path:** 7BOSS > Hamburger Menu > External Links > External Links > 7-Reports > 7-Reports (opens in a new tab) > Accept Terms & Conditions > Index Groups: Store Reports > Document Groups: Store Operator Reports > Document Names: DMR.D - DAILY MERCHANDISE REPORT (ASI)
**Date:** today's calendar date (both From and To) — not the target
business date. The DMR reports on activity processed today.

Steps:

1. Set From and To dates to today (run-start calendar date).
2. Save Search > Name: today's date > SAVE.
3. Open Navigation Menu > SAVED SEARCHES > open the search for today.
4. Open the DMR.

Collect:

- All vendor rows: Invoice #, Vendor Name, DMR Cost, DMR Retail
- The **"Merchandise Report Thru" date** shown on the DMR — used for ISR
  matching in Screen 1.6 Visit A.

### Screen 1.6 — Invoice Summary

**Path:** 7BOSS > Hamburger Menu > Inventory Management > Deliveries > Receiving > Invoice Summary

> **Caution:** The hamburger menu places "Inventory Management" and
> "Ordering" close together. Click Inventory Management — not Ordering.

#### Date picker behavior (Ant Design)

The Invoice Summary uses an Ant Design range picker. To set both From and
To to the same date:

1. Click the From date field once to open the picker.
2. Click the target date cell once (sets From).
3. Click the same date cell again (sets To).
4. Click **APPLY**.

If clicks don't register against the calendar cells, the Engine MUST fall
back to JavaScript dispatching `mousedown` + `mouseup` + `click` events on
`.ant-picker-cell-inner` matching the target day.

This screen requires two visits with different date settings.

---

**Visit A — ISR Collection**

- **Date:** the **"Merchandise Report Thru" date from the DMR** (Screen 1.5)
- **Collect:** all rows with an Invoice # — Invoice #, Vendor Name, ISR
  Cost, ISR Retail, Row Type (Self-Billing / Memo / Distribution)
- **Exclusion rule:** exclude rows that have NO Invoice # — these are pure
  memo/adjustment entries (Sale, WO, Lottery, Lotto, Gift, Financial, MO)
  from prior Layer 2 runs.
- **Memo rows WITH Invoice #** (e.g., FritoLay, McLane promotion) are
  INCLUDED in reconciliation.

---

**Visit B — Inventory by Hour**

- **Date:** target business date (both From and To)
- **Navigate:** Delivery Type > Invoice Summary Details > Checked-In View
- **Collect** for every row with an Invoice #: Vendor Name, Total Invoice
  Cost, Check-In Start time.
- For "Memo" rows with an Invoice # that have NO Check-In Start time:
  bucket into the **first hour of the shift their delivery date falls on.**
  (E.g., a memo dated 05/11 goes in the 7am–8am bar.)
- **Pre-7AM exclusion:** if a real (non-memo) delivery's Check-In Start
  falls before 7:00 AM on the business date's calendar day, it belongs to
  the prior business day — exclude entirely (it should have been captured
  in the previous run).

---

## Layer 2 — Data Entry

> Layer 2 writes back to the client's 7BOSS system. Errors here affect the
> client's bookkeeping, not just our report. The Engine MUST treat every
> write as auditable and idempotent.

### Idempotency contract

Every write the Engine performs is recorded in `audit_log` with an
idempotency key derived from `(store_id, business_date, screen, action,
payload_hash)`. Before performing any write, the Engine checks the audit
log:

- **No prior record:** perform the write, then log it.
- **Prior record with status = success:** skip the write (already done).
- **Prior record with status = failed:** retry, then update the log.
- **Prior record with status = in_progress:** abort the run — a previous
  run hung mid-write. Manual review required.

This makes reruns safe: replaying a Layer 2 sequence after a partial
failure picks up exactly where the previous attempt stopped.

### Screen 2.1 — Lotto / Scratch Lottery Worksheet

**Path:** 7BOSS > Hamburger Menu > Cash Management > Cash Summary Process > Lotto / Scratch Lottery Worksheet
**Date:** target business date

For all shifts, copy each POS value into its corresponding Physical field:

- POS Sales (Lotto) → Physical Sales (Lotto)
- POS Wins (Lotto) → Physical Wins (Lotto)
- POS Wins (Scratch Lottery) → Physical Wins (Scratch Lottery)

SAVE.

### Screen 2.2 — Cash Summary

**Path:** 7BOSS > Hamburger Menu > Cash Management > Cash Summary Process > Cash Summary
**Date:** target business date

- Enter Deposit Adjustment Total $ into **Deposits / Change Fund > Total Deposit $**
- SAVE

### Screen 2.3 — Invoice Summary (Memo Entries)

**Path:** 7BOSS > Hamburger Menu > Inventory Management > Deliveries > Receiving > Invoice Summary
**Date:** target business date (both From and To)

Click **Action > Add Memo Entry** and add the following memos in order.
Click **ADD ANOTHER** between every entry. Click **SAVE** only on the final
entry.

| Order | Vendor Name | Total Invoice Cost | Total Invoice Retail |
|---|---|---|---|
| 1 per type | _(one entry per Commission Type — iterate through all)_ | blank | Commission Type's Total $ **(positive)** |
| 2 | Sales | blank | Sales Including Commissions **(negative)** |
| 3 (final) | Write-Off | Write-Off Extended Cost $ Total **(negative)** | Write-Off Extended Retail $ Total **(negative)** |

> **Sign rules:**
> - Commission → Retail: POSITIVE
> - Sale → Retail: NEGATIVE
> - Write-Off → Cost: NEGATIVE, Retail: NEGATIVE

> **Field fallback:** If the Total Invoice Retail field doesn't respond
> to `form_input`, the Engine MUST fall back to click → type.

---

## Layer 3 — Computation & Reconciliation

> All math happens in the **Calculator** — pure Python, no language model
> involvement. The Calculator reads `raw_snapshots` and `invoice_ledger`
> from the Vault, computes the payload's `figures` blocks, mutates the
> ledger, and writes everything back.

### Per-hour formulas

For each of the 24 hour bars:

| Component | Formula |
|---|---|
| Merchandise Sales per hour | Sum of filtered merchandise line items (from EJ — see Screen 1.4 _Merchandise Filtering_) |
| Commissions per hour | Sum of commission-type line items for that hour (from EJ) |
| Gas Commissions per hour | (Volume Sales × 0.015) ÷ 24 |
| **Sales per hour** | Merchandise Sales per hour + Commissions per hour + Gas Commissions per hour |
| Inventory per hour | Sum of Total Invoice Cost for all qualifying deliveries assigned to that hour bar (see Screen 1.6 Visit B). If no deliveries, 0. |
| Royalty per hour | (Merchandise Sales per hour − Inventory per hour) × 0.54 |
| Labor per hour | Sum of hourly rates of distinct employees who rang at least one transaction in that hour (exclude weekly bonuses, Administrator, and store owner). If no eligible employees, $0 — do not floor. |
| Maintenance per hour | ($3,000 ÷ days in current month) ÷ 24 |
| **Costs per hour** | Inventory + Royalty + Labor + Maintenance |
| **Profit per hour** | Sales per hour − Costs per hour |

> The `$3,000` maintenance baseline is per-store configurable, defaulting
> to $3,000/month. Per-store overrides live on the `stores` table.

### Daily totals

| Total | Formula |
|---|---|
| **Sales (daily)** | Sum of Sales per hour across all 24 hours |
| **Costs (daily)** | Sum of Costs per hour across all 24 hours |
| **Profit (daily)** | Sales (daily) − Costs (daily) |

### Shift variance & severity

For each of the three shifts, compute the variance from the per-register
POS Over/Short values (Screen 1.2). Severity is classified by absolute
value:

| Absolute variance | Severity |
|---|---|
| ≤ $5.00 | within |
| $5.01 – $50.00 | mild |
| $50.01 – $100.00 | moderate |
| > $100.00 | severe |

Thresholds are per-store configurable; the defaults above apply unless a
store overrides them on the `stores` table.

### ISR / DMR Reconciliation — Ledger-backed logic

Reconciliation uses the persistent `invoice_ledger` table. It is not a
single-day match — it carries unmatched invoices across runs so timing
differences self-resolve.

#### Invoice key normalization

For every invoice number from either ISR or DMR, derive a normalized
**key** = the longest run of trailing digits (strip trailing non-digit
suffix like `FL`, `P`). If the trailing digit run is fewer than 4 digits,
use the full invoice string as the key.

Examples:

- `398533401618` → `398533401618`
- `0003401618` → `0003401618`
- `59912159FL` → `59912159`
- `2600006504-0003401608` → `0003401608`

Two keys "match" when the longer key's last 4+ digits equal the shorter
key, OR they share a common trailing suffix of 4+ digits that is
unambiguous in the current ledger context.

#### Ledger row shape

The `invoice_ledger` table mirrors what was previously a JSON file. One
row per ledger entry, scoped by `store_id`:

```
store_id            uuid (FK)
key                 text  (normalized invoice key)
isr_vendor          text  | null
isr_invoice         text  | null
isr_cost            numeric(12,2) | null
isr_retail          numeric(12,2) | null
isr_date            date  | null
isr_first_seen_run  uuid  | null
isr_last_seen_run   uuid  | null
dmr_vendor          text  | null
dmr_invoice         text  | null
dmr_cost            numeric(12,2) | null
dmr_retail          numeric(12,2) | null
dmr_thru_date       date  | null
dmr_first_seen_run  uuid  | null
dmr_last_seen_run   uuid  | null
status              text  (see below)
first_seen          date
last_updated        timestamptz
days_pending        int
```

#### Status state machine

- `matched` — both sides present, ISR cost = DMR cost AND ISR retail = DMR retail
- `mismatched` — both sides present, one or both values differ
- `isr_pending_dmr` — ISR side only, DMR not yet seen
- `dmr_pending_isr` — DMR side only, ISR not yet seen
- `resolved` — was previously pending or mismatched, now reconciled in this run
- `stale` — pending more than 7 days

Transitions:

```
(new ISR row)  →  isr_pending_dmr
(new DMR row)  →  dmr_pending_isr
isr_pending_dmr + DMR arrives, values agree     → matched (and resolved this run)
isr_pending_dmr + DMR arrives, values disagree  → mismatched
dmr_pending_isr + ISR arrives, values agree     → matched (and resolved this run)
dmr_pending_isr + ISR arrives, values disagree  → mismatched
mismatched + values now agree (one side updated) → matched (and resolved this run)
any pending state untouched for 7+ days          → stale
```

#### Per-run logic

1. **Load** all ledger rows for this store at the start of Layer 3.
2. For each ISR row collected this run:
   - Compute its key.
   - Look up the entry. If found, update the ISR block (refresh values,
     bump `isr_last_seen_run`). If not found, create with status =
     `isr_pending_dmr`, `first_seen = today`.
   - If the entry already had DMR values, re-evaluate status.
3. For each DMR row collected this run:
   - Compute its key.
   - Look up the entry. If found, update the DMR block. If not found,
     create with status = `dmr_pending_isr`.
   - If the entry already had ISR values, re-evaluate status.
4. For every entry not touched this run, increment `days_pending` and
   downgrade to `stale` if it exceeds 7 days.
5. **Save** all mutations within a single transaction.

#### What appears in the report

The Engine includes in the payload:

- Up to N most recent `matched` rows (default 20; configurable per store)
- All `mismatched` rows
- All `isr_pending_dmr` and `dmr_pending_isr` rows
- All `stale` rows
- All entries whose status flipped to `resolved` this run (rendered as a
  "Resolved this run" callout)

### Payload assembly

Once all the above is computed, the Calculator assembles the `figures`
blocks of the payload. The `prose` blocks remain empty at this stage —
Layer 4 fills them. The Calculator's output is validated against
`DailyReportPayload` (see schema) before being passed to Layer 4. A
validation failure aborts the run.

---

## Layer 4 — Report Generation

Layer 4 has two sub-components.

### 4.1 — The Voice writer

The Voice writer reads the Calculator's payload and fills in the `prose`
blocks. It does this by calling the Anthropic API with:

- A system prompt encoding the brand voice spec (see brand spec Part 13).
- The full payload as immutable context, with explicit instruction that no
  number may be invented, modified, or omitted.
- The specific prose field being filled (one of the five allowlisted
  paths — see `VOICE_FILLABLE_FIELDS` in the schema).

The Voice writer fills exactly these fields and nothing else:

- `executive_summary.prose.summary_note`
- `variance_summary.prose.intro_note`
- `delivery_reconciliation.prose.intro_note`
- `delivery_reconciliation.prose.flagged_notes` (one note per flagged row)
- `profit_loss.prose.intro_note`

#### Post-Voice validation

After the Voice writer returns, the Engine MUST:

1. Re-validate the payload against `DailyReportPayload`.
2. Diff against the pre-Voice payload. Any change outside
   `VOICE_FILLABLE_FIELDS` is a hard error — the run aborts and the
   Supervisor is notified.
3. For each numeric value mentioned in the generated prose, verify it
   matches a corresponding value in the payload (to 2dp). Numbers in
   prose that don't appear in the payload are a hard error.

### 4.2 — The Template renderer

The Template renderer takes the completed payload and produces the final
HTML report. The template is the one in the brand spec (the locked
`DailyExecutiveReportSampleDark.html` / `…Light.html` shape).

The Template renderer does NOT:

- Make formatting decisions outside what the brand spec defines
- Reinterpret any field of the payload
- Generate any text not present in the payload

The renderer's job is mechanical: bind payload fields to template slots,
apply brand-spec formatting (currency display, percent display, severity
colors, etc.), produce HTML.

### Output

The completed report is stored in two forms:

- The payload JSON in the `reports.payload` column
- The rendered HTML at `reports.file_path` (in Supabase Storage)

Storing both means we can re-render any old report with a new template
version without re-running Layers 1–3.

---

## Layer 6 — Supervisor

> The Supervisor is the last gate before Portal publication. No report
> reaches the client unless the Supervisor signs off. The Supervisor is its
> own component, not a method on any other layer's class — it must be able
> to operate on a completed run independently.

### Why Layer 6 exists

Layers 1 through 4 do their best work, but:

- Layer 1 might miss rows (AG-Grid virtualization gotchas, network
  hiccups).
- Layer 2 might leave 7BOSS in a half-saved state if a sequence aborts
  mid-write.
- Layer 3 formulas can compound small data quality issues into large
  visible errors.
- Layer 4's Voice writer can, despite the post-Voice validator, produce
  prose that is technically valid but misleading.

The Supervisor's job is to catch these before the client sees the report.
It also generates the trust gradient the human owner needs to eventually
step back from review-every-day to review-when-flagged.

### Three tiers of check, escalating in cost

#### Tier 1 — Internal assertions (free; always run)

Run on every layer's output. Cost is just a few CPU milliseconds.

Layer 1 assertions:

- Every screen named in this spec produced a non-empty result.
- EJ row count in the accumulator matches the reported
  `Total transactions: N` displayed on the page.
- Sum of EJ merchandise sales per hour reconciles within $0.01 to the
  Cash Summary Merchandise Sales Total.
- All employees referenced in EJ transactions exist in the store's pay
  reference table (else flag the unknown employee).

Layer 3 assertions:

- Sum(Sales per hour over 24 hours) equals Sales (daily) within $0.01.
- Sum(Costs per hour over 24 hours) equals Costs (daily) within $0.01.
- Sales (daily) − Costs (daily) equals Profit (daily) within $0.01.
- No ledger entry has `last_seen_run` older than 7 days unless its status
  is `stale`.
- Every flagged delivery row in the payload has a corresponding entry in
  `flagged_notes`.

Layer 4 assertions:

- Payload validates against `DailyReportPayload` (already checked by
  Layer 4 itself; Supervisor verifies the check actually ran).
- Pre-Voice and post-Voice payloads differ only at paths in
  `VOICE_FILLABLE_FIELDS`.
- Every number appearing in prose matches a value in the payload to 2dp.
- Rendered HTML file exists and is non-empty.

#### Tier 2 — External re-reads (moderate cost; after Layer 2 only)

The one place external verification earns its keep is after Layer 2,
because Layer 2's writes affect the client's system. The Supervisor:

1. Re-opens 7BOSS > Invoice Summary > target business date (same screen
   Layer 2 wrote to).
2. Confirms every memo entry recorded in `audit_log` for this run is
   present in the page, with the expected vendor name, cost, and retail
   values.
3. Flags any missing or differently-valued entries.

The Supervisor does NOT re-scrape the EJ, the Cash Summary, the DMR, or
the Invoice Summary Visit B data. Those are read-only screens — if Layer
1 scraped them wrong, re-scraping won't tell us anything new without a
ground-truth source we don't have.

#### Tier 3 — Heuristic checks (cheap; informational only)

These don't block but they flag patterns worth noticing:

- Daily profit changed by more than 25% from the rolling 7-day average.
- A shift has variance > $100 (severity = severe).
- A single delivery row has been pending more than 5 days (close to
  staleness).
- The Engine made more than N API calls or took longer than M minutes for
  a single run (cost or duration alarm).

Tier 3 findings go into `supervisor_findings` as `info` rows but do not
affect publication.

### Failure routing

Every finding is one of:

- **`blocking`** — the run is not published. The report goes to a
  "needs review" queue visible only to the owner. An email alert is sent.
  The Portal shows no new report for the affected client.
- **`warning`** — the report IS published, but with a Supervisor-warning
  badge on the Portal row. The badge text describes the warning.
- **`info`** — logged only. No visible effect.

The default classification is conservative:

- Any Tier 1 hard assertion fails → `blocking`.
- Any Tier 2 re-read mismatch → `blocking`.
- Tier 3 patterns → `warning` (if it might mislead the client) or `info`
  (if it just notes a notable day).

### Operating principle

The Supervisor is a defense in depth, not a substitute for correct upstream
code. If the Supervisor is regularly catching the same class of error, the
fix belongs in the upstream layer — not in the Supervisor's check list.

---

## Layer 5 — Delivery

### Portal (primary channel)

When the Supervisor signs off, the Engine publishes the report to the
Portal by updating the `reports` row's `supervisor_status` to one of
`passed` or `passed_with_warnings`. The Portal queries reports by
`store_id` for the logged-in client and renders the report from the
stored HTML.

Clients only see reports with `supervisor_status` in (`passed`,
`passed_with_warnings`). Blocked reports stay in the owner's review queue.

### Email (secondary channel, optional)

If the client has `email_delivery_enabled = true`, the Engine also creates
a Gmail draft addressed to the client's report delivery email, with:

- Subject: `[Client Name] [Store Number] — Daily Report — [date]`
- Body: short plaintext + Gmail-friendly inline HTML summary
- Attachment: the rendered HTML report

**The Engine never auto-sends.** Drafts wait in the owner's Gmail for
manual send. This is intentional during Phase 6 trust-building; the policy
will be revisited in Phase 8.

---

## Cross-cutting concerns

### Client configuration

All per-client data lives in the Vault, not in code. The Engine reads it
at run-start:

- `clients` — client metadata, plan, delivery preferences
- `stores` — store number, timezone, maintenance baseline, severity
  thresholds (if overriding defaults)
- `store_employees` — pay reference sheet (name, hourly rate, weekly
  bonus, weekly-only flag, exclude-from-labor flag)
- `store_shifts` — shift definitions (if overriding the default
  7am/3pm/11pm boundaries)

Nothing in this spec hardcodes "Store 19775" or "Nawazish Malik." Both
appear only as the example client for illustrative purposes.

### Name matching

Match employee names on **first name only.** "Jordan" and "Jordan
Owensby" are the same person. The matching is case-insensitive and
whitespace-tolerant. Unrecognized first names raise a Tier 1 Supervisor
warning.

### Exclusions

Per the pay reference sheet for each store:

- Accounts marked `excluded_from_labor` (typically Administrator, store
  owner) — excluded from all labor calculations.
- Employees with `hourly_rate = 0` and `weekly_bonus > 0` — remain in the
  cashier roster on the shift card but contribute $0 to per-hour labor
  cost (their bonus is applied in weekly reports only).
- EJ transactions outside the business day window — discarded (covered in
  Screen 1.4 _Out-of-range filter_).

### Run identifiers

Every run has a UUID `run_id` assigned at run-start. The `run_id` appears
in:

- The `runs` row
- Every `audit_log` entry for the run's writebacks
- The `reports.run_id` foreign key
- The `supervisor_findings.run_id` foreign key
- Every log line emitted during the run

This is the system's audit thread — any anomaly observed in the Portal
can be traced backwards to the exact set of inputs and decisions that
produced it.

### Secrets

The Engine needs:

- 7BOSS credentials (per store)
- 2FA secret or relay mechanism (per store; see Phase 5 2FA strategy)
- Supabase service role key
- Anthropic API key
- Gmail OAuth tokens (per client receiving email delivery)

None of these live in this document, in the repo, or in any
`NEXT_PUBLIC_*` environment variable. They live in:

- Vercel environment variables (production runtime)
- A local `.env.local` file (development; gitignored)
- A secrets manager (TBD — likely 1Password or AWS Secrets Manager) for
  per-client 7BOSS credentials

### Observability

Every run emits structured logs keyed by `run_id`. Logs include:

- Layer entry and exit timestamps
- Screen-level timings (collection layer)
- Anthropic API token usage (Voice writer)
- Supervisor findings (every one, regardless of severity)
- Any error and its stack trace

The owner has access to a run dashboard showing recent runs, statuses,
durations, and findings. Clients do not see this; they see only their
published reports.

---

## Appendix A — Implementation pointers

The components named throughout this spec map to the following
high-level architectural pieces. File-level structure is owned by the
Engine codebase and is not pinned here:

- **The Collector** — owns Layer 1. Playwright-based.
- **The Writeback Agent** — owns Layer 2. Playwright-based; tightly
  coupled to the audit log.
- **The Calculator** — owns Layer 3. Pure Python.
- **The Voice writer** — owns the prose half of Layer 4. Calls the
  Anthropic API.
- **The Template renderer** — owns the rendering half of Layer 4.
- **The Supervisor** — owns Layer 6.
- **The Delivery dispatcher** — owns Layer 5.

These names are part of the system's design vocabulary. They appear in
this document, in code comments, and in commit messages. They are
stable across refactors.

## Appendix B — Open questions for v5

- Weekly and monthly report payloads — schemas to be defined when Phase 6
  ends and the weekly tier launches.
- 2FA strategy for unattended runs — TBD pending Phase 5 architectural
  decision.
- Multi-timezone support — current spec assumes store-local time end to
  end; add explicit timezone handling when onboarding a store outside
  the original client's timezone.
- Cost cap per run — at what API spend does a single run abort? TBD.
- Per-client report customization — should clients on different plan
  tiers see different sections? Currently the schema's `meta.plan`
  field is collected but not yet acted on.

---

_End of specification._
