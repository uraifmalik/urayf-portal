"""
Smoke test for the engine scaffold.

This test exists only to prove that:
  - pytest discovers and runs tests
  - The schema package imports cleanly
  - Pydantic is installed and working

Once Phase 1 has real Calculator tests, this file can stay as a sanity
check, or be deleted — either is fine.
"""

from schema.report_payload import PAYLOAD_SCHEMA_VERSION, DailyReportPayload


def test_schema_version_is_v1() -> None:
    """The locked payload schema version is 1.0."""
    assert PAYLOAD_SCHEMA_VERSION == "1.0"


def test_daily_report_payload_class_exists() -> None:
    """The root payload model is importable."""
    assert DailyReportPayload.__name__ == "DailyReportPayload"
