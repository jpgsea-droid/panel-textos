(() => {
  const config = window.APP_CONFIG || {};
  const apiBase = (config.API_BASE_URL || "").replace(/\/+$/, "");
  const rawBase = "https://raw.githubusercontent.com/jpgsea-droid/panel-textos/main/";
  const form = document.getElementById("send-form");
  const input = document.getElementById("input-text");
  const sendButton = document.getElementById("send-button");
  const sendStatus = document.getElementById("send-status");
  const count = document.getElementById("char-count");
  const honeypot = document.getElementById("website");
  const refreshButton = document.getElementById("refresh-button");
  const updatedStatus = document.getElementById("outputs-updated");

  const outputs = [
    { key: "ino", file: "salida.ino", elementId: "output-ino", statusId: "status-ino", copyId: "copy-ino", empty: "(El archivo salida.ino está vacío.)" },
    { key: "json", file: "salida.json", elementId: "output-json", statusId: "status-json", copyId: "copy-json", empty: "(El archivo salida.json está vacío.)" },
    { key: "extra", file: "extra.txt", elementId: "output-extra", statusId: "status-extra", copyId: "copy-extra", empty: "(El archivo extra.txt está vacío.)" }
  ];

  function apiReady() {
    return apiBase.startsWith("https://") && !apiBase.includes("PEGA_AQUI");
  }
  function setSendStatus(message, kind = "") {
    sendStatus.textContent = message;
    sendStatus.className = `status ${kind}`;
  }
  input.addEventListener("input", () => {
    count.textContent = `${input.value.length} / 20000`;
  });

  async function loadOne(output) {
    const element = document.getElementById(output.elementId);
    const note = document.getElementById(output.statusId);
    note.textContent = "Cargando desde GitHub…";
    try {
      const response = await fetch(`${rawBase}${output.file}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`GitHub respondió HTTP ${response.status}`);
      const content = await response.text();
      element.textContent = content || output.empty;
      note.textContent = "Actualizado desde GitHub";
      return true;
    } catch (error) {
      element.textContent = "No fue posible cargar este archivo. Pulsa “Actualizar las tres salidas” para intentarlo de nuevo.";
      note.textContent = error.message || "Error de conexión";
      return false;
    }
  }

  async function loadOutputs() {
    refreshButton.disabled = true;
    updatedStatus.textContent = "Actualizando las tres salidas…";
    const results = await Promise.all(outputs.map(loadOne));
    updatedStatus.textContent = results.every(Boolean)
      ? `Última consulta: ${new Date().toLocaleString()}`
      : "Una o más salidas no pudieron cargarse.";
    refreshButton.disabled = false;
  }

  async function copyOutput(output) {
    const element = document.getElementById(output.elementId);
    const note = document.getElementById(output.statusId);
    const button = document.getElementById(output.copyId);
    const text = element.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      note.textContent = "Contenido copiado al portapapeles.";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const copied = document.execCommand("copy");
      selection.removeAllRanges();
      note.textContent = copied ? "Contenido copiado al portapapeles." : "No se pudo copiar automáticamente; selecciona y copia el texto manualmente.";
    }
    button.blur();
  }

  outputs.forEach(output => {
    document.getElementById(output.copyId).addEventListener("click", () => copyOutput(output));
  });
  refreshButton.addEventListener("click", loadOutputs);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (honeypot.value) return;
    if (!apiReady()) {
      setSendStatus("La web está pendiente de conectar con el backend seguro.", "error");
      return;
    }
    const text = input.value;
    if (!text.trim()) {
      setSendStatus("Escribe o pega un texto antes de enviarlo.", "error");
      return;
    }
    sendButton.disabled = true;
    setSendStatus("Enviando y guardando en GitHub…");
    try {
      const response = await fetch(`${apiBase}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, website: honeypot.value })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el texto.");
      setSendStatus("Texto enviado correctamente y guardado en entrada.txt de GitHub.", "success");
      input.value = "";
      count.textContent = "0 / 20000";
    } catch (error) {
      setSendStatus(error.message || "Error de conexión. Inténtalo de nuevo.", "error");
    } finally {
      sendButton.disabled = false;
    }
  });

  loadOutputs();
})();
