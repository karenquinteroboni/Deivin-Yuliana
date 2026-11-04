#!/usr/bin/env python3
"""Genera las tarjetas de mesa con el QR de fotos (HTML imprimible).
Uso:  python3 tools/make_table_cards.py "<URL del álbum>"   (por defecto lee photosUrl de js/config.js)
Luego: node tools/render_print.js   → crea print/*.pdf y print/*.png
Requiere: pip install segno"""
import re, sys, pathlib, segno

root = pathlib.Path(__file__).resolve().parent.parent
url = sys.argv[1] if len(sys.argv) > 1 else re.search(r'photosUrl:\s*"([^"]+)"', (root / "js/config.js").read_text()).group(1)
qr = segno.make(url, error="h")                      # corrección alta: tolera rayones/dobleces
svg = qr.svg_inline(scale=1, border=0, dark="#0a1530", light=None, omitsize=True)
short = re.sub(r"^https?://", "", url)

CARD = f'''<div class="card"><div class="in">
  <div class="frame"></div><div class="frame f2"></div>
  <img class="mono" src="../assets/img/monogram.webp" alt="">
  <p class="kicker">Comparte tus fotos</p>
  <div class="rule"></div>
  <div class="qr"><div class="qrbox">{svg}</div></div>
  <p class="how">Apunta la cámara de tu celular<br>al código y sube las fotos de esta noche</p>
  <p class="names">Deivin <span>&amp;</span> Yuliana</p>
  <p class="date">20 · 03 · 2027</p>
  <p class="url">{short}</p>
</div></div>'''

CSS = '''
@page{margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.card{container-type:inline-size;width:100%;aspect-ratio:105/148;position:relative;overflow:hidden;color:#f6e3a6;text-align:center;
  background:radial-gradient(ellipse at 50% 28%,#16306f 0%,#0b1b45 48%,#050b1e 100%);font-family:'Cormorant Garamond',Georgia,serif}
.in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:7.4cqw 0 0}
.frame{position:absolute;inset:3.6cqw;border:.32cqw solid #c9a24d;border-radius:1.2cqw}
.frame.f2{inset:5cqw;border-width:.14cqw;border-color:#c9a24dbb}
.mono{width:25cqw;height:auto;display:block}
.kicker{margin-top:2.6cqw;font-weight:600;font-size:4.5cqw;letter-spacing:.26em;text-transform:uppercase;padding-left:.26em;color:#f1d98f}
.rule{width:15cqw;height:.25cqw;margin:2cqw 0 3.2cqw;background:linear-gradient(90deg,transparent,#c9a24d,transparent)}
.qr{width:52cqw;padding:2cqw;background:#fbf7ec;border-radius:2cqw;border:.4cqw solid #c9a24d;box-shadow:0 0 0 .9cqw #c9a24d22}
.qrbox{padding:2.4cqw;background:#fbf7ec;line-height:0}
.qrbox svg{width:100%;height:auto;display:block;shape-rendering:crispEdges}
.how{margin-top:3.4cqw;font-style:italic;font-weight:500;font-size:4.2cqw;line-height:1.35;color:#fff6e0}
.names{margin-top:2.4cqw;font-family:'Pinyon Script',cursive;font-size:9.6cqw;line-height:1.1;-webkit-text-stroke:.016em currentColor;color:#f6e3a6}
.names span{font-size:.92em;margin:0 .08em}
.date{margin-top:.4cqw;font-weight:600;font-size:3.2cqw;letter-spacing:.42em;padding-left:.42em;color:#fff6e0}
.url{margin-top:2.2cqw;font-size:2.7cqw;letter-spacing:.06em;color:#c9b27a;font-weight:500}
'''
HEAD = f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Tarjeta de mesa · QR de fotos</title>
<link rel="stylesheet" href="../css/fonts.css"><style>{CSS}'''

# 1) Tarjeta individual 105 × 148 mm (A6) para imprenta
single = HEAD + '''
@page{size:105mm 148mm}
body{width:105mm;height:148mm}
</style></head><body>''' + CARD + '</body></html>'

# 2) Hoja A4 con 4 tarjetas de 95 × 134 mm para imprimir en casa y recortar
sheet = HEAD + '''
@page{size:210mm 297mm}
body{width:210mm;height:297mm;position:relative;background:#fff}
.g{position:absolute;inset:0;display:grid;grid-template-columns:95mm 95mm;grid-template-rows:134mm 134mm;gap:6mm;padding:11.5mm 7mm;justify-content:center}
.cut{position:absolute;background:#bbb}
.v{left:105mm;width:.2mm;top:4mm;bottom:4mm}.h{top:148.5mm;height:.2mm;left:4mm;right:4mm}
</style></head><body><div class="g">''' + CARD * 4 + '''</div><div class="cut v"></div><div class="cut h"></div></body></html>'''

out = root / "print"; out.mkdir(exist_ok=True)
(out / "mesa-qr-individual.html").write_text(single)
(out / "mesa-qr-hoja-a4.html").write_text(sheet)
print("OK ->", out, "| URL:", url)
