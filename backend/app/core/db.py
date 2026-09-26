import sqlite3
import pandas as pd
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from backend.app.core.config import DB_PATH, DATA_DIR

DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_db(seed_from_csv: bool = True):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS stations (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        zone TEXT,
        division TEXT
    );

    CREATE TABLE IF NOT EXISTS segments (
        block_id TEXT PRIMARY KEY,
        from_station TEXT NOT NULL,
        to_station TEXT NOT NULL,
        length_km REAL NOT NULL,
        max_speed REAL NOT NULL,
        line TEXT DEFAULT 'UP',
        track_count INTEGER DEFAULT 2,
        is_single_track INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS signals (
        signal_id TEXT PRIMARY KEY,
        block_id TEXT NOT NULL,
        aspect TEXT DEFAULT 'GREEN'
    );

    CREATE TABLE IF NOT EXISTS platforms (
        station_code TEXT NOT NULL,
        platform_id TEXT NOT NULL,
        capacity INTEGER DEFAULT 1,
        occupied_until TEXT,
        PRIMARY KEY (station_code, platform_id)
    );

    CREATE TABLE IF NOT EXISTS trains (
        train_id TEXT PRIMARY KEY,
        train_name TEXT NOT NULL,
        class TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        rake_id TEXT
    );

    CREATE TABLE IF NOT EXISTS timetable (
        train_id TEXT NOT NULL,
        station_code TEXT NOT NULL,
        seq INTEGER NOT NULL,
        arr TEXT,
        dep TEXT,
        class TEXT,
        priority INTEGER,
        day_offset INTEGER DEFAULT 0,
        distance_km REAL DEFAULT 0,
        PRIMARY KEY (train_id, seq)
    );

    CREATE TABLE IF NOT EXISTS rake_links (
        rake_id TEXT PRIMARY KEY,
        inbound_train_id TEXT NOT NULL,
        outbound_train_id TEXT NOT NULL,
        turnaround_station TEXT NOT NULL,
        min_turnaround_min REAL DEFAULT 30.0
    );

    CREATE TABLE IF NOT EXISTS srt_table (
        segment TEXT NOT NULL,
        train_class TEXT NOT NULL,
        time_band TEXT NOT NULL,
        p10 REAL NOT NULL,
        median REAL NOT NULL,
        p90 REAL NOT NULL,
        n INTEGER NOT NULL,
        version TEXT DEFAULT 'v1.0',
        PRIMARY KEY (segment, train_class, time_band)
    );

    CREATE TABLE IF NOT EXISTS hist_profile (
        train TEXT NOT NULL,
        station TEXT NOT NULL,
        day_type TEXT NOT NULL,
        season TEXT NOT NULL,
        mean REAL NOT NULL,
        p50 REAL NOT NULL,
        p90 REAL NOT NULL,
        n INTEGER NOT NULL,
        PRIMARY KEY (train, station, day_type, season)
    );

    CREATE TABLE IF NOT EXISTS train_state (
        train_id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        speed REAL NOT NULL,
        block_id TEXT,
        delay REAL DEFAULT 0.0,
        quality TEXT DEFAULT 'FRESH',
        current_stop_idx INTEGER DEFAULT 1,
        distance_covered_km REAL DEFAULT 0.0,
        status TEXT DEFAULT 'RUNNING'
    );

    CREATE TABLE IF NOT EXISTS events (
        event_id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        target TEXT NOT NULL,
        start_time TEXT NOT NULL,
        duration_min REAL NOT NULL,
        severity REAL DEFAULT 1.0,
        parameters TEXT,
        source TEXT DEFAULT 'SIMULATOR',
        active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS eta_predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        train_id TEXT NOT NULL,
        station TEXT NOT NULL,
        generated_at TEXT NOT NULL,
        horizon REAL NOT NULL,
        b0_eta TEXT,
        b1_eta TEXT,
        b2_eta TEXT,
        b3_eta TEXT,
        low TEXT,
        high TEXT,
        reasons TEXT,
        quality TEXT DEFAULT 'FRESH',
        model_version TEXT DEFAULT 'B3-0.1.0'
    );

    CREATE TABLE IF NOT EXISTS prediction_outcomes (
        prediction_id INTEGER PRIMARY KEY,
        train_id TEXT NOT NULL,
        station TEXT NOT NULL,
        predicted_eta TEXT NOT NULL,
        actual_arrival TEXT NOT NULL,
        error_min REAL NOT NULL,
        covered INTEGER DEFAULT 1,
        scored_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conflicts (
        conflict_id TEXT PRIMARY KEY,
        resource_id TEXT NOT NULL,
        winning_train TEXT NOT NULL,
        losing_train TEXT NOT NULL,
        reason TEXT NOT NULL,
        original_interval TEXT NOT NULL,
        assigned_interval TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resource_reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_id TEXT NOT NULL,
        train_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        priority INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS whatif_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conflict_id TEXT NOT NULL,
        action TEXT NOT NULL,
        saved_minutes REAL NOT NULL,
        affected_trains TEXT NOT NULL,
        computed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resource_alerts (
        alert_id TEXT PRIMARY KEY,
        resource_type TEXT NOT NULL,
        train_id TEXT NOT NULL,
        station TEXT NOT NULL,
        predicted_time TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT DEFAULT 'WARNING',
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS model_registry (
        version TEXT PRIMARY KEY,
        trained_on TEXT NOT NULL,
        mae REAL NOT NULL,
        rmse REAL NOT NULL,
        share_5min REAL NOT NULL,
        coverage REAL NOT NULL,
        params TEXT,
        status TEXT DEFAULT 'CHAMPION'
    );

    CREATE TABLE IF NOT EXISTS data_sources (
        provider TEXT PRIMARY KEY,
        source_ref TEXT NOT NULL,
        licence TEXT NOT NULL,
        last_seen TEXT NOT NULL,
        status TEXT DEFAULT 'HEALTHY',
        data_quality TEXT DEFAULT 'FRESH',
        is_simulated INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS weather_calibration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        calibration_value REAL NOT NULL,
        seed_range TEXT NOT NULL,
        scenario TEXT NOT NULL,
        simulator_version TEXT NOT NULL,
        sample_count INTEGER NOT NULL,
        generated_at TEXT NOT NULL,
        provenance TEXT DEFAULT 'SIM_CALIBRATED'
    );

    -- Indexes for high throughput performance
    CREATE INDEX IF NOT EXISTS idx_train_state_time ON train_state(timestamp);
    CREATE INDEX IF NOT EXISTS idx_eta_train_st ON eta_predictions(train_id, station);
    CREATE INDEX IF NOT EXISTS idx_reservations_res ON resource_reservations(resource_id, start_time, end_time);
    CREATE INDEX IF NOT EXISTS idx_timetable_train ON timetable(train_id, seq);
    """);

    conn.commit()

    if seed_from_csv:
        seed_database(conn)

    conn.close()

def seed_database(conn: sqlite3.Connection):
    cursor = conn.cursor()
    # Stations
    stations_path = DATA_DIR / "stations.csv"
    if stations_path.exists():
        df_stations = pd.read_csv(stations_path)
        cursor.executemany(
            "INSERT OR REPLACE INTO stations (code, name, lat, lon, zone, division) VALUES (?, ?, ?, ?, ?, ?)",
            df_stations.values.tolist()
        )

    # Segments
    segments_path = DATA_DIR / "segments.csv"
    if segments_path.exists():
        df_segments = pd.read_csv(segments_path)
        cursor.executemany(
            "INSERT OR REPLACE INTO segments (block_id, from_station, to_station, length_km, max_speed, line, track_count, is_single_track) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            df_segments.values.tolist()
        )
        # Seed default signals
        for _, row in df_segments.iterrows():
            cursor.execute("INSERT OR REPLACE INTO signals (signal_id, block_id, aspect) VALUES (?, ?, ?)",
                           (f"SIG_{row['block_id']}", row['block_id'], "GREEN"))

    # Platforms
    platforms_path = DATA_DIR / "platforms.csv"
    if platforms_path.exists():
        df_plat = pd.read_csv(platforms_path)
        cursor.executemany(
            "INSERT OR REPLACE INTO platforms (station_code, platform_id, capacity) VALUES (?, ?, ?)",
            df_plat.values.tolist()
        )

    # Trains
    trains_path = DATA_DIR / "trains.csv"
    if trains_path.exists():
        df_trains = pd.read_csv(trains_path)
        cursor.executemany(
            "INSERT OR REPLACE INTO trains (train_id, train_name, class, priority, rake_id) VALUES (?, ?, ?, ?, ?)",
            df_trains.values.tolist()
        )

    # Timetable
    timetable_path = DATA_DIR / "timetable.csv"
    if timetable_path.exists():
        df_tt = pd.read_csv(timetable_path).fillna("")
        cursor.executemany(
            "INSERT OR REPLACE INTO timetable (train_id, station_code, seq, arr, dep, class, priority, day_offset, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            df_tt.values.tolist()
        )

    # Rake links
    rake_path = DATA_DIR / "rake_links.csv"
    if rake_path.exists():
        df_rake = pd.read_csv(rake_path)
        cursor.executemany(
            "INSERT OR REPLACE INTO rake_links (rake_id, inbound_train_id, outbound_train_id, turnaround_station, min_turnaround_min) VALUES (?, ?, ?, ?, ?)",
            df_rake.values.tolist()
        )

    # Seed Initial SRT Table
    # Baseline SRT calculated from section lengths at typical operating speed (~60-75 km/h)
    initial_srts = [
        ("B01", "EXPRESS", "ALL", 11.0, 12.0, 14.5, 120, "v1.0"),
        ("B01", "PASSENGER", "ALL", 14.0, 16.0, 19.0, 150, "v1.0"),
        ("B02", "EXPRESS", "ALL", 13.0, 14.5, 17.0, 120, "v1.0"),
        ("B02", "PASSENGER", "ALL", 17.0, 19.0, 23.0, 150, "v1.0"),
        ("B03", "EXPRESS", "ALL", 21.0, 23.0, 27.0, 120, "v1.0"),
        ("B03", "PASSENGER", "ALL", 27.0, 30.0, 35.0, 150, "v1.0"),
    ]
    cursor.executemany(
        "INSERT OR REPLACE INTO srt_table (segment, train_class, time_band, p10, median, p90, n, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        initial_srts
    )

    # Seed Historical Delay Profiles (train, station, day_type, season, mean, p50, p90, n)
    initial_profiles = [
        ("T101", "ST02", "WEEKDAY", "MONSOON", 2.5, 2.0, 5.0, 90),
        ("T101", "ST03", "WEEKDAY", "MONSOON", 3.8, 3.0, 7.5, 90),
        ("T101", "ST04", "WEEKDAY", "MONSOON", 4.2, 3.5, 8.0, 90),
        ("T102", "ST02", "WEEKDAY", "MONSOON", 3.0, 2.5, 6.0, 90),
        ("T102", "ST03", "WEEKDAY", "MONSOON", 5.5, 4.0, 9.5, 90),
        ("T103", "ST03", "WEEKDAY", "MONSOON", 2.0, 1.5, 4.0, 90),
        ("T104", "ST03", "WEEKDAY", "MONSOON", 1.5, 1.0, 3.5, 90),
        ("T104", "ST02", "WEEKDAY", "MONSOON", 3.0, 2.0, 6.0, 90),
        ("T104", "ST01", "WEEKDAY", "MONSOON", 4.0, 3.0, 7.0, 90),
    ]
    cursor.executemany(
        "INSERT OR REPLACE INTO hist_profile (train, station, day_type, season, mean, p50, p90, n) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        initial_profiles
    )

    # Seed Data Sources / Provenance
    sources = [
        ("SIMULATOR_CORE", "smart_rail_simulator_v3", "Internal Demo Open Source", "2026-09-26T14:30:00", "HEALTHY", "FRESH", 1),
        ("OPEN_METEO", "https://api.open-meteo.com/v1/forecast", "Open-Meteo Non-Commercial / CC-BY 4.0", "2026-09-26T14:30:00", "HEALTHY", "FRESH", 0),
        ("DATA_GOV_IN_TIMETABLE", "https://data.gov.in/catalog/indian-railways-train-time-table", "Government Open Data License - India (GODL)", "2026-09-26T14:30:00", "HEALTHY", "FRESH", 0),
        ("OSM_RAILWAY_MAP", "https://www.openrailwaymap.org", "ODbL 1.0", "2026-09-26T14:30:00", "HEALTHY", "FRESH", 0),
        ("CRIS_NTES_RTIS_ADAPTER", "CRIS Authorized Endpoint Skeleton", "CRIS Terms of Use (Requires Railway Credential)", "2026-09-26T14:30:00", "GATED_STANDBY", "FALLBACK_TO_SIM", 1),
    ]
    cursor.executemany(
        "INSERT OR REPLACE INTO data_sources (provider, source_ref, licence, last_seen, status, data_quality, is_simulated) VALUES (?, ?, ?, ?, ?, ?, ?)",
        sources
    )

    # Seed Default Weather Calibration
    cursor.execute("""
        INSERT OR REPLACE INTO weather_calibration (id, calibration_value, seed_range, scenario, simulator_version, sample_count, generated_at, provenance)
        VALUES (1, 0.82, "100-150", "MONSOON_RAIN_B02_B03", "v3.1.0", 50, "2026-09-26T12:00:00", "SIM_CALIBRATED")
    """)

    # Seed Default Model Registry Champion
    cursor.execute("""
        INSERT OR REPLACE INTO model_registry (version, trained_on, mae, rmse, share_5min, coverage, params, status)
        VALUES ("B3-0.1.0", "2026-09-26T12:00:00", 1.84, 2.65, 0.912, 0.824, '{"max_iter": 100, "learning_rate": 0.08}', "CHAMPION")
    """)

    conn.commit()

if __name__ == "__main__":
    init_db(seed_from_csv=True)
    print("Database initialized and seeded successfully.")
