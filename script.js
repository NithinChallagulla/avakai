const API = "/api";
let streams = [];
let overlayInterval = null;
let hlsInstance = null;

/* ---------- TAB HANDLING ---------- */
function openTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

  document.getElementById(id).classList.add("active");
  if (btn) btn.classList.add("active");

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

/* ---------- PEOPLE COUNT TAB ---------- */
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

/* ---------- MASTER TAB ---------- */
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

  const current = sel.value;
  sel.innerHTML = "";

  streams.forEach(s => {
    sel.innerHTML += `<option value="${s.stream_id}">${s.name}</option>`;
  });

  if (!current && streams.length > 0) {
    sel.value = streams[0].stream_id;
  }
}

/* ---------- STREAM + COUNT ---------- */
function loadStream() {
  const sel = document.getElementById("streamSelect");
  const video = document.getElementById("video");
  if (!sel || !video) return;

  const id = sel.value;

  // 🔥 IMPORTANT: Netlify HLS proxy
  const url = `/hls/${id}.m3u8`;

  // Destroy previous HLS instance
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  if (window.Hls && Hls.isSupported()) {
    hlsInstance = new Hls({
      lowLatencyMode: true,
      liveSyncDuration: 2,
