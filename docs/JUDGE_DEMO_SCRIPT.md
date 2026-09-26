# SMART RAIL AI - Official Demonstration & Evaluation Walkthrough

Follow this exact 10-step sequence during the live presentation without refreshing the browser:

| Step | Action in UI / API | Observable Behaviour / Evidence |
| :--- | :--- | :--- |
| **1. Clean Reset** | Click **"Reset (Seed 42)"** in top navbar | Simulator resets to clean corridor status; trains T101, T102, T103, T104 initialize at clean departure times. |
| **2. Baseline & Smart ETA** | Open **Passenger ETA** tab & select `T101` | Displays scheduled arrival, Smart ETA `16:50`, calibrated 80% uncertainty window `16:48 - 16:53`, and `Live GPS: FRESH` badge. |
| **3. Disruption Injection** | Open **Simulator** tab & click **"🔴 Red Signal (B02)"** | T101 immediately halts; Smart ETA moves to `16:56`; named operational reason `• RED_SIGNAL(SIG_B02): +6.0m` appears with zero double-counting. |
| **4. Delay Propagation** | Open **Control Room** tab | Shows active cascade: T101 delay propagates downstream to following commuter train `T102` (+4.5m) and `T103` (+2.7m) to maintain safe headway. |
| **5. Concurrency Safe Preemption** | Inspect Conflict Queue in **Control Room** | Shows priority-based atomic arbitration: Express `T101` (Priority 1) wins section over `T102` (Priority 2); losing train is safely re-timed without double-booking. |
| **6. GPS Degradation Fault** | Switch to **Simulator** & click **"🛰️ GPS Degraded Fault"** | Injected GPS jitter/delay triggers data cleaner; status transitions to `GPS Delayed: STALE (Window Widened)` and uncertainty interval expands safely without crashing. |
| **7. Station Board & Resources** | Open **Station Board** & **Control Room (Resource Alerts)** | High-contrast PIDS board reflects live arrival times automatically; pit-line turnaround compressed warning & crew relief alerts update dynamically. |
| **8. Advisory What-If Analysis** | Inspect **Advisory What-If** in Control Room | Shows ranked candidate interventions (`REORDER_T101_T102`, `ALTERNATE_PLATFORM_ST02_PF2`, `HOLD_T101_4MIN`), minutes saved, and prominent **"ADVISORY ONLY"** safety banner. |
| **9. Continuous Learning** | Open **Continuous Learning** tab | Shows measured 4-tier baseline validation table (B0: 14.8m MAE &rarr; B3: 1.84m MAE), 82.4% window coverage, drift monitor, and **"Retrain Challenger"** promotion flow. |
| **10. Data Provenance & Calibration** | Open **Data Sources & Provenance** tab | Proves all feeds carry provenance; shows CRIS credential-gated architectural boundary and runs the paired-seed **Weather Calibration Experiment** producing `SIM_CALIBRATED` factor `0.82`. |
