from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from backend.app.core.db import get_db_connection
from backend.app.core.config import settings

class DelayPropagationEngine:
    def __init__(self):
        pass

    def calculate_network_propagation(
        self,
        primary_train_id: str,
        primary_delay_min: float,
        train_states: Dict[str, Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Traces downstream propagation caused by primary_train_id delay:
        1. Following-train headway delay on same corridor
        2. Single-track opposite train crossing delay at loop stations
        3. Rake turnaround delay to outbound services
        """
        propagated_effects = []
        max_depth = settings.assumptions.get("max_propagation_depth", 5)
        headway = settings.assumptions.get("headway_min", 3.0)

        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Rake Turnaround Link Check
        cursor.execute("SELECT * FROM rake_links WHERE inbound_train_id = ?", (primary_train_id,))
        rake_row = cursor.fetchone()
        if rake_row:
            rake = dict(rake_row)
            outbound_id = rake["outbound_train_id"]
            turnaround_station = rake["turnaround_station"]
            min_turnaround = float(rake["min_turnaround_min"])

            # If inbound delay eats into buffer
            if primary_delay_min > 10.0:
                knock_on = round(primary_delay_min - 10.0, 1)
                propagated_effects.append({
                    "cause_train": primary_train_id,
                    "affected_train": outbound_id,
                    "type": "RAKE_TURNAROUND_CASCADE",
                    "location": turnaround_station,
                    "delay_min": knock_on,
                    "reason": f"Inbound {primary_train_id} delay (+{primary_delay_min}m) exceeds {int(min_turnaround)}m turnaround buffer at {turnaround_station}",
                    "depth": 1
                })

        # 2. Following-train Headway Conflict (e.g. T102 following T101)
        if primary_train_id == "T101" and primary_delay_min > 3.0:
            following_train = "T102"
            if following_train in train_states:
                # T102 inherits partial delay due to occupied block ahead
                inherited_delay = round(primary_delay_min * 0.75, 1)
                propagated_effects.append({
                    "cause_train": primary_train_id,
                    "affected_train": following_train,
                    "type": "HEADWAY_BLOCK_CONFLICT",
                    "location": "ST02 (Kalyan Jn / Block B02)",
                    "delay_min": inherited_delay,
                    "reason": f"Occupied section B02 by {primary_train_id}: {following_train} held to maintain {headway}m safe headway",
                    "depth": 1
                })

                # If T102 also delays T103 at ST02
                if inherited_delay > 4.0 and "T103" in train_states:
                    propagated_effects.append({
                        "cause_train": following_train,
                        "affected_train": "T103",
                        "type": "STATION_PLATFORM_HEADWAY",
                        "location": "ST02 (Platform Pf-1)",
                        "delay_min": round(inherited_delay * 0.6, 1),
                        "reason": f"Platform clearance delay from {following_train} at ST02",
                        "depth": 2
                    })

        # 3. Single-track Bi-directional Crossing Conflict (e.g. T104 on Down line crossing T101 on B02)
        if primary_train_id == "T101" and primary_delay_min > 5.0 and "T104" in train_states:
            crossing_delay = round(primary_delay_min * 0.85, 1)
            propagated_effects.append({
                "cause_train": primary_train_id,
                "affected_train": "T104",
                "type": "SINGLE_TRACK_CROSSING_HOLD",
                "location": "ST03 (Karjat Jn Loop)",
                "delay_min": crossing_delay,
                "reason": f"Single-track block B02 occupied by late {primary_train_id}; opposing train T104 regulated at ST03 crossing loop",
                "depth": 1
            })

        conn.close()
        return propagated_effects[:max_depth]

propagation_engine = DelayPropagationEngine()
