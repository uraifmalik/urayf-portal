"""
Dev harness: run the Cash Summary collector against live 7BOSS.

This is a DEVELOPMENT script — it runs headed (so you can watch), prompts you
for the SMS code at the terminal, collects Screen 1.1 for a date you specify,
and prints the resulting fragment. It does NOT write to the database; it just
proves the scrape works end to end.

Usage (from engine/, with Playwright installed):

    uv run python -m collector.dev_run --date 01/12/2026

Credentials come from environment variables so they never touch the code or the
repo:

    $env:BOSS_USERNAME = "your-username"
    $env:BOSS_PASSWORD = "your-password"

First-time Playwright setup (one time, installs the browser):

    uv run playwright install chromium

⚠️ The selectors in selectors.py are unverified. The first live run will almost
certainly fail at some selector — that's expected. Watch the headed browser to
see where it stops, inspect the real element, fix the selector in selectors.py,
and run again. Iterate until the fragment prints correctly.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys

from collector.cash_summary import collect_cash_summary
from collector.session import CollectorSession, prompt_for_code


async def main(target_date: str, storage_state: str | None) -> int:
    username = os.environ.get("BOSS_USERNAME")
    password = os.environ.get("BOSS_PASSWORD")
    if not username or not password:
        print(
            "ERROR: set BOSS_USERNAME and BOSS_PASSWORD environment variables first.",
            file=sys.stderr,
        )
        return 2

    print(f"Collecting Cash Summary for business date {target_date} ...", file=sys.stderr)
    print("A headed browser will open. Watch it. You'll be asked for the SMS code.\n", file=sys.stderr)

    try:
        async with CollectorSession(
            username,
            password,
            code_provider=prompt_for_code,
            headless=False,
            storage_state_path=storage_state,
        ) as session:
            fragment = await collect_cash_summary(session.page, target_date)
    except Exception as exc:  # noqa: BLE001 — dev harness, show everything
        print(f"\nFAILED: {type(exc).__name__}: {exc}", file=sys.stderr)
        print(
            "\nIf this was a selector timeout, open the headed browser's current "
            "page, find the real selector, and fix it in collector/selectors.py.",
            file=sys.stderr,
        )
        return 1

    print("\n=== Cash Summary fragment ===")
    print(fragment.model_dump_json(indent=2))

    if fragment.commissions_reconcile():
        print("\n✓ Commission types reconcile to the commissions total.")
    else:
        print(
            "\n⚠ Commission types do NOT sum to the commissions total — "
            "check the commission-row selectors.",
            file=sys.stderr,
        )

    print(
        "\nDate shown on screen was:",
        fragment.business_date_shown,
        "(confirm this matches your target date)",
    )
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dev run: Cash Summary collector.")
    parser.add_argument(
        "--date",
        required=True,
        help="Target business date as 7BOSS expects it, e.g. 01/12/2026",
    )
    parser.add_argument(
        "--storage-state",
        default=None,
        help="Optional path to persist/reuse session state (may reduce SMS prompts).",
    )
    args = parser.parse_args()

    exit_code = asyncio.run(main(args.date, args.storage_state))
    sys.exit(exit_code)
