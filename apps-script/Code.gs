/**
 * Backend de confirmaciones — Deivin & Yuliana
 * Se pega en Extensiones > Apps Script de la hoja de Google (ver README.md).
 *
 * Hoja "Invitados"       : A Código | B Invitado/Familia | C Cupos | D Enlace
 * Hoja "Confirmaciones"  : se crea sola y se actualiza (una fila por código)
 *
 * El límite de cupos se valida AQUÍ (servidor), no solo en la página.
 */
const HOJA_INVITADOS = 'Invitados';
const HOJA_CONF = 'Confirmaciones';
const ENCABEZADOS = ['Código', 'Invitado', 'Cupos', 'Asistirá', 'Personas', 'Mensaje', 'Fecha de respuesta'];

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function buscarInvitado_(codigo) {
  const sh = SpreadsheetApp.getActive().getSheetByName(HOJA_INVITADOS);
  if (!sh || !codigo) return null;
  const filas = sh.getDataRange().getValues();
  for (let i = 1; i < filas.length; i++) {
    if (String(filas[i][0]).trim().toLowerCase() === String(codigo).trim().toLowerCase()) {
      return { codigo: String(filas[i][0]).trim(), nombre: String(filas[i][1]), cupos: Number(filas[i][2]) };
    }
  }
  return null;
}

function hojaConf_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(HOJA_CONF);
  if (!sh) {
    sh = ss.insertSheet(HOJA_CONF);
    sh.appendRow(ENCABEZADOS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, ENCABEZADOS.length).setFontWeight('bold');
  }
  return sh;
}

// Consulta del invitado (nombre, cupos y respuesta previa si existe)
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== 'guest') return json_({ ok: false, error: 'accion' });
  const g = buscarInvitado_(p.code);
  if (!g) return json_({ ok: false, error: 'codigo' });
  let response = null;
  const filas = hojaConf_().getDataRange().getValues();
  for (let i = 1; i < filas.length; i++) {
    if (String(filas[i][0]) === g.codigo) {
      response = { attending: filas[i][3] === 'Sí', count: Number(filas[i][4]) || 0, message: String(filas[i][5] || '') };
    }
  }
  return json_({ ok: true, name: g.nombre, cupos: g.cupos, response: response });
}

// Registro de la confirmación
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    const g = buscarInvitado_(d.code);
    if (!g) return json_({ ok: false, error: 'Invitación no válida.' });

    const asiste = d.attending === true;
    const n = asiste ? parseInt(d.count, 10) : 0;
    if (asiste && (!(n >= 1) || n > g.cupos)) {
      return json_({ ok: false, error: 'Puedes confirmar entre 1 y ' + g.cupos + ' personas.' });
    }
    const msg = String(d.message || '').slice(0, 300).replace(/^[=+\-@]/, "'$&"); // evita fórmulas en la hoja
    const fila = [g.codigo, g.nombre, g.cupos, asiste ? 'Sí' : 'No', n, msg, new Date()];

    const sh = hojaConf_();
    const datos = sh.getDataRange().getValues();
    let destino = -1;
    for (let i = 1; i < datos.length; i++) if (String(datos[i][0]) === g.codigo) destino = i + 1;
    if (destino > 0) sh.getRange(destino, 1, 1, fila.length).setValues([fila]);
    else sh.appendRow(fila);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'No pudimos guardar tu respuesta.' });
  } finally {
    lock.releaseLock();
  }
}
