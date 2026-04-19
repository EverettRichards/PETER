window.addEventListener("error", (event) => {
  const el = document.getElementById("weather-updated");
  if (el) el.textContent = `JS error: ${event.message}`;
});

window.addEventListener("unhandledrejection", (event) => {
  const el = document.getElementById("weather-updated");
  if (el) el.textContent = `Promise error: ${event.reason}`;
});

function formatCityTime(timeZone) {
  try {
    const fmt = new Intl.DateTimeFormat([], {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    });
    return fmt.format(new Date());
  } catch {
    return "--:--";
  }
}

function iconFromForecast(text) {
  const t = (text || "").toLowerCase();

  if (t.includes("thunder")) {
    return `
      <svg viewBox="0 0 64 64" class="wx-svg">
        <path d="M24 50l8-14h-8l10-20h16L40 32h10L34 50z"/>
        <path d="M18 42a16 16 0 1 1 28-10A12 12 0 1 1 46 42z"
              fill="none" stroke="currentColor" stroke-width="4"/>
      </svg>`;
  }

  if (t.includes("snow")) {
    return `
      <svg viewBox="0 0 64 64" class="wx-svg">
        <path d="M18 38a16 16 0 1 1 28-10A12 12 0 1 1 46 38z"
              fill="none" stroke="currentColor" stroke-width="4"/>
        <path d="M22 48l4-4m0 4l-4-4
                 m18 4l4-4m0 4l-4-4
                 m-9 4l4-4m0 4l-4-4"
              stroke="currentColor" stroke-width="3"
              stroke-linecap="round"/>
      </svg>`;
  }

  if (t.includes("rain") || t.includes("shower")) {
    return `
      <svg viewBox="0 0 64 64" class="wx-svg">
        <path d="M18 30a16 16 0 1 1 28-10A12 12 0 1 1 46 30z"
              fill="none" stroke="currentColor" stroke-width="4"/>
        <path d="M24 40l-3 8m10-8l-3 8m10-8l-3 8"
              stroke="currentColor" stroke-width="4"
              stroke-linecap="round"/>
      </svg>`;
  }

  if (t.includes("fog") || t.includes("haze")) {
    return `
      <svg viewBox="0 0 64 64" class="wx-svg">
        <path d="M18 26a16 16 0 1 1 28-10A12 12 0 1 1 46 26z"
              fill="none" stroke="currentColor" stroke-width="4"/>
        <path d="M14 40h36M10 48h44"
              stroke="currentColor" stroke-width="4"
              stroke-linecap="round"/>
      </svg>`;
  }

  if (t.includes("cloud")) {
    return `
      <svg viewBox="0 0 64 64" class="wx-svg">
        <path d="M18 38a16 16 0 1 1 28-10A12 12 0 1 1 46 38z"
              fill="none" stroke="currentColor" stroke-width="4"/>
      </svg>`;
  }

  // sunny (default)
  return `
    <svg viewBox="0 0 64 64" class="wx-svg">
      <circle cx="32" cy="32" r="12"
              fill="none" stroke="currentColor" stroke-width="4"/>
      <path d="M32 8v8M32 48v8M8 32h8M48 32h8
               M14 14l6 6M44 44l6 6
               M50 14l-6 6M20 44l-6 6"
            stroke="currentColor" stroke-width="4"
            stroke-linecap="round"/>
    </svg>`;
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


function iconClassFromForecast(text) {
  const t = (text || "").toLowerCase();

  if (t.includes("thunder")) return "wx-thunder";
  if (t.includes("snow")) return "wx-snow";
  if (t.includes("rain") || t.includes("shower")) return "wx-rain";
  if (t.includes("fog") || t.includes("haze")) return "wx-fog";
  if (t.includes("cloud")) return "wx-cloudy";
  return "wx-sunny";
}


function fmtTemp(t) {
  if (t === null || t === undefined) return "--";
  return String(t);
}

function fmtPct(p) {
  if (p === null || p === undefined) return "--";
  return String(p);
}

function safeText(s) {
  if (s === null || s === undefined) return "";
  return String(s);
}

function formatDateLabel(ts, timeZone) {
  const d = new Date(ts * 1000);
  return new Intl.DateTimeFormat([], {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(d);
}

function setUpdated(ts) {
  const el = document.getElementById("weather-updated");
  const d = new Date(ts * 1000);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  el.textContent = `Updated ${hh}:${mm}`;
}

function renderWarning(message) {
  const el = document.getElementById("rain-warning");
  if (!el) return;

  if (!message) {
    el.textContent = "";
    el.classList.add("hidden");
    return;
  }

  el.textContent = message;
  el.classList.remove("hidden");
}

function renderPrimary(p) {
  document.getElementById("primary-city").textContent = p.name;

  const tz = p.timeZone || "UTC";
  document.getElementById("primary-time").textContent = formatCityTime(tz);
  document.getElementById("primary-date").textContent = formatDateLabel(window.__weatherData?.updated_at || Math.floor(Date.now() / 1000), tz);

  const cur = p.current || {};
  const today = p.today || {};

  document.getElementById("primary-temp").textContent = `${fmtTemp(cur.temp_f)}°F`;
  document.getElementById("primary-summary").textContent = safeText(cur.shortForecast);
  document.getElementById("primary-hilo").textContent =
    `H ${fmtTemp(today.high_f)}°  L ${fmtTemp(today.low_f)}°`;

  document.getElementById("primary-precip").textContent = `${fmtPct(today.precip_pct)}%`;
  document.getElementById("primary-clouds").textContent =
    (today.cloud_pct === null || today.cloud_pct === undefined) ? "--%" : `${fmtPct(today.cloud_pct)}%`;
  document.getElementById("primary-wind").textContent = safeText(today.wind || "--");

  document.getElementById("primary-attire").textContent = safeText(p.attire || "");

  // const iconEl = document.getElementById("primary-icon");
  // const iconUrl = cur.icon;
  // if (iconUrl) {
  //   iconEl.src = iconUrl;
  //   iconEl.style.display = "block";
  // } else {
  //   iconEl.style.display = "none";
  // }
  const iconEl = document.getElementById("primary-icon");
  const wrapper = iconEl.parentElement;

  wrapper.className = `wx-icon ${iconClassFromForecast(cur.shortForecast)}`;
  wrapper.innerHTML = iconFromForecast(cur.shortForecast || "");
  iconEl.style.display = "block";

}

function renderOthers(others) {
  const wrap = document.getElementById("weather-others");
  wrap.innerHTML = "";

  for (const o of (others || [])) {
    const cur = o.current || {};
    const today = o.today || {};
    const tz = o.timeZone || "UTC";
    const timeStr = formatCityTime(tz);

    const div = document.createElement("div");
    div.className = "other-row";

    // Give the time span an id so our periodic refresher can update it
    const safeId = `tz_${o.name}`;

    div.innerHTML = `
    <div class="other-city">${o.name}</div>
    <div class="other-time" id="${safeId}">${timeStr}</div>
    <div class="other-temp-big">${fmtTemp(cur.temp_f)}°F</div>
    <div class="wx-icon ${iconClassFromForecast(cur.shortForecast)}">
      ${iconFromForecast(cur.shortForecast || "")}
    </div>
    <div class="other-right">
      <div class="other-metric">H ${fmtTemp(today.high_f)}°</div>
      <div class="other-metric">L ${fmtTemp(today.low_f)}°</div>
      <div class="other-metric">${fmtPct(today.precip_pct)}%</div>
    </div>
  `;

    wrap.appendChild(div);
  }
}


function renderWeek(week) {
  if (!week || !week.length) return;

  const grid = document.getElementById("week-grid");
  grid.innerHTML = "";

  for (const d of (week || []).slice(0, 7)) {
    const el = document.createElement("div");
    el.className = "day";

    const cls = iconClassFromForecast(d.shortForecast);
    const icon = `
      <div class="wx-icon ${iconClassFromForecast(d.shortForecast)}">
        ${iconFromForecast(d.shortForecast || "")}
      </div>`;



    const precip = (d.precip_pct === null || d.precip_pct === undefined) ? "--" : `${d.precip_pct}`;

    el.innerHTML = `
      <div class="day-name">${safeText(d.name)}</div>
      ${icon}
      <div class="day-hilo">${fmtTemp(d.high_f)}° / ${fmtTemp(d.low_f)}°</div>
      <div class="day-precip">${precip}% precip</div>
    `;
    grid.appendChild(el);
  }
}

async function loadWeather() {
  const status = document.getElementById("status-content");
  try {
    const res = await fetch("/api/weather", { cache: "no-store" });
    const data = await res.json();

    window.__weatherData = data;

    if (!data.primary) {
      status.textContent = "Weather: no cities configured";
      return;
    }

    setUpdated(data.updated_at);
    renderPrimary(data.primary);
    renderOthers(data.others);
    renderWeek(data.primary.week);
    renderWarning(data.primary.rain_warning);

    status.textContent = "OK";
  } catch (e) {
    status.textContent = `Weather error: ${e}`;
  }
}

// Keep your existing clock code if you like
function setClock() {
  const el = document.getElementById("clock");
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  el.textContent = `${hh}:${mm}`;
}

setClock();
setInterval(setClock, 1000 * 10);

loadWeather();
setInterval(loadWeather, 1000 * 60 * 10);

setInterval(() => {
  // refresh times without refetching weather
  const ptz = window.__weatherData?.primary?.timeZone;
  if (ptz) {
    const el = document.getElementById("primary-time");
    if (el) el.textContent = formatCityTime(ptz);
  }

  const others = window.__weatherData?.others || [];
  for (const o of others) {
    const tzel = document.getElementById(`tz_${o.name}`);
    if (tzel) tzel.textContent = formatCityTime(o.timeZone || "UTC");
  }
}, 10_000);

// =========================
// Transit Map
// =========================

let transitMap = null;
let vehicleMarkers = {};
let landmarkMarker = null;

const TROLLEY_LINE_STYLES = {
  Blue: { className: "trolley-line-blue", color: "#0f4b8b" },
  Green: { className: "trolley-line-green", color: "#15853b" },
  Orange: { className: "trolley-line-orange", color: "#e28112" },
  Copper: { className: "trolley-line-copper", color: "#5f2e0b" },
  Trolley: { className: "trolley-line-generic", color: "#888888" },
};

const TRANSIT_BOUNDS = [
  [32.705, -117.22],
  [32.905, -116.99],
];

// Bus icon (blue circle)
function getBusIcon() {
  if (typeof L === 'undefined') return null;
  return L.divIcon({
    className: 'transit-marker bus-marker',
    html: '<div class="marker-dot"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function getTrolleyIcon(lineName) {
  if (typeof L === 'undefined') return null;
  const style = TROLLEY_LINE_STYLES[lineName] || TROLLEY_LINE_STYLES.Trolley;
  return L.divIcon({
    className: `transit-marker trolley-marker ${style.className}`,
    html: `
      <div class="marker-wrap">
        <div class="marker-dot"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function getLandmarkIcon() {
  if (typeof L === 'undefined') return null;
  return L.divIcon({
    className: 'transit-marker landmark-marker',
    html: `
      <div class="marker-wrap landmark-wrap">
        <div class="marker-star">★</div>
        <div class="marker-label">The Rive</div>
      </div>
    `,
    iconSize: [60, 42],
    iconAnchor: [30, 21],
  });
}

function initTransitMap() {
  const mapContainer = document.getElementById('transit-map');
  if (!mapContainer || transitMap || typeof L === 'undefined') return;

  // Focus tighter on the San Diego core to reduce empty ocean/desert coverage.
  transitMap = L.map('transit-map', {
    zoomControl: true,
    attributionControl: false,
  }).setView([32.78, -117.09], 12.4);

  transitMap.setMinZoom(11.4);
  transitMap.setMaxZoom(14.5);

  // Use a reliable full-color basemap.
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
    crossOrigin: true,
  }).addTo(transitMap);

  transitMap.fitBounds(TRANSIT_BOUNDS, { padding: [8, 8] });

  // Add custom styles for markers via style element
  const style = document.createElement('style');
  style.textContent = `
    .transit-marker {
      background: transparent;
      border: none;
    }
    .marker-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      transform: translateY(-1px);
    }
    .marker-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
      flex: none;
    }
    .bus-marker .marker-dot {
      background: #f28b8b;
    }
    .trolley-marker .marker-dot {
      width: 18px;
      height: 18px;
      border-width: 2px;
    }
    .trolley-line-blue .marker-dot {
      background: #2f7fd6;
    }
    .trolley-line-green .marker-dot {
      background: #63d28b;
    }
    .trolley-line-orange .marker-dot {
      background: #ffab4d;
    }
    .trolley-line-copper .marker-dot {
      background: #c87f4a;
    }
    .trolley-line-generic .marker-dot {
      background: #ffd166;
    }
    .marker-label {
      padding: 2px 7px 3px;
      border-radius: 999px;
      background: rgba(8, 14, 20, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.16);
      color: #f7fbff;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
    }
    .landmark-wrap .marker-star {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #fff3b0 0%, #f5c94c 45%, #b77814 100%);
      color: #1d1300;
      font-size: 14px;
      line-height: 1;
      box-shadow: 0 0 0 2px rgba(255, 224, 128, 0.24), 0 4px 10px rgba(0, 0, 0, 0.45);
      margin-bottom: 2px;
    }
  `;
  document.head.appendChild(style);

  const landmarkLatLng = [32.76325, -117.06256];
  landmarkMarker = L.marker(landmarkLatLng, { icon: getLandmarkIcon() })
    .bindPopup(`
      <strong>Golden star</strong><br>
      32°45'47.7"N 117°03'45.2"W
    `)
    .addTo(transitMap);
}

async function loadTransitVehicles() {
  const subtitle = document.getElementById("transit-updated");
  
  if (!transitMap || typeof L === 'undefined') {
    if (subtitle) subtitle.textContent = "Map not ready";
    return;
  }
  
  try {
    const res = await fetch("/api/transit/vehicles", { cache: "no-store" });
    const data = await res.json();

    if (!data.success) {
      // Display error type and first part of message for diagnostic purposes
      const errorMsg = data.error || "Unknown error";
      const errorType = errorMsg.split(':')[0];
      if (subtitle) subtitle.textContent = `Error: ${errorType}`;
      return;
    }

    // Update timestamp
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    if (subtitle) subtitle.textContent = `Updated ${hh}:${mm} - ${data.count} vehicles`;

    // Track current vehicle IDs
    const currentVehicleIds = new Set();

    // Update or add markers
    for (const vehicle of data.vehicles) {
      currentVehicleIds.add(vehicle.id);

      const icon = vehicle.vehicle_type === 'trolley'
        ? getTrolleyIcon(vehicle.trolley_line || 'Trolley')
        : getBusIcon();
      const latLng = [vehicle.latitude, vehicle.longitude];

      if (vehicleMarkers[vehicle.id]) {
        // Update existing marker
        vehicleMarkers[vehicle.id].setIcon(icon);
        vehicleMarkers[vehicle.id].setLatLng(latLng);
      } else {
        // Create new marker
        const marker = L.marker(latLng, { icon })
          .bindPopup(`
            <strong>${vehicle.vehicle_type === 'trolley' ? `${escapeHtml(vehicle.trolley_line || 'Trolley')} Line` : 'Bus'}</strong><br>
            Route: ${vehicle.route_id}<br>
            Vehicle: ${vehicle.vehicle_id || 'N/A'}
          `)
          .addTo(transitMap);
        
        vehicleMarkers[vehicle.id] = marker;
      }
    }

    // Remove markers for vehicles no longer in the feed
    for (const id in vehicleMarkers) {
      if (!currentVehicleIds.has(id)) {
        transitMap.removeLayer(vehicleMarkers[id]);
        delete vehicleMarkers[id];
      }
    }

  } catch (e) {
    if (subtitle) subtitle.textContent = `Transit error: ${e.message || e}`;
  }
}

// Initialize map when Leaflet loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof L !== 'undefined') {
      initTransitMap();
      loadTransitVehicles();
    }
  });
} else {
  if (typeof L !== 'undefined') {
    initTransitMap();
    loadTransitVehicles();
  }
}

// Update transit vehicles every 15 seconds
setInterval(loadTransitVehicles, 1000 * 15);
