/**
 * Backend de confirmaciones — Deivin & Yuliana
 * Se pega en Extensiones > Apps Script de la hoja de Google (ver README.md).
 *
 * Hoja "Invitados"       : A Código | B Invitado/Familia | C Cupos | D Enlace
 * Hoja "Confirmaciones"  : se crea sola y se actualiza (una fila por código)
 *
 * El límite de cupos se valida AQUÍ (servidor), no solo en la página.
 */
// URL pública de la tarjeta (termina en /). Cámbiala si cambia el dominio.
const URL_TARJETA = 'https://karenquinteroboni.github.io/Deivin-Yuliana/';
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

/* ============ Utilidades dentro de la hoja ============ */

// Menú "Invitación" al abrir la hoja
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Invitación')
    .addItem('Preparar hojas', 'prepararHojas')
    .addItem('Generar códigos y enlaces', 'generarCodigos')
    .addToUi();
}

// Crea las hojas con sus encabezados si aún no existen
function prepararHojas() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(HOJA_INVITADOS);
  if (!sh) {
    sh = ss.insertSheet(HOJA_INVITADOS);
    sh.appendRow(['Código', 'Invitado / Familia', 'Cupos', 'Enlace personalizado']);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  hojaConf_();
}

// Para cada fila con nombre y cupos: crea un código único (si falta) y el enlace.
// Valida que Cupos sea un entero >= 1. No cambia códigos ya existentes.
function generarCodigos() {
  prepararHojas();
  const sh = SpreadsheetApp.getActive().getSheetByName(HOJA_INVITADOS);
  const n = sh.getLastRow();
  if (n < 2) { SpreadsheetApp.getUi().alert('Pega primero los invitados (columna B) y sus cupos (columna C).'); return; }
  const datos = sh.getRange(2, 1, n - 1, 3).getValues();
  const usados = {};
  datos.forEach(f => { if (f[0]) usados[String(f[0]).toLowerCase()] = true; });
  const ABC = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const errores = [];
  const codigos = [], enlaces = [];
  datos.forEach((f, i) => {
    let [cod, nombre, cupos] = f;
    if (!nombre) { codigos.push(['']); enlaces.push(['']); return; }
    if (!(Number.isInteger(Number(cupos)) && Number(cupos) >= 1)) errores.push('Fila ' + (i + 2) + ': cupos inválidos');
    if (!cod) {
      do { cod = ''; for (let k = 0; k < 6; k++) cod += ABC.charAt(Math.floor(Math.random() * ABC.length)); }
      while (usados[cod.toLowerCase()]);
      usados[cod.toLowerCase()] = true;
    }
    codigos.push([cod]);
    enlaces.push([URL_TARJETA + '?i=' + cod]);
  });
  sh.getRange(2, 1, codigos.length, 1).setValues(codigos);
  sh.getRange(2, 4, enlaces.length, 1).setValues(enlaces);
  sh.autoResizeColumns(1, 4);
  SpreadsheetApp.getUi().alert(errores.length ? 'Listo, pero revisa:\n' + errores.join('\n') : 'Códigos y enlaces generados.');
}
