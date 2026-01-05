from __future__ import annotations

import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests


# -----------------------------
# Editable city list (PRIMARY is first)
# Use NWS exclusively, so cities should be in the US (or NWS-covered).
# -----------------------------
CITIES: List[Dict[str, Any]] = [
    {"name": "San Diego, CA", "lat": 32.7764, "lon": -117.0719},  # primary
    {"name": "Erie, CO", "lat": 40.0503, "lon": -105.0500},
    {"name": "Boston, MA", "lat": 42.3601, "lon": -71.0589},
]

# Cache TTLs (seconds)
TTL_POINTS = 7 * 24 * 3600          # points->grid mapping changes rarely
TTL_HOURLY = 10 * 60                # current conditions feel "live"
TTL_FORECAST = 30 * 60              # daily/weekly forecast OK to refresh slower

# Disk cache location (inside repo; service user everett can write here)
CACHE_DIR = Path(__file__).resolve().parents[3] / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    # NWS requests a descriptive UA with contact
    "User-Agent": "PETER-dashboard (Everett Richards, contact: local-kiosk)",
    "Accept": "application/geo+json",
}


@dataclass(frozen=True)
class Grid:
    grid_id: str
    grid_x: int
    grid_y: int
    time_zone: str


def _slug(name: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "_" for ch in name).strip("_")


def _cache_path(key: str) -> Path:
    return CACHE_DIR / f"{key}.json"


def _read_cache(key: str) -> Optional[Dict[str, Any]]:
    p = _cache_path(key)
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None


def _write_cache(key: str, payload: Dict[str, Any]) -> None:
    p = _cache_path(key)
    tmp = p.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    tmp.replace(p)


def _now() -> float:
    return time.time()


def _cached_get_json(url: str, cache_key: str, ttl_seconds: int) -> Dict[str, Any]:
    cached = _read_cache(cache_key)
    if cached and isinstance(cached, dict):
        ts = cached.get("_ts")
        if isinstance(ts, (int, float)) and (_now() - float(ts)) < ttl_seconds:
            return cached["data"]

    r = requests.get(url, headers=HEADERS, timeout=15)
    r.raise_for_status()
    data = r.json()
    _write_cache(cache_key, {"_ts": _now(), "data": data})
    return data


def _get_grid_for_point(lat: float, lon: float) -> Grid:
    url = f"https://api.weather.gov/points/{lat:.4f},{lon:.4f}"
    key = f"nws_points_{lat:.4f}_{lon:.4f}"
    data = _cached_get_json(url, key, TTL_POINTS)
    props = data["properties"]
    return Grid(
        grid_id=props["gridId"],
        grid_x=int(props["gridX"]),
        grid_y=int(props["gridY"]),
        time_zone=props.get("timeZone", "UTC"),
    )



def _get_forecast_periods(grid: Grid) -> List[Dict[str, Any]]:
    url = f"https://api.weather.gov/gridpoints/{grid.grid_id}/{grid.grid_x},{grid.grid_y}/forecast"
    key = f"nws_forecast_{grid.grid_id}_{grid.grid_x}_{grid.grid_y}"
    data = _cached_get_json(url, key, TTL_FORECAST)
    return data["properties"]["periods"]


def _get_hourly_periods(grid: Grid) -> List[Dict[str, Any]]:
    url = f"https://api.weather.gov/gridpoints/{grid.grid_id}/{grid.grid_x},{grid.grid_y}/forecast/hourly"
    key = f"nws_hourly_{grid.grid_id}_{grid.grid_x}_{grid.grid_y}"
    data = _cached_get_json(url, key, TTL_HOURLY)
    return data["properties"]["periods"]


def _first_non_null(*vals):
    for v in vals:
        if v is not None:
            return v
    return None


def _attire_recommendation(high_f: Optional[int], low_f: Optional[int], precip_pct: Optional[int]) -> str:
    # Simple/naive but useful
    if high_f is None and low_f is None:
        return "Bring a light layer just in case."

    hi = high_f if high_f is not None else low_f
    lo = low_f if low_f is not None else high_f
    p = precip_pct if precip_pct is not None else 0

    if p >= 60:
        if hi is not None and hi <= 50:
            return "Rain likely. Wear a warm waterproof jacket and shoes that can get wet."
        return "Rain likely. Bring a rain jacket or umbrella."
    if p >= 30:
        if lo is not None and lo <= 40:
            return "Chance of rain. Bring a light rain shell and a warmer layer for later."
        return "Chance of rain. Consider a light rain shell."
    # Dry guidance
    if hi is not None and hi >= 85:
        return "Hot today. T-shirt and shorts, and hydrate."
    if lo is not None and lo <= 40:
        return "Chilly. Bring a warm jacket or sweater."
    if hi is not None and hi <= 55:
        return "Cool. A jacket or hoodie is a good idea."
    return "Comfortable. Light layers should be perfect."


def _precip_from_period(period: Dict[str, Any]) -> Optional[int]:
    # NWS forecast period often includes probabilityOfPrecipitation { value: int or None }
    pop = period.get("probabilityOfPrecipitation") or {}
    val = pop.get("value")
    if isinstance(val, (int, float)):
        return int(round(val))
    return None


def _sky_from_hourly(period: Dict[str, Any]) -> Optional[int]:
    # Hourly periods include "cloudCover" in some cases. If absent, return None.
    cc = period.get("cloudCover")
    if isinstance(cc, (int, float)):
        return int(round(cc))
    return None


def _build_week_from_forecast(periods: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Turn NWS day/night periods into a daily list:
    [{name, high_f, low_f, precip_pct, icon, shortForecast}]
    We prefer daytime icon/forecast; low comes from night.
    """
    days: List[Dict[str, Any]] = []
    # periods usually alternate: Day, Night, Day, Night...
    i = 0
    while i < len(periods) and len(days) < 7:
        p = periods[i]
        if p.get("isDaytime") is True:
            day = p
            night = periods[i + 1] if (i + 1) < len(periods) else None
            high_f = day.get("temperature") if isinstance(day.get("temperature"), int) else None
            low_f = night.get("temperature") if (night and isinstance(night.get("temperature"), int)) else None
            precip = _first_non_null(_precip_from_period(day), _precip_from_period(night) if night else None)
            icon = day.get("icon") or (night.get("icon") if night else None)
            short_fc = day.get("shortForecast") or (night.get("shortForecast") if night else "")
            name = day.get("name") or "Day"

            days.append(
                {
                    "name": name,
                    "high_f": high_f,
                    "low_f": low_f,
                    "precip_pct": precip,
                    "icon": icon,
                    "shortForecast": short_fc,
                }
            )
            i += 2
        else:
            # If the feed starts on a Night period, skip until first day.
            i += 1
    return days


def _city_weather(city: Dict[str, Any], include_week: bool) -> Dict[str, Any]:
    name = city["name"]
    lat = float(city["lat"])
    lon = float(city["lon"])

    grid = _get_grid_for_point(lat, lon)
    forecast_periods = _get_forecast_periods(grid)
    hourly_periods = _get_hourly_periods(grid)

    # Current: take the first hourly period
    cur = hourly_periods[0] if hourly_periods else {}
    current_temp_f = cur.get("temperature") if isinstance(cur.get("temperature"), int) else None
    current_icon = cur.get("icon")
    current_short = cur.get("shortForecast", "")
    current_precip = _precip_from_period(cur)
    current_cloud = _sky_from_hourly(cur)
    wind = cur.get("windSpeed", "")

    # Today's high/low: use first daytime + its next night if available
    week = _build_week_from_forecast(forecast_periods)
    today = week[0] if week else {}

    high_f = today.get("high_f")
    low_f = today.get("low_f")
    precip_today = today.get("precip_pct")

    # If hourly has precip and forecast doesn’t, prefer hourly as "current precip chance"
    precip_display = _first_non_null(current_precip, precip_today)
    icon_display = _first_non_null(current_icon, today.get("icon"))
    short_display = _first_non_null(current_short, today.get("shortForecast", ""))

    out: Dict[str, Any] = {
        "name": name,
        "timeZone": grid.time_zone,
        "current": {
            "temp_f": current_temp_f,
            "icon": icon_display,
            "shortForecast": short_display,
        },
        "today": {
            "high_f": high_f,
            "low_f": low_f,
            "precip_pct": precip_display,
            "cloud_pct": current_cloud,
            "wind": wind,
        },
    }


    if include_week:
        out["week"] = week
        out["attire"] = _attire_recommendation(high_f, low_f, precip_display)

    return out


def get_weather_payload() -> Dict[str, Any]:
    if not CITIES:
        return {"primary": None, "others": [], "updated_at": int(_now())}

    primary_city = CITIES[0]
    other_cities = CITIES[1:]

    primary = _city_weather(primary_city, include_week=True)
    others = [_city_weather(c, include_week=False) for c in other_cities]

    return {
        "primary": primary,
        "others": others,
        "updated_at": int(_now()),
        "source": "api.weather.gov",
    }
