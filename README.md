# Deivin & Yuliana · Invitación digital

Tarjeta web estática (HTML/CSS/JS, sin build) pensada para **GitHub Pages**.

## Estructura
| Ruta | Qué es |
|---|---|
| `index.html`, `css/`, `js/main.js` | La tarjeta |
| `js/config.js` | **Único archivo de ajustes**: fecha, endpoint del Excel, enlace de fotos, grupo de WhatsApp, dress code |
| `assets/` | Imágenes, video, música y tipografías optimizados (los originales siguen en la raíz del repo) |
| `apps-script/Code.gs` | Backend gratuito que escribe las confirmaciones en Google Sheets |
| `plantilla_invitados.xlsx` | Hojas `Invitados`, `Confirmaciones` y `Resumen` |
| `tools/preparar_invitados.py` | Convierte la lista real (Invitado, Cupos) en el Excel con códigos y enlaces |
| `tools/make_qr.py` | Genera el QR para compartir fotos |

## Cómo funcionan las confirmaciones
GitHub Pages no puede guardar datos, así que las respuestas van a una **Google Sheet** (descargable como .xlsx cuando quieran).
Cada invitación tiene un enlace propio: `https://karenquinteroboni.github.io/Deivin-Yuliana/?i=CÓDIGO`.
La tarjeta consulta el nombre y los cupos de ese código; el invitado puede confirmar **entre 1 y su cupo** (o declinar).
El tope se valida **en el servidor** (`Code.gs`), no solo en pantalla.

### Puesta en marcha (una sola vez)
1. Crear una Google Sheet nueva (o subir `plantilla_invitados.xlsx` y abrirla como Google Sheet).
2. **Extensiones → Apps Script**, borrar lo que haya, pegar `apps-script/Code.gs` y guardar. Recargar la hoja: aparece el menú **Invitación**.
3. Pegar la lista en la hoja `Invitados` (B = nombre, C = cupos) y usar **Invitación → Generar códigos y enlaces**. (Alternativa con Python: `tools/preparar_invitados.py`.)
4. **Implementar → Nueva implementación → Aplicación web**: ejecutar como *Yo*, acceso *Cualquier persona*. Copiar la URL `/exec`.
5. Pegar esa URL en `rsvpEndpoint` de `js/config.js`. (Si se edita `Code.gs` después, hay que crear una **nueva versión** de la implementación.)
6. Enviar a cada invitado su enlace (columna *Enlace personalizado*).

Mientras `rsvpEndpoint` esté vacío la tarjeta está en **modo prueba**: `…/?i=demo` (3 cupos) no guarda nada en el Excel.

### QR de fotos
Crear una carpeta de Drive (o álbum compartido de Google Fotos) donde cualquiera con el enlace pueda subir, y luego:
```bash
pip install segno
python3 tools/make_qr.py "URL_DE_LA_CARPETA"
```
Poner la misma URL en `photosUrl` (`js/config.js`): aparece la sección "Comparte tus fotos" con el QR.

## Publicar
Settings → Pages → *Deploy from a branch* → `main` / `(root)`. (Esta rama debe estar fusionada en `main`.)

## Notas
- La música arranca al tocar el sello (los navegadores exigen un gesto del usuario) y se puede silenciar con el botón superior izquierdo.
- Mapas: se incrustan por dirección; los botones "Cómo llegar" usan los enlaces exactos de los novios. Verificar que el pin de *Finca Villa Laura* sea el correcto.
- El enlace del grupo de WhatsApp solo se muestra tras confirmar asistencia, pero queda visible en el código fuente del repositorio.
