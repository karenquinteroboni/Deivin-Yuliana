#!/usr/bin/env python3
"""Genera el QR para compartir fotos.   Uso: python3 tools/make_qr.py "<URL de la carpeta/álbum>"
Requiere:  pip install segno
Crea assets/img/qr-fotos.png (se muestra en la tarjeta) y qr-fotos.svg (para imprimir)."""
import sys, segno
if len(sys.argv) != 2:
    sys.exit(__doc__)
q = segno.make(sys.argv[1], error="h")
q.save("assets/img/qr-fotos.png", scale=12, border=2, dark="#0a1530")
q.save("assets/img/qr-fotos.svg", scale=12, border=2, dark="#0a1530")
print("QR creado en assets/img/qr-fotos.png / .svg  — recuerda poner la misma URL en photosUrl (js/config.js)")
