// Renderiza print/*.html a PDF (vectorial) y PNG.  Uso: node tools/render_print.js
const { chromium } = require('playwright'); const path = require('path');
const dir = path.resolve(__dirname, '..', 'print');
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const jobs = [['mesa-qr-individual', { width: '105mm', height: '148mm' }, 397, 559], ['mesa-qr-hoja-a4', { width: '210mm', height: '297mm' }, 794, 1123]];
  for (const [name, size, w, h] of jobs) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 3.125 });   // ≈ 300 dpi
    await p.goto('file://' + path.join(dir, name + '.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
    await p.pdf({ path: path.join(dir, name + '.pdf'), ...size, printBackground: true, pageRanges: '1' });
    await p.screenshot({ path: path.join(dir, name + '.png') });
    console.log('ok', name);
  }
  await b.close();
})();
