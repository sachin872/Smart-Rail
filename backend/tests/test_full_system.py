import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.api.rate_limiter import rate_limiter

client = TestClient(app)

def test_full_api_lifecycle():
    rate_limiter.reset()
    # 1. Health
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"

    # 2. Reset Simulation
    res = client.post("/api/v1/simulation/reset", json={"scenario": "RESET", "seed": 42}, headers={"X-User-Role": "admin"})
    assert res.status_code == 200

    # 3. Train list & detail
    res = client.get("/api/v1/trains")
    assert res.status_code == 200
    assert len(res.json()["data"]) >= 4

    res = client.get("/api/v1/trains/T101")
    assert res.status_code == 200
    assert res.json()["train_id"] == "T101"

    # 4. Multi-station ETA vector
    res = client.get("/api/v1/eta/T101")
    assert res.status_code == 200
    eta = res.json()
    assert eta["train_id"] == "T101"
    assert len(eta["stops"]) == 4
    for stop in eta["stops"]:
        assert "b0_eta" in stop
        assert "b1_eta" in stop
        assert "b2_eta" in stop
        assert "b3_eta" in stop
        assert "low" in stop
        assert "high" in stop

    # 5. Station Board
    res = client.get("/api/v1/stations/ST02/board")
    assert res.status_code == 200
    assert res.json()["station"]["code"] == "ST02"
    assert len(res.json()["arrivals_departures"]) >= 1

    # 6. Disruption Injection (RED_SIGNAL)
    res = client.post("/api/v1/simulation/scenario", json={"scenario": "RED_SIGNAL", "seed": 42}, headers={"X-User-Role": "controller"})
    assert res.status_code == 200

    # 7. Check ETA responded to disruption
    res = client.get("/api/v1/eta/T101")
    assert res.status_code == 200
    updated_eta = res.json()
    assert any("RED_SIGNAL" in str(s["reasons"]) for s in updated_eta["stops"])

    # 8. Check Conflicts & Cascade
    res = client.get("/api/v1/conflicts")
    assert res.status_code == 200

    # 9. Advisory What-If
    res = client.get("/api/v1/whatif/CONF-DEFAULT")
    assert res.status_code == 200
    whatif = res.json()
    assert whatif["advisory"] is True
    assert len(whatif["candidates"]) >= 3
    assert "ADVISORY" in whatif["safety_disclaimer"]

    # 10. Resource Alerts
    res = client.get("/api/v1/resources/alerts")
    assert res.status_code == 200
    assert "alerts" in res.json()

    # 11. Multilingual Notifications
    res = client.get("/api/v1/notifications/T101")
    assert res.status_code == 200
    notifs = res.json()
    assert "en" in notifs
    assert "hi" in notifs
    assert "mr" in notifs

    # 12. Simulation Step
    res = client.post("/api/v1/simulation/step", headers={"X-User-Role": "controller"})
    assert res.status_code == 200
    assert "clock" in res.json()

    # 13. Metrics & Drift
    res = client.get("/api/v1/metrics")
    assert res.status_code == 200
    assert "baselines_comparison" in res.json()
    assert "drift_status" in res.json()

    # 14. Data Sources & Provenance
    res = client.get("/api/v1/sources")
    assert res.status_code == 200
    assert len(res.json()["sources"]) >= 4

    # 15. Weather Calibration
    res = client.post("/api/v1/weather/calibrate", headers={"X-User-Role": "admin"})
    assert res.status_code == 200
    assert res.json()["provenance"] == "SIM_CALIBRATED"

    # 16. Retrain Model
    res = client.post("/api/v1/model/retrain", headers={"X-User-Role": "admin"})
    assert res.status_code == 200
    assert res.json()["status"] == "PROMOTED_CHAMPION"
