"""
Collector session: browser lifecycle + 7BOSS login with SMS 2FA.

The session owns the authenticated Playwright page. Screens are collected
against that page. Login once, then visit screens — mirroring how a person
actually works.

THE SMS PROBLEM
---------------
7BOSS requires an SMS code on EVERY login. That code comes from a physical
phone. For unattended 7 AM runs this is the central challenge of the whole
Collector (see Playbook v5 and the project notes). This module does NOT solve
unattended SMS — it makes the code SOURCE pluggable via `code_provider`, so:

  • development:  code_provider = prompt_for_code  (you type it at the terminal)
  • production:   code_provider = <some automated source>  (decided pre-Phase 7)

Swapping dev → production is a one-argument change. The login flow never knows
which it's using.

⚠️  The selectors this module uses (from selectors.py) are UNVERIFIED guesses.
This code is structurally complete but will not successfully log in until the
selectors are confirmed against the live 7BOSS page.
"""

from __future__ import annotations

import sys
from collections.abc import Callable
from dataclasses import dataclass

# Playwright is imported lazily inside functions so this module can be imported
# (and its non-browser parts tested) in environments without Playwright.

from collector.selectors import Login, BOSS_BASE_URL

# A code provider is any zero-argument callable returning the SMS code string.
CodeProvider = Callable[[], str]


def prompt_for_code() -> str:
    """
    Development code provider: ask the human to type the SMS code.

    Used while building and testing the Collector, when you're sitting at the
    terminal. Production runs will inject a different provider.
    """
    print("\n  7BOSS sent an SMS code to your phone.", file=sys.stderr)
    code = input("  Enter the 6-digit code: ").strip()
    return code


@dataclass
class LoginError(Exception):
    """Raised when login fails at a known step, with which step for debugging."""

    step: str
    detail: str = ""

    def __str__(self) -> str:
        return f"login failed at {self.step}: {self.detail}" if self.detail else f"login failed at {self.step}"


class CollectorSession:
    """
    An authenticated 7BOSS browser session.

    Usage (async):
        async with CollectorSession(username, password, code_provider) as session:
            fragment = await collect_cash_summary(session.page, target_date)

    The context manager handles browser startup, login, and teardown.
    """

    def __init__(
        self,
        username: str,
        password: str,
        code_provider: CodeProvider = prompt_for_code,
        *,
        headless: bool = False,
        storage_state_path: str | None = None,
    ) -> None:
        self._username = username
        self._password = password
        self._code_provider = code_provider
        # Default to HEADED in development so you can watch what happens and
        # intervene. Production scheduling will set headless=True.
        self._headless = headless
        # If set, persist/reuse browser storage (cookies, localStorage) to
        # possibly skip re-login while a 7BOSS session is still alive. This is
        # how we MIGHT reduce SMS frequency — to be tested. None = no persistence.
        self._storage_state_path = storage_state_path

        self._playwright = None
        self._browser = None
        self._context = None
        self.page = None  # set after __aenter__

    async def __aenter__(self) -> "CollectorSession":
        from playwright.async_api import async_playwright

        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(headless=self._headless)

        # Reuse stored session state if we have it and it exists on disk.
        context_kwargs: dict = {}
        if self._storage_state_path:
            import os

            if os.path.exists(self._storage_state_path):
                context_kwargs["storage_state"] = self._storage_state_path

        self._context = await self._browser.new_context(**context_kwargs)
        self.page = await self._context.new_page()

        await self._ensure_logged_in()
        return self

    async def __aexit__(self, *exc) -> None:
        # Persist session state for potential reuse next run.
        if self._storage_state_path and self._context is not None:
            await self._context.storage_state(path=self._storage_state_path)
        if self._context is not None:
            await self._context.close()
        if self._browser is not None:
            await self._browser.close()
        if self._playwright is not None:
            await self._playwright.stop()

    async def _ensure_logged_in(self) -> None:
        """
        Navigate to 7BOSS and log in if not already authenticated.

        If a persisted session is still valid, the post-login marker will
        already be present and we skip the credential + SMS flow entirely.
        """
        page = self.page
        assert page is not None

        await page.goto(BOSS_BASE_URL, wait_until="domcontentloaded")

        # If we're already logged in (valid persisted session), we're done.
        if await self._looks_logged_in():
            return

        await self._do_login()

    async def _looks_logged_in(self) -> bool:
        """True if the post-login marker is visible within a short timeout."""
        page = self.page
        assert page is not None
        try:
            await page.wait_for_selector(Login.POST_LOGIN_MARKER, timeout=4000)
            return True
        except Exception:
            return False

    async def _do_login(self) -> None:
        """
        Perform the full credential + SMS 2FA login.

        ⚠️ Uses unverified selectors. Confirm against the live page.
        """
        page = self.page
        assert page is not None

        # Step 1: credentials.
        try:
            await page.fill(Login.USERNAME_INPUT, self._username)
            await page.fill(Login.PASSWORD_INPUT, self._password)
            await page.click(Login.SUBMIT_BUTTON)
        except Exception as exc:
            raise LoginError("credentials", str(exc)) from exc

        # Step 2: wait for the SMS code field to appear, then get the code.
        try:
            await page.wait_for_selector(Login.SMS_CODE_INPUT, timeout=15000)
        except Exception as exc:
            raise LoginError("waiting for SMS field", str(exc)) from exc

        # This call blocks until the code is available. In dev it prompts the
        # terminal; in production it'll come from an automated source.
        code = self._code_provider()
        if not code:
            raise LoginError("sms code", "code provider returned empty")

        # Step 3: submit the code.
        try:
            await page.fill(Login.SMS_CODE_INPUT, code)
            await page.click(Login.SMS_CONFIRM_BUTTON)
        except Exception as exc:
            raise LoginError("submitting SMS code", str(exc)) from exc

        # Step 4: confirm we actually got in.
        if not await self._looks_logged_in():
            raise LoginError(
                "post-login confirmation",
                "the post-login marker never appeared; code may have been wrong "
                "or the marker selector is incorrect",
            )
