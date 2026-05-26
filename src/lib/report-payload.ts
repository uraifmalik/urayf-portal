// ============================================================================
// urayf · Daily Report Payload Schema · v1
// ----------------------------------------------------------------------------
// This is the contract between the Engine (Python) and the Template (TypeScript
// / React rendering inside the Portal). It describes EVERYTHING that must be
// present in a daily report payload, and nothing more.
//
// Conventions (these are intentional and worth reading once):
//
//   • All money values are numbers (floats), in USD, rounded to 2 decimals at
//     the Calculator's output boundary. The template formats them for display.
//   • All percentages are numbers in percent units, NOT ratios. So 10.7 means
//     10.7%, not 1070%. (The template appends the % sign.)
//   • "Missing" values are `null`, never `0` or `-1`. Conflating zero with
//     "we haven't seen this yet" is the bug we are most determined to avoid.
//   • Dates are ISO strings (YYYY-MM-DD), in the store's local business date.
//   • Times are ISO strings (HH:MM:SS, 24-hour, local time).
//   • Money signs are explicit: a negative variance is `-21.91`, not `21.91`
//     with a sign flag. The template chooses how to render the sign.
//   • There are no rich-text or HTML fields. All prose is plain UTF-8.
//
// Two-stream architecture: every section has a `figures` block (deterministic,
// from the Calculator) and a `prose` block (from the Voice writer). The Voice
// writer reads `figures` as immutable context; it never invents or modifies
// a number. A pre-render validator confirms every numeric value mentioned in
// `prose` matches the corresponding `figures` value to 2dp.
// ============================================================================

export const PAYLOAD_SCHEMA_VERSION = "1.0";

// ----------------------------------------------------------------------------
// Common building blocks
// ----------------------------------------------------------------------------

/** A money value in USD, rounded to 2 decimals. Negative values allowed. */
export type Money = number;

/** A percentage in percent units (10.7 means 10.7%). */
export type Percent = number;

/** ISO date — YYYY-MM-DD, business date in the store's local timezone. */
export type IsoDate = string;

/** ISO local time — HH:MM:SS, 24-hour, store's local timezone. */
export type IsoTime = string;

/**
 * A figure that can be unknown. Use `null` (NOT 0) when a value has not yet
 * been observed — e.g., DMR cost on an ISR-pending-DMR ledger entry.
 */
export type MaybeMoney = Money | null;

/**
 * A signed numeric movement vs. some baseline.
 * E.g., daily Profit was 10.7% higher than last Monday → { value: 10.7, direction: "up" }.
 * `direction` is derived from value sign; we carry it explicitly so the template
 * doesn't have to recompute it and so a zero-delta day is unambiguous.
 */
export interface Delta {
  /** The magnitude of the change, always positive. */
  value: Percent;
  /** "up" if the new value is higher than the baseline, "down" if lower, "flat" if zero. */
  direction: "up" | "down" | "flat";
  /** Plain-text description of the baseline, e.g. "compared to last Monday". */
  baseline_label: string;
}

// ----------------------------------------------------------------------------
// Root payload
// ----------------------------------------------------------------------------

export interface DailyReportPayload {
  /** Schema version, e.g. "1.0". Lets us evolve the shape without breaking old reports. */
  schema_version: string;

  /** Identifying metadata. Renders the masthead, page title, file name. */
  meta: ReportMeta;

  /** Section 1: Executive Summary — sales/costs/profit cards. */
  executive_summary: ExecutiveSummary;

  /** Section 2: Variance Summary — POS over/short by shift. */
  variance_summary: VarianceSummary;

  /** Section 3: Delivery Reconciliation — ISR/DMR ledger view. */
  delivery_reconciliation: DeliveryReconciliation;

  /** Section 4: Profit & Loss Analysis — per-shift hourly chart. */
  profit_loss: ProfitLossAnalysis;

  /** Hourly data (24 rows) used to draw the shift charts. */
  hourly: HourlyRow[];
}

// ----------------------------------------------------------------------------
// Metadata
// ----------------------------------------------------------------------------

export interface ReportMeta {
  /** Client's display name as it appears in the loader and email subject. */
  client_name: string;
  /** Store number, e.g. "19775". String, not number — leading zeros may matter. */
  store_number: string;
  /** Business date the report covers. */
  business_date: IsoDate;
  /** Pre-formatted long-form date for the masthead, e.g. "Monday, the Twelfth of January". */
  business_date_long: string;
  /** Pre-formatted Roman-numeral year, e.g. "MMXXVI". */
  business_date_year_roman: string;
  /** Plan tier — determines which sections render and certain feature flags. */
  plan: "standard" | "premium" | "max";
  /** ID of the engine run that produced this payload. For audit linkage. */
  run_id: string;
  /** Timestamp the run started (UTC, ISO 8601). */
  run_started_at: string;
  /** Timestamp the payload was finalized (UTC, ISO 8601). */
  generated_at: string;
}

// ----------------------------------------------------------------------------
// Section 1: Executive Summary
// ----------------------------------------------------------------------------

export interface ExecutiveSummary {
  figures: {
    /** Daily sales total. Sum of hourly.sales across all 24 hours. */
    sales: Money;
    /** Daily costs total. Sum of hourly costs (inventory + royalty + labor + maintenance). */
    costs: Money;
    /** Daily profit. sales - costs. May be negative. */
    profit: Money;

    /** Sales movement vs. same-weekday last week. */
    sales_vs_last: Delta;
    /** Costs movement vs. same-weekday last week. */
    costs_vs_last: Delta;
    /** Profit movement vs. same-weekday last week. */
    profit_vs_last: Delta;

    /** Breakdown of sales into named components — drives the "What Makes Up Sales" list. */
    sales_breakdown: NamedFigure[];
    /** Breakdown of costs into named components — drives the "What Makes Up Costs" list. */
    costs_breakdown: NamedFigure[];

    /**
     * Profit by shift — drives the donut chart on the profit card.
     * Always exactly 3 entries (shift 1, 2, 3) in order; values may be negative.
     */
    profit_by_shift: { shift: 1 | 2 | 3; profit: Money }[];
  };

  prose: {
    /**
     * The opening note above the cards. Written by the Voice writer.
     * Must reference at least the profit delta and the best/worst hours;
     * pre-render validation enforces that every $-figure mentioned here
     * appears verbatim in `figures` or `hourly`.
     */
    summary_note: string;
  };
}

/**
 * A single named line in a breakdown. The template renders these as
 * "<label> ........ $<value>" rows. Order matters — render in array order.
 */
export interface NamedFigure {
  label: string;
  value: Money;
}

// ----------------------------------------------------------------------------
// Section 2: Variance Summary
// ----------------------------------------------------------------------------

export interface VarianceSummary {
  figures: {
    /**
     * Total absolute variance across all shifts, as a percent of daily sales.
     * E.g. (|−$10.79| + |−$21.91| + |+$14.39|) / $6,537.97 ≈ 0.72%, rounded to
     * the displayed precision.
     */
    total_variance_pct_of_sales: Percent;

    /** Per-shift variance details. Always exactly 3 entries in order. */
    shifts: ShiftVariance[];
  };

  prose: {
    /** Section intro — typically frames the day's variance as clean / mild / serious. */
    intro_note: string;
  };
}

export interface ShiftVariance {
  shift: 1 | 2 | 3;
  /** Display label, e.g. "Shift One", "Shift Two", "Shift Three". */
  shift_label: string;
  /**
   * Signed variance amount in dollars. Positive = over, negative = short.
   * The template chooses card color from severity, not directly from this value.
   */
  variance: Money;
  /** Variance as a percentage of that shift's sales (always positive — direction is in `variance`). */
  variance_pct_of_sales: Percent;
  /**
   * Severity classification per playbook thresholds (absolute value of variance):
   *   within   : ≤ $5.00
   *   mild     : $5.01 – $50.00
   *   moderate : $50.01 – $100.00
   *   severe   : > $100.00
   */
  severity: "within" | "mild" | "moderate" | "severe";
  /** Direction word for the figure ("over" / "short" / "balanced"). */
  direction: "over" | "short" | "balanced";
  /** Per-register breakdown — drives the bar chart inside the card. */
  registers: RegisterVariance[];
  /** Cashiers on the shift roster. First names only, per playbook name-matching rule. */
  cashiers: string[];
}

export interface RegisterVariance {
  /** Display name, e.g. "POS 1". */
  name: string;
  /** Signed variance for this register. */
  variance: Money;
  /**
   * Width percentage for the bar relative to the worst variance in the shift.
   * Pre-computed by the Calculator so the template never has to scan the array.
   * Always 0–100.
   */
  bar_pct: Percent;
}

// ----------------------------------------------------------------------------
// Section 3: Delivery Reconciliation
// ----------------------------------------------------------------------------

export interface DeliveryReconciliation {
  figures: {
    /** Total deliveries reviewed in this run. */
    deliveries_reviewed: number;
    /** Count of reconciled (matched) deliveries. */
    reconciled_count: number;
    /** Count of flagged (non-matched) deliveries. */
    flagged_count: number;
    /**
     * Total dollar value of discrepancies on flagged rows.
     * Sum of |ISR retail − DMR retail| + |ISR cost − DMR cost| for mismatched,
     * or the present-side value for pending. Used in the section intro.
     */
    total_discrepancy: Money;

    /** Matched delivery rows (status = Matched). Collapsed by default in the UI. */
    matched: DeliveryRow[];
    /** Flagged delivery rows (any non-Matched status). Surfaced prominently. */
    flagged: DeliveryRow[];
    /**
     * Entries that flipped to "Resolved" in this run. Rendered as a green callout
     * above the tables. Empty array if none.
     */
    resolved_this_run: DeliveryRow[];
  };

  prose: {
    /** Section intro — frames the day's delivery picture. */
    intro_note: string;
    /**
     * Per-flagged-row plain-English notes, keyed by ledger_key.
     * The Voice writer generates these following the templates in Playbook §3.
     * Every flagged row MUST have a corresponding note.
     */
    flagged_notes: Record<string, string>;
  };
}

export interface DeliveryRow {
  /**
   * Stable identifier — the normalized invoice key from the ledger.
   * Used to join `flagged_notes` to the row. Not displayed to the client.
   */
  ledger_key: string;
  /** Display date for the delivery, e.g. "May 9". */
  date_label: string;
  /** Vendor display name (taken from ISR side if both present). */
  vendor: string;
  /** ISR cost, or null if ISR side not yet seen. */
  isr_cost: MaybeMoney;
  /** ISR retail, or null if ISR side not yet seen. */
  isr_retail: MaybeMoney;
  /** DMR cost, or null if DMR side not yet seen. */
  dmr_cost: MaybeMoney;
  /** DMR retail, or null if DMR side not yet seen. */
  dmr_retail: MaybeMoney;
  /**
   * Status from the ledger state machine. The template uses this to choose
   * the row's visual treatment and badge text.
   */
  status:
    | "matched"
    | "mismatched"
    | "isr_pending_dmr"
    | "dmr_pending_isr"
    | "resolved"
    | "stale";
  /** How many days this entry has been pending. 0 if matched or just-resolved. */
  days_pending: number;
}

// ----------------------------------------------------------------------------
// Section 4: Profit & Loss Analysis
// ----------------------------------------------------------------------------

export interface ProfitLossAnalysis {
  figures: {
    /** Day's profit margin as a percentage. profit / sales × 100. */
    margin_pct: Percent;
    /** Per-shift totals — three stat-card sets stacked behind the tabs. */
    shifts: ShiftPL[];
  };

  prose: {
    /** Section intro — typically calls out the margin and which shift led. */
    intro_note: string;
  };
}

export interface ShiftPL {
  shift: 1 | 2 | 3;
  shift_label: string;
  sales: Money;
  costs: Money;
  profit: Money;
  margin_pct: Percent;
  sales_vs_last: Delta;
  costs_vs_last: Delta;
  profit_vs_last: Delta;
}

// ----------------------------------------------------------------------------
// Hourly data (24 rows, used by the stacked bar chart)
// ----------------------------------------------------------------------------

export interface HourlyRow {
  /** Hour label as the template expects it, e.g. "7-8a", "11a-12p", "6-7a". */
  hour: string;
  /** Which shift this hour belongs to (1, 2, or 3). */
  shift: 1 | 2 | 3;
  /** Total sales for the hour. */
  sales: Money;
  /** Cost of goods sold for the hour — assigned deliveries summed at Total Invoice Cost. */
  inventory: Money;
  /**
   * Royalty for the hour. Per playbook: (merchandise_sales − inventory) × 0.54.
   * Can be negative when inventory deliveries exceed merchandise sales for the hour
   * (the famous "12-1p deliveries arrive" case in the sample).
   */
  royalty: Money;
  /**
   * Labor for the hour. Sum of hourly rates for distinct employees who rang at
   * least one transaction. Excludes Administrator, store owner, and any employee
   * marked $0/hr (weekly bonus only). $0 if no eligible employees rang.
   */
  labor: Money;
  /** Maintenance amortization for the hour: ($3000 / days_in_month) / 24. */
  maintenance: Money;
  /** Profit = sales − (inventory + royalty + labor + maintenance). May be negative. */
  profit: Money;
}

// ----------------------------------------------------------------------------
// Convenience: the keys the Voice writer is allowed to fill.
// Anything outside this list is forbidden from changing post-Calculator.
// ----------------------------------------------------------------------------

export const VOICE_FILLABLE_FIELDS = [
  "executive_summary.prose.summary_note",
  "variance_summary.prose.intro_note",
  "delivery_reconciliation.prose.intro_note",
  "delivery_reconciliation.prose.flagged_notes",
  "profit_loss.prose.intro_note",
] as const;
