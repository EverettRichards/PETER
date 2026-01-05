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

  const iconEl = document.getElementById("primary-icon");
  const iconUrl = cur.icon;
  if (iconUrl) {
    iconEl.src = iconUrl;
    iconEl.style.display = "block";
  } else {
    iconEl.style.display = "none";
  }
}

function renderOthers(others) {
  const wrap = document.getElementById("weather-others");
  wrap.innerHTML = "";

  for (const o of (others || [])) {
    const cur = o.current || {};
    const today = o.today || {};
    const div = document.createElement("div");
    div.className = "other-card";

    const icon = cur.icon ? `<img class="other-icon" src="${cur.icon}" alt="" />` : `<div></div>`;

    div.innerHTML = `
      <div>
        <div class="other-name">${o.name}</div>
        <div class="other-line">
          <div class="other-temp">${fmtTemp(cur.temp_f)}°</div>
          <div>H ${fmtTemp(today.high_f)}°</div>
          <div>L ${fmtTemp(today.low_f)}°</div>
          <div>${fmtPct(today.precip_pct)}%</div>
        </div>
      </div>
      ${icon}
    `;
    wrap.appendChild(div);
  }
}

function renderWeek(week) {
  const grid = document.getElementById("week-grid");
  grid.innerHTML = "";

  for (const d of (week || []).slice(0, 7)) {
    const el = document.createElement("div");
    el.className = "day";

    const icon = d.icon ? `<img class="day-icon" src="${d.icon}" alt="" />` : `<div style="height:34px"></div>`;
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
