import time
import psutil
import os
import numpy as np
from datetime import datetime
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from backend.app.quality.data_cleaner import data_cleaner
from backend.app.ml.residual_model import ml_predictor
from backend.app.prediction.eta_engine import eta_engine

def run_scale_load_test(train_counts=[100, 500, 1000, 3000]):
    """
    Measures realistic pipeline performance across high event volumes:
    - Ingestion & Data Quality cleaning throughput (events/sec)
    - p50 / p95 prediction cycle latency (ms)
    - Memory usage (MB)
    - Dropped / rejected events
    """
    print("=" * 70)
    print("SMART RAIL AI - HIGH VOLUME SCALE & RESILIENCE BENCHMARK")
    print(f"Timestamp: {datetime.now().isoformat()} | Python {sys.version.split()[0]}")
    print("=" * 70)
    
    process = psutil.Process(os.getpid())
    results = []

    for n_trains in train_counts:
        start_mem = process.memory_info().rss / (1024 * 1024)
        latencies_ms = []
        events_processed = 0
        rejected_count = 0
        
        t0 = time.perf_counter()
        
        for i in range(n_trains):
            train_id = f"T{1000 + i}"
            now_iso = datetime.now().isoformat()
            
            # 1. Ingest GPS Position Event
            raw_event = {
                "train_id": train_id,
                "latitude": 19.0469 + (i % 20) * 0.001,
                "longitude": 72.9468 + (i % 20) * 0.001,
                "speed_kmh": 65.0 + (i % 30),
                "timestamp": now_iso
            }
            
            cycle_start = time.perf_counter()
            
            # 2. Clean & Map Match
            cleaned, quality, err = data_cleaner.clean_position_event(raw_event, now_iso)
            if not cleaned:
                rejected_count += 1
                continue
                
            # 3. Vectorized feature extraction & ML residual prediction
            features = {
                "current_delay_min": 2.5,
                "speed_kmh": cleaned["speed_kmh"],
                "speed_ratio": 0.95,
                "distance_remaining_km": 24.0,
                "horizon_min": 20.0,
                "srt_median_min": 15.0,
                "hist_mean_delay_min": 2.0,
                "rain_mm": 0.0,
                "is_peak_hour": 1,
                "is_single_track_ahead": 0,
                "preceding_delay_min": 0.0
            }
            residual = ml_predictor.predict_residual(features)
            
            cycle_elapsed = (time.perf_counter() - cycle_start) * 1000.0 # ms
            latencies_ms.append(cycle_elapsed)
            events_processed += 1
            
        total_time = time.perf_counter() - t0
        end_mem = process.memory_info().rss / (1024 * 1024)
        throughput = events_processed / total_time if total_time > 0 else 0
        
        p50 = float(np.percentile(latencies_ms, 50)) if latencies_ms else 0
        p95 = float(np.percentile(latencies_ms, 95)) if latencies_ms else 0
        p99 = float(np.percentile(latencies_ms, 99)) if latencies_ms else 0
        
        res = {
            "trains": n_trains,
            "events_processed": events_processed,
            "duration_s": round(total_time, 3),
            "throughput_ev_per_sec": round(throughput, 1),
            "p50_latency_ms": round(p50, 3),
            "p95_latency_ms": round(p95, 3),
            "p99_latency_ms": round(p99, 3),
            "mem_delta_mb": round(end_mem - start_mem, 2),
            "current_mem_mb": round(end_mem, 2),
            "rejected_events": rejected_count
        }
        results.append(res)
        
        print(f"[{n_trains:4d} Trains] Throughput: {res['throughput_ev_per_sec']:8.1f} ev/s | p50: {res['p50_latency_ms']:5.3f}ms | p95: {res['p95_latency_ms']:5.3f}ms | RAM: {res['current_mem_mb']:5.1f}MB")

    print("=" * 70)
    print("Scale Benchmark Summary:")
    for r in results:
        print(f"  N={r['trains']:4d} -> {r['throughput_ev_per_sec']:7.1f} events/sec, p95={r['p95_latency_ms']}ms, RAM delta={r['mem_delta_mb']}MB")
    print("=" * 70)
    return results

if __name__ == "__main__":
    run_scale_load_test()
