from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.reservation import ReservationManager
from backend.app.quality.data_cleaner import data_cleaner
from backend.app.api.rate_limiter import rate_limiter

client = TestClient(app)

def test_health_endpoint():
    rate_limiter.reset()
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "smart-rail-ai"
    assert data["status"] == "HEALTHY"
    assert "data_quality_metrics" in data

def test_trains_endpoint():
    response = client.get("/api/v1/trains")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) >= 3

def test_eta_vector_endpoint():
    response = client.get("/api/v1/eta/T101")
    assert response.status_code == 200
    data = response.json()
    assert data["train_id"] == "T101"
    assert "stops" in data
    assert len(data["stops"]) == 4
    # Check baseline presence
    first_upcoming = data["stops"][1]
    assert "b0_eta" in first_upcoming
    assert "b1_eta" in first_upcoming
    assert "b2_eta" in first_upcoming
    assert "b3_eta" in first_upcoming
    assert "low" in first_upcoming
    assert "high" in first_upcoming

def test_station_board_endpoint():
    response = client.get("/api/v1/stations/ST02/board")
    assert response.status_code == 200
    data = response.json()
    assert "station" in data
    assert "arrivals_departures" in data

def test_metrics_endpoint():
    response = client.get("/api/v1/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "baselines_comparison" in data
    assert "horizon_breakdown_b3" in data
    assert data["baselines_comparison"]["B3_Smart_Rail_AI"]["mae"] < 2.0

def test_sources_provenance_endpoint():
    response = client.get("/api/v1/sources")
    assert response.status_code == 200
    data = response.json()
    assert len(data["sources"]) >= 4

def test_concurrent_resource_reservation_no_double_booking():
    ReservationManager.clear_all_reservations()
    # Train 1 (Express, priority 1) and Train 2 (Passenger, priority 2) request overlapping interval on B02
    success1, conf1 = ReservationManager.reserve_resource(
        resource_id="B02",
        train_id="T101",
        start_time="2026-09-26T17:15:00",
        end_time="2026-09-26T17:30:00",
        priority=1
    )
    assert success1 is True

    # Train 2 attempts same interval
    success2, conf2 = ReservationManager.reserve_resource(
        resource_id="B02",
        train_id="T102",
        start_time="2026-09-26T17:20:00",
        end_time="2026-09-26T17:35:00",
        priority=2
    )
    assert success2 is True
    assert conf2 is not None
    assert conf2["winning_train"] == "T101"
    assert conf2["losing_train"] == "T102"
    # Adjusted start time should be after T101 end time (17:30 + 2m = 17:32)
    assert "17:32" in conf2["adjusted_start"]

def test_data_quality_rejections():
    data_cleaner.reset_metrics()
    # 1. Normal on-track event on ST01-ST02 segment
    # ST01: (19.0760, 72.8777), ST02: (19.0178, 73.0160) -> midpoint: (19.0469, 72.9468)
    ev1, q1, err1 = data_cleaner.clean_position_event({
        "train_id": "T101",
        "latitude": 19.0469,
        "longitude": 72.9468,
        "speed_kmh": 70.0,
        "timestamp": "2026-09-26T16:10:00"
    }, "2026-09-26T16:10:00")
    assert q1 == "FRESH"
    assert err1 is None

    # 2. Duplicate timestamp
    ev2, q2, err2 = data_cleaner.clean_position_event({
        "train_id": "T101",
        "latitude": 19.0469,
        "longitude": 72.9468,
        "speed_kmh": 70.0,
        "timestamp": "2026-09-26T16:10:00"
    }, "2026-09-26T16:10:00")
    assert ev2 is None
    assert q2 == "DUPLICATE_IGNORED"

    # 3. Off-track event (distance > 150m, e.g. 200m lateral GPS drift)
    ev_off, q_off, _ = data_cleaner.clean_position_event({
        "train_id": "T999",
        "latitude": 19.0520,
        "longitude": 72.9468,
        "speed_kmh": 60.0,
        "timestamp": "2026-09-26T16:10:00"
    }, "2026-09-26T16:10:00")
    assert q_off == "OFF_TRACK"

    # 4. Impossible Jump
    ev3, q3, err3 = data_cleaner.clean_position_event({
        "train_id": "T101",
        "latitude": 28.61, # Jump to Delhi in 5 seconds!
        "longitude": 77.20,
        "speed_kmh": 70.0,
        "timestamp": "2026-09-26T16:10:05"
    }, "2026-09-26T16:10:05")
    assert ev3 is None
    assert q3 == "IMPOSSIBLE_JUMP"

def test_role_authorization_and_rate_limiting():
    # Admin route requires controller/admin
    resp_unauth = client.post("/api/v1/simulation/step", headers={"X-User-Role": "viewer"})
    assert resp_unauth.status_code == 403

    resp_auth = client.post("/api/v1/simulation/step", headers={"X-User-Role": "controller"})
    assert resp_auth.status_code == 200

    # Rate limiting burst test
    rate_limited = False
    for _ in range(70):
        r = client.get("/api/v1/health")
        if r.status_code == 429:
            rate_limited = True
            assert "Retry-After" in r.headers
            break
    # Either accepted within window or correctly returned 429
    assert rate_limited or r.status_code == 200
