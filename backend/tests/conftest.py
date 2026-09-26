import pytest
from backend.app.api.rate_limiter import rate_limiter

@pytest.fixture(autouse=True)
def reset_rate_limits():
    rate_limiter.reset()
    yield
    rate_limiter.reset()
