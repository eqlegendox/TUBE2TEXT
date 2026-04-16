const BACKEND_URL = "http://localhost:8000";

// ── State management ──────────────────────────────────────────────────────────

const states = ["not-youtube", "ready", "loading", "result", "error"];

function showState(name) {
  states.forEach((s) => {
    document.getElementById(`state-${s}`).classList.add("hidden");
  });
  document.getElementById(`state-${name}`).classList.remove("hidden");
}

// ── YouTube helpers ───────────────────────────────────────────────────────────

function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v") || null;
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("?")[0] || null;
    }
  } catch (_) {}
  return null;
}

function buildTimestampUrl(videoId, timestamp) {
  const parts = timestamp.split(":").map(Number);
  let seconds = 0;
  if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
  if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  return `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Get current tab info ──────────────────────────────────────────────────────

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// ── Render result ─────────────────────────────────────────────────────────────

function renderResult(data) {
  document.getElementById("result-title").textContent = data.video_title || "Video Notes";
  document.getElementById("result-overview").textContent = data.overview;

  // Render sections
  const sectionsContainer = document.getElementById("result-sections");
  sectionsContainer.innerHTML = "";

  (data.sections || []).forEach((section) => {
    const tsUrl = buildTimestampUrl(data.video_id, section.timestamp);

    const div = document.createElement("div");
    div.className = "notes-section";

    // Header: section title + timestamp link
    const header = document.createElement("div");
    header.className = "notes-section-header";
    header.innerHTML = `
      <span class="notes-section-title">${escapeHtml(section.title)}</span>
      <a class="notes-timestamp" href="${tsUrl}" target="_blank">${escapeHtml(section.timestamp)}</a>
    `;
    div.appendChild(header);

    // Full notes text
    const notes = document.createElement("p");
    notes.className = "notes-text";
    notes.textContent = section.notes;
    div.appendChild(notes);

    // Visual moments
    if (section.visual_moments && section.visual_moments.length > 0) {
      const vmContainer = document.createElement("div");
      vmContainer.className = "visual-moments";

      const vmLabel = document.createElement("span");
      vmLabel.className = "visual-moments-label";
      vmLabel.textContent = "📺 Visual moments";
      vmContainer.appendChild(vmLabel);

      const vmList = document.createElement("ul");
      vmList.className = "visual-moments-list";
      section.visual_moments.forEach((vm) => {
        const vmUrl = buildTimestampUrl(data.video_id, vm.timestamp);
        const li = document.createElement("li");
        li.innerHTML = `<a class="vm-timestamp" href="${vmUrl}" target="_blank">${escapeHtml(vm.timestamp)}</a> <span class="vm-desc">${escapeHtml(vm.description)}</span>`;
        vmList.appendChild(li);
      });
      vmContainer.appendChild(vmList);
      div.appendChild(vmContainer);
    }

    sectionsContainer.appendChild(div);
  });

  // Truncation warning
  const truncatedBanner = document.getElementById("truncated-banner");
  if (data.truncated) {
    truncatedBanner.classList.remove("hidden");
  } else {
    truncatedBanner.classList.add("hidden");
  }

  // Notion status
  const notionLink = document.getElementById("notion-link");
  const notionErrorBanner = document.getElementById("notion-error-banner");

  if (data.notion_page_url) {
    notionLink.href = data.notion_page_url;
    notionLink.classList.remove("hidden");
    notionErrorBanner.classList.add("hidden");
  } else {
    notionLink.classList.add("hidden");
    if (data.notion_error) {
      notionErrorBanner.textContent = `⚠ Notion save failed: ${data.notion_error}`;
      notionErrorBanner.classList.remove("hidden");
    } else {
      notionErrorBanner.classList.add("hidden");
    }
  }

  showState("result");
}

// ── Main summarize flow ───────────────────────────────────────────────────────

async function runSummarize() {
  const tab = await getCurrentTab();
  const videoId = extractVideoId(tab.url);

  if (!videoId) {
    showState("not-youtube");
    return;
  }

  showState("loading");
  setLoadingMessage("Fetching transcript & generating notes…");

  try {
    const response = await fetch(`${BACKEND_URL}/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_id: videoId,
        video_title: tab.title ? tab.title.replace(" - YouTube", "").trim() : "",
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || `Server error ${response.status}`);
    }

    const data = await response.json();
    renderResult(data);
  } catch (err) {
    let msg = err.message || "Unknown error";
    if (err instanceof TypeError && msg.includes("fetch")) {
      msg =
        "Cannot reach the backend. Make sure the FastAPI server is running on http://localhost:8000.";
    }
    showError(msg);
  }
}

function setLoadingMessage(msg) {
  document.getElementById("loading-message").textContent = msg;
}

function showError(msg) {
  document.getElementById("error-message").textContent = msg;
  showState("error");
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  const tab = await getCurrentTab();
  const videoId = extractVideoId(tab.url || "");

  if (!videoId) {
    showState("not-youtube");
    return;
  }

  document.getElementById("video-id-display").textContent = videoId;
  showState("ready");

  document.getElementById("summarize-btn").addEventListener("click", runSummarize);
  document.getElementById("summarize-again-btn").addEventListener("click", () => {
    showState("ready");
  });
  document.getElementById("retry-btn").addEventListener("click", runSummarize);
});
