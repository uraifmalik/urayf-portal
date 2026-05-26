"""
urayf · Daily Report Payload Schema · v1 (Python mirror)
========================================================

Pydantic models that mirror `report-payload.ts`. The TypeScript file is the
canonical source of truth for the SHAPE of the payload; this file is the
canonical source of truth for the VALIDATION RULES the Engine enforces before
emitting a payload.

If you change a field name, type, or shape in `report-payload.ts`, change it
here too. Drift is a real risk; we accept it for v1 in exchange for fast
iteration. A future task is to generate one from the other automatically.

Conventions (must match the TS file):

    • All money values are floats in USD, rounded to 2 decimals at the
      Calculator's output boundary.
    • All percentages are in percent units (10.7 means 10.7%), not ratios.
    • Missing-not-zero: values that haven't been observed are `None`, never 0.
    • Dates are ISO strings YYYY-MM-DD.
    • Money signs are explicit; the template chooses how to render them.

The Engine uses `DailyReportPayload.model_validate()` immediately before
handing a payload off to the Template renderer. Failures should never reach
the Portal.
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

PAYLOAD_SCHEMA_VERSION = "1.0"


# ---------------------------------------------------------------------------
# Common building blocks
# ---------------------------------------------------------------------------

# Money values are floats. Pydantic v2 accepts int or float here; we trust the
# Calculator to round to 2dp at its output boundary. A future enhancement is
# to add a validator that rejects values with more than 2 decimal places.
Money = float

# Percent in percent units (10.7 means 10.7%, not 0.107).
Percent = float

# A money value that may legitimately be unknown — e.g., DMR cost on an
# ISR-pending-DMR ledger entry. NEVER use 0 for "not yet observed".
MaybeMoney = Annotated[
    Money | None, Field(description="None means 'not yet observed', not 'zero'.")
]


class _Strict(BaseModel):
    """Base model that forbids extra fields. Catches typos before they ship."""

    model_config = ConfigDict(extra="forbid", frozen=False, str_strip_whitespace=True)


class Delta(_Strict):
    """A signed numeric movement vs. some baseline."""

    value: Percent = Field(ge=0, description="Magnitude of change, always positive.")
    direction: Literal["up", "down", "flat"]
    baseline_label: str = Field(min_length=1)


# ---------------------------------------------------------------------------
# Metadata
# ---------------------------------------------------------------------------


class ReportMeta(_Strict):
    client_name: str = Field(min_length=1)
    store_number: str = Field(
        min_length=1, description="String, not int — leading zeros may matter."
    )
    business_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    business_date_long: str
    business_date_year_roman: str
    plan: Literal["standard", "premium", "max"]
    run_id: str = Field(min_length=1)
    run_started_at: str
    generated_at: str


# ---------------------------------------------------------------------------
# Section 1: Executive Summary
# ---------------------------------------------------------------------------


class NamedFigure(_Strict):
    label: str
    value: Money


class ProfitByShift(_Strict):
    shift: Literal[1, 2, 3]
    profit: Money


class ExecutiveSummaryFigures(_Strict):
    sales: Money
    costs: Money
    profit: Money
    sales_vs_last: Delta
    costs_vs_last: Delta
    profit_vs_last: Delta
    sales_breakdown: list[NamedFigure]
    costs_breakdown: list[NamedFigure]
    profit_by_shift: list[ProfitByShift] = Field(min_length=3, max_length=3)


class ExecutiveSummaryProse(_Strict):
    summary_note: str = Field(min_length=1)


class ExecutiveSummary(_Strict):
    figures: ExecutiveSummaryFigures
    prose: ExecutiveSummaryProse


# ---------------------------------------------------------------------------
# Section 2: Variance Summary
# ---------------------------------------------------------------------------


class RegisterVariance(_Strict):
    name: str
    variance: Money
    bar_pct: Annotated[Percent, Field(ge=0, le=100)]


class ShiftVariance(_Strict):
    shift: Literal[1, 2, 3]
    shift_label: str
    variance: Money
    variance_pct_of_sales: Percent
    severity: Literal["within", "mild", "moderate", "severe"]
    direction: Literal["over", "short", "balanced"]
    registers: list[RegisterVariance]
    cashiers: list[str]


class VarianceSummaryFigures(_Strict):
    total_variance_pct_of_sales: Percent
    shifts: list[ShiftVariance] = Field(min_length=3, max_length=3)


class VarianceSummaryProse(_Strict):
    intro_note: str = Field(min_length=1)


class VarianceSummary(_Strict):
    figures: VarianceSummaryFigures
    prose: VarianceSummaryProse


# ---------------------------------------------------------------------------
# Section 3: Delivery Reconciliation
# ---------------------------------------------------------------------------

LedgerStatus = Literal[
    "matched",
    "mismatched",
    "isr_pending_dmr",
    "dmr_pending_isr",
    "resolved",
    "stale",
]


class DeliveryRow(_Strict):
    ledger_key: str = Field(min_length=1)
    date_label: str
    vendor: str
    isr_cost: MaybeMoney
    isr_retail: MaybeMoney
    dmr_cost: MaybeMoney
    dmr_retail: MaybeMoney
    status: LedgerStatus
    days_pending: int = Field(ge=0)


class DeliveryReconciliationFigures(_Strict):
    deliveries_reviewed: int = Field(ge=0)
    reconciled_count: int = Field(ge=0)
    flagged_count: int = Field(ge=0)
    total_discrepancy: Money
    matched: list[DeliveryRow]
    flagged: list[DeliveryRow]
    resolved_this_run: list[DeliveryRow]


class DeliveryReconciliationProse(_Strict):
    intro_note: str = Field(min_length=1)
    flagged_notes: dict[str, str] = Field(
        description="Keyed by DeliveryRow.ledger_key. Every flagged row needs one.",
    )


class DeliveryReconciliation(_Strict):
    figures: DeliveryReconciliationFigures
    prose: DeliveryReconciliationProse


# ---------------------------------------------------------------------------
# Section 4: Profit & Loss Analysis
# ---------------------------------------------------------------------------


class ShiftPL(_Strict):
    shift: Literal[1, 2, 3]
    shift_label: str
    sales: Money
    costs: Money
    profit: Money
    margin_pct: Percent
    sales_vs_last: Delta
    costs_vs_last: Delta
    profit_vs_last: Delta


class ProfitLossFigures(_Strict):
    margin_pct: Percent
    shifts: list[ShiftPL] = Field(min_length=3, max_length=3)


class ProfitLossProse(_Strict):
    intro_note: str = Field(min_length=1)


class ProfitLossAnalysis(_Strict):
    figures: ProfitLossFigures
    prose: ProfitLossProse


# ---------------------------------------------------------------------------
# Hourly data
# ---------------------------------------------------------------------------


class HourlyRow(_Strict):
    hour: str = Field(
        description="Hour label as the template expects it, e.g. '7-8a' or '11a-12p'."
    )
    shift: Literal[1, 2, 3]
    sales: Money
    inventory: Money
    royalty: Money
    labor: Money
    maintenance: Money
    profit: Money


# ---------------------------------------------------------------------------
# Root payload
# ---------------------------------------------------------------------------


class DailyReportPayload(_Strict):
    schema_version: str = Field(
        default=PAYLOAD_SCHEMA_VERSION,
        description="Bump this when shape changes; old reports stay renderable.",
    )
    meta: ReportMeta
    executive_summary: ExecutiveSummary
    variance_summary: VarianceSummary
    delivery_reconciliation: DeliveryReconciliation
    profit_loss: ProfitLossAnalysis
    hourly: list[HourlyRow] = Field(
        min_length=24,
        max_length=24,
        description="Always exactly 24 rows, from 7-8a through 6-7a.",
    )


# ---------------------------------------------------------------------------
# Voice-fillable field allowlist
# ---------------------------------------------------------------------------
# The Voice writer is permitted to set values at these dotted paths ONLY.
# A post-Voice validator confirms that no other field changed from what the
# Calculator emitted.

VOICE_FILLABLE_FIELDS: tuple[str, ...] = (
    "executive_summary.prose.summary_note",
    "variance_summary.prose.intro_note",
    "delivery_reconciliation.prose.intro_note",
    "delivery_reconciliation.prose.flagged_notes",
    "profit_loss.prose.intro_note",
)
