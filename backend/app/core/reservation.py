import sqlite3
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from backend.app.core.db import get_db_connection

# Re-entrant thread lock to serialize atomic SQLite reservation transactions
_reservation_lock = threading.Lock()

class ReservationManager:
    @staticmethod
    def parse_dt(dt_str: str) -> datetime:
        # Accepts ISO strings or HH:MM / HH:MM:SS
        if "T" in dt_str:
            return datetime.fromisoformat(dt_str)
        if len(dt_str.split(":")) == 2:
            dt_str = f"{dt_str}:00"
        today = datetime.now().strftime("%Y-%m-%d")
        return datetime.fromisoformat(f"{today}T{dt_str}")

    @classmethod
    def reserve_resource(
        cls,
        resource_id: str,
        train_id: str,
        start_time: str,
        end_time: str,
        priority: int = 1,
        train_name: str = ""
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Atomically reserve a block/platform/junction.
        Resolves conflicts using:
        1. Priority (lower number = higher priority, e.g. Express=1 > Passenger=2)
        2. Tie-breaker: earliest planned entry / first-come
        3. Assign earliest safe slot to losing train
        """
        with _reservation_lock:
            conn = get_db_connection()
            cursor = conn.cursor()
            try:
                req_start = cls.parse_dt(start_time)
                req_end = cls.parse_dt(end_time)

                # Fetch all existing reservations on this resource that overlap
                cursor.execute(
                    """
                    SELECT * FROM resource_reservations
                    WHERE resource_id = ?
                    ORDER BY start_time ASC
                    """,
                    (resource_id,)
                )
                existing = [dict(row) for row in cursor.fetchall()]

                conflict_found = False
                winning_train = train_id
                losing_train = None
                conflict_reason = None
                conflict_info = None

                for res in existing:
                    if res["train_id"] == train_id:
                        continue # Same train update
                    
                    res_start = cls.parse_dt(res["start_time"])
                    res_end = cls.parse_dt(res["end_time"])

                    # Check interval overlap
                    if max(req_start, res_start) < min(req_end, res_end):
                        conflict_found = True
                        res_prio = res.get("priority", 1)

                        if priority < res_prio:
                            # New train has higher priority (e.g. Express 1 vs Passenger 2)
                            winning_train = train_id
                            losing_train = res["train_id"]
                            conflict_reason = f"Priority override: {train_id} (Prio {priority}) preempts {losing_train} (Prio {res_prio})"
                            
                            # Shift the losing train to start after req_end
                            shift_duration = res_end - res_start
                            new_loser_start = req_end + timedelta(minutes=2)
                            new_loser_end = new_loser_start + shift_duration
                            
                            cursor.execute(
                                """
                                UPDATE resource_reservations
                                SET start_time = ?, end_time = ?
                                WHERE id = ?
                                """,
                                (new_loser_start.isoformat(), new_loser_end.isoformat(), res["id"])
                            )
                            # Record conflict
                            conflict_id = f"CONF-{datetime.now().strftime('%H%M%S%f')[:10]}"
                            cursor.execute(
                                """
                                INSERT INTO conflicts (conflict_id, resource_id, winning_train, losing_train, reason, original_interval, assigned_interval, created_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                """,
                                (
                                    conflict_id, resource_id, winning_train, losing_train,
                                    conflict_reason,
                                    f"{res['start_time']} - {res['end_time']}",
                                    f"{new_loser_start.isoformat()} - {new_loser_end.isoformat()}",
                                    datetime.now().isoformat()
                                )
                            )
                        else:
                            # Existing reservation has higher or equal priority (first-come)
                            winning_train = res["train_id"]
                            losing_train = train_id
                            conflict_reason = f"Headway/Section Occupancy: {winning_train} has precedence on {resource_id}"
                            
                            # Shift current train after existing reservation
                            shift_duration = req_end - req_start
                            req_start = res_end + timedelta(minutes=2)
                            req_end = req_start + shift_duration
                            
                            conflict_id = f"CONF-{datetime.now().strftime('%H%M%S%f')[:10]}"
                            cursor.execute(
                                """
                                INSERT INTO conflicts (conflict_id, resource_id, winning_train, losing_train, reason, original_interval, assigned_interval, created_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                """,
                                (
                                    conflict_id, resource_id, winning_train, losing_train,
                                    conflict_reason,
                                    f"{start_time} - {end_time}",
                                    f"{req_start.isoformat()} - {req_end.isoformat()}",
                                    datetime.now().isoformat()
                                )
                            )

                # Insert the committed reservation
                cursor.execute(
                    """
                    INSERT INTO resource_reservations (resource_id, train_id, start_time, end_time, priority)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (resource_id, train_id, req_start.isoformat(), req_end.isoformat(), priority)
                )

                conn.commit()

                if conflict_found:
                    conflict_info = {
                        "resource_id": resource_id,
                        "winning_train": winning_train,
                        "losing_train": losing_train,
                        "reason": conflict_reason,
                        "adjusted_start": req_start.isoformat(),
                        "adjusted_end": req_end.isoformat()
                    }
                return True, conflict_info

            except Exception as e:
                conn.rollback()
                raise e
            finally:
                conn.close()

    @classmethod
    def clear_all_reservations(cls):
        with _reservation_lock:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM resource_reservations")
            cursor.execute("DELETE FROM conflicts")
            conn.commit()
            conn.close()
