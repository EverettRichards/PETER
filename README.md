# PETER

PETER is a kiosk-style dashboard for a Raspberry Pi or any small always-on screen. It serves a single-page frontend from a FastAPI backend, with weather data pulled from the National Weather Service and cached locally on disk for speed and resilience.

The current UI focuses on weather, but the layout already includes placeholder tiles for transit, today, and system status. The app is designed to run full-screen in Chromium with the mouse pointer hidden.

## What The App Does

The app has three pieces:

1. A FastAPI backend that serves the static frontend and exposes JSON endpoints.
2. A browser-based dashboard that renders the current time, a primary city forecast, secondary city summaries, and a 7-day forecast.
3. A weather provider that calls api.weather.gov, translates the response into dashboard-friendly JSON, and stores cached copies in the repo-local cache directory.

The weather provider currently tracks these cities:

1. San Diego, CA
2. Newark, DE

The first city is treated as the primary city and gets the expanded daily forecast plus attire guidance.

## Repository Layout

- `backend/` contains the FastAPI app and weather provider.
- `frontend/` contains the static HTML, JavaScript, and CSS.
- `scripts/` contains kiosk and Pi launch helpers.
- `cache/` stores generated NWS responses and can be deleted safely if you want to force a refresh.

## How It Works

At runtime, the backend serves the frontend files and responds to two JSON routes:

- `GET /api/health` returns a simple health check.
- `GET /api/weather` returns the dashboard payload.

The weather provider uses the NWS points, hourly forecast, and daily forecast endpoints. It keeps three cache tiers:

- point lookups: 7 days
- hourly data: 10 minutes
- daily forecast data: 30 minutes

Cache files are written under `cache/` and named like `nws_points_32.7764_-117.0719.json`.

The frontend calls `/api/weather` every 10 minutes and updates the clock every 10 seconds. It does not require a build step.

The current kiosk layout is intentionally clock-first: the time, San Diego temperature, daily high/low, precipitation chance, and any rain warning are styled to be readable from across a 15-inch display.

## Running Locally

### Prerequisites

- Python 3.11 or newer
- A virtual environment is recommended
- Internet access for the first weather fetch

### Install Dependencies

From the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Start The Backend

Run the API from the `backend/` directory:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Then open:

- `http://localhost:8000/` for the dashboard
- `http://localhost:8000/api/health` for the health check
- `http://localhost:8000/api/weather` for the raw JSON payload

### Optional Kiosk Mode

The `scripts/kiosk.sh` helper waits for the backend health check and then launches Chromium in kiosk mode against `http://localhost:8000`.

Typical usage on the Pi desktop session:

```bash
bash scripts/kiosk.sh
```

The script expects a graphical session with either `WAYLAND_DISPLAY` or `DISPLAY` set.

### Notes On `run_dev_pi.sh`

`scripts/run_dev_pi.sh` currently exists but is empty. There is no implemented dev-on-Pi wrapper yet.

## Frontend Interface

The frontend is a static page that reads from the API and updates the DOM in place. The main screen includes:

- current clock
- primary city weather card
- secondary city weather rows
- 7-day forecast tiles
- placeholder tiles for future modules

The page is intentionally built to be kiosk-friendly: cursor hidden, dark surface colors, large typography, and no visible app chrome.

## Backend API

### `GET /api/health`

Returns:

```json
{ "ok": true }
```

### `GET /api/weather`

Returns a payload shaped like this:

```json
{
	"primary": {
		"name": "San Diego, CA",
		"timeZone": "America/Los_Angeles",
		"current": {
			"temp_f": 72,
			"icon": "https://...",
			"shortForecast": "Sunny"
		},
		"today": {
			"high_f": 73,
			"low_f": 54,
			"precip_pct": 0,
			"cloud_pct": 58,
			"wind": "5 to 10 mph"
		},
		"week": [
			{
				"name": "Today",
				"high_f": 73,
				"low_f": 54,
				"precip_pct": 0,
				"icon": "https://...",
				"shortForecast": "Sunny"
			}
		],
		"attire": "Comfortable. Light layers should be perfect."
	},
	"others": [
		{
			"name": "Boston, MA",
			"timeZone": "America/New_York",
			"current": {
				"temp_f": 61,
				"icon": "https://...",
				"shortForecast": "Mostly Cloudy"
			},
			"today": {
				"high_f": 64,
				"low_f": 52,
				"precip_pct": 7,
				"cloud_pct": 84,
				"wind": "10 mph"
			}
		}
	],
	"updated_at": 1776637404,
	"source": "api.weather.gov"
}
```

## Customizing The Dashboard

### Change The Cities

Edit `backend/app/providers/weather_nws.py` and update the `CITIES` list. Keep the primary city first.

Each entry needs:

- `name`
- `lat`
- `lon`

### Change Weather Behavior

The provider logic also lives in `backend/app/providers/weather_nws.py`:

- `_get_grid_for_point()` resolves a coordinate to the NWS grid.
- `_get_forecast_periods()` pulls the daily forecast.
- `_get_hourly_periods()` pulls the hourly forecast.
- `_build_week_from_forecast()` shapes the 7-day view.
- `_attire_recommendation()` generates the text shown under the main weather card.

### Reset Cached Weather Data

If the feed gets stale or you want to refresh everything from NWS, delete the JSON files in `cache/` and reload the app. They will be recreated automatically.

## Deploying And Pushing Changes

The Git remote for this repository is `origin` on GitHub:

```text
https://github.com/EverettRichards/PETER.git
```

To push source changes to the remote Git system:

```bash
git status
git add README.md backend frontend scripts
git commit -m "Describe your change"
git push origin main
```

If the remote machine is a Raspberry Pi or other kiosk host that has its own clone of this repo, update that checkout after the push:

```bash
git pull origin main
```

Then restart whatever process is serving the app on that machine. If you are using the kiosk script manually, relaunch `scripts/kiosk.sh` after the backend is back up.

This repository does not currently include a systemd unit or a deployment script that automates the remote restart step.

## Troubleshooting

- If the dashboard loads but weather is blank, check `GET /api/weather` directly to confirm the backend can reach api.weather.gov.
- If Chromium opens to a blank page in kiosk mode, make sure the backend is already running on port 8000.
- If you change the city list, old cache files may still exist. Removing `cache/*.json` forces fresh lookups.
- If the Pi kiosk launch fails immediately, make sure you are running it from a graphical session, not a plain SSH shell.

## Current Project Notes

- The backend entrypoint is `backend/app/main.py`.
- The frontend is fully static and lives under `frontend/`.
- Weather data is fetched from api.weather.gov and cached locally.
- The primary dashboard now highlights the clock, current San Diego temperature, daily high/low, precipitation, and an explicit rain warning banner when rain is expected tonight or tomorrow.
- `scripts/run_dev_pi.sh` is currently empty and should be filled in if you want a dedicated Pi development launcher.


Deployment notes:
- Connect to hotspot
- Connect in VS CODE via SSH
- Make changes
- Update backend: `sudo systemctl restart PETER.service`
- Update frontend: `ctrl+R` on kiosk browser
- Worst case, `sudo reboot`
- Push changes to GitHub