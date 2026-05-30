"""
Parsing helpers for values scraped as text from 7BOSS.

7BOSS renders money as display strings like "$6,537.97", "(21.91)" for
negatives, or "-$21.91". Converting these to floats correctly is exactly the
kind of unglamorous code that silently corrupts a report if done sloppily, so
it lives in one tested place.
"""

from __future__ import annotations

import re


class MoneyParseError(ValueError):
    """Raised when a string can't be parsed as a money value."""


def parse_money(text: str) -> float:
    """
    Parse a money display string into a float.

    Handles:
      - Currency symbols and thousands separators: "$6,537.97" -> 6537.97
      - Parenthesized negatives (accounting style): "(21.91)" -> -21.91
      - Leading-minus negatives: "-$21.91" -> -21.91
      - Plain numbers: "443.24" -> 443.24
      - Surrounding whitespace

    Raises MoneyParseError on anything it can't confidently parse, rather than
    guessing — a wrong number is worse than a loud failure.
    """
    if text is None:
        raise MoneyParseError("cannot parse money from None")

    raw = text.strip()
    if not raw:
        raise MoneyParseError("cannot parse money from empty string")

    negative = False

    # Accounting-style parentheses denote a negative.
    if raw.startswith("(") and raw.endswith(")"):
        negative = True
        raw = raw[1:-1].strip()

    # Leading minus.
    if raw.startswith("-"):
        negative = True
        raw = raw[1:].strip()

    # Strip currency symbols and thousands separators. Keep digits and the
    # decimal point only.
    cleaned = re.sub(r"[^\d.]", "", raw)

    if cleaned == "" or cleaned == ".":
        raise MoneyParseError(f"no numeric content in {text!r}")

    # Guard against multiple decimal points (e.g. a mis-scrape concatenating
    # two numbers) — better to fail than to silently produce garbage.
    if cleaned.count(".") > 1:
        raise MoneyParseError(f"ambiguous number (multiple decimals) in {text!r}")

    try:
        value = float(cleaned)
    except ValueError as exc:
        raise MoneyParseError(f"could not parse {text!r} as a number") from exc

    return -value if negative else value
