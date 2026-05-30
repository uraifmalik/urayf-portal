"""
Snapshot fragment models for Layer 1 collection.

Each 7BOSS/7REPORTS screen produces a typed fragment. Fragments are assembled
into the full `raw_snapshots.data` JSON at the end of a collection run. Typing
each fragment means a missing or malformed value fails loudly at collection
time — not silently three layers downstream in the Calculator.

This module currently defines only the Cash Summary fragment (Screen 1.1).
Other screens' fragments are added as we build each one.

Per Playbook v5 §Layer 1, Screen 1.1.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class _Strict(BaseModel):
    """Forbid extra fields so DOM-shape surprises surface immediately."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class CommissionType(_Strict):
    """One commission type and its total, from the Commissions breakdown."""

    name: str = Field(min_length=1)
    total: float


class CashSummaryFragment(_Strict):
    """
    The data collected from Screen 1.1 (Cash Summary).

    Per Playbook v5 §Layer 1, Screen 1.1, the Engine collects:
      - Deposit Adjustment Total $
      - Sales Including Commissions Total $
      - Commissions Total $
      - Merchandise Sales Total $
      - The list of Commission Types with their Total $
      - Volume Sales (under Day Totals, from Gas Sales)

    All money values are floats in USD. The business_date is echoed back from
    what the screen actually displayed, so the Supervisor can confirm it matches
    the run's target (a mismatch means we scraped the wrong day).
    """

    # Echoed from the screen for the pre-flight date check.
    business_date_shown: str = Field(
        description="The business date the Cash Summary screen displayed, as text."
    )

    deposit_adjustment_total: float
    sales_including_commissions_total: float
    commissions_total: float
    merchandise_sales_total: float

    commission_types: list[CommissionType] = Field(
        default_factory=list,
        description="Each commission type and its total, from the Commissions panel.",
    )

    volume_sales: float = Field(
        description="Volume Sales under Day Totals, from the Gas Sales panel. "
        "Used downstream for the gas-commissions formula."
    )

    def commissions_reconcile(self, tolerance: float = 0.01) -> bool:
        """
        Sanity check: the sum of individual commission-type totals should equal
        the reported Commissions Total (within a cent). This is a fragment-level
        check; the Supervisor does the cross-screen checks.
        """
        return abs(sum(c.total for c in self.commission_types) - self.commissions_total) <= tolerance
