const MAX_TEXT_LENGTH = 20000;

function corsHeaders(origin, env) {
  const allowed = env.ALLOWED_ORIGIN || "";
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
  if (origin && origin === allowed) headers["Access-Control-Allow-Origin"] = allowed;
  return headers;
}

function json(data, status, origin, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(origin, env)
    }
  });
}

function encodeBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64Utf8(content) {
  const binary = atob(content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function validateConfig(env) {
  return Boolean(env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO && env.GITHUB_BRANCH);
}

async function githubRequest(path, env, options = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "public-text-panel",
      ...(options.headers || {})
    }
  });
}

async function readFile(path, env) {
  const endpoint = `/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}/contents/${path}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`;
  const response = await githubRequest(endpoint, env);
  if (!response.ok) throw new Error(`GitHub no pudo leer ${path} (HTTP ${response.status}).`);
  const data = await response.json();
  if (!data.content || data.encoding !== "base64") throw new Error(`Formato inesperado para ${path}.`);
  return decodeBase64Utf8(data.content);
}

async function writeInput(text, env) {
  const endpoint = `/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}/contents/entrada.txt`;
  const getResponse = await githubRequest(`${endpoint}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`, env);
  let sha;
  if (getResponse.ok) sha = (await getResponse.json()).sha;
  else if (getResponse.status !== 404) throw new Error(`No se pudo consultar entrada.txt (HTTP ${getResponse.status}).`);

  const payload = {
    message: "Actualizar entrada.txt desde el panel público",
    content: encodeBase64Utf8(text),
    branch: env.GITHUB_BRANCH
  };
  if (sha) payload.sha = sha;
  const response = await githubRequest(endpoint, env, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub rechazó el guardado (HTTP ${response.status}). ${detail.slice(0, 200)}`);
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    if (!validateConfig(env)) return json({ error: "El backend aún no está configurado." }, 500, origin, env);

    if (url.pathname === "/api/output" && request.method === "GET") {
      try {
        return json({ text: await readFile("salida.txt", env) }, 200, origin, env);
      } catch (error) {
        return json({ error: error.message || "Error al leer el archivo." }, 502, origin, env);
      }
    }

    if (url.pathname === "/api/submit" && request.method === "POST") {
      if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) return json({ error: "Origen no permitido." }, 403, origin, env);
      let body;
      try { body = await request.json(); }
      catch { return json({ error: "La solicitud no contiene JSON válido." }, 400, origin, env); }
      if (body.website) return json({ ok: true }, 200, origin, env);
      if (typeof body.text !== "string" || !body.text.trim()) return json({ error: "El texto no puede estar vacío." }, 400, origin, env);
      if (body.text.length > MAX_TEXT_LENGTH) return json({ error: "El texto supera el límite de 20.000 caracteres." }, 413, origin, env);
      try {
        await writeInput(body.text, env);
        return json({ ok: true }, 200, origin, env);
      } catch (error) {
        return json({ error: error.message || "Error al guardar en GitHub." }, 502, origin, env);
      }
    }
    return json({ error: "Ruta no encontrada." }, 404, origin, env);
  }
};