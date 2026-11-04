#!/usr/bin/env python3
"""Genera el Excel de invitados (con códigos únicos y enlaces) y la hoja de confirmaciones.

Uso:
  python3 tools/preparar_invitados.py                      # crea la plantilla con ejemplos
  python3 tools/preparar_invitados.py lista.csv            # lista real: columnas Invitado,Cupos
  python3 tools/preparar_invitados.py lista.xlsx salida.xlsx

Si el archivo de entrada ya trae una columna "Código", se respeta (no se regenera).
"""
import csv, secrets, sys
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.worksheet.datavalidation import DataValidation

BASE_URL = "https://karenquinteroboni.github.io/Deivin-Yuliana/"
ALFABETO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"   # sin 0/O/1/I para evitar confusiones


def leer(path):
    if path.lower().endswith(".csv"):
        with open(path, newline="", encoding="utf-8-sig") as f:
            return list(csv.DictReader(f))
    ws = load_workbook(path, read_only=True).active
    filas = list(ws.iter_rows(values_only=True))
    cab = [str(c or "").strip() for c in filas[0]]
    return [dict(zip(cab, r)) for r in filas[1:] if any(r)]


def pick(row, *names):
    for k, v in row.items():
        if k and k.strip().lower() in names:
            return v
    return None


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    out = sys.argv[2] if len(sys.argv) > 2 else "invitados_confirmaciones.xlsx"
    if src:
        filas = []
        for r in leer(src):
            nombre = pick(r, "invitado", "nombre", "familia", "invitado/familia")
            cupos = pick(r, "cupos", "personas", "cantidad")
            if not nombre:
                continue
            try:
                cupos = int(cupos)
            except (TypeError, ValueError):
                sys.exit(f"Cupos inválido para «{nombre}»: {cupos!r}")
            if cupos < 1:
                sys.exit(f"Cupos debe ser ≥ 1 para «{nombre}»")
            filas.append([pick(r, "código", "codigo"), str(nombre).strip(), cupos])
    else:
        filas = [[None, "Familia Ejemplo Pérez", 4], [None, "María Gómez", 1], [None, "Carlos y Laura", 2]]

    usados = {f[0] for f in filas if f[0]}
    for f in filas:
        while not f[0]:
            c = "".join(secrets.choice(ALFABETO) for _ in range(6))
            if c not in usados:
                f[0] = c; usados.add(c)

    wb = Workbook()
    ws = wb.active; ws.title = "Invitados"
    ws.append(["Código", "Invitado / Familia", "Cupos", "Enlace personalizado"])
    for i, (c, n, k) in enumerate(filas, start=2):
        ws.append([c, n, k, f'="{BASE_URL}?i="&A{i}'])
    cf = wb.create_sheet("Confirmaciones")
    cf.append(["Código", "Invitado", "Cupos", "Asistirá", "Personas", "Mensaje", "Fecha de respuesta"])
    res = wb.create_sheet("Resumen")
    res["A1"], res["B1"] = "Invitaciones enviadas", "=COUNTA(Invitados!A2:A1000)"
    res["A2"], res["B2"] = "Cupos totales", "=SUM(Invitados!C2:C1000)"
    res["A3"], res["B3"] = "Respuestas recibidas", "=COUNTA(Confirmaciones!A2:A1000)"
    res["A4"], res["B4"] = "Personas confirmadas", '=SUMIF(Confirmaciones!D2:D1000,"Sí",Confirmaciones!E2:E1000)'
    res["A5"], res["B5"] = "Invitaciones que dijeron que no", '=COUNTIF(Confirmaciones!D2:D1000,"No")'
    res["A6"], res["B6"] = "Invitaciones sin respuesta", "=B1-B3"

    azul = PatternFill("solid", fgColor="0F1F4A")
    for sh in (ws, cf):
        for c in sh[1]:
            c.font = Font(bold=True, color="F1D98F"); c.fill = azul; c.alignment = Alignment(horizontal="center")
    for sh, widths in ((ws, (12, 34, 9, 60)), (cf, (12, 34, 9, 10, 10, 50, 22))):
        for i, w in enumerate(widths):
            sh.column_dimensions[chr(65 + i)].width = w
    res.column_dimensions["A"].width = 34
    dv = DataValidation(type="whole", operator="greaterThanOrEqual", formula1="1", showErrorMessage=True,
                        errorTitle="Cupos", error="Debe ser un número entero mayor o igual a 1")
    ws.add_data_validation(dv); dv.add("C2:C1000")
    wb.save(out)
    print(f"Listo: {out}  ({len(filas)} invitaciones)")


if __name__ == "__main__":
    main()
