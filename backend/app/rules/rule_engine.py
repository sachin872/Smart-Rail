import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from backend.app.core.config import settings
from backend.app.core.db import get_db_connection

class RailwayRuleEngine:
    def __init__(self):
        pass

    def get_active_events(self) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE active = 1")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    def calculate_deterministic_delays(
        self,
        train_id: str,
        train_class: str,
        segment_id: str,
        station_code: str,
        planned_arrival_time: str,
        weather_rain_mm: float = 0.0
    ) -> Tuple[float, float, List[str]]:
        """
        Calculates:
        1. extra_travel_time_min: deterministic increase in transit time on this segment
        2. extra_wait_time_min: stationary delays (red signal, platform conflict, LC closure, unscheduled halt)
        3. named_reasons: list of formatted string reasons for delay attribution
        """
        extra_travel_time_min = 0.0
        extra_wait_time_min = 0.0
        named_reasons: List[str] = []

        active_events = self.get_active_events()
        assumptions = settings.assumptions

        for ev in active_events:
            ev_type = ev["type"]
            target = ev["target"]
            duration = float(ev.get("duration_min", 0.0))

            # 1. RED Signal
            if ev_type == "RED_SIGNAL" and (target == f"SIG_{segment_id}" or target == segment_id):
                wait = duration if duration > 0 else assumptions.get("red_signal_wait_min", 4.0)
                extra_wait_time_min += wait
                named_reasons.append(f"RED_SIGNAL({target}): +{wait:.1f}m")

            # 2. Level Crossing Closure
            elif ev_type == "LC_CLOSURE" and (target == segment_id or target == f"LC_{segment_id}"):
                wait = duration if duration > 0 else assumptions.get("lc_closure_min", 3.0)
                extra_wait_time_min += wait
                named_reasons.append(f"LEVEL_CROSSING({target}): +{wait:.1f}m")

            # 3. Unscheduled Stoppage
            elif ev_type == "UNSCHEDULED_STOP" and target == train_id:
                wait = duration if duration > 0 else assumptions.get("unscheduled_stop_min", 8.0)
                extra_wait_time_min += wait
                named_reasons.append(f"UNSCHEDULED_STOP({train_id}): +{wait:.1f}m")

            # 4. Temporary Speed Restriction (TSR)
            elif ev_type == "SPEED_RESTRICTION" and target == segment_id:
                # Segment travel time increase
                params = json.loads(ev.get("parameters") or "{}")
                restricted_speed = float(params.get("speed_limit_kmh", 40.0))
                # Assuming typical 18km segment at 75 km/h (14.4m) vs 40 km/h (27m) => +12.6m
                added_transit = duration if duration > 0 else 6.5
                extra_travel_time_min += added_transit
                named_reasons.append(f"SPEED_RESTRICTION({segment_id} @ {int(restricted_speed)}km/h): +{added_transit:.1f}m")

            # 5. Maintenance / Emergency Track Block
            elif ev_type in ("MAINTENANCE_BLOCK", "EMERGENCY_BLOCK") and target == segment_id:
                wait = duration if duration > 0 else 15.0
                extra_wait_time_min += wait
                named_reasons.append(f"TRACK_MAINTENANCE({segment_id}): +{wait:.1f}m")

            # 6. Monsoon / Rain Event
            elif ev_type == "HEAVY_RAIN" and (target == "ALL" or target == segment_id):
                rain_factor = assumptions.get("rain_speed_factor", 0.82)
                # Slowdown from factor
                added_weather_time = 3.0
                extra_travel_time_min += added_weather_time
                named_reasons.append(f"MONSOON_RAIN(Speed Factor {rain_factor:.2f}): +{added_weather_time:.1f}m")

        # 7. Live Weather Input (if rain_mm > 5.0 and not already covered by scenario)
        if weather_rain_mm > 5.0 and not any("MONSOON" in r for r in named_reasons):
            rain_factor = assumptions.get("rain_speed_factor", 0.82)
            weather_time = 2.0
            extra_travel_time_min += weather_time
            named_reasons.append(f"WEATHER_RAIN({weather_rain_mm:.1f}mm): +{weather_time:.1f}m")

        return extra_travel_time_min, extra_wait_time_min, named_reasons

rule_engine = RailwayRuleEngine()
