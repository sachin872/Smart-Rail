import time
import random
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from backend.app.core.db import get_db_connection
from backend.app.core.graph import rail_graph
from backend.app.quality.data_cleaner import data_cleaner
from backend.app.prediction.eta_engine import eta_engine
from backend.app.prediction.propagation import propagation_engine
from backend.app.resources.resource_manager import resource_manager

class TrainSimulator:
    def __init__(self):
        self.is_running = False
        self.sim_speed_multiplier = 1.0
        self.current_seed = 42
        self.active_scenario = "CLEAN_RUN"
        self.clock = datetime.fromisoformat("2026-09-26T16:10:00")
        self.train_states: Dict[str, Dict[str, Any]] = {}
        self.subscribers: List[Any] = []
        self.reset_simulation(seed=42)

    def reset_simulation(self, seed: int = 42):
        self.current_seed = seed
        random.seed(seed)
        self.clock = datetime.fromisoformat("2026-09-26T16:10:00")
        self.active_scenario = "CLEAN_RUN"
        data_cleaner.reset_metrics()

        # Initialize trains on corridor
        # T101 (Departed ST01 @ 16:05, currently on B01 heading to ST02)
        # T102 (At ST01 preparing dep @ 16:15)
        # T103 (At ST02 scheduled dep @ 16:35)
        # T104 (Departed ST04 on Down line @ 16:30 heading to ST03)
        st01 = rail_graph.get_station("ST01") or {"lat": 19.0760, "lon": 72.8777}
        st02 = rail_graph.get_station("ST02") or {"lat": 19.0178, "lon": 73.0160}
        st03 = rail_graph.get_station("ST03") or {"lat": 18.9894, "lon": 73.1175}
        st04 = rail_graph.get_station("ST04") or {"lat": 18.7500, "lon": 73.4200}

        # Interpolate initial position for T101 midway B01
        t101_lat = st01["lat"] + 0.45 * (st02["lat"] - st01["lat"])
        t101_lon = st01["lon"] + 0.45 * (st02["lon"] - st01["lon"])

        # Down train T104 midway B03
        t104_lat = st04["lat"] + 0.30 * (st03["lat"] - st04["lat"])
        t104_lon = st04["lon"] + 0.30 * (st03["lon"] - st04["lon"])

        self.train_states = {
            "T101": {
                "train_id": "T101",
                "train_name": "Deccan Superfast",
                "class": "EXPRESS",
                "priority": 1,
                "lat": t101_lat,
                "lon": t101_lon,
                "speed": 78.0,
                "block_id": "B01",
                "delay": 0.0,
                "quality": "FRESH",
                "current_stop_idx": 2,
                "target_station": "ST02",
                "progress_ratio": 0.45,
                "status": "RUNNING",
                "timestamp": self.clock.isoformat()
            },
            "T102": {
                "train_id": "T102",
                "train_name": "Local Commuter",
                "class": "PASSENGER",
                "priority": 2,
                "lat": st01["lat"],
                "lon": st01["lon"],
                "speed": 0.0,
                "block_id": "ST01_PF1",
                "delay": 0.0,
                "quality": "FRESH",
                "current_stop_idx": 1,
                "target_station": "ST01",
                "progress_ratio": 0.0,
                "status": "BOARDING",
                "timestamp": self.clock.isoformat()
            },
            "T103": {
                "train_id": "T103",
                "train_name": "Karjat Shuttle",
                "class": "PASSENGER",
                "priority": 2,
                "lat": st02["lat"],
                "lon": st02["lon"],
                "speed": 0.0,
                "block_id": "ST02_PF2",
                "delay": 0.0,
                "quality": "FRESH",
                "current_stop_idx": 1,
                "target_station": "ST02",
                "progress_ratio": 0.0,
                "status": "SCHEDULED",
                "timestamp": self.clock.isoformat()
            },
            "T104": {
                "train_id": "T104",
                "train_name": "Pragati Express (Down)",
                "class": "EXPRESS",
                "priority": 1,
                "lat": t104_lat,
                "lon": t104_lon,
                "speed": 72.0,
                "block_id": "B03_REV",
                "delay": 0.0,
                "quality": "FRESH",
                "current_stop_idx": 2,
                "target_station": "ST03",
                "progress_ratio": 0.30,
                "status": "RUNNING",
                "timestamp": self.clock.isoformat()
            }
        }

        # Clear events in DB and re-seed
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE events SET active = 0")
        cursor.execute("DELETE FROM resource_reservations")
        cursor.execute("DELETE FROM conflicts")
        cursor.execute("DELETE FROM resource_alerts")
        conn.commit()
        conn.close()

    def inject_scenario(self, scenario_name: str) -> Dict[str, Any]:
        """
        Applies one of the standard operational disruption scenarios.
        """
        self.active_scenario = scenario_name
        conn = get_db_connection()
        cursor = conn.cursor()
        now_str = self.clock.isoformat()

        if scenario_name == "RED_SIGNAL":
            cursor.execute(
                """
                INSERT OR REPLACE INTO events (event_id, type, target, start_time, duration_min, severity, parameters, active)
                VALUES ('EV_RED_01', 'RED_SIGNAL', 'SIG_B02', ?, 6.0, 1.0, '{"aspect": "RED"}', 1)
                """, (now_str,)
            )
            # T101 stops in front of signal
            if "T101" in self.train_states:
                self.train_states["T101"]["speed"] = 0.0
                self.train_states["T101"]["delay"] += 6.0
                self.train_states["T101"]["block_id"] = "B02"

        elif scenario_name == "HEAVY_RAIN":
            cursor.execute(
                """
                INSERT OR REPLACE INTO events (event_id, type, target, start_time, duration_min, severity, parameters, active)
                VALUES ('EV_RAIN_01', 'HEAVY_RAIN', 'ALL', ?, 20.0, 0.82, '{"rain_mm": 24.5, "speed_factor": 0.82}', 1)
                """, (now_str,)
            )
            for t_id, t_data in self.train_states.items():
                t_data["speed"] = max(20.0, t_data["speed"] * 0.82)
                t_data["delay"] += 3.5

        elif scenario_name == "SPEED_RESTRICTION":
            cursor.execute(
                """
                INSERT OR REPLACE INTO events (event_id, type, target, start_time, duration_min, severity, parameters, active)
                VALUES ('EV_TSR_01', 'SPEED_RESTRICTION', 'B02', ?, 30.0, 0.5, '{"speed_limit_kmh": 40.0}', 1)
                """, (now_str,)
            )
            if "T101" in self.train_states:
                self.train_states["T101"]["speed"] = 40.0
                self.train_states["T101"]["delay"] += 5.0

        elif scenario_name == "LC_CLOSURE":
            cursor.execute(
                """
                INSERT OR REPLACE INTO events (event_id, type, target, start_time, duration_min, severity, parameters, active)
                VALUES ('EV_LC_01', 'LC_CLOSURE', 'B02', ?, 4.0, 1.0, '{"gate_id": "LC_02"}', 1)
                """, (now_str,)
            )
            if "T101" in self.train_states:
                self.train_states["T101"]["delay"] += 4.0

        elif scenario_name == "UNSCHEDULED_STOP":
            cursor.execute(
                """
                INSERT OR REPLACE INTO events (event_id, type, target, start_time, duration_min, severity, parameters, active)
                VALUES ('EV_STOP_01', 'UNSCHEDULED_STOP', 'T101', ?, 8.0, 1.0, '{"reason": "Technical check"}', 1)
                """, (now_str,)
            )
            if "T101" in self.train_states:
                self.train_states["T101"]["speed"] = 0.0
                self.train_states["T101"]["delay"] += 8.0

        elif scenario_name == "GPS_DEGRADED":
            # Injects jitter + staleness into T101 GPS
            if "T101" in self.train_states:
                stale_clock = (self.clock - timedelta(seconds=140)).isoformat()
                raw_event = {
                    "train_id": "T101",
                    "latitude": self.train_states["T101"]["lat"] + 0.008, # Jitter
                    "longitude": self.train_states["T101"]["lon"] + 0.008,
                    "speed_kmh": 65.0,
                    "timestamp": stale_clock
                }
                cleaned, quality, _ = data_cleaner.clean_position_event(raw_event, self.clock.isoformat())
                if cleaned:
                    self.train_states["T101"]["quality"] = quality
                    self.train_states["T101"]["timestamp"] = stale_clock

        elif scenario_name == "SINGLE_TRACK_CROSSING":
            # T101 and T104 compete for single track section B02
            if "T101" in self.train_states and "T104" in self.train_states:
                self.train_states["T101"]["delay"] += 7.0 # Late Express
                self.train_states["T104"]["delay"] += 5.5 # Opposing train waiting at ST03 loop

        conn.commit()
        conn.close()

        return {"scenario": scenario_name, "status": "APPLIED", "sim_time": self.clock.isoformat()}

    def step_simulation(self, seconds: int = 60) -> Dict[str, Any]:
        """
        Advances the simulation clock by `seconds` and moves trains along the network graph.
        """
        self.clock += timedelta(seconds=seconds)
        clock_str = self.clock.isoformat()

        st01 = rail_graph.get_station("ST01") or {"lat": 19.0760, "lon": 72.8777}
        st02 = rail_graph.get_station("ST02") or {"lat": 19.0178, "lon": 73.0160}
        st03 = rail_graph.get_station("ST03") or {"lat": 18.9894, "lon": 73.1175}
        st04 = rail_graph.get_station("ST04") or {"lat": 18.7500, "lon": 73.4200}

        # Advance T101
        t101 = self.train_states.get("T101")
        if t101 and t101["status"] != "TERMINATED":
            t101["timestamp"] = clock_str
            prog = t101["progress_ratio"] + (0.04 * (t101["speed"] / 75.0))
            if prog > 1.0:
                # Move to next block B02
                t101["block_id"] = "B02"
                t101["current_stop_idx"] = 3
                t101["target_station"] = "ST03"
                t101["progress_ratio"] = 0.1
                t101["lat"] = st02["lat"] + 0.1 * (st03["lat"] - st02["lat"])
                t101["lon"] = st02["lon"] + 0.1 * (st03["lon"] - st02["lon"])
            else:
                t101["progress_ratio"] = prog
                t101["lat"] = st01["lat"] + prog * (st02["lat"] - st01["lat"])
                t101["lon"] = st01["lon"] + prog * (st02["lon"] - st01["lon"])

        # Check cascading propagation
        if t101 and t101["delay"] > 0:
            propagation_engine.calculate_network_propagation(
                primary_train_id="T101",
                primary_delay_min=t101["delay"],
                train_states=self.train_states
            )

        return {
            "clock": clock_str,
            "scenario": self.active_scenario,
            "trains": list(self.train_states.values())
        }

simulator = TrainSimulator()
