from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
from backend.app.core.graph import rail_graph
from backend.app.core.config import settings

class DataQualityCleaner:
    def __init__(self):
        self.last_accepted: Dict[str, Dict[str, Any]] = {}
        self.metrics = {
            "total_events": 0,
            "accepted": 0,
            "duplicate_or_out_of_order": 0,
            "impossible_jumps": 0,
            "off_track": 0,
            "stale": 0,
            "lost": 0,
        }

    def reset_metrics(self):
        self.last_accepted.clear()
        self.metrics = {
            "total_events": 0,
            "accepted": 0,
            "duplicate_or_out_of_order": 0,
            "impossible_jumps": 0,
            "off_track": 0,
            "stale": 0,
            "lost": 0,
        }

    def parse_iso(self, ts_str: str) -> datetime:
        if "T" not in ts_str and " " in ts_str:
            ts_str = ts_str.replace(" ", "T")
        try:
            return datetime.fromisoformat(ts_str)
        except Exception:
            return datetime.now()

    def clean_position_event(
        self,
        event: Dict[str, Any],
        current_time_iso: Optional[str] = None
    ) -> Tuple[Optional[Dict[str, Any]], str, Optional[str]]:
        """
        Validates and cleans incoming GPS position event.
        Returns (cleaned_event_or_none, quality_status, rejection_reason)
        """
        self.metrics["total_events"] += 1
        train_id = event.get("train_id")
        if not train_id:
            return None, "DATA_ERROR", "Missing train_id"

        raw_ts = event.get("timestamp") or datetime.now().isoformat()
        current_time = self.parse_iso(current_time_iso) if current_time_iso else datetime.now()
        event_time = self.parse_iso(raw_ts)

        last = self.last_accepted.get(train_id)

        # 1. Duplicate / Out-of-order check
        if last:
            last_time = self.parse_iso(last["timestamp"])
            if event_time <= last_time:
                self.metrics["duplicate_or_out_of_order"] += 1
                return None, "DUPLICATE_IGNORED", f"Timestamp {raw_ts} <= last accepted {last['timestamp']}"

        # 2. Impossible Jump / Max Speed check
        lat = float(event.get("latitude", 0.0))
        lon = float(event.get("longitude", 0.0))
        reported_speed = float(event.get("speed_kmh", 0.0))

        if last:
            last_lat = float(last["latitude"])
            last_lon = float(last["longitude"])
            last_time = self.parse_iso(last["timestamp"])
            
            time_delta_h = abs((event_time - last_time).total_seconds()) / 3600.0
            if time_delta_h > 0.0001:
                dist_km = rail_graph.calculate_geo_distance(last_lat, last_lon, lat, lon)
                implied_speed = dist_km / time_delta_h
                max_speed = settings.quality_rules.get("max_speed_kmh", 160.0)
                if implied_speed > max_speed:
                    self.metrics["impossible_jumps"] += 1
                    # Reject jump, retain last good
                    return None, "IMPOSSIBLE_JUMP", f"Implied speed {implied_speed:.1f} km/h exceeds limit {max_speed} km/h"

        # 3. GPS Map Matching / Off-Track Detection
        snapped_lat, snapped_lon, distance_m, matched_block = rail_graph.snap_to_track(lat, lon)
        max_off_track = settings.quality_rules.get("max_off_track_m", 150.0)
        
        quality = "FRESH"
        if distance_m > max_off_track:
            self.metrics["off_track"] += 1
            quality = "OFF_TRACK"

        # 4. Staleness / Lost Evaluation
        age_seconds = (current_time - event_time).total_seconds()
        stale_threshold = settings.quality_rules.get("stale_after_s", 90)
        lost_threshold = settings.quality_rules.get("lost_after_s", 600)

        if age_seconds > lost_threshold:
            self.metrics["lost"] += 1
            quality = "LOST"
        elif age_seconds > stale_threshold and quality != "OFF_TRACK":
            self.metrics["stale"] += 1
            quality = "STALE"

        cleaned_event = {
            "train_id": train_id,
            "timestamp": event_time.isoformat(),
            "latitude": snapped_lat if quality != "OFF_TRACK" else lat,
            "longitude": snapped_lon if quality != "OFF_TRACK" else lon,
            "raw_latitude": lat,
            "raw_longitude": lon,
            "speed_kmh": reported_speed,
            "block_id": matched_block or event.get("block_id", "B01"),
            "quality": quality,
            "deviation_m": round(distance_m, 1),
            "source": event.get("source", "GPS_SIMULATOR")
        }

        self.last_accepted[train_id] = cleaned_event
        self.metrics["accepted"] += 1
        return cleaned_event, quality, None

data_cleaner = DataQualityCleaner()
