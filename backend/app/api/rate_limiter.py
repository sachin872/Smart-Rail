import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from backend.app.core.config import settings

class RateLimiter:
    def __init__(self):
        # Stores client_ip -> (tokens, last_refreshed_ts)
        self.clients: Dict[str, Tuple[float, float]] = {}

    def reset(self):
        self.clients.clear()

    def check_rate_limit(self, client_ip: str, role: str = "viewer") -> bool:
        if not settings.rate_limits.get("enabled", True):
            return True

        limits = {
            "viewer": settings.rate_limits.get("read_rps", 60),
            "controller": settings.rate_limits.get("write_rps", 30),
            "admin": settings.rate_limits.get("admin_rps", 20),
        }
        max_rate = limits.get(role, 60)

        key = f"{client_ip}:{role}"
        now = time.time()
        tokens, last_time = self.clients.get(key, (float(max_rate), now))

        # Replenish tokens
        elapsed = max(0.0, now - last_time)
        tokens = min(float(max_rate), tokens + elapsed * max_rate)

        if tokens >= 1.0:
            tokens -= 1.0
            self.clients[key] = (tokens, now)
            return True
        else:
            self.clients[key] = (tokens, now)
            return False

rate_limiter = RateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Determine requested action role
    path = request.url.path
    role = "viewer"
    if "/model/retrain" in path or "/reset" in path:
        role = "admin"
    elif "/events" in path or "/simulation" in path or "/whatif" in path:
        role = "controller"

    # Enforce rate limit
    if not rate_limiter.check_rate_limit(client_ip, role):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "Rate limit exceeded",
                "message": f"Client {client_ip} exceeded maximum permitted rate for role '{role}'. Please back off.",
                "retry_after_seconds": 1
            },
            headers={"Retry-After": "1"}
        )

    response = await call_next(request)
    return response
