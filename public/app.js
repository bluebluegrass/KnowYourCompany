const form = document.querySelector("#research-form");
const submitButton = document.querySelector("#submit-button");
const downloadButton = document.querySelector("#download-button");
const themeToggle = document.querySelector("#theme-toggle");
const statusBox = document.querySelector("#status-box");
const snapshot = document.querySelector("#snapshot");
const snapshotGrid = document.querySelector("#snapshot-grid");
const reportFrame = document.querySelector("#report-frame");
const emptyPreview = document.querySelector("#empty-preview");

let latestHtml = "";
let latestFilename = "KnowYourCompany_Report.html";

themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  document.documentElement.setAttribute("data-theme", currentTheme === "dark" ? "light" : "dark");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    company: String(formData.get("company") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    role: String(formData.get("role") || "").trim(),
    outputLanguage: String(formData.get("outputLanguage") || "").trim() || "English",
  };

  if (!payload.company) {
    setStatus("error", "Company name is required.");
    return;
  }

  setBusyState(true);
  setStatus("running", `Researching ${payload.company}. This usually takes a minute or two because the model is using live web search.`);

  try {
    const response = await fetch("/api/research", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    latestHtml = data.html;
    latestFilename = data.filename || latestFilename;
    reportFrame.srcdoc = latestHtml;
    reportFrame.style.display = "block";
    emptyPreview.style.display = "none";
    downloadButton.disabled = false;
    renderSnapshot(data.report.sections || []);
    setStatus("success", `Report ready for ${data.report.company}. Review it below or download the HTML file.`);
  } catch (error) {
    setStatus("error", error.message || "Failed to generate the report.");
  } finally {
    setBusyState(false);
  }
});

downloadButton.addEventListener("click", () => {
  if (!latestHtml) {
    return;
  }

  const blob = new Blob([latestHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = latestFilename;
  link.click();
  URL.revokeObjectURL(url);
});

function setBusyState(isBusy) {
  submitButton.disabled = isBusy;
  submitButton.textContent = isBusy ? "Researching..." : "Start research";
}

function setStatus(kind, text) {
  statusBox.className = `status-box ${kind}`;
  statusBox.textContent = text;
}

function renderSnapshot(sections) {
  snapshot.classList.remove("hidden");
  snapshotGrid.innerHTML = "";

  for (const section of sections.slice(0, 6)) {
    const card = document.createElement("div");
    card.className = `snapshot-card ${section.severity || "grey"}`;
    card.innerHTML = `
      <span class="label">${escapeHtml(section.shortTitle || section.title || "Section")}</span>
      <span class="value">${escapeHtml(section.label || "No data")}</span>
    `;
    snapshotGrid.append(card);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
