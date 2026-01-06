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

function setUpdated(ts) {
  const el = document.getElementById("weather-updated");
  const d = new Date(ts * 1000);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  el.textContent = `Updated ${hh}:${mm}`;
}

function renderPrimary(p) {
  document.getElementById("primary-city").textContent = p.name;

  const tz = p.timeZone || "UTC";
  document.getElementById("primary-time").textContent = formatCityTime(tz);

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

    const iconSrc = iconFromForecast(cur.shortForecast || "");

    // Give the time span an id so our periodic refresher can update it
    const safeId = `tz_${o.name}`;

    div.innerHTML = `
    <div class="other-city">${o.name}</div>
    <div class="other-time" id="${safeId}">${timeStr}</div>
    <div class="other-temp-big">${fmtTemp(cur.temp_f)}°F</div>
    <div class="wx-icon ${iconClassFromForecast(cur.shortForecast)}">
      <div class="wx-icon ${iconClassFromForecast(cur.shortForecast)}">
        ${iconFromForecast(cur.shortForecast || "")}
      </div>
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
