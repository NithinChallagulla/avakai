const API = "http://34.93.62.26:8000";
let streams = [];

function openTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.target.classList.add('active');
}

async function fetchStreams() {
  const res = await fetch(`${API}/streams`);
  streams = await res.json();
  renderCounts();
  renderMaster();
  populateSelect();
}

function renderCounts() {
  const container = document.getElementById("countCards");
  container.innerHTML = "";
  streams.forEach(s => {
    container.innerHTML += `
      <div class="card">
        <h3>${s.name}</h3>
        <p>Live: ${s.live}</p>
        <p>Today: ${s.today}</p>
        <p>Event: ${s.event_total}</p>
      </div>
    `;
  });
}

function renderMaster() {
  const table = document.getElementById("masterTable");
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

function populateSelect() {
  const sel = document.getElementById("streamSelect");
  sel.innerHTML = "";
  streams.forEach(s => {
    sel.innerHTML += `<option value="${s.stream_id}">${s.name}</option>`;
  });
}

async function loadStream() {
  const id = document.getElementById("streamSelect").value;
  const video = document.getElementById("video");
  const url = `http://34.93.62.26/hls/${id}.m3u8`;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
  } else {
    video.src = url;
  }

  updateOverlay(id);
}

async function updateOverlay(id) {
  const res = await fetch(`${API}/count/${id}`);
  const data = await res.json();
  document.getElementById("liveCount").innerText = `Live: ${data.live}`;
  document.getElementById("todayCount").innerText = `Today: ${data.today}`;
  document.getElementById("eventCount").innerText = `Event: ${data.event_total}`;
}

setInterval(fetchStreams, 3000);
fetchStreams();
