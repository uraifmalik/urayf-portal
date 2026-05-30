# 7-Eleven Engine Specification (Playbook v5)

**Version:** v5
**Status:** Active specification — the Engine implements this document.
**Audience:** Engineers building the urayf Engine.
**Supersedes:** v4 (which reframed v3 for the Engine but assumed a single fixed
daily report). v5 introduces multi-cadence reports (daily / weekly / monthly)
and client-customizable widget layouts.
**Last Updated:** _to fill in on commit_

---

## What changed from v4

v4 assumed one report shape: a fixed daily report with four fixed sections.
v5 replaces that with a **platform** model:

- **Three cadences.** Daily, weekly, and monthly reports, each built from the
  same underlying daily data.
- **Widgets, not fixed sections.** Clients assemble their own reports from a
  catalog of widgets, arranged on a 12-column grid. See _Layer 4_ and
  _Appendix A_.
- **Computation decoupled from presentation.** The Calculator computes the
  full set of metrics for a cadence (the _metric catalog_). The client's
  layout decides which metrics become visible widgets. The Calculator does
  not know or care what the client chose to display.
- **One renderer, three surfaces.** Report rendering is React code that lives
  in the Portal, used by the layout editor, the preview, and the Engine's
  headless render step alike. The Engine does not re-implement rendering.
- **Aggregation windows.** Weekly = Monday–Sunday; Monthly = calendar month.
  Both are rolled up from stored daily snapshots — never re-scraped.

What did NOT change: Layers 1 (collection), 2 (writeback), and the core
per-hour formulas in Layer 3 are carried forward from v4 essentially intact.
The 7BOSS/7REPORTS screens, the DOM quirks, the ledger logic, the business-date
rules — all still accurate.

---

## Core principle: daily data is the atom

Every report at every cadence is built from **daily snapshots.** A weekly
report is seven daily snapshots aggregated; a monthly report is a calendar
month of them. This has three consequences that shape the whole system:

1. **Collection (Layer 1) and writeback (Layer 2) run every business day**,
   for every active store, regardless of which report cadences the client is
   subscribed to. The daily snapshot is the raw material for all three
   cadences.

2. **Weekly and monthly reports are never scraped.** They are computed by
   aggregating the daily snapshots already in the Vault. If the snapshots
   exist, the aggregate can be produced; if a daily snapshot is missing, any
   aggregate covering that day has a hole the Supervisor must catch.

3. **A report's window must be complete before it generates.** A Monday–Sunday
   weekly report runs early Monday morning (after Sunday's snapshot lands). A
   calendar-month report runs on the 1st (after the final day's snapshot
   lands).

---

## Architecture overview

```
Layer 1 — Collection            (Playwright reads 7BOSS + 7REPORTS) — DAILY
   ↓ writes raw_snapshots
Layer 2 — Data Entry            (Playwright writes back to 7BOSS) — DAILY
   ↓ writes audit_log
Layer 3 — Computation           (Pure Python — the Calculator)
   ↓ writes metric sets + mutates ledger
Layer 4 — Report Generation     (Layout + payload → React renderer → HTML/PDF)
   ↓ writes reports
Layer 6 — Supervisor            (Verifies layers 1–4; gates Layer 5)
   ↓ writes supervisor_findings
Layer 5 — Delivery              (Portal + optional Gmail draft)
```

Layers 1 and 2 are **daily and cadence-independent.** Layers 3 through 6 run
**per report**, which means they may run for multiple cadences on the same
morning (e.g., the 1st of a month that is also a Monday triggers daily, weekly,
AND monthly reports — all from the same accumulated snapshots).

### The three data artifacts

v5 separates what v4 conflated into a single payload:

| Artifact | Owns | Written by | Read by |
|---|---|---|---|
| **Catalog** | the universe of available widgets | us (static + secret bank) | Portal editor, Engine |
| **Layout spec** | which widgets, where, per (client, cadence, [store]) | Portal editor | Engine, renderer |
| **Payload** | the computed metric values for one run | Engine (Calculator) | renderer |

The renderer combines a layout spec and a payload to produce a report. Neither
the layout nor the payload alone is a report; the report is their composition.

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
| Snapshot | One business day's collected raw data for one store. The atom. |
| Cadence | daily, weekly, or monthly. |
| Window | The date range a report covers. Daily = one day. Weekly = Mon–Sun. Monthly = calendar month. |
| Widget | One displayable unit on a report. An instance of an archetype bound to (cadence, metric, scope). |
| Archetype | One of six widget kinds: note, stat_card, card_set, ledger, pl_graph, trend_chart. |
| Metric | A computed value (e.g. "shift 2 sales"). Widgets bind to metrics; the Calculator produces them. |
| Catalog | The full set of available widgets. |
| Layout spec | A client's chosen arrangement of widgets for one cadence. |
| Payload | The Calculator's computed metric values for one run. |
| Ledger | Persistent ISR/DMR reconciliation state in the Vault. |
| Run | One execution of Layers 3–6 producing one report for one (store, cadence, window). |
| Engine | The software implementing this spec. |
| Calculator / Voice writer / Renderer / Supervisor | The named components — see Appendix B. |
| Vault | The Supabase Postgres database. |

---

## Business Date Rules

> ⚠️ **Critical — read before touching any date field.**

The 7-Eleven business day runs **7:00 AM to 6:59 AM the next calendar day**, in
the store's local timezone (`stores.timezone`).

| If the daily run starts at... | Current business date | Target ("yesterday") |
|---|---|---|
| 7:00 AM on May 12 | May 12 | May 11 |
| 7:00 AM on May 1 | May 1 | April 30 |

The daily collection run is scheduled for 7:00 AM store-local. At that moment
the previous business day has just closed (6:59 AM), so the target business
date is the calendar day before the run.

The Engine MUST:
1. Compute the target business date at run-start and freeze it for the run.
2. Persist it on the `runs` row.
3. Verify the displayed business date on Screen 1.1 matches before collecting.
   Mismatch aborts the run.

### Window rules for aggregated cadences

| Cadence | Window | Generates |
|---|---|---|
| Daily | The single target business date | Morning after the business day |
| Weekly | Monday 00:00 – Sunday business-day-end | Early Monday, after Sunday's snapshot |
| Monthly | 1st – last calendar day of the month | On the 1st, after the final day's snapshot |

Weekly and monthly windows are fixed (Mon–Sun, calendar month). Per-client
window overrides are an explicit non-goal for v5 — see Appendix C.

---

## Client & Plan Model

Plan tiers gate which cadences — and therefore which widgets — a client can use:

| Plan | Receives | Can pick widgets from |
|---|---|---|
| The Monthly | Monthly reports | Monthly catalog |
| The Weekly | Weekly + Monthly reports | Weekly + Monthly catalogs |
| The Daily | Daily + Weekly + Monthly reports | All catalogs |

All per-client configuration lives in the Vault, never in code:
- `clients` — metadata, plan, delivery preferences
- `stores` — store number, timezone, maintenance baseline, severity thresholds
- `store_employees` — pay reference (name, hourly rate, weekly bonus, flags)
- `store_shifts` — shift definitions (default 7am / 3pm / 11pm boundaries)
- `layouts` — per (client, cadence, [store]) widget arrangement (see Layer 4)

Nothing in this spec hardcodes "Store 19775" or "Nawazish Malik"; they appear
only as the illustrative example client.

---

## Layer 1 — Collection (daily, cadence-independent)

> Runs every business day for every active store. Each screen is visited
> **once.** Output is one immutable `raw_snapshots` row per (store,
> business_date). Unchanged from v4 except for the explicit note that it is
> cadence-independent: we collect daily data always, and weekly / monthly
> reports are built from the accumulated snapshots, never from a separate
> scrape.

### Screen 1.1 — Cash Summary
**Path:** 7BOSS > Hamburger Menu > Cash Management > Cash Summary Process > Cash Summary
**Date:** target business date — double-click the date field, enter the date, click Apply.
**Pre-flight:** displayed business date matches the run's target, else abort.

Collect:
- Deposit Adjustment Total $
- Sales Including Commissions Total $
- Commissions Total $
- Merchandise Sales Total $
- Commission Types with their Total $ *(click Commissions)*
- Volume Sales under Day Totals *(click Gas Sales)*

### Screen 1.2 — POS / Shift Worksheet
**Path:** 7BOSS > Cash Management > Cash Summary Process > POS / Shift Worksheet
**Date:** target business date.

Steps:
1. Click **Expand All** to reveal individual POS register rows under each shift.
2. For each shift, read each register's POS Over/Short column.
3. Hover over each employee avatar to reveal the full name via tooltip.

Collect per shift (1, 2, 3): signed variance per register; cashiers responsible
(first name only — see _Name Matching_, Appendix B).

### Screen 1.3 — Write-Off Review (Transmitted)
**Path:** 7BOSS > Hamburger Menu > Inventory Management > Performance Reports > Write-Off Review > Transmitted
**Date:** Transmit Date = target business date (literal). Surfaced entries are
stamped one calendar day earlier — expected, not an error.

Collect: Write-Off Extended Retail $ Total and Write-Off Extended Cost $ Total
(from the Total Store row).

### Screen 1.4 — Electronic Journal
**Path:** 7BOSS > Hamburger Menu > Cash Management > Accountability > Electronic Journal
**Date:** target business date — double-click date field, enter date, Create Report.

The EJ uses AG-Grid with virtualized rendering. The Engine MUST:

1. **Force full load.** After Create Report, scroll to the bottom to pull all
   chunks from the server. Wait for "Loading…" rows to resolve.
2. **Return to top.**
3. **Scroll-and-scan** in ~200–400px steps, capturing `.ag-center-cols-container
   .ag-row` into an accumulator keyed by `row-index` (dedupe).
4. **Backfill** missed indices with smaller scroll deltas until the accumulator
   size matches the reported `Total transactions: N`.

> DOM scraping is authoritative. Do not intercept API calls or refresh during
> extraction. `Total transactions: N` is the verification target (checked by
> the Supervisor).

#### Per-hour bucketing
Group transactions into 24 hour bars (7am day D = bar 0; 6:59am day D+1 = bar
23). Discard transactions outside the business-day window.

Per hour collect: merchandise sales (see filtering below), commissions per the
Cash Summary commission types, and the distinct employees who rang
transactions (excluding Administrator and the store owner).

#### Merchandise Filtering
Raw SALE totals include non-merchandise. Drill into each SALE transaction's
line items and classify:
- Merchandise (taxable / non-taxable retail goods) → INCLUDE
- Sales Tax → EXCLUDE
- Lottery / Lotto sales → EXCLUDE
- Money Order purchases → EXCLUDE
- Financial Services / Prepaid Card / Gift Card / MO Fee → EXCLUDE
- Gas (inside-paid) → EXCLUDE

Sum merchandise line items per transaction, then aggregate per hour.

> Validation: Σ(merchandise sales per hour) reconciles within $0.01 to Cash
> Summary Merchandise Sales Total. Supervisor checks this.

### Screen 1.5 — DMR (Daily Merchandise Report)
**Path:** 7BOSS > … > External Links > 7-Reports (new tab) > Accept T&C >
Index Groups: Store Reports > Document Groups: Store Operator Reports >
Document Names: DMR.D - DAILY MERCHANDISE REPORT (ASI)
**Date:** today's calendar date (From and To) — the DMR reports on activity
processed today.

Steps: set From/To to today; Save Search named today's date; open it via
Navigation Menu > Saved Searches; open the DMR.

Collect: all vendor rows (Invoice #, Vendor Name, DMR Cost, DMR Retail) and the
"Merchandise Report Thru" date (used for ISR matching in Screen 1.6 Visit A).

### Screen 1.6 — Invoice Summary
**Path:** 7BOSS > Hamburger Menu > Inventory Management > Deliveries > Receiving > Invoice Summary

> Caution: click Inventory Management, not the nearby Ordering.

Ant Design range picker: click the From field once (opens picker), click the
target date cell once (sets From), click it again (sets To), click APPLY. If
clicks don't register, dispatch `mousedown`+`mouseup`+`click` on
`.ant-picker-cell-inner` for the target day.

**Visit A — ISR Collection.** Date = the DMR's "Merchandise Report Thru" date.
Collect all rows WITH an Invoice #: Invoice #, Vendor Name, ISR Cost, ISR
Retail, Row Type. Exclude rows with NO Invoice # (pure memo/adjustment entries
from prior Layer 2 runs). Memo rows WITH an Invoice # are included.

**Visit B — Inventory by Hour.** Date = target business date. Navigate Delivery
Type > Invoice Summary Details > Checked-In View. Collect every row with an
Invoice #: Vendor Name, Total Invoice Cost, Check-In Start. Memo rows with an
Invoice # and no Check-In Start → bucket into the first hour of the shift their
delivery date falls on. Real deliveries with Check-In Start before 7:00 AM →
belong to the prior business day, exclude.

---

## Layer 2 — Data Entry (daily, cadence-independent)

> Writes back to the client's 7BOSS system every business day. Errors here
> affect the client's bookkeeping, not just our reports. Every write is
> auditable and idempotent. Carried forward from v4 intact.

### Idempotency contract
Every write is recorded in `audit_log` with an idempotency key derived from
`(store_id, business_date, screen, action, payload_hash)`. Before any write,
check the log:
- No record → perform, then log.
- `success` → skip (already done).
- `failed` → retry, update log.
- `in_progress` → abort the run; a prior run hung mid-write. Manual review.

### Screen 2.1 — Lotto / Scratch Lottery Worksheet
**Date:** target business date. For all shifts, copy each POS value into its
Physical field: POS Sales (Lotto) → Physical Sales (Lotto); POS Wins (Lotto) →
Physical Wins (Lotto); POS Wins (Scratch) → Physical Wins (Scratch). SAVE.

### Screen 2.2 — Cash Summary
**Date:** target business date. Enter Deposit Adjustment Total $ into Deposits /
Change Fund > Total Deposit $. SAVE.

### Screen 2.3 — Invoice Summary (Memo Entries)
**Date:** target business date. Action > Add Memo Entry; click ADD ANOTHER
between entries; SAVE only on the final one.

| Order | Vendor Name | Total Invoice Cost | Total Invoice Retail |
|---|---|---|---|
| one per type | (one per Commission Type) | blank | Commission Type's Total $ (positive) |
| then | Sales | blank | Sales Including Commissions (negative) |
| final | Write-Off | Write-Off Extended Cost $ (negative) | Write-Off Extended Retail $ (negative) |

> Sign rules: Commission → Retail POSITIVE. Sale → Retail NEGATIVE. Write-Off →
> Cost NEGATIVE, Retail NEGATIVE.
> Field fallback: if Total Invoice Retail won't accept programmatic input, fall
> back to click → type.

---

## Layer 3 — Computation & Reconciliation

> All math happens in the **Calculator** — pure Python, no language model, no
> I/O. The Calculator reads snapshots and ledger from the Vault (via the Engine
> wrapper), computes metrics, mutates the ledger, and returns the payload.
>
> v5's central change: the Calculator computes **the full metric catalog for a
> cadence**, not a fixed report. Which metrics become visible widgets is the
> layout's concern (Layer 4), not the Calculator's.

### 3.0 — Cadence and window resolution

A Layer 3 run is parameterized by (store, cadence, window):

- **Daily:** window = the target business date. Reads one snapshot.
- **Weekly:** window = the Mon–Sun containing the just-completed Sunday. Reads
  up to 7 snapshots.
- **Monthly:** window = the just-completed calendar month. Reads up to ~31
  snapshots.

> **Completeness precondition.** Before computing an aggregated cadence, the
> Calculator records which business dates in the window have snapshots and
> which are missing. Missing days do not abort computation, but they are
> attached to the payload as `coverage` metadata and the Supervisor decides
> whether the gap is publishable (see Layer 6).

### 3.1 — Per-hour formulas (daily atom)

For each of the 24 hour bars of a single business day:

| Component | Formula |
|---|---|
| Merchandise Sales / hr | Σ filtered merchandise line items (EJ) |
| Commissions / hr | Σ commission-type line items for the hour (EJ) |
| Gas Commissions / hr | (Volume Sales × 0.015) ÷ 24 |
| **Sales / hr** | Merchandise + Commissions + Gas Commissions |
| Inventory / hr | Σ Total Invoice Cost of deliveries assigned to the hour (else 0) |
| Royalty / hr | (Merchandise Sales / hr − Inventory / hr) × 0.54 |
| Labor / hr | Σ hourly rates of distinct employees who rang in the hour (exclude weekly-bonus-only, Administrator, owner; $0 if none) |
| Maintenance / hr | (monthly maintenance baseline ÷ days in month) ÷ 24 |
| **Costs / hr** | Inventory + Royalty + Labor + Maintenance |
| **Profit / hr** | Sales / hr − Costs / hr |

Maintenance baseline defaults to $3,000/month, per-store overridable
(`stores.maintenance_monthly_baseline`).

### 3.2 — Daily totals and shift rollups

- **Daily Sales / Costs / Profit** = Σ of the respective per-hour values across
  all 24 bars.
- **Per-shift Sales / Costs / Profit** = Σ over that shift's 8 hour bars
  (Shift 1 = bars 0–7, Shift 2 = bars 8–15, Shift 3 = bars 16–23).
- **Per-shift / daily margin** = Profit ÷ Sales × 100.

### 3.3 — Variance and severity (daily)

Per shift, variance = Σ of per-register POS Over/Short. Severity by absolute
value (per-store overridable thresholds):

| |variance| | Severity |
|---|---|---|
| ≤ $5 | within |
| $5.01–$50 | mild |
| $50.01–$100 | moderate |
| > $100 | severe |

### 3.4 — ISR / DMR reconciliation (ledger-backed)

Unchanged from v4. The persistent `invoice_ledger` table carries unmatched
invoices across runs.

**Invoice key normalization:** key = longest trailing-digit run (≥4 digits);
else the full invoice string. Two keys match when the longer's last 4+ digits
equal the shorter, or they share an unambiguous 4+ digit trailing suffix.

**Status state machine:** `matched` (both sides, values agree), `mismatched`
(both sides, values differ), `isr_pending_dmr`, `dmr_pending_isr`, `resolved`
(reconciled this run), `stale` (pending > 7 days). Transitions as in v4.

**Per-run logic:** load store ledger → upsert each ISR row by key → upsert each
DMR row by key → re-evaluate status on touched entries → increment
`days_pending` and mark `stale` on untouched pending entries → save in one
transaction.

> Reconciliation runs on the **daily** atom. Weekly/monthly reconciliation
> metrics (deliveries reviewed/reconciled/flagged for the window) are
> aggregated from the daily reconciliation results — see 3.6.

### 3.5 — Aggregation windows (weekly, monthly)

Aggregated cadences roll up the per-day computed values across the window. The
rule is metric-specific:

| Metric family | Aggregation rule |
|---|---|
| Sales, Costs, Profit (total + per-shift) | **Sum** across days in window |
| Margin (total + per-shift) | Window Profit ÷ window Sales × 100 (NOT a mean of daily margins) |
| Variance (per-shift) | **Sum** of signed daily variances across the window |
| Deliveries reviewed / reconciled / flagged | **Sum** of daily counts across the window |
| Reconciliation ledgers (lists) | **Union** of flagged/reconciled rows whose activity falls in the window |
| Trend series (sales/costs/profit/variance over time) | **Ordered list** of per-bucket values (see 3.6) |
| P&L / Operations graph buckets | **Per-bucket sums** (see 3.6) |

> Margin is the classic aggregation trap: the average of daily margins is not
> the period margin. Always divide window profit by window sales.

### 3.6 — Time buckets for graphs and trends

Graph and trend widgets need values bucketed by a time unit that depends on
cadence:

| Cadence | P&L / Operations bucket | Trend series points |
|---|---|---|
| Daily | per hour within a shift (8 bars × 3 shifts) | n/a (daily has no trend widgets) |
| Weekly | per day (Mon…Sun, 7 buckets) | per day (7 points) |
| Monthly | per week (Week 1…Week 4/5) | per week (4–5 points) |

Each bucket carries the full cost breakdown (sales, inventory, royalty, labor,
maintenance, profit) so the Operations graph can show "sales minus each cost
component revealing profit" at any cadence.

> Monthly week-buckets: Week 1 = days 1–7, Week 2 = 8–14, Week 3 = 15–21,
> Week 4 = 22–end (Week 4 absorbs the remaining 7–10 days; there is no partial
> Week 5 in v5 — revisit if clients find it confusing). _Open question, App. C._

### 3.7 — The metric catalog

The Calculator's contract is to produce, for a given (store, cadence, window),
**every** metric below. Widgets bind to these metric keys; the layout decides
which are shown. Producing the full set every run (rather than only what's
displayed) keeps the Calculator's output independent of layout and makes
re-layout instant (no recompute).

**Scalar metrics** (one number each), produced for the window:

```
sales.total                  costs.total                  profit.total
sales.shift1                 costs.shift1                 profit.shift1
sales.shift2                 costs.shift2                 profit.shift2
sales.shift3                 costs.shift3                 profit.shift3
margin.total
variance.shift1              variance.shift2              variance.shift3
variance.total
deliveries.reviewed          deliveries.reconciled        deliveries.flagged
```

**Series metrics** (ordered lists of buckets), produced for the window:

```
trend.sales                  trend.costs                  trend.profit          (weekly/monthly)
trend.variance.shift1        trend.variance.shift2        trend.variance.shift3 (weekly/monthly)
pl.shift1  pl.shift2  pl.shift3        (daily: per-hour P&L per shift)
pl.window                              (weekly: per-day; monthly: per-week)
operations.shift1 operations.shift2 operations.shift3  (daily: per-hour, with cost breakdown)
operations.window                      (weekly: per-day; monthly: per-week, with cost breakdown)
```

**List metrics** (variable-length), produced for the window:

```
ledger.reconciled            ledger.flagged
```

**Prose metrics** (filled by the Voice writer in Layer 4, not the Calculator):

```
note.executive_summary       note.variance        note.reconciliation       note.pl
```

Not every metric is meaningful at every cadence (e.g., `trend.*` is
weekly/monthly only; the per-hour `pl.shiftN` is daily only). Appendix A maps
each catalog widget to its metric key and the cadences where it applies. The
Calculator produces only the metrics defined for the cadence it is running.

### 3.8 — Payload assembly

The Calculator emits a payload: cadence, window, coverage metadata, and the
computed values for every metric defined for that cadence. Prose metric fields
are present but empty (Layer 4 fills them). The payload is validated against
its schema before leaving Layer 3; a validation failure aborts the run.

> The payload is metric-keyed, NOT widget-keyed or layout-shaped. The same
> payload can render under any layout the client chooses. This is the property
> that makes layout changes free of recomputation.

---

## Layer 4 — Report Generation

Layer 4 turns (layout spec + payload) into a rendered report. It has three
sub-components: the Voice writer, the layout resolver, and the renderer.

### 4.1 — The Voice writer

Fills the prose metrics (`note.*`) the Calculator left empty. Calls the
Anthropic API with: the brand voice spec as system prompt; the full payload as
immutable factual context; explicit instruction that no number may be invented,
modified, or omitted; and the specific note being written.

The Voice writer only produces prose for `note.*` metrics that the client's
layout actually includes. No point writing a variance note for a report with no
variance note widget.

**Post-Voice validation (MUST):** re-validate payload against schema; confirm
only `note.*` fields changed; confirm every number in the prose matches a
payload value to 2dp. Any violation aborts and notifies the Supervisor.

### 4.2 — The layout resolver

Resolves which layout spec applies for this (client, cadence, store), in order:

1. **Store override** — a layout saved specifically for this store and cadence.
2. **Client layout** — the client's layout for this cadence (applies to all
   their stores). This is the common case.
3. **Plan default preset** — the starting layout for the client's plan, used
   until the client customizes.

The resolved layout is a list of widget instances, each with: catalog widget
id, grid position (column, row), size, and any per-widget config (config is a
v5 open question — see Appendix C; for now widgets are parameter-free except
the profit-formula set which is inherently a fixed three-card arrangement).

### 4.3 — The renderer (single implementation, three surfaces)

> There is exactly **one** rendering implementation in the system: React
> components living in the Portal codebase. The Engine does not re-implement
> rendering in Python.

- One component per archetype: `NoteWidget`, `StatCardWidget`, `CardSetWidget`,
  `LedgerWidget`, `PLGraphWidget`, `TrendChartWidget`.
- One `GridComposer` that places widgets on a 12-column grid from the layout
  spec and binds each to its metric value(s) from the payload.

The same components serve three surfaces:
- **Editor** (Portal) — interactive, widgets draggable, catalog palette.
- **Preview** (Portal) — static, real or sample data.
- **Engine render step** — headless (Node + browser), real data, emits the
  report as HTML and multi-page PDF.

The Engine's render step is a single well-defined call:
`render(layout_spec, payload) -> {html, pdf}`. The Python↔Node boundary is
pure data: Python emits JSON, Node consumes JSON and emits HTML/PDF. Python
never touches React; Node never does arithmetic.

> Render-step technology (headless Chromium via Playwright vs. a React-PDF
> library) is deliberately deferred — see Appendix C. The data boundary above
> holds regardless of which is chosen.

### 4.4 — The 12-column grid and widget sizes

Widgets occupy a 12-column grid, centered, variable height. Sizes:

| Size | Grid footprint |
|---|---|
| XS | 3 × 3 |
| S | 4 × 3 |
| M | 6 × 3 |
| L | 12 × 3 |
| XL | 12 × 6 |
| 2XL | 12 × 12+ |

Valid row combinations (must fill 12 columns): `XS+XS+XS+XS`, `S+S+S`, `M+M`,
`L`, `L` (with an `XS+XS` stacked variant noted in the catalog), `XL`, `2XL`.

### 4.5 — Print / PDF

Reports may span multiple printed pages on 8.5×11. The renderer's print mode
MUST: apply `break-inside: avoid` per widget (no widget splits across a page
boundary); size margins for 8.5×11; and preserve the brand spec's typography
and color in print. The Supervisor verifies the rendered PDF exists and has the
expected page/widget count before publication.

### 4.6 — Output

Stored in two forms on the `reports` row: the payload JSON (`reports.payload`)
and the rendered output (`reports.file_path`, in Supabase Storage). Storing
both means a report can be re-rendered under a new template version or a new
layout without re-running Layers 1–3.

---

## Layer 6 — Supervisor

> The last gate before publication. No report reaches the client unless the
> Supervisor signs off. Operates on a completed run independently.

### Tier 1 — Internal assertions (free, always)

Layer 1 (daily collection): every screen produced a non-empty result; EJ
accumulator size matches `Total transactions: N`; Σ(merchandise/hr) reconciles
to Cash Summary; all EJ employees exist in the pay reference.

**Coverage (aggregated cadences):** the window has a snapshot for every
business date. Missing days → finding. A weekly report missing 1 day → warning
(publish with a coverage badge); missing 3+ days → blocking. Monthly thresholds
proportionally higher. Exact thresholds per-store configurable.

Layer 3: Σ(per-bucket) equals the window total for sales, costs, profit;
window profit = window sales − window costs; margin = profit ÷ sales × 100;
no ledger entry pending > 7 days unless `stale`; every flagged ledger row in
the payload has a matching note when a reconciliation note widget is present.

Layer 4: payload validates; only `note.*` changed post-Voice; every prose
number matches a payload value; the rendered PDF exists, is non-empty, and has
the expected widget/page count for the resolved layout.

### Tier 2 — External re-reads (moderate, after Layer 2 only)

Re-open 7BOSS Invoice Summary for the business date and confirm every memo
entry recorded in `audit_log` for the run is present with expected values.
Mismatch → blocking. Read-only screens are NOT re-scraped.

### Tier 3 — Heuristic checks (cheap, informational)

Window total deviates > 25% from the trailing comparable-period average; a
shift severity = severe; a ledger row pending > 5 days; run exceeded API or
time budget. These warn or inform; they do not block.

### Failure routing

- `blocking` → not published; goes to the owner's review queue; email alert.
- `warning` → published with a badge describing the warning.
- `info` → logged only.

Default: any Tier 1 hard assertion or Tier 2 mismatch → blocking. Tier 3 →
warning or info.

> The Supervisor is defense in depth, not a substitute for correct upstream
> code. If it keeps catching the same class of error, fix the upstream layer.

---

## Layer 5 — Delivery

### Portal (primary)
On sign-off, set `reports.supervisor_status` to `passed` or
`passed_with_warnings`. The Portal shows the logged-in client reports with
those statuses (blocked reports stay in the owner's queue). The Portal renders
the report from the stored output via the same React components.

### Email (secondary, optional)
If `clients.email_delivery_enabled`, create a Gmail draft to the client's
delivery email: subject `[Client] [Store] — [Cadence] Report — [window]`; short
plaintext + the rendered PDF attached. **The Engine never auto-sends.** Drafts
wait for manual send (Phase 6 trust-building; revisited Phase 8).

---

## Cross-cutting concerns

### Name matching
Match employee names on first name only, case-insensitive, whitespace-tolerant.
Unrecognized first names raise a Tier 1 warning.

### Exclusions
Per the store's pay reference: `excluded_from_labor` accounts (Administrator,
owner) are excluded from all labor; `hourly_rate = 0` + `weekly_bonus > 0`
employees stay on the cashier roster but contribute $0 to per-hour labor (bonus
applied in weekly reports only); EJ transactions outside the business-day
window are discarded.

### Run identifiers
Every run has a UUID `run_id` assigned at start, appearing on the `runs` row,
every `audit_log` entry, `reports.run_id`, `supervisor_findings.run_id`, and
every log line. The audit thread.

### Secrets
7BOSS credentials and 2FA secret/relay (per store), Supabase service role key,
Anthropic API key, Gmail OAuth tokens (per client). None in this document, the
repo, or any `NEXT_PUBLIC_*` var. They live in Vercel env, local `.env.local`
(gitignored), or a secrets manager for per-store 7BOSS credentials.

### Observability
Structured logs keyed by `run_id`: layer timings, screen timings, Anthropic
token usage, every Supervisor finding, errors with stack traces. The owner has
a run dashboard; clients see only their published reports.

---

## Appendix A — Widget catalog

Each widget is an instance of an archetype bound to (cadence, metric, scope),
with a size and an `is_set` flag (sets render as an L container of S cards;
their members are independently placeable too — clients may add the set OR
individual cards). `[DEFAULT]` marks widgets in the plan's starting preset.

Archetypes: `note` (L prose), `stat_card` (S), `card_set` (L of S),
`ledger` (L+ variable), `pl_graph` (XL), `trend_chart` (XL).

### Daily catalog

| # | Widget | Archetype | Metric | Size |
|---|---|---|---|---|
| 1 | Daily Executive Summary Note | note | note.executive_summary | L |
| 2 | Daily Shift Sales Card Set | card_set | sales.shift{1,2,3} | L |
| 2A/B/C | Daily Shift {1,2,3} Sales Card | stat_card | sales.shift{n} | S |
| 3 | Daily Sales Card | stat_card | sales.total | S |
| 4 | Daily Shift Costs Card Set | card_set | costs.shift{1,2,3} | L |
| 4A/B/C | Daily Shift {1,2,3} Costs Card | stat_card | costs.shift{n} | S |
| 5 | Daily Costs Card | stat_card | costs.total | S |
| 6 | Daily Shift Profit Card Set | card_set | profit.shift{1,2,3} | L |
| 6A/B/C | Daily Shift {1,2,3} Profit Card | stat_card | profit.shift{n} | S |
| 7 | Daily Profit Card | stat_card | profit.total | S |
| 8 [DEFAULT] | Daily Profit Formula Card Set | card_set | sales.total, costs.total, profit.total | L |
| 8A/B/C | (Sales / Costs / Profit cards) | stat_card | sales.total / costs.total / profit.total | S |
| 9 | Daily Variance Summary Note | note | note.variance | L |
| 10 [DEFAULT] | Daily Shift Variance Card Set | card_set | variance.shift{1,2,3} | L |
| 10A/B/C | Daily Shift {1,2,3} Variance Card | stat_card | variance.shift{n} | S |
| 11 | Daily Delivery Reconciliation Note | note | note.reconciliation | L |
| 12 | Daily Delivery Reconciliation Card Set | card_set | deliveries.{reviewed,reconciled,flagged} | L |
| 12A/B/C | Daily Deliveries {Reviewed,Reconciled,Flagged} Card | stat_card | deliveries.{...} | S |
| 13 [DEFAULT] | Daily Delivery Reconciliation Ledgers | ledger | ledger.reconciled, ledger.flagged | L+ |
| 13A | Daily Reconciled Deliveries | ledger | ledger.reconciled | L+ |
| 13B | Daily Flagged Deliveries | ledger | ledger.flagged | L+ |
| 14 | Daily P&L Analysis Note | note | note.pl | L |
| 15 [DEFAULT] | Daily P&L Graphs (per shift) | pl_graph | pl.shift{1,2,3} | XL each |
| 15A/B/C | Shift {1,2,3} P&L | pl_graph | pl.shift{n} | XL |
| 16 | Daily Operations Graphs (per shift) | pl_graph | operations.shift{1,2,3} | XL each |
| 16A/B/C | Shift {1,2,3} Operations | pl_graph | operations.shift{n} | XL |

### Weekly catalog

| # | Widget | Archetype | Metric | Size |
|---|---|---|---|---|
| 1 | Weekly Executive Summary Note | note | note.executive_summary | L |
| 2 | Weekly Sales Card Set | card_set | sales.shift{1,2,3} | L |
| 2A/B/C | Weekly Shift {1,2,3} Sales Card | stat_card | sales.shift{n} | S |
| 3 | Weekly Sales Card | stat_card | sales.total | S |
| 4 | Weekly Costs Card Set | card_set | costs.shift{1,2,3} | L |
| 4A/B/C | Weekly Shift {1,2,3} Costs Card | stat_card | costs.shift{n} | S |
| 5 | Weekly Costs Card | stat_card | costs.total | S |
| 6 | Weekly Profit Card Set | card_set | profit.shift{1,2,3} | L |
| 6A/B/C | Weekly Shift {1,2,3} Profit Card | stat_card | profit.shift{n} | S |
| 7 | Weekly Profit Card | stat_card | profit.total | S |
| 8 [DEFAULT] | Weekly Profit Formula Card Set | card_set | sales/costs/profit.total | L |
| 8A/B/C | (Sales / Costs / Profit cards) | stat_card | …total | S |
| 9 | Weekly Trend Charts | trend_chart | trend.{sales,costs,profit} | XL each |
| 9A/B/C | Weekly {Sales,Costs,Profit} Chart | trend_chart | trend.{…} | XL |
| 10 | Weekly Variance Charts | trend_chart | trend.variance.shift{1,2,3} | XL each |
| 10A/B/C | Weekly Shift {1,2,3} Variance Chart | trend_chart | trend.variance.shift{n} | XL |
| 11 | Weekly Variance Summary Note | note | note.variance | L |
| 12 [DEFAULT] | Weekly Shift Variance Card Set | card_set | variance.shift{1,2,3} | L |
| 12A/B/C | Weekly Shift {1,2,3} Variance Card | stat_card | variance.shift{n} | S |
| 13 | Weekly Delivery Reconciliation Note | note | note.reconciliation | L |
| 14 | Weekly Delivery Reconciliation Card Set | card_set | deliveries.{…} | L |
| 14A/B/C | Weekly Deliveries {…} Card | stat_card | deliveries.{…} | S |
| 15 [DEFAULT] | Weekly Delivery Reconciliation Ledgers | ledger | ledger.{reconciled,flagged} | L+ |
| 15A/B | Weekly {Reconciled,Flagged} Deliveries | ledger | ledger.{…} | L+ |
| 16 | Weekly P&L Analysis Note | note | note.pl | L |
| 17 [DEFAULT] | Weekly P&L Graph | pl_graph | pl.window (per-day Mon–Sun) | XL |
| 18 | Weekly Operations Graph | pl_graph | operations.window (per-day Mon–Sun) | XL |

### Monthly catalog

| # | Widget | Archetype | Metric | Size |
|---|---|---|---|---|
| 1 | Monthly Executive Summary Note | note | note.executive_summary | L |
| 2 | Monthly Sales Card Set | card_set | sales.shift{1,2,3} | L |
| 2A/B/C | Monthly Shift {1,2,3} Sales Card | stat_card | sales.shift{n} | S |
| 3 | Monthly Sales Card | stat_card | sales.total | S |
| 4 | Monthly Costs Card Set | card_set | costs.shift{1,2,3} | L |
| 4A/B/C | Monthly Shift {1,2,3} Costs Card | stat_card | costs.shift{n} | S |
| 5 | Monthly Costs Card | stat_card | costs.total | S |
| 6 | Monthly Profit Card Set | card_set | profit.shift{1,2,3} | L |
| 6A/B/C | Monthly Shift {1,2,3} Profit Card | stat_card | profit.shift{n} | S |
| 7 | Monthly Profit Card | stat_card | profit.total | S |
| 8 [DEFAULT] | Monthly Profit Formula Card Set | card_set | sales/costs/profit.total | L |
| 8A/B/C | (Sales / Costs / Profit cards) | stat_card | …total | S |
| 9 | Monthly Trend Charts | trend_chart | trend.{sales,costs,profit} | XL each |
| 9A/B/C | Monthly {Sales,Costs,Profit} Chart | trend_chart | trend.{…} | XL |
| 10 | Monthly Variance Charts | trend_chart | trend.variance.shift{1,2,3} | XL each |
| 10A/B/C | Monthly Shift {1,2,3} Variance Chart | trend_chart | trend.variance.shift{n} | XL |
| 11 | Monthly Variance Summary Note | note | note.variance | L |
| 12 [DEFAULT] | Monthly Shift Variance Card Set | card_set | variance.shift{1,2,3} | L |
| 12A/B/C | Monthly Shift {1,2,3} Variance Card | stat_card | variance.shift{n} | S |
| 13 | Monthly Delivery Reconciliation Note | note | note.reconciliation | L |
| 14 | Monthly Delivery Reconciliation Card Set | card_set | deliveries.{…} | L |
| 14A/B/C | Monthly Deliveries {…} Card | stat_card | deliveries.{…} | S |
| 15 [DEFAULT] | Monthly Delivery Reconciliation Ledgers | ledger | ledger.{reconciled,flagged} | L+ |
| 15A/B | Monthly {Reconciled,Flagged} Deliveries | ledger | ledger.{…} | L+ |
| 16 | Monthly P&L Analysis Note | note | note.pl | L |
| 17 [DEFAULT] | Monthly P&L Graph | pl_graph | pl.window (per-week) | XL |
| 18 | Monthly Operations Graph | pl_graph | operations.window (per-week) | XL |

> Additional widgets exist in a reserve bank and will be added to the catalog
> over time. Adding a widget = adding a catalog row (archetype + metric +
> cadence + size), not writing new engine code, provided its metric already
> exists or is added to the metric catalog (3.7).

---

## Appendix B — Implementation pointers

Conceptual components (file structure owned by the codebase, not pinned here):

- **The Collector** — Layer 1. Playwright.
- **The Writeback Agent** — Layer 2. Playwright + audit log.
- **The Calculator** — Layer 3. Pure Python, no I/O, no LLM.
- **The Voice writer** — prose half of Layer 4. Anthropic API.
- **The Renderer** — React components + GridComposer (in the Portal). Used by
  editor, preview, and the Engine's headless render step.
- **The Supervisor** — Layer 6.
- **The Delivery dispatcher** — Layer 5.

These names are the system's design vocabulary; stable across refactors.

---

## Appendix C — Open questions for v6

- **Per-widget config knobs** (e.g. "top N cashiers", ledger row limits).
  v5 widgets are parameter-free except inherently-structured sets.
- **Render-step technology** — headless Chromium (Playwright) vs. a React-PDF
  library. Data boundary is fixed; the mechanism is not.
- **Monthly week-bucketing** — Week 4 currently absorbs days 22–end. Revisit if
  clients want a true Week 5.
- **Per-client window overrides** — fixed Mon–Sun / calendar-month for v5.
- **Catalog versioning + "new widget available" discovery flow.**
- **Weekly/monthly cross-check against 7BOSS native reports** — v5 trusts the
  daily roll-up; a future Supervisor tier could cross-check.

---

_End of specification._
