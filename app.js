(() => {
  const config = window.APP_CONFIG || {};
  const apiBase = (config.API_BASE_URL || "").replace(/\/+$/, "");
  const form = document.getElementById("send-form");
  const input = document.getElementById("input-text");
  const sendButton = document.getElementById("send-button");
  const sendStatus = document.getElementById("send-status");
  const output = document.getElementById("output-text");
  const updatedStatus = document.getElementById("updated-status");
  const refreshButton = document.getElementById("refresh-button");
  const count = document.getElementById("char-count");
  const honeypot = document.getElementById("website");
  function apiReady() { return apiBase.startsWith("https://") && !apiBase.includes("PEGA_AQUI"); }
  function status(message, kind = "") { sendStatus.textContent = message; sendStatus.className = `status ${kind}`; }
  input.addEventListener("input", () => { count.textContent = `${input.value.length} / 20000`; });
  async function loadOutput() {
    if (!apiReady()) { output.textContent = "La página está publicada, pero falta configurar el backend para cargar salida.txt."; updatedStatus.textContent = "Falta configurar la API"; return; }
    refreshButton.disabled = true; updatedStatus.textContent = "Actualizando…";
    try {
      const response = await fetch(`${apiBase}/api/output`, {cache:"no-store"});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo leer salida.txt.");
      output.textContent = data.text || "(El archivo salida.txt está vacío.)";
      updatedStatus.textContent = `Contenido consultado: ${new Date().toLocaleString()}`;
    } catch (error) { output.textContent = "No fue posible cargar el contenido. Comprueba la conexión y vuelve a intentarlo."; updatedStatus.textContent = error.message || "Error de conexión"; }
    finally { refreshButton.disabled = false; }
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); if (honeypot.value) return;
    if (!apiReady()) { status("La web está pendiente de conectar con el backend seguro.", "error"); return; }
    const text = input.value;
    if (!text.trim()) { status("Escribe o pega un texto antes de enviarlo.", "error"); return; }
    sendButton.disabled = true; status("Enviando y guardando en GitHub…");
    try {
      const response = await fetch(`${apiBase}/api/submit`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,website:honeypot.value})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el texto.");
      status("Texto enviado correctamente y guardado en GitHub.", "success"); input.value = ""; count.textContent = "0 / 20000";
    } catch (error) { status(error.message || "Error de conexión. Inténtalo de nuevo.", "error"); }
    finally { sendButton.disabled = false; }
  });
  refreshButton.addEventListener("click", loadOutput); loadOutput();
})();