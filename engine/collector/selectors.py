"""
7BOSS / 7REPORTS DOM selectors, isolated in one module.

Third-party sites change their markup without warning. When 7BOSS breaks the
Collector, the fix belongs HERE — not scattered through scraping logic. Keep
every selector in this file.

⚠️  STATUS: PLACEHOLDERS. These selectors are educated guesses, NOT verified
against the live 7BOSS site. Each one marked `# VERIFY` must be confirmed (and
almost certainly corrected) by inspecting the real page before the Collector
will work. Use the browser dev tools (or Claude Code with the page open) to
find the true selectors.

The values that are NOT guesses — the URLs and the human-readable menu paths —
come from Playbook v5 and are reliable.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# URLs (reliable — from Playbook v5)
# ---------------------------------------------------------------------------

BOSS_BASE_URL = "https://remoteportal.ris.7-eleven.com"
REPORTS_BASE_URL = "https://7-reports.cabnit.com"


# ---------------------------------------------------------------------------
# Login flow (PLACEHOLDERS — verify every one against the live login page)
# ---------------------------------------------------------------------------

class Login:
    # The username/password fields and submit button.
    USERNAME_INPUT = 'input[name="username"]'        # VERIFY
    PASSWORD_INPUT = 'input[name="password"]'        # VERIFY
    SUBMIT_BUTTON = 'button[type="submit"]'          # VERIFY

    # The SMS 2FA step. After submitting credentials, 7BOSS sends an SMS and
    # shows a code-entry field. These selectors locate that field and its
    # confirm button.
    SMS_CODE_INPUT = 'input[name="otp"]'             # VERIFY
    SMS_CONFIRM_BUTTON = 'button[type="submit"]'     # VERIFY

    # A selector that is present ONLY when login has fully succeeded (e.g. an
    # element on the post-login landing page). Used to confirm we're in.
    POST_LOGIN_MARKER = '[data-testid="dashboard"]'  # VERIFY


# ---------------------------------------------------------------------------
# Navigation: the hamburger menu and its paths (PLACEHOLDERS)
# ---------------------------------------------------------------------------

class Nav:
    HAMBURGER_MENU = 'button[aria-label="menu"]'     # VERIFY

    # Menu item text is reliable (from the playbook); how to click it is not.
    # We'll likely navigate by visible text using Playwright's get_by_text /
    # get_by_role rather than CSS selectors, which is more robust to markup
    # changes. The scraping code uses text where possible; these CSS selectors
    # are fallbacks.
    CASH_MANAGEMENT = 'text=Cash Management'                  # VERIFY
    CASH_SUMMARY_PROCESS = 'text=Cash Summary Process'        # VERIFY
    CASH_SUMMARY = 'text=Cash Summary'                        # VERIFY


# ---------------------------------------------------------------------------
# Screen 1.1 — Cash Summary (PLACEHOLDERS)
# ---------------------------------------------------------------------------

class CashSummary:
    # The date field. Playbook says "double-click the date field, enter the
    # date, click Apply."
    DATE_INPUT = 'input[name="businessDate"]'        # VERIFY
    APPLY_BUTTON = 'button:has-text("Apply")'        # VERIFY

    # The displayed business date (for the pre-flight check). May be the same
    # as DATE_INPUT's value, or a separate label.
    BUSINESS_DATE_DISPLAY = '[data-field="businessDate"]'   # VERIFY

    # The headline totals. These are the six values from Playbook v5 §1.1.
    # Almost certainly these live in labeled rows or a summary table; the real
    # selectors depend entirely on 7BOSS's markup.
    DEPOSIT_ADJUSTMENT_TOTAL = '[data-field="depositAdjustmentTotal"]'        # VERIFY
    SALES_INCLUDING_COMMISSIONS_TOTAL = '[data-field="salesInclComm"]'        # VERIFY
    COMMISSIONS_TOTAL = '[data-field="commissionsTotal"]'                     # VERIFY
    MERCHANDISE_SALES_TOTAL = '[data-field="merchandiseSalesTotal"]'          # VERIFY

    # The Commissions panel — clicking "Commissions" reveals a breakdown list.
    COMMISSIONS_TAB = 'text=Commissions'             # VERIFY
    COMMISSION_ROW = 'tr.commission-row'             # VERIFY — repeated element
    COMMISSION_ROW_NAME = 'td.commission-name'       # VERIFY — within a row
    COMMISSION_ROW_TOTAL = 'td.commission-total'     # VERIFY — within a row

    # The Gas Sales panel — clicking "Gas Sales" reveals Volume Sales.
    GAS_SALES_TAB = 'text=Gas Sales'                 # VERIFY
    VOLUME_SALES = '[data-field="volumeSales"]'      # VERIFY
