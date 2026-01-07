const API = "/api";
let streams = [];
let overlayInterval = null;
let hls = null;

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
function populateSelect() {
  const sel = document.getElementById("streamSelect");
  if (!sel) return;

  sel.innerHTML = "";
  streams.forEach(s => {
    sel.innerHTML += `<option value="${s.stream_id}">${s.name}</option>`;
  });
}

/* ---------- STREAM PLAYER ---------- */
function loadStream() {
  const sel = document.getElementById("streamSelect");
  const video = document.getElementById("video");
  if (!sel || !video) return;

  const id = sel.value;

  // ⚠️ TEMPORARY DIRECT STREAM (works only on HTTP pages)
  const url = `http://34.93.62.26/hls/${id}.m3u8`;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  if (Hls.isSupported()) {
    hls = new Hls({
      liveSyncDuration: 2,
      lowLatencyMode: true
    });

    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.muted = true;
      video.play().catch(() => {});
    });
  } else {
    video.src = url;
    video.play().catch(() => {});
  }

  updateOverlay(id);
  startOverlayAutoUpdate(id);
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
  overlayInterval = setInterval(() => updateOverlay(id), 3000);
}

/* ---------- START ---------- */
setInterval(fetchStreams, 3000);
fetchStreams();
