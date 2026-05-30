"""
Screen 1.1 — Cash Summary collector.

Per Playbook v5 §Layer 1, Screen 1.1. Navigates to the Cash Summary screen,
sets the target business date, and scrapes the six required values plus the
commission-type breakdown into a CashSummaryFragment.

⚠️ Uses unverified selectors (selectors.py). Structurally complete; will not
return correct data until selectors are confirmed against the live page.

Design notes:
  • Navigation prefers Playwright's text/role locators over brittle CSS where
    possible — menu labels from the playbook are stable, CSS class names are not.
  • Every scraped value goes through parse_money, which fails loudly on garbage.
  • The fragment is validated by Pydantic on construction; a missing value
    raises immediately, here at collection time.
"""

from __future__ import annotations

from collector.fragments import CashSummaryFragment, CommissionType
from collector.parsing import parse_money
from collector.selectors import CashSummary, Nav


async def collect_cash_summary(page, target_date: str) -> CashSummaryFragment:
    """
    Collect Screen 1.1 for the given target business date.

    Args:
        page: an authenticated Playwright page (from CollectorSession).
        target_date: the business date to collect, formatted as 7BOSS expects
            it in the date field (e.g. "01/12/2026"). The caller is responsible
            for formatting; the business-date math lives in the Engine wrapper.

    Returns:
        A validated CashSummaryFragment.

    Raises:
        Any Playwright error if navigation/selectors fail; MoneyParseError if a
        value can't be parsed; pydantic.ValidationError if the fragment is
        incomplete.
    """
    await _navigate_to_cash_summary(page)
    await _set_business_date(page, target_date)

    business_date_shown = await _read_text(page, CashSummary.BUSINESS_DATE_DISPLAY)

    deposit_adjustment_total = parse_money(
        await _read_text(page, CashSummary.DEPOSIT_ADJUSTMENT_TOTAL)
    )
    sales_including_commissions_total = parse_money(
        await _read_text(page, CashSummary.SALES_INCLUDING_COMMISSIONS_TOTAL)
    )
    commissions_total = parse_money(
        await _read_text(page, CashSummary.COMMISSIONS_TOTAL)
    )
    merchandise_sales_total = parse_money(
        await _read_text(page, CashSummary.MERCHANDISE_SALES_TOTAL)
    )

    commission_types = await _collect_commission_types(page)
    volume_sales = await _collect_volume_sales(page)

    return CashSummaryFragment(
        business_date_shown=business_date_shown,
        deposit_adjustment_total=deposit_adjustment_total,
        sales_including_commissions_total=sales_including_commissions_total,
        commissions_total=commissions_total,
        merchandise_sales_total=merchandise_sales_total,
        commission_types=commission_types,
        volume_sales=volume_sales,
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _navigate_to_cash_summary(page) -> None:
    """Open hamburger → Cash Management → Cash Summary Process → Cash Summary."""
    await page.click(Nav.HAMBURGER_MENU)
    await page.click(Nav.CASH_MANAGEMENT)
    await page.click(Nav.CASH_SUMMARY_PROCESS)
    await page.click(Nav.CASH_SUMMARY)


async def _set_business_date(page, target_date: str) -> None:
    """
    Set the date field per the playbook: double-click, enter date, click Apply.
    """
    await page.dblclick(CashSummary.DATE_INPUT)
    await page.fill(CashSummary.DATE_INPUT, target_date)
    await page.click(CashSummary.APPLY_BUTTON)
    # Give the screen a moment to refresh its totals after applying the date.
    await page.wait_for_load_state("networkidle")


async def _read_text(page, selector: str) -> str:
    """Read the trimmed text content of a single element."""
    element = await page.wait_for_selector(selector, timeout=10000)
    text = await element.text_content()
    return (text or "").strip()


async def _collect_commission_types(page) -> list[CommissionType]:
    """Click the Commissions panel and scrape each type + total."""
    await page.click(CashSummary.COMMISSIONS_TAB)
    rows = await page.query_selector_all(CashSummary.COMMISSION_ROW)

    results: list[CommissionType] = []
    for row in rows:
        name_el = await row.query_selector(CashSummary.COMMISSION_ROW_NAME)
        total_el = await row.query_selector(CashSummary.COMMISSION_ROW_TOTAL)
        if name_el is None or total_el is None:
            continue
        name = ((await name_el.text_content()) or "").strip()
        total_text = ((await total_el.text_content()) or "").strip()
        if not name:
            continue
        results.append(CommissionType(name=name, total=parse_money(total_text)))

    return results


async def _collect_volume_sales(page) -> float:
    """Click the Gas Sales panel and scrape Volume Sales."""
    await page.click(CashSummary.GAS_SALES_TAB)
    return parse_money(await _read_text(page, CashSummary.VOLUME_SALES))
