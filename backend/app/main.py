from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .providers.weather_nws import get_weather_payload
from .providers.transit_sdmts import get_vehicle_positions

BASE_DIR = Path(__file__).resolve().parents[2]  # repo root
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(title="Pi Dashboard")

# Serve static frontend files
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

@app.get("/")
def index():
    return FileResponse(str(FRONTEND_DIR / "index.html"))

@app.get("/api/health")
def health():
    return {"ok": True}

@app.get("/api/weather")
def weather():
    return get_weather_payload()

@app.get("/api/transit/vehicles")
def transit_vehicles():
    return get_vehicle_positions()