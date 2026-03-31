import asyncio
import random
import time
from urllib.parse import urlparse

import httpx
from config import AMBITIONBOX_DELAY_MIN, AMBITIONBOX_DELAY_MAX, USER_AGENT

ALLOWED_DOMAINS = {"www.ambitionbox.com", "ambitionbox.com"}


class BaseScraper:
    """Base scraper with ethical rate limiting and shared HTTP client."""

    def __init__(
        self,
        min_delay: float = AMBITIONBOX_DELAY_MIN,
        max_delay: float = AMBITIONBOX_DELAY_MAX,
    ):
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.semaphore = asyncio.Semaphore(1)
        self.last_request_time = 0.0
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
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

    async def _throttle(self):
        elapsed = time.time() - self.last_request_time
        delay = random.uniform(self.min_delay, self.max_delay)
        if elapsed < delay:
            await asyncio.sleep(delay - elapsed)
        self.last_request_time = time.time()

    async def fetch(self, url: str) -> str:
        # Validate URL domain to prevent SSRF
        parsed = urlparse(url)
        if parsed.hostname not in ALLOWED_DOMAINS:
            raise ValueError(f"URL domain '{parsed.hostname}' is not allowed")

        async with self.semaphore:
            await self._throttle()
            async with httpx.AsyncClient(
                headers=self.headers,
                timeout=30.0,
                follow_redirects=True,
            ) as client:
                response = await client.get(url)
                response.raise_for_status()

                # Verify redirect didn't escape to a different domain
                final_host = urlparse(str(response.url)).hostname
                if final_host not in ALLOWED_DOMAINS:
                    raise ValueError(f"Redirect to disallowed domain: {final_host}")

                return response.text
