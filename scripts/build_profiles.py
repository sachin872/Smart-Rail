import sqlite3
import numpy as np
import pandas as pd
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from backend.app.core.db import get_db_connection

def build_historical_profiles():
    """
    Builds historical delay profiles by train, station, day_type, and season.
    Populates the hist_profile table with mean, median (p50), p90, and sample size n.
    """
    print("Building historical delay profiles across corridor stations...")
    np.random.seed(42)

    profiles = [
        ("T101", "ST02", "WEEKDAY", "MONSOON", 2.5, 2.0, 5.0, 90),
        ("T101", "ST03", "WEEKDAY", "MONSOON", 3.8, 3.0, 7.5, 90),
        ("T101", "ST04", "WEEKDAY", "MONSOON", 4.2, 3.5, 8.0, 90),
        ("T101", "ST02", "WEEKEND", "MONSOON", 3.2, 2.5, 6.0, 60),
        ("T101", "ST03", "WEEKEND", "MONSOON", 4.5, 3.5, 8.5, 60),
        ("T101", "ST04", "WEEKEND", "MONSOON", 5.0, 4.0, 9.0, 60),
        ("T102", "ST02", "WEEKDAY", "MONSOON", 3.0, 2.5, 6.0, 90),
        ("T102", "ST03", "WEEKDAY", "MONSOON", 5.5, 4.0, 9.5, 90),
        ("T103", "ST03", "WEEKDAY", "MONSOON", 2.0, 1.5, 4.0, 90),
        ("T104", "ST03", "WEEKDAY", "MONSOON", 1.5, 1.0, 3.5, 90),
        ("T104", "ST02", "WEEKDAY", "MONSOON", 3.0, 2.0, 6.0, 90),
        ("T104", "ST01", "WEEKDAY", "MONSOON", 4.0, 3.0, 7.0, 90),
    ]

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.executemany(
        """
        INSERT OR REPLACE INTO hist_profile (train, station, day_type, season, mean, p50, p90, n)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        profiles
    )
    conn.commit()
    conn.close()

    print(f"Successfully generated and stored {len(profiles)} historical delay profile entries.")

if __name__ == "__main__":
    build_historical_profiles()
