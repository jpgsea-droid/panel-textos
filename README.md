# Panel público de textos conectado a GitHub

La web se publica con GitHub Pages. El formulario envía un texto al backend de Cloudflare Workers, que actualiza `entrada.txt` de forma segura. Las tres salidas se leen desde los archivos públicos del repositorio y cada una tiene un botón para copiar su contenido.

## Archivos principales
- `index.html`, `styles.css`, `config.js`, `app.js`: sitio web público.
- `entrada.txt`: lo reemplaza cada envío aceptado desde la web.
- `salida.ino`: texto que se muestra en el cuadro **.ino**.
- `salida.json`: texto que se muestra en el cuadro **json**.
- `extra.txt`: texto que se muestra en el cuadro **extra**.
- `worker/index.js`: backend de Cloudflare Workers.
- `worker/wrangler.toml`: configuración de Wrangler.

## Cambiar el contenido de las salidas
Edita `salida.ino`, `salida.json` o `extra.txt` directamente en GitHub y guarda el cambio. En la web pulsa **Actualizar las tres salidas** para volver a cargarlas. Los botones **Copiar** copian el contenido de cada cuadro por separado.

## Publicación
La web usa GitHub Pages desde la rama `main` y carpeta `/(root)`: https://jpgsea-droid.github.io/panel-textos/

El formulario depende del backend `https://panel-textos-api.jpgsea.workers.dev`. Guarda `GITHUB_TOKEN` como Secret en Cloudflare, nunca en archivos públicos. El token debe tener permiso Contents: Read and write únicamente en este repositorio.

Los envíos públicos reemplazan `entrada.txt`; no incluyas contraseñas ni información privada.
