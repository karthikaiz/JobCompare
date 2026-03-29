import os
from dotenv import load_dotenv

load_dotenv()

AMBITIONBOX_DELAY_MIN = float(os.getenv("AMBITIONBOX_DELAY_MIN", "3.0"))
AMBITIONBOX_DELAY_MAX = float(os.getenv("AMBITIONBOX_DELAY_MAX", "6.0"))
CACHE_TTL_HOURS = int(os.getenv("CACHE_TTL_HOURS", "24"))
USER_AGENT = "JobCompare/1.0 (Educational Project; contact@jobcompare.dev)"
