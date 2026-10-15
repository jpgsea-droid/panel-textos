(() => {
  const config = window.APP_CONFIG || {};
  const apiBase = (config.API_BASE_URL || "").replace(/\/+$/, "");
  const rawBase = "https://raw.githubusercontent.com/jpgsea-droid/panel-textos/main/";
  const commitsBase = "https://api.github.com/repos/jpgsea-droid/panel-textos/commits?per_page=1&path=";
  const form = document.getElementById("send-form");
  const input = document.getElementById("input-text");
  const sendButton = document.getElementById("send-button");
  const sendStatus = document.getElementById("send-status");
  const honeypot = document.getElementById("website");
  const linksToggle = document.getElementById("links-toggle");
  const linksPanel = document.getElementById("links-panel");
  const linksStatus = document.getElementById("links-status");
  const refreshButton = document.getElementById("refresh-button");

  const outputs = [
    { key: "ino", file: "salida.ino", timeId: "time-ino", copyId: "copy-ino", label: ".ino", content: null, loaded: false },
    { key: "json", file: "salida.json", timeId: "time-json", copyId: "copy-json", label: ".json", content: null, loaded: false },
    { key: "extra", file: "extra.txt", timeId: "time-extra", copyId: "copy-extra", label: ".txt", content: null, loaded: false }
  ];

  function apiReady() {
    return apiBase.startsWith("https://") && !apiBase.includes("PEGA_AQUI");
  }
  function setSendStatus(message, kind = "") {
    sendStatus.textContent = message;
    sendStatus.className = `status ${kind}`;
  }

  function formatUpdatedAt(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Hora no disponible";
    return date.toLocaleString(undefined, {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
  }

  async function updateLastModified(output) {
    const timeElement = document.getElementById(output.timeId);
    try {
      const url = `${commitsBase}${encodeURIComponent(output.file)}`;
      const response = await fetch(url, { cache: "no-store", headers: { "Accept": "application/vnd.github+json" } });
      if (!response.ok) throw new Error("No disponible");
      const commits = await response.json();
      const date = commits?.[0]?.commit?.committer?.date || commits?.[0]?.commit?.author?.date;
      if (!date) throw new Error("No disponible");
      timeElement.textContent = `Última actualización: ${formatUpdatedAt(date)}`;
    } catch {
      timeElement.textContent = "Última actualización: hora no disponible";
    }
  }

  async function loadOutput(output) {
    const button = document.getElementById(output.copyId);
    const timeElement = document.getElementById(output.timeId);
    try {
      const response = await fetch(`${rawBase}${output.file}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`GitHub respondió HTTP ${response.status}`);
      output.content = await response.text();
      output.loaded = true;
      button.disabled = false;
      await updateLastModified(output);
      return true;
    } catch {
      output.content = null;
      output.loaded = false;
      button.disabled = true;
      timeElement.textContent = "Archivo no disponible";
      linksStatus.textContent = `No se pudo cargar ${output.file}. Intenta actualizar.`;
      return false;
    }
  }

  async function loadAllOutputs() {
    refreshButton.disabled = true;
    linksStatus.textContent = "Actualizando archivos y horas…";
    const result = await Promise.all(outputs.map(loadOutput));
    const loadedCount = result.filter(Boolean).length;
    linksStatus.textContent = loadedCount === outputs.length
      ? "Archivos listos para copiar."
      : `Se pudieron cargar ${loadedCount} de ${outputs.length} archivos.`;
    refreshButton.disabled = false;
  }

  async function copyOutput(output) {
    if (!output.loaded || typeof output.content !== "string") {
      linksStatus.textContent = `${output.label}: el archivo aún no está disponible.`;
      return;
    }
    const button = document.getElementById(output.copyId);
    try {
      await navigator.clipboard.writeText(output.content);
      linksStatus.textContent = `${output.label} copiado al portapapeles.`;
    } catch {
      const area = document.createElement("textarea");
      area.value = output.content;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let copied = false;
      try { copied = document.execCommand("copy"); } catch { copied = false; }
      area.remove();
      linksStatus.textContent = copied
        ? `${output.label} copiado al portapapeles.`
        : "No se pudo copiar automáticamente en este navegador.";
    }
    button.blur();
  }

  linksToggle.addEventListener("click", () => {
    const expanded = linksToggle.getAttribute("aria-expanded") === "true";
    linksToggle.setAttribute("aria-expanded", String(!expanded));
    linksPanel.hidden = expanded;
    if (!expanded && outputs.every(output => !output.loaded)) loadAllOutputs();
  });

  outputs.forEach(output => {
    document.getElementById(output.copyId).addEventListener("click", () => copyOutput(output));
  });
  refreshButton.addEventListener("click", loadAllOutputs);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (honeypot.value) return;
    if (!apiReady()) {
      setSendStatus("La web está pendiente de conectar con el backend seguro.", "error");
      return;
    }
    const text = input.value;
    if (!text.trim()) {
      setSendStatus("Pega o escribe un texto antes de enviarlo.", "error");
      return;
    }
    sendButton.disabled = true;
    setSendStatus("Enviando…");
    try {
      const response = await fetch(`${apiBase}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, website: honeypot.value })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el texto.");
      setSendStatus("Enviado.", "success");
      input.value = "";
    } catch (error) {
      setSendStatus(error.message || "Error de conexión. Inténtalo de nuevo.", "error");
    } finally {
      sendButton.disabled = false;
    }
  });

  loadAllOutputs();
})();
