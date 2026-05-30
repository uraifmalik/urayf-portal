"""Tests for the money-parsing helper."""

import pytest

from collector.parsing import MoneyParseError, parse_money


class TestParseMoneyValid:
    def test_plain_number(self) -> None:
        assert parse_money("443.24") == 443.24

    def test_currency_symbol(self) -> None:
        assert parse_money("$6,537.97") == 6537.97

    def test_thousands_separator(self) -> None:
        assert parse_money("9,566.34") == 9566.34

    def test_large_number_multiple_separators(self) -> None:
        assert parse_money("$1,234,567.89") == 1234567.89

    def test_parenthesized_negative(self) -> None:
        assert parse_money("(21.91)") == -21.91

    def test_parenthesized_negative_with_currency(self) -> None:
        assert parse_money("($21.91)") == -21.91

    def test_leading_minus(self) -> None:
        assert parse_money("-$21.91") == -21.91

    def test_leading_minus_no_currency(self) -> None:
        assert parse_money("-208.82") == -208.82

    def test_zero(self) -> None:
        assert parse_money("$0.00") == 0.0

    def test_whitespace_padding(self) -> None:
        assert parse_money("  $443.24  ") == 443.24

    def test_no_decimals(self) -> None:
        assert parse_money("$3,000") == 3000.0

    def test_negative_zero_normalizes(self) -> None:
        # -0.0 == 0.0 in float comparison, which is what we want.
        assert parse_money("($0.00)") == 0.0


class TestParseMoneyInvalid:
    def test_none(self) -> None:
        with pytest.raises(MoneyParseError):
            parse_money(None)  # type: ignore[arg-type]

    def test_empty(self) -> None:
        with pytest.raises(MoneyParseError):
            parse_money("")

    def test_whitespace_only(self) -> None:
        with pytest.raises(MoneyParseError):
            parse_money("   ")

    def test_no_numeric_content(self) -> None:
        with pytest.raises(MoneyParseError):
            parse_money("N/A")

    def test_bare_decimal_point(self) -> None:
        with pytest.raises(MoneyParseError):
            parse_money(".")

    def test_multiple_decimals(self) -> None:
        # A mis-scrape that concatenated two numbers should fail loudly.
        with pytest.raises(MoneyParseError):
            parse_money("12.34.56")


class TestCommissionsReconcile:
    def test_reconcile_passes(self) -> None:
        from collector.fragments import CashSummaryFragment, CommissionType

        frag = CashSummaryFragment(
            business_date_shown="01/12/2026",
            deposit_adjustment_total=100.0,
            sales_including_commissions_total=6537.97,
            commissions_total=507.18,
            merchandise_sales_total=5812.04,
            commission_types=[
                CommissionType(name="Lottery", total=300.18),
                CommissionType(name="Money Orders", total=207.00),
            ],
            volume_sales=14583.33,
        )
        assert frag.commissions_reconcile()

    def test_reconcile_fails_on_mismatch(self) -> None:
        from collector.fragments import CashSummaryFragment, CommissionType

        frag = CashSummaryFragment(
            business_date_shown="01/12/2026",
            deposit_adjustment_total=100.0,
            sales_including_commissions_total=6537.97,
            commissions_total=507.18,
            merchandise_sales_total=5812.04,
            commission_types=[
                CommissionType(name="Lottery", total=300.18),
            ],
            volume_sales=14583.33,
        )
        assert not frag.commissions_reconcile()
