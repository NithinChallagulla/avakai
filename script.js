const url = `https://34.93.62.26/hls/${id}.m3u8`;
let streams = [];
let overlayInterval = null;

/* ---------- TAB HANDLING ---------- */
function openTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

  document.getElementById(id).classList.add("active");
  if (btn) btn.classList.add("active");

  // 🔥 IMPORTANT: load stream when Stream tab opens
  if (id === "stream") {
    setTimeout(loadStream, 300);
  }
}


/* ---------- FETCH STREAMS ---------- */
async function fetchStreams() {
  try {
    const res = await fetch(`${API}/streams`);
    streams = await res.json();
    renderCounts();
    renderMaster();
    populateSelect();
  } catch (err) {
    console.error("Failed to fetch streams", err);
  }
}

/* ---------- TAB 1: PEOPLE COUNT ---------- */
function renderCounts() {
  const container = document.getElementById("countCards");
  if (!container) return;

  container.innerHTML = "";
  streams.forEach(s => {
    container.innerHTML += `
      <div class="card">
        <h3>${s.name}</h3>
        <p><b>Live:</b> ${s.live}</p>
        <p><b>Today:</b> ${s.today}</p>
        <p><b>Event:</b> ${s.event_total}</p>
      </div>
    `;
  });
}

/* ---------- TAB 3: MASTER ---------- */
function renderMaster() {
  const table = document.getElementById("masterTable");
  if (!table) return;

  table.innerHTML = "";
  streams.forEach(s => {
    table.innerHTML += `
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
function populateSelect() {
  const sel = document.getElementById("streamSelect");
  if (!sel) return;

  sel.innerHTML = "";
  streams.forEach(s => {
    sel.innerHTML += `<option value="${s.stream_id}">${s.name}</option>`;
  });
}

/* ---------- TAB 2: STREAM + COUNT ---------- */
async function loadStream() {
  const sel = document.getElementById("streamSelect");
  const video = document.getElementById("video");
  if (!sel || !video) return;

  const id = sel.value;
  const url = `/hls/${id}.m3u8`; // ✅ Netlify proxy

  if (Hls.isSupported()) {
    const hls = new Hls({ liveSyncDuration: 3 });
    hls.loadSource(url);
    hls.attachMedia(video);
  } else {
    video.src = url;
  }

  updateOverlay(id);
  startOverlayAutoUpdate(id);
}

/* ---------- OVERLAY UPDATE ---------- */
async function updateOverlay(id) {
  try {
    const res = await fetch(`${API}/count/${id}`);
    const data = await res.json();

    document.getElementById("liveCount").innerText = `Live: ${data.live}`;
    document.getElementById("todayCount").innerText = `Today: ${data.today}`;
    document.getElementById("eventCount").innerText = `Event: ${data.event_total}`;
  } catch (err) {
    console.error("Overlay update failed", err);
  }
}

function startOverlayAutoUpdate(id) {
  if (overlayInterval) clearInterval(overlayInterval);
  overlayInterval = setInterval(() => updateOverlay(id), 3000);
}

/* ---------- AUTO REFRESH ---------- */
setInterval(fetchStreams, 3000);
fetchStreams();
