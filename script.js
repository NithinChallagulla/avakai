const API = "/api";
let streams = [];
let overlayInterval = null;
let hls = null;
let currentStreamId = null;
let hourlyChart = null;

/* ---------- TAB HANDLING ---------- */
function openTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

  document.getElementById(id).classList.add("active");
  if (btn) btn.classList.add("active");

  if (id === "stream") {
    setTimeout(loadStream, 200);
  }
}

/* ---------- FETCH STREAMS ---------- */
async function fetchStreams() {
  try {
    const res = await fetch(`${API}/streams`);
    streams = await res.json();

    renderCounts();
    renderMaster();
    populateSelectPreserve();
  } catch (e) {
    console.error("fetchStreams failed", e);
  }
}

/* ---------- PEOPLE COUNT ---------- */
function renderCounts() {
  const el = document.getElementById("countCards");
  if (!el) return;

  el.innerHTML = "";
  streams.forEach(s => {
    el.innerHTML += `
      <div class="card">
        <h3>${s.name}</h3>
        <p>Live: ${s.live}</p>
        <p>Today: ${s.today}</p>
        <p>Event: ${s.event_total}</p>
      </div>
    `;
  });
}

/* ---------- MASTER ---------- */
function renderMaster() {
  const el = document.getElementById("masterTable");
  if (!el) return;

  el.innerHTML = "";
  streams.forEach(s => {
    el.innerHTML += `
      <tr>
        <td>${s.stream_id}</td>
        <td>${s.name}</td>
        <td>${s.status}</td>
        <td>${s.live}</td>
        <td>${s.today}</td>
        <td>${s.event_total}</td>
      </tr>
    `;
  });
}

/* ---------- STREAM SELECT ---------- */
function populateSelectPreserve() {
  const sel = document.getElementById("streamSelect");
  if (!sel) return;

  const prev = sel.value;
  sel.innerHTML = "";

  streams.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.stream_id;
    opt.textContent = s.name;
    sel.appendChild(opt);
  });

  if (prev && streams.find(s => s.stream_id === prev)) {
    sel.value = prev;
  } else {
    sel.value = streams[0]?.stream_id;
  }

  currentStreamId = sel.value;
}

/* ---------- STREAM PLAYER ---------- */
function loadStream() {
  const sel = document.getElementById("streamSelect");
  const video = document.getElementById("video");
  if (!sel || !video) return;

  const id = sel.value;
  currentStreamId = id;

  const url = `/hls/${id}.m3u8`;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  if (Hls.isSupported()) {
    hls = new Hls({ liveSyncDuration: 2 });
    hls.loadSource(url);
    hls.attachMedia(video);
  } else {
    video.src = url;
  }

  updateOverlay(id);
  startOverlayAutoUpdate(id);
  updateHourlyChart(id);
}

/* ---------- OVERLAY ---------- */
async function updateOverlay(id) {
  try {
    const res = await fetch(`${API}/count/${id}`);
    const d = await res.json();

    document.getElementById("liveCount").innerText = `Live: ${d.live}`;
    document.getElementById("todayCount").innerText = `Today: ${d.today}`;
    document.getElementById("eventCount").innerText = `Event: ${d.event_total}`;
  } catch (e) {
    console.error("overlay failed", e);
  }
}

function startOverlayAutoUpdate(id) {
  if (overlayInterval) clearInterval(overlayInterval);
  overlayInterval = setInterval(() => {
    updateOverlay(id);
    updateHourlyChart(id);
  }, 5000);
}

/* ---------- HOURLY CHART ---------- */
async function updateHourlyChart(id) {
  try {
    const res = await fetch(`${API}/count/${id}`);
    const data = await res.json();

    const hourly = data.hourly || {};
    const labels = Object.keys(hourly);
    const values = Object.values(hourly);

    const ctx = document.getElementById("hourlyChart");
    if (!ctx) return;

    if (hourlyChart) {
      hourlyChart.data.labels = labels;
      hourlyChart.data.datasets[0].data = values;
      hourlyChart.update();
      return;
    }

    hourlyChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "People per Hour",
          data: values
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });

  } catch (e) {
    console.error("chart error", e);
  }
}

/* ---------- CSV EXPORT ---------- */
async function downloadHourlyCSV() {
  if (!currentStreamId) return;

  const res = await fetch(`${API}/count/${currentStreamId}`);
  const data = await res.json();

  let csv = "Hour,Count\n";
  Object.entries(data.hourly).forEach(([h, c]) => {
    csv += `${h},${c}\n`;
  });

  downloadFile(csv, "hourly_counts.csv");
}

async function downloadDailyCSV() {
  if (!currentStreamId) return;

  const res = await fetch(`${API}/daily/${currentStreamId}`);
  const data = await res.json();

  let csv = "Date,Count\n";
  data.forEach(row => {
    csv += `${row.date},${row.count}\n`;
  });

  downloadFile(csv, "daily_counts.csv");
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/* ---------- RESET ---------- */
async function resetStream() {
  if (!currentStreamId) return;
  if (!confirm(`Reset counts for ${currentStreamId}?`)) return;

  await fetch(`${API}/reset/${currentStreamId}`, { method: "POST" });
}

/* ---------- START ---------- */
setInterval(fetchStreams, 3000);
fetchStreams();
