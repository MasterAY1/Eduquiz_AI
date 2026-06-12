"""SlowAPI rate-limiting configuration."""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize Limiter using IP address as default key evaluation
limiter = Limiter(key_func=get_remote_address)
