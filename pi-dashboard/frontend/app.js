function setClock() {
  const el = document.getElementById("clock");
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  el.textContent = `${hh}:${mm}`;
}

async function loadWeather() {
  const status = document.getElementById("status-content");
  try {
    const res = await fetch("/api/weather", { cache: "no-store" });
    const data = await res.json();
    const container = document.getElementById("weather-content");
    container.innerHTML = "";

    for (const loc of data.locations) {
      const row = document.createElement("div");
      row.className = "weather-row";

      row.innerHTML = `
        <div class="weather-left">
          <div class="weather-name">${loc.name}</div>
          <div class="weather-cond">${loc.condition}</div>
        </div>
        <div class="weather-right">
          <div class="weather-temp">${loc.temp_f}°F</div>
          <div class="weather-hilo">H ${loc.high_f}°  L ${loc.low_f}°</div>
        </div>
      `;
      container.appendChild(row);
    }

    status.textContent = `OK - updated ${data.generated_at}`;
  } catch (e) {
    status.textContent = `Error: ${e}`;
  }
}

function setDim(alpha) {
  // alpha: 0..0.85
  const overlay = document.getElementById("dim-overlay");
  overlay.style.opacity = String(alpha);
}

// Boot
setClock();
setInterval(setClock, 1000 * 10);

loadWeather();
setInterval(loadWeather, 1000 * 60 * 10);

// For now: mild dim at night-ish. Replace with camera/schedule later.
const hour = new Date().getHours();
setDim(hour >= 0 && hour < 7 ? 0.65 : 0.10);
