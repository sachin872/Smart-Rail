import os
import yaml
from pathlib import Path
from pydantic import BaseModel
from typing import Dict, Any, List

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
CONFIG_PATH = ROOT_DIR / "config" / "system_config.yaml"
DATA_DIR = ROOT_DIR / "data"
MODELS_DIR = ROOT_DIR / "backend" / "models"
DB_PATH = ROOT_DIR / "backend" / "data" / "smart_rail.db"

class SystemSettings:
    def __init__(self):
        self.config: Dict[str, Any] = {}
        self.load_config()

    def load_config(self):
        if CONFIG_PATH.exists():
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                self.config = yaml.safe_load(f) or {}
        else:
            self.config = {
                "version": "3.1.0",
                "railway_assumptions": {
                    "headway_min": 3.0,
                    "red_signal_wait_min": 4.0,
                    "rain_speed_factor": 0.82,
                    "lc_closure_min": 3.0,
                    "unscheduled_stop_min": 8.0,
                    "min_dwell_min_express": 2.0,
                    "min_dwell_min_passenger": 3.0,
                    "max_propagation_depth": 5,
                    "single_track_buffer_min": 2.0,
                },
                "data_quality_rules": {
                    "stale_after_s": 90,
                    "lost_after_s": 600,
                    "max_off_track_m": 150.0,
                    "max_speed_kmh": 160.0,
                    "conformal_alpha": 0.20,
                    "ewma_alpha": 0.20,
                },
                "rate_limiting": {
                    "enabled": True,
                    "read_rps": 30,
                    "write_rps": 10,
                    "admin_rps": 5,
                },
                "resource_thresholds": {
                    "platform_conflict_buffer_min": 3.0,
                    "coach_cleaning_turnaround_min": 30.0,
                    "crew_handover_min": 15.0,
                    "feeder_dispatch_threshold_min": 10.0,
                }
            }

    @property
    def assumptions(self) -> Dict[str, Any]:
        return self.config.get("railway_assumptions", {})

    @property
    def quality_rules(self) -> Dict[str, Any]:
        return self.config.get("data_quality_rules", {})

    @property
    def rate_limits(self) -> Dict[str, Any]:
        return self.config.get("rate_limiting", {})

    @property
    def resource_thresholds(self) -> Dict[str, Any]:
        return self.config.get("resource_thresholds", {})

settings = SystemSettings()
