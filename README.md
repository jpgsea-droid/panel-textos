# Panel público de textos conectado a GitHub

La web se publica con GitHub Pages. El formulario envía texto al backend de Cloudflare Workers, que actualiza `entrada.txt`.

Los tres archivos de salida quedan ocultos tras el botón discreto **Links** al final de la página. Al desplegarlo, cada botón pequeño copia directamente su archivo al portapapeles. Encima de cada botón se muestra la hora de la última modificación del archivo según el historial de GitHub.

## Salidas
- Botón `.ino` copia `salida.ino`.
- Botón `.json` copia `salida.json`.
- Botón `.txt` copia `extra.txt`.

Para cambiar una salida, edita el archivo correspondiente desde GitHub. La hora mostrada corresponde al último commit que modificó ese archivo.

## Configuración
- GitHub Pages: rama `main`, carpeta `/(root)`.
- Web: https://jpgsea-droid.github.io/panel-textos/
- Backend: `https://panel-textos-api.jpgsea.workers.dev`.
- En Cloudflare, conserva `GITHUB_TOKEN` como Secret, con permiso de Contents: Read and write limitado a este repositorio.

Los envíos públicos reemplazan `entrada.txt`; no incluyas secretos ni información privada.
