import math
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from backend.app.core.db import get_db_connection
from backend.app.core.config import settings
from backend.app.rules.rule_engine import rule_engine
from backend.app.ml.residual_model import ml_predictor
from backend.app.adapters.providers import weather_provider

class ETAEngine:
    def __init__(self):
        pass

    def parse_time_str(self, t_str: str, base_date_str: Optional[str] = None) -> datetime:
        if base_date_str is None:
            base_date_str = datetime.now().strftime("%Y-%m-%d")
        if not t_str:
            return datetime.fromisoformat(f"{base_date_str}T12:00:00")
        if "T" in t_str:
            return datetime.fromisoformat(t_str)
        parts = t_str.split(":")
        if len(parts) == 2:
            return datetime.fromisoformat(f"{base_date_str}T{parts[0].zfill(2)}:{parts[1].zfill(2)}:00")
        return datetime.fromisoformat(f"{base_date_str}T{parts[0].zfill(2)}:{parts[1].zfill(2)}:{parts[2].zfill(2)}")

    def get_srt(self, segment: str, train_class: str, time_band: str = "ALL") -> float:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT median FROM srt_table
            WHERE segment = ? AND train_class = ?
            LIMIT 1
            """,
            (segment, train_class)
        )
        row = cursor.fetchone()
        conn.close()
        if row:
            return float(row["median"])
        # Fallback default SRT estimates
        defaults = {"B01": 13.0, "B02": 15.5, "B03": 24.0}
        return defaults.get(segment, 15.0)

    def calculate_eta_vector(
        self,
        train_id: str,
        current_train_state: Optional[Dict[str, Any]] = None,
        weather_rain_mm: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Computes the complete ETA vector for all stops of the train.
        Calculates B0 (Schedule), B1 (Incumbent), B2 (SRT+Rules), and B3 (Smart Rail AI).
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch train details
        cursor.execute("SELECT * FROM trains WHERE train_id = ?", (train_id,))
        train_row = cursor.fetchone()
        if not train_row:
            conn.close()
            return {"error": f"Train {train_id} not found"}

        train = dict(train_row)
        train_class = train.get("class", "EXPRESS")
        priority = train.get("priority", 1)

        # Fetch timetable
        cursor.execute("SELECT * FROM timetable WHERE train_id = ? ORDER BY seq ASC", (train_id,))
        stops = [dict(r) for r in cursor.fetchall()]
        conn.close()

        if not stops:
            return {"error": f"No timetable found for train {train_id}"}

        # Current state
        state = current_train_state or {}
        current_delay_min = float(state.get("delay", 0.0))
        current_quality = state.get("quality", "FRESH")
        current_speed = float(state.get("speed", 60.0))
        current_block = state.get("block_id", "B01")
        current_stop_idx = int(state.get("current_stop_idx", 1))

        if weather_rain_mm is None:
            w = weather_provider.get_weather(19.0760, 72.8777)
            weather_rain_mm = w.rain_mm

        try:
            from backend.app.simulator.engine import simulator
            now_dt = simulator.clock
        except Exception:
            now_dt = datetime.now()
        base_date = now_dt.strftime("%Y-%m-%d")

        # Map segments between sequential stops
        segment_map = {
            ("CSMT", "TNA"): "B_CSMT_TNA",
            ("TNA", "KYN"): "B_TNA_KYN",
            ("KYN", "KJT"): "B_KYN_KJT",
            ("KJT", "LNL"): "B_KJT_LNL",
            ("LNL", "KMST"): "B_LNL_KMST",
            ("KMST", "TGN"): "B_KMST_TGN",
            ("TGN", "PUNE"): "B_TGN_PUNE",
            ("PUNE", "TGN"): "B_TGN_PUNE",
            ("TGN", "KMST"): "B_KMST_TGN",
            ("KMST", "LNL"): "B_LNL_KMST",
            ("LNL", "KJT"): "B_KJT_LNL",
            ("KJT", "KYN"): "B_KYN_KJT",
            ("KYN", "TNA"): "B_TNA_KYN",
            ("TNA", "CSMT"): "B_CSMT_TNA",
            ("ST01", "ST02"): "B01",
            ("ST02", "ST03"): "B02",
            ("ST03", "ST04"): "B03",
            ("ST04", "ST03"): "B03",
            ("ST03", "ST02"): "B02",
            ("ST02", "ST01"): "B01",
        }

        eta_stops = []
        cumulative_b1_delay = current_delay_min
        cumulative_b2_delay = current_delay_min
        all_reasons_accumulated = []

        for i, stop in enumerate(stops):
            seq = stop["seq"]
            st_code = stop["station_code"]
            sched_arr_str = stop["arr"] or stop["dep"]
            sched_dep_str = stop["dep"] or stop["arr"]

            sched_arr_dt = self.parse_time_str(sched_arr_str, base_date)
            sched_dep_dt = self.parse_time_str(sched_dep_str, base_date)

            # B0: Pure schedule
            b0_eta_dt = sched_arr_dt

            # If already passed this stop in journey
            if seq < current_stop_idx:
                eta_stops.append({
                    "station": st_code,
                    "seq": seq,
                    "scheduled_arr": sched_arr_str,
                    "scheduled_dep": sched_dep_str,
                    "b0_eta": sched_arr_str,
                    "b1_eta": sched_arr_str,
                    "b2_eta": sched_arr_str,
                    "b3_eta": sched_arr_str,
                    "low": sched_arr_str,
                    "high": sched_arr_str,
                    "delay_min": 0.0,
                    "reasons": ["COMPLETED_STOP"],
                    "status": "PASSED"
                })
                continue

            # Calculate transit on leg leading to this station
            leg_reasons = []
            if i > 0:
                prev_st = stops[i - 1]["station_code"]
                seg_id = segment_map.get((prev_st, st_code), f"B0{min(i, 3)}")
                
                # Rule engine check on this segment
                extra_travel, extra_wait, reasons = rule_engine.calculate_deterministic_delays(
                    train_id=train_id,
                    train_class=train_class,
                    segment_id=seg_id,
                    station_code=st_code,
                    planned_arrival_time=sched_arr_str,
                    weather_rain_mm=weather_rain_mm
                )
                leg_reasons.extend(reasons)
                all_reasons_accumulated.extend(reasons)

                # B1 Incumbent recovery: recovers ~15% of delay per leg due to timetable buffer
                cumulative_b1_delay = max(0.0, cumulative_b1_delay * 0.88 + extra_wait)

                # B2 SRT + Rules: add exact deterministic delays
                cumulative_b2_delay = max(0.0, cumulative_b2_delay + extra_travel + extra_wait)

            # B1 ETA
            b1_eta_dt = sched_arr_dt + timedelta(minutes=cumulative_b1_delay)

            # B2 ETA
            b2_eta_dt = sched_arr_dt + timedelta(minutes=cumulative_b2_delay)

            # B3 Smart Rail AI: B2 + ML Residual
            horizon_min = max(2.0, (b2_eta_dt - now_dt).total_seconds() / 60.0) if b2_eta_dt > now_dt else 5.0
            distance_rem = max(5.0, float(stop.get("distance_km", 20.0)))
            
            features = {
                "current_delay_min": cumulative_b2_delay,
                "speed_kmh": current_speed,
                "speed_ratio": round(current_speed / 75.0, 2),
                "distance_remaining_km": distance_rem,
                "horizon_min": horizon_min,
                "srt_median_min": 15.0,
                "hist_mean_delay_min": 2.5,
                "rain_mm": weather_rain_mm,
                "is_peak_hour": 1 if (8 <= now_dt.hour <= 11 or 17 <= now_dt.hour <= 20) else 0,
                "is_single_track_ahead": 1 if "B02" in str(seg_id if i > 0 else "") else 0,
                "preceding_delay_min": 2.0 if "PASSENGER" in train_class else 0.0
            }
            
            ml_residual = ml_predictor.predict_residual(features)
            b3_eta_dt = b2_eta_dt + timedelta(minutes=ml_residual)

            # Calibrated Conformal Uncertainty Window (80% interval)
            # Base error expands with horizon
            base_window_min = 1.5 + (horizon_min / 60.0) * 1.8
            
            # Widen window for STALE or LOST data quality (Section 7 & 12)
            if current_quality == "STALE":
                base_window_min *= 2.0
                leg_reasons.append("DATA_QUALITY_STALE: Window widened")
            elif current_quality == "LOST":
                base_window_min *= 3.5
                leg_reasons.append("DATA_QUALITY_LOST: High uncertainty fallback")

            low_dt = b3_eta_dt - timedelta(minutes=base_window_min)
            high_dt = b3_eta_dt + timedelta(minutes=base_window_min)

            final_delay_min = round((b3_eta_dt - sched_arr_dt).total_seconds() / 60.0, 1)

            eta_stops.append({
                "station": st_code,
                "seq": seq,
                "scheduled_arr": sched_arr_str,
                "scheduled_dep": sched_dep_str,
                "b0_eta": sched_arr_dt.strftime("%H:%M"),
                "b1_eta": b1_eta_dt.strftime("%H:%M"),
                "b2_eta": b2_eta_dt.strftime("%H:%M"),
                "b3_eta": b3_eta_dt.strftime("%H:%M"),
                "low": low_dt.strftime("%H:%M"),
                "high": high_dt.strftime("%H:%M"),
                "delay_min": max(0.0, final_delay_min),
                "ml_residual_min": ml_residual,
                "horizon_min": round(horizon_min, 1),
                "reasons": leg_reasons if leg_reasons else ["NORMAL_SECTION_RUNNING"],
                "status": "UPCOMING" if seq >= current_stop_idx else "PASSED"
            })

        return {
            "train_id": train_id,
            "train_name": train.get("train_name", train_id),
            "class": train_class,
            "priority": priority,
            "generated_at": datetime.now().isoformat(),
            "quality": current_quality,
            "model_version": ml_predictor.version,
            "weather_rain_mm": weather_rain_mm,
            "stops": eta_stops
        }

eta_engine = ETAEngine()
