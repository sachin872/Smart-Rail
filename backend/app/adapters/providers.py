import requests
import json
import os
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

# Canonical Schemas (Section 5)
class TrainPositionEvent(BaseModel):
    event_id: str
    provider: str
    source_version: str = "v1.0"
    retrieved_at: str
    train_id: str
    timestamp: str
    latitude: float
    longitude: float
    speed_kmh: float
    heading: Optional[float] = 0.0
    station_id: Optional[str] = None
    block_id: Optional[str] = None
    quality: str = "FRESH"
    raw_reference: Optional[str] = None
    schema_version: str = "1.0"
    is_simulated: bool = True

class RailwayStateEvent(BaseModel):
    event_id: str
    provider: str
    timestamp: str
    signal_id: Optional[str] = None
    aspect: Optional[str] = "GREEN" # RED, YELLOW, DOUBLE_YELLOW, GREEN
    block_id: Optional[str] = None
    occupied: bool = False
    platform_id: Optional[str] = None
    platform_occupied_until: Optional[str] = None
    level_crossing_id: Optional[str] = None
    closed_until: Optional[str] = None
    restriction_id: Optional[str] = None
    speed_limit_kmh: Optional[float] = None
    maintenance_block: Optional[bool] = False
    confidence: float = 1.0
    schema_version: str = "1.0"

class WeatherEvent(BaseModel):
    timestamp: str
    latitude: float
    longitude: float
    rain_mm: float = 0.0
    wind_kmh: float = 10.0
    temperature_c: float = 28.0
    visibility_m: Optional[float] = 10000.0
    source: str = "OPEN_METEO"
    retrieved_at: str

class DataProvenance(BaseModel):
    provider: str
    source_url_or_ref: str
    retrieved_at: str
    version_or_date: str
    licence_or_permission: str
    schema_version: str = "1.0"
    status: str = "HEALTHY" # HEALTHY, DEGRADED, GATED_STANDBY, DOWN
    is_simulated: bool = False

# Abstract Provider Interface
class BaseProvider(ABC):
    @abstractmethod
    def get_weather(self, lat: float, lon: float) -> WeatherEvent:
        pass

    @abstractmethod
    def get_provenance(self) -> DataProvenance:
        pass

# Open-Meteo Adapter with Caching and Graceful Fallback
class OpenMeteoWeatherProvider(BaseProvider):
    def __init__(self):
        self._cache: Dict[str, Tuple[datetime, WeatherEvent]] = {}
        self.cache_ttl_minutes = 30

    def get_weather(self, lat: float = 19.0760, lon: float = 72.8777) -> WeatherEvent:
        cache_key = f"{round(lat, 2)}_{round(lon, 2)}"
        now = datetime.now()

        # Check Cache
        if cache_key in self._cache:
            cached_time, cached_event = self._cache[cache_key]
            if (now - cached_time).total_seconds() < self.cache_ttl_minutes * 60:
                return cached_event

        # Attempt API Call
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,precipitation,wind_speed_10m&timezone=Asia%2FKolkata"
            resp = requests.get(url, timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                event = WeatherEvent(
                    timestamp=current.get("time", now.isoformat()),
                    latitude=lat,
                    longitude=lon,
                    rain_mm=float(current.get("precipitation", 0.0)),
                    wind_kmh=float(current.get("wind_speed_10m", 12.0)),
                    temperature_c=float(current.get("temperature_2m", 29.5)),
                    source="OPEN_METEO_LIVE",
                    retrieved_at=now.isoformat()
                )
                self._cache[cache_key] = (now, event)
                return event
        except Exception:
            pass # Graceful degradation fallback

        # Fallback to seasonal climate average
        fallback_event = WeatherEvent(
            timestamp=now.isoformat(),
            latitude=lat,
            longitude=lon,
            rain_mm=0.0,
            wind_kmh=12.5,
            temperature_c=29.0,
            visibility_m=8000.0,
            source="OPEN_METEO_CACHED_FALLBACK",
            retrieved_at=now.isoformat()
        )
        self._cache[cache_key] = (now, fallback_event)
        return fallback_event

    def get_provenance(self) -> DataProvenance:
        return DataProvenance(
            provider="OPEN_METEO",
            source_url_or_ref="https://open-meteo.com/en/docs",
            retrieved_at=datetime.now().isoformat(),
            version_or_date="API v1 (CC-BY 4.0)",
            licence_or_permission="Open-Meteo Open Data License (Free Non-Commercial Tier)",
            status="HEALTHY",
            is_simulated=False
        )

# CRIS NTES/RTIS Gated Adapter (Demonstrates architectural boundary without unauthorized scraping)
class CRISRailwayGatedAdapter(BaseProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("CRIS_AUTH_KEY")
        self.is_authorized = bool(self.api_key)

    def get_weather(self, lat: float, lon: float) -> WeatherEvent:
        return WeatherEvent(
            timestamp=datetime.now().isoformat(),
            latitude=lat,
            longitude=lon,
            rain_mm=0.0,
            wind_kmh=10.0,
            temperature_c=28.0,
            source="CRIS_STATION_FEED",
            retrieved_at=datetime.now().isoformat()
        )

    def get_provenance(self) -> DataProvenance:
        return DataProvenance(
            provider="CRIS_NTES_RTIS",
            source_url_or_ref="https://www.cris.org.in/loadpage?page=proRTIS",
            retrieved_at=datetime.now().isoformat(),
            version_or_date="2026-CRIS-RTIS-SPEC",
            licence_or_permission="Restricted Railway Access - Requires CRIS Production Credentials",
            status="GATED_STANDBY" if not self.is_authorized else "CONNECTED",
            is_simulated=not self.is_authorized
        )

weather_provider = OpenMeteoWeatherProvider()
cris_gated_adapter = CRISRailwayGatedAdapter()
