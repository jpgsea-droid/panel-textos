# Panel público de textos conectado a GitHub

La web se publica con GitHub Pages. El backend debe desplegarse por separado (por ejemplo, Cloudflare Workers) para que el formulario pueda escribir de forma segura en `entrada.txt`.

## Archivos del repositorio
- `index.html`, `styles.css`, `config.js`, `app.js`: web estática.
- `entrada.txt`: texto que reemplaza cada envío aceptado.
- `salida.txt`: contenido que aparece en el cuadro fijo.

## Publicación
1. En GitHub, ve a Settings → Pages.
2. En Build and deployment, elige Deploy from a branch, rama `main`, carpeta `/(root)`, y guarda.
3. La URL será `https://jpgsea-droid.github.io/panel-textos/`.
4. Despliega después el backend desde la carpeta `worker` del paquete del proyecto y guarda el token de GitHub como secreto, nunca en archivos públicos.
5. Actualiza `config.js` con la URL del backend.

La casilla de envío no funcionará hasta conectar el backend. No añadas secretos a este repositorio público.