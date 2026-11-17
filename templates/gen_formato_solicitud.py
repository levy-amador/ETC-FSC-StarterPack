#!/usr/bin/env python3
"""Genera el formato de solicitud (.xlsx) de la base común FSC para enviar al cliente.

Uso: python3 templates/gen_formato_solicitud.py <data-dictionary.json> <access-matrix.json> <salida.xlsx>
Requiere openpyxl. Lee la especificación de config/spec/ (fuente única); no edites el Excel a mano.
"""
import json
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

DD = json.load(open(sys.argv[1], encoding="utf-8"))
AM = json.load(open(sys.argv[2], encoding="utf-8"))
OUT = sys.argv[3]

TITLE = "ETC · Especialistas en Transformación Cloud · Formato de solicitud · Base común FSC · v0.1 · Cliente Confidencial"
AZUL, AMARILLO = "00308B", "F3C100"
F_HEAD = PatternFill("solid", fgColor=AZUL)
F_HEAD_CLI = PatternFill("solid", fgColor=AMARILLO)
F_BASE = PatternFill("solid", fgColor="F2F2F2")
F_CLI = PatternFill("solid", fgColor="FFF6D1")
FONT = "Arial"
THIN = Side(style="thin", color="BFBFBF")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
WRAP = Alignment(wrap_text=True, vertical="top")
TYPES = {"Text": "Texto", "Picklist": "Lista", "Date": "Fecha", "Checkbox": "Casilla", "LongTextArea": "Texto largo"}

wb = Workbook()
wb.remove(wb.active)


def sheet(name, subtitle):
    ws = wb.create_sheet(name)
    ws["A1"] = TITLE
    ws["A1"].font = Font(name=FONT, bold=True, size=11, color=AZUL)
    ws["A2"] = subtitle
    ws["A2"].font = Font(name=FONT, italic=True, size=10, color="595959")
    return ws


def table(ws, base_cols, client_cols, rows, widths, start=4, validations=None):
    """base_cols/client_cols: encabezados; rows: listas con valores base (las columnas del cliente quedan vacías)."""
    headers = base_cols + client_cols
    for i, h in enumerate(headers, 1):
        c = ws.cell(row=start, column=i, value=h)
        cli = i > len(base_cols)
        c.fill = F_HEAD_CLI if cli else F_HEAD
        c.font = Font(name=FONT, bold=True, color="000000" if cli else "FFFFFF")
        c.alignment = Alignment(wrap_text=True, vertical="center")
        c.border = BORDER
    for r, row in enumerate(rows, start + 1):
        for i in range(1, len(headers) + 1):
            v = row[i - 1] if i - 1 < len(row) else None
            c = ws.cell(row=r, column=i, value=v)
            c.fill = F_CLI if i > len(base_cols) else F_BASE
            c.font = Font(name=FONT, size=10)
            c.alignment = WRAP
            c.border = BORDER
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    end = start + max(len(rows), 1)
    ws.freeze_panes = ws.cell(row=start + 1, column=2)
    ws.auto_filter.ref = f"A{start}:{get_column_letter(len(headers))}{end}"
    for col_name, options in (validations or {}).items():
        col = headers.index(col_name) + 1
        dv = DataValidation(type="list", formula1='"' + ",".join(options) + '"', allow_blank=True)
        ws.add_data_validation(dv)
        dv.add(f"{get_column_letter(col)}{start + 1}:{get_column_letter(col)}{end}")
    return end


SI_NO_MOD = ["Sí", "No", "Modificar"]

# 1. Instrucciones
ws = sheet("Instrucciones", "Cómo llenar este formato")
lines = [
    ("Propósito", "Confirmar o ajustar la configuración base de Salesforce Financial Services Cloud (base común) antes del despliegue. El formato viene prellenado con la base ETC predeterminada."),
    ("Cómo llenar", "Revise cada hoja. En las columnas amarillas indique Sí / No / Modificar y escriba sus ajustes o comentarios. No modifique las columnas grises."),
    ("Leyenda", "Gris = base ETC (no editar) · Amarillo = respuesta del cliente"),
    ("Importante", "Si no se recibe respuesta, se implementa la base ETC."),
    ("Fecha límite", "[Placeholder: fecha límite de respuesta]"),
    ("Contacto ETC", "[Placeholder: nombre y correo del consultor ETC]"),
    ("Hojas", "Datos generales · Campos · Listas estándar · Validaciones · Duplicados · Personas y roles · Permisos por objeto · Datos sensibles · Preguntas abiertas"),
]
for r, (k, v) in enumerate(lines, 4):
    a, b = ws.cell(row=r, column=1, value=k), ws.cell(row=r, column=2, value=v)
    a.font = Font(name=FONT, bold=True, color="FFFFFF")
    a.fill = F_HEAD
    b.font = Font(name=FONT, size=10, bold=(k == "Importante"))
    b.alignment = WRAP
    for c in (a, b):
        c.border = BORDER
        c.alignment = Alignment(wrap_text=True, vertical="top")
ws["B6"].fill = PatternFill("solid", fgColor="E0E0E0")
ws.cell(row=6, column=2).value = "Gris = base ETC (no editar) · Amarillo = respuesta del cliente"
ws.column_dimensions["A"].width = 18
ws.column_dimensions["B"].width = 110

# 2. Datos generales
ws = sheet("Datos generales", "Datos del cliente y de la implementación")
gen = [
    ["Cliente", ""], ["Responsable del cliente", ""], ["Correo del responsable", ""], ["Fecha de respuesta", ""],
    ["Vertical a implementar", ""], ["Licencias FSC Sales contratadas (cantidad)", ""],
    ["Licencias FSC Service contratadas (cantidad)", ""], ["¿Hay usuarios externos (portal, brokers, aliados)?", ""],
    ["Comentarios generales", ""],
]
table(ws, ["Dato"], ["Respuesta del cliente"], gen, [48, 60])
dv = DataValidation(type="list", formula1='"Seguros,Banca,Patrimonial"', allow_blank=True)
ws.add_data_validation(dv)
dv.add("B9")
dv2 = DataValidation(type="list", formula1='"Sí,No"', allow_blank=True)
ws.add_data_validation(dv2)
dv2.add("B12")

# 3. Campos
ws = sheet("Campos", f"Campos propios (prefijo ETC_) · {DD['status']}")
rows = []
for f in DD["fields"]:
    tipo = TYPES.get(f["type"], f["type"]) + (f" ({f['length']})" if f.get("length") else "")
    rows.append([f["object"], f["label"], f["apiName"], tipo, " · ".join(f.get("values") or []), f["purpose"], "Sí" if f.get("sensitive") else "No"])
table(ws, ["Objeto", "Etiqueta", "API Name", "Tipo", "Valores propuestos", "Para qué sirve", "Sensible"],
      ["¿Se usa?", "¿Obligatorio?", "Valores del cliente", "Comentarios"], rows,
      [12, 28, 30, 14, 40, 50, 9, 12, 13, 35, 35],
      validations={"¿Se usa?": SI_NO_MOD, "¿Obligatorio?": ["Sí", "No"]})

# 4. Listas estándar
ws = sheet("Listas estándar", "Campos estándar de Salesforce que se reutilizan (no se crean campos nuevos)")
rows = [[s["object"], s["label"], s["apiName"], s["use"], " · ".join(s["values"]) if s.get("values") else "Sin cambios"] for s in DD["standardFields"]]
table(ws, ["Objeto", "Etiqueta", "API Name", "Uso", "Valores propuestos"], ["¿Se usa?", "Valores del cliente", "Comentarios"], rows,
      [12, 24, 18, 50, 50, 12, 35, 35], validations={"¿Se usa?": SI_NO_MOD})

# 5. Validaciones
ws = sheet("Validaciones", "Reglas que impiden guardar datos incompletos o con formato inválido")
rows = [[v["object"], v["name"], v["purpose"], v["message"]] for v in DD["validationRules"]]
table(ws, ["Objeto", "Regla", "Qué asegura", "Mensaje al usuario"], ["¿Aplica?", "Comentarios"], rows,
      [12, 30, 50, 60, 12, 40], validations={"¿Aplica?": SI_NO_MOD})

# 6. Duplicados
ws = sheet("Duplicados", "Detección de registros duplicados · la base ETC alerta sin bloquear")
rows = [[r["object"], r["name"], r["match"], ", ".join(r["fields"]), r["action"]] for r in DD["duplicateRules"]]
table(ws, ["Objeto", "Regla", "Coincidencia", "Campos", "Acción base"], ["Acción del cliente", "Comentarios"], rows,
      [12, 30, 45, 40, 22, 18, 40], validations={"Acción del cliente": ["Alertar", "Bloquear", "No usar"]})

# 7. Personas y roles
ws = sheet("Personas y roles", "Tipos de usuario, rol, grupo de permisos y licencia")
rows = [[p["label"], p["description"], p["role"] or "-", p["psg"] or "Perfil Administrador del sistema", p["license"]] for p in AM["personas"]]
end = table(ws, ["Persona", "Qué hace", "Rol", "Permission Set Group", "Licencia"],
            ["Nombre del puesto en su organización", "Número de usuarios", "¿Aplica?", "Comentarios"], rows,
            [26, 55, 26, 30, 14, 30, 12, 12, 35], validations={"¿Aplica?": SI_NO_MOD})
r = end + 2
ws.cell(row=r, column=1, value="Jerarquía de roles (base ETC)").font = Font(name=FONT, bold=True, color=AZUL)
by_name = {x["name"]: x for x in AM["roles"]}


def walk(parent, depth):
    global r
    for x in [x for x in AM["roles"] if x["parent"] == parent]:
        r += 1
        c = ws.cell(row=r, column=1, value=("    " * depth) + ("└─ " if depth else "") + f"{x['label']} ({x['name']})")
        c.font = Font(name=FONT, size=10)
        walk(x["name"], depth + 1)


walk(None, 0)
r += 2
ws.cell(row=r, column=1, value="Comentarios del cliente sobre la jerarquía:").font = Font(name=FONT, bold=True)
ws.cell(row=r, column=2).fill = F_CLI
ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=5)

# 8. Permisos por objeto
P = [p for p in AM["personas"] if p.get("psg")]
ws = sheet("Permisos por objeto", "C = crear · R = leer · E = editar · D = eliminar (nadie tiene D) · — = sin acceso")
rows = [[o] + [m.get(p["id"]) or "—" for p in P] for o, m in AM["objectPermissions"].items()]
rows.append(["Alcance de registros"] + [AM["recordScope"].get(p["id"], "") for p in P])
table(ws, ["Objeto"] + [p["label"] for p in P], ["Comentarios del cliente"], rows, [22] + [20] * len(P) + [45])
r = 4 + len(rows) + 2
ws.cell(row=r, column=1, value="Visibilidad predeterminada (OWD)").font = Font(name=FONT, bold=True, color=AZUL)
for o, v in AM["owd"].items():
    r += 1
    ws.cell(row=r, column=1, value=o).font = Font(name=FONT, size=10)
    ws.cell(row=r, column=2, value={"Private": "Privado", "ControlledByParent": "Controlado por el principal"}.get(v, v)).font = Font(name=FONT, size=10)
r += 2
ws.cell(row=r, column=1, value="Reglas de colaboración").font = Font(name=FONT, bold=True, color=AZUL)
for s in AM["sharingRules"]:
    r += 1
    ws.cell(row=r, column=1, value=s["object"]).font = Font(name=FONT, size=10)
    c = ws.cell(row=r, column=2, value=f"{s['criteria']} → {s['sharedWith']} ({'Lectura' if s['access'] == 'Read' else 'Lectura y edición'}). {s['why']}")
    c.font = Font(name=FONT, size=10)
    c.alignment = WRAP
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=len(P) + 1)
    ws.row_dimensions[r].height = 30

# 9. Datos sensibles
ws = sheet("Datos sensibles", f"E = edita · R = lee · — = sin acceso · {AM['fieldSecurityDefault']}")
label = {f"{f['object']}.{f['apiName']}": f["label"] for f in DD["fields"]}
rows = [[f"{label.get(k, k)} ({k})"] + [("—" if m.get(p["id"]) == "-" else m.get(p["id"], "")) for p in P] for k, m in AM["fieldSecurity"].items()]
table(ws, ["Campo"] + [p["label"] for p in P], ["Comentarios del cliente"], rows, [48] + [18] * len(P) + [45])

# 10. Preguntas abiertas
ws = sheet("Preguntas abiertas", "Decisiones que solo el cliente puede tomar")
qs = []
for f in DD["fields"]:
    if f.get("askClient"):
        qs.append(["Campos", f"{f['label']}: {f['askClient']}"])
for v in DD["validationRules"]:
    if v.get("askClient"):
        qs.append(["Validaciones", f"{v['name']}: {v['askClient']}"])
for q in AM.get("askClient", []):
    qs.append(["Acceso", q])
for p in AM["personas"]:
    if p.get("askClient"):
        qs.append(["Acceso", f"{p['label']}: {p['askClient']}"])
for s in AM["sharingRules"]:
    if s.get("askClient"):
        qs.append(["Acceso", f"{s['name']}: {s['askClient']}"])
rows = [[i + 1, t, q] for i, (t, q) in enumerate(qs)]
table(ws, ["#", "Tema", "Pregunta"], ["Respuesta del cliente"], rows, [5, 14, 80, 60])

for w in wb.worksheets:
    w.sheet_view.showGridLines = False
wb.save(OUT)
print(f"{OUT}: {len(wb.sheetnames)} hojas")
