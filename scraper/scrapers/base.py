import asyncio
import random
import time
from urllib.parse import urlparse

import httpx
from config import AMBITIONBOX_DELAY_MIN, AMBITIONBOX_DELAY_MAX, USER_AGENT

ALLOWED_DOMAINS = {"www.ambitionbox.com", "ambitionbox.com"}

# Rotate user agents to reduce fingerprinting
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
]


class BaseScraper:
    """Base scraper with ethical rate limiting and shared HTTP client.

    Uses a persistent session (cookie jar + connection pool) across all
    requests, which is more realistic browser behaviour and avoids
    triggering bot-detection on sites like AmbitionBox.
    """

    def __init__(
        self,
        min_delay: float = AMBITIONBOX_DELAY_MIN,
        max_delay: float = AMBITIONBOX_DELAY_MAX,
    ):
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.semaphore = asyncio.Semaphore(1)
        self.last_request_time = 0.0
        self._client: httpx.AsyncClient | None = None
        self._warmed_up = False

        # Pick a random UA for the whole session (real browsers don't change mid-session)
        self._user_agent = random.choice(USER_AGENTS)
        self.headers = {
            "User-Agent": self._user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"macOS"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        }

    async def _get_client(self) -> httpx.AsyncClient:
        """Return the persistent HTTP client, creating it if needed."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers=self.headers,
                timeout=30.0,
                follow_redirects=True,
                # Persist cookies across requests (like a real browser)
                cookies=httpx.Cookies(),
            )
        return self._client

    async def warmup(self):
        """Visit the homepage to establish cookies and a realistic session.

        Many sites set tracking/session cookies on the first visit.
        Without them, subsequent page requests look suspicious.
        """
        if self._warmed_up:
            return
        try:
            client = await self._get_client()
            await self._throttle()
            print("  [warmup] Visiting AmbitionBox homepage to establish session...")
            resp = await client.get("https://www.ambitionbox.com/")
            print(f"  [warmup] Status: {resp.status_code}, Cookies: {len(resp.cookies)}")
            self._warmed_up = True
            # Extra delay after warmup to look natural
            await asyncio.sleep(random.uniform(2.0, 4.0))
        except Exception as e:
            print(f"  [warmup] Warning: homepage warmup failed: {e}")
            # Continue anyway — warmup is best-effort

    async def close(self):
        """Close the persistent HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None
        self._warmed_up = False

    async def _throttle(self):
        elapsed = time.time() - self.last_request_time
        delay = random.uniform(self.min_delay, self.max_delay)
        if elapsed < delay:
            await asyncio.sleep(delay - elapsed)
        self.last_request_time = time.time()

    async def fetch(self, url: str, retries: int = 2) -> str:
        """Fetch a URL with retry logic and bot-detection diagnostics.

        Args:
            url: The URL to fetch.
            retries: Number of retry attempts on failure (default 2).
        """
        # Validate URL domain to prevent SSRF
        parsed = urlparse(url)
        if parsed.hostname not in ALLOWED_DOMAINS:
            raise ValueError(f"URL domain '{parsed.hostname}' is not allowed")

        # Ensure session is warmed up
        await self.warmup()

        last_error = None
        for attempt in range(1 + retries):
            async with self.semaphore:
                await self._throttle()
                try:
                    client = await self._get_client()

                    # Set Referer to look like natural navigation
                    extra_headers = {"Referer": "https://www.ambitionbox.com/"}
                    response = await client.get(url, headers=extra_headers)
                    response.raise_for_status()

                    # Verify redirect didn't escape to a different domain
                    final_host = urlparse(str(response.url)).hostname
                    if final_host not in ALLOWED_DOMAINS:
                        raise ValueError(f"Redirect to disallowed domain: {final_host}")

                    html = response.text

                    # Detect bot-detection pages
                    if self._is_blocked_page(html):
                        msg = f"Bot detection page received (attempt {attempt + 1}/{1 + retries})"
                        print(f"    [fetch] {msg}")
                        if attempt < retries:
                            backoff = (attempt + 1) * random.uniform(5.0, 10.0)
                            print(f"    [fetch] Retrying in {backoff:.1f}s...")
                            await asyncio.sleep(backoff)
                            # Reset session on blocked response
                            await self.close()
                            self._warmed_up = False
                            continue
                        raise ValueError(
                            f"Blocked by bot detection after {1 + retries} attempts. "
                            f"Page title: {self._extract_title(html)}"
                        )

                    return html

                except httpx.HTTPStatusError as e:
                    last_error = e
                    if e.response.status_code == 429:
                        # Rate limited — back off significantly
                        backoff = (attempt + 1) * random.uniform(15.0, 30.0)
                        print(f"    [fetch] Rate limited (429). Waiting {backoff:.1f}s...")
                        await asyncio.sleep(backoff)
                        continue
                    elif e.response.status_code in (403, 503):
                        backoff = (attempt + 1) * random.uniform(8.0, 15.0)
                        print(f"    [fetch] {e.response.status_code} response. Retrying in {backoff:.1f}s...")
                        await asyncio.sleep(backoff)
                        continue
                    raise
                except (httpx.ConnectError, httpx.ReadTimeout) as e:
                    last_error = e
                    if attempt < retries:
                        backoff = (attempt + 1) * random.uniform(5.0, 10.0)
                        print(f"    [fetch] Connection error: {e}. Retrying in {backoff:.1f}s...")
                        await asyncio.sleep(backoff)
                        continue
                    raise

        raise last_error or ValueError("Fetch failed after all retries")

    def _is_blocked_page(self, html: str) -> bool:
        """Detect common bot-detection / CAPTCHA pages."""
        blocked_indicators = [
            "cf-browser-verification",  # Cloudflare
            "challenge-platform",       # Cloudflare challenge
            "captcha",                  # Generic CAPTCHA
            "blocked",                  # Generic block
            "access denied",            # Generic denial
            "please verify you are a human",
            "ray id",                   # Cloudflare ray ID
            "checking your browser",    # Cloudflare interstitial
        ]
        html_lower = html[:5000].lower()  # Only check the first 5KB
        return any(indicator in html_lower for indicator in blocked_indicators)

    def _extract_title(self, html: str) -> str:
        """Extract <title> from HTML for diagnostics."""
        import re
        match = re.search(r"<title[^>]*>(.*?)</title>", html[:3000], re.DOTALL | re.IGNORECASE)
        return match.group(1).strip()[:100] if match else "(no title)"
