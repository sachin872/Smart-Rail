const API_BASE = "http://localhost:8000/api/v1";

export interface TrainState {
  train_id: string;
  train_name: string;
  class: string;
  priority: number;
  lat: number;
  lon: number;
  speed: number;
  block_id: string;
  delay: number;
  quality: string;
  current_stop_idx: number;
  target_station: string;
  progress_ratio: number;
  status: string;
  timestamp: string;
}

export interface ETAStop {
  station: string;
  seq: number;
  scheduled_arr: string;
  scheduled_dep: string;
  b0_eta: string;
  b1_eta: string;
  b2_eta: string;
  b3_eta: string;
  low: string;
  high: string;
  delay_min: number;
  ml_residual_min?: number;
  horizon_min?: number;
  reasons: string[];
  status: string;
}

export interface ETAResponse {
  train_id: string;
  train_name: string;
  class: string;
  priority: number;
  generated_at: string;
  quality: string;
  model_version: string;
  weather_rain_mm?: number;
  stops: ETAStop[];
}

export interface StationBoardItem {
  train_id: string;
  train_name: string;
  class: string;
  platform: string;
  scheduled_time: string;
  smart_eta: string;
  eta_window: string;
  delay_min: number;
  status: string;
  quality: string;
  primary_reason: string;
}

export interface StationBoardResponse {
  station: {
    code: string;
    name: string;
    lat: number;
    lon: number;
    zone: string;
  };
  generated_at: string;
  arrivals_departures: StationBoardItem[];
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getTrains(): Promise<{ data: TrainState[] }> {
    const res = await fetch(`${API_BASE}/trains`);
    return res.json();
  },

  async getETA(trainId: string): Promise<ETAResponse> {
    const res = await fetch(`${API_BASE}/eta/${trainId}`);
    return res.json();
  },

  async getStationBoard(stationCode: string): Promise<StationBoardResponse> {
    const res = await fetch(`${API_BASE}/stations/${stationCode}/board`);
    return res.json();
  },

  async getConflicts() {
    const res = await fetch(`${API_BASE}/conflicts`);
    return res.json();
  },

  async getWhatIf(conflictId: string = "CONF-DEFAULT") {
    const res = await fetch(`${API_BASE}/whatif/${conflictId}`);
    return res.json();
  },

  async getResourceAlerts() {
    const res = await fetch(`${API_BASE}/resources/alerts`);
    return res.json();
  },

  async getNotifications(trainId: string) {
    const res = await fetch(`${API_BASE}/notifications/${trainId}`);
    return res.json();
  },

  async getMetrics() {
    const res = await fetch(`${API_BASE}/metrics`);
    return res.json();
  },

  async getSources() {
    const res = await fetch(`${API_BASE}/sources`);
    return res.json();
  },

  async stepSimulation() {
    const res = await fetch(`${API_BASE}/simulation/step`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Role": "controller" }
    });
    return res.json();
  },

  async resetSimulation(seed: number = 42) {
    const res = await fetch(`${API_BASE}/simulation/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Role": "admin" },
      body: JSON.stringify({ scenario: "RESET", seed })
    });
    return res.json();
  },

  async injectScenario(scenario: string) {
    const res = await fetch(`${API_BASE}/simulation/scenario`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Role": "controller" },
      body: JSON.stringify({ scenario, seed: 42 })
    });
    return res.json();
  },

  async retrainModel() {
    const res = await fetch(`${API_BASE}/model/retrain`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Role": "admin" }
    });
    return res.json();
  },

  async calibrateWeather() {
    const res = await fetch(`${API_BASE}/weather/calibrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Role": "admin" }
    });
    return res.json();
  }
};
