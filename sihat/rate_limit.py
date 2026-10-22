from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request, status

_WINDOW_SECONDS = 60.0
_MAX_ENTRIES = 4096
_attempts: dict[str, deque[float]] = defaultdict(deque)
_lock = Lock()


def enforce_auth_rate_limit(request: Request, action: str, subject: str, limit: int = 10) -> None:
    client_host = request.client.host if request.client else "unknown"
    key = f"{client_host}:{action}:{subject.casefold()}"
    now = monotonic()

    with _lock:
        if key not in _attempts and len(_attempts) >= _MAX_ENTRIES:
            for stale_key, timestamps in list(_attempts.items()):
                if not timestamps or now - timestamps[-1] >= _WINDOW_SECONDS:
                    _attempts.pop(stale_key, None)
            if len(_attempts) >= _MAX_ENTRIES:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many authentication attempts; try again later",
                )
        timestamps = _attempts[key]
        while timestamps and now - timestamps[0] >= _WINDOW_SECONDS:
            timestamps.popleft()
        if len(timestamps) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many authentication attempts; try again later",
            )
        timestamps.append(now)


def clear_auth_rate_limits() -> None:
    with _lock:
        _attempts.clear()
