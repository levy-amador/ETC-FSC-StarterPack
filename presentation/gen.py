"""Presentación comercial «Financial Services Cloud Starter Pack — Quick Start».

Uso (desde la raíz del repo):
  python3 -I presentation/gen.py config/catalog/fsc-catalog.json presentation/style.css presentation/deck.js <salida.html>

El primer argumento solo sirve para ubicar la raíz del repo. Todos los números salen del repositorio
(conteo de archivos en modules/<módulo>/main/default) o de config/spec/*.json; los únicos valores de oferta
son «4 semanas» y «30 días de garantía». TEST guarda el resultado de la última corrida de npm run test.
"""
import collections, html, json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(sys.argv[1]), "..", ".."))
OUT = sys.argv[4] if len(sys.argv) > 4 else "Financial Services Cloud Starter Pack — Quick Start V3.html"
TEST = {"fecha": "17-nov-2026", "ok": 21, "total": 21}
E = html.escape
spec = lambda name: json.load(open(os.path.join(ROOT, "config", "spec", name)))

DD = {m: spec(f"{m}-data-dictionary.json") for m in ("common", "insurance", "banking", "wealth")}
UI = {m: spec(f"{m}-ui.json") for m in ("common", "insurance", "banking", "wealth")}
AM = spec("common-access-matrix.json")
SETTINGS = spec("common-settings.json")
MODS = [("common", "Base común"), ("insurance", "Seguros"), ("banking", "Banca"), ("wealth", "Patrimonial")]

# ---------- Conteos del repositorio
PATS = [("Campos", r"^objects/(?!ETC_Configuracion)[^/]+/fields/"), ("Validaciones", r"validationRules/"), ("Duplicados", r"^duplicateRules/"),
        ("Permisos", r"^permissionset"), ("Layouts", r"^layouts/"), ("Páginas", r"^flexipages/"), ("Vistas", r"listViews/"),
        ("Path", r"^pathAssistants/"), ("Colas", r"^queues/"), ("Asignación", r"^assignmentRules/"), ("Action Plans", r"^actionPlanTemplates/"),
        ("Flows", r"^flows/"), ("Reportes", r"^reports/.+\.report-meta"), ("Dashboards", r"^dashboards/.+\.dashboard-meta")]
EXTRA = [("Roles", r"^roles/"), ("Grupos de permisos", r"^permissionsetgroups/"), ("Apps", r"^applications/")]
def count(mod, pats=PATS):
    base = os.path.join(ROOT, "modules", mod, "main", "default")
    out = collections.Counter()
    for root, _, fs in os.walk(base):
        for f in fs:
            r = os.path.relpath(os.path.join(root, f), base)
            if r.endswith(".gitkeep"):
                continue
            for k, pat in pats:
                if re.search(pat, r):
                    out[k] += 1
    return out
CNT = {m: count(m) for m, _ in MODS}
TOT = collections.Counter()
for m, _ in MODS:
    TOT.update(CNT[m])
COLS = [k for k, _ in PATS if TOT[k]]
COMPONENTES = sum(TOT.values())
EXTRA_CNT = count("common", EXTRA)
CRITERIOS = sum(1 for f in SETTINGS["fields"] if f["type"] == "Number")
HAS = lambda k: TOT[k] > 0
DOCS = sum(1 for r, _, fs in os.walk(os.path.join(ROOT, "docs")) for f in fs if f.endswith(".md"))
PERSONAS = [p for p in AM["personas"] if p.get("psg")]

def tag(kind, text=None):
    return f'<span class="tag tag-{kind.lower()[:3]}">{E(text or kind)}</span>'

slides = []
def slide(theme, eyebrow, title, body, cls=""):
    slides.append((theme, eyebrow, title, body, cls))

# ================= 1 Portada
slide("dark", "Propuesta al área comercial", "Financial Services Cloud Starter Pack", """
<p class="cover-sub">Operación financiera en Salesforce, productiva en 4 semanas</p>
<p class="cover-meta">ETC · Noviembre 2026</p>
<div class="cover-mods">
  <span class="mod mod-base">Base común</span><span class="plus">+</span>
  <span class="mod">Seguros</span><span class="or">|</span><span class="mod">Banca</span><span class="or">|</span><span class="mod">Patrimonial</span>
</div>""", cls="cover")

# ================= 2 Qué es
slide("dark", "Qué es", "Una base FSC lista para operar, con el módulo de industria que el cliente necesita", f"""
<p class="lead">Hoy cada implementación de Financial Services Cloud arranca desde cero. Con el Starter Pack partimos de una base ya construida y probada en una org FSC real.</p>
<div class="kpis">
  <div class="kpi"><div class="n">4</div><div class="l">semanas de kickoff a go-live</div></div>
  <div class="kpi"><div class="n">{COMPONENTES}</div><div class="l">componentes ya construidos y validados</div></div>
  <div class="kpi"><div class="n">{TEST['ok']}/{TEST['total']}</div><div class="l">pruebas funcionales aprobadas</div></div>
  <div class="kpi"><div class="n">0</div><div class="l">código a la medida: solo funcionalidad estándar</div></div>
</div>""")

# ================= 3 Qué incluye
n_val = CNT["common"]["Validaciones"]
proc = "Prospectos y oportunidades con producto de interés y motivo de pérdida"
if HAS("Path"):
    proc += "; etapas guiadas con Path"
serv = "Casos con aclaraciones y quejas, fecha compromiso automática, dictamen y resolución obligatoria"
if HAS("Colas"):
    serv += "; colas y asignación automática"
rows = [
    ("Clientes", "Personas y empresas en un solo modelo: RFC, CURP, régimen fiscal SAT, segmento y tipo de cliente"),
    ("Cumplimiento", "Estatus KYC con vigencia y nivel de riesgo PLD, visible solo para quien corresponde"),
    ("Datos limpios", f"{n_val} validaciones y alertas de duplicados por RFC, CURP y correo"),
    ("Servicio", serv),
    ("Proceso comercial", proc),
    ("Automatización", "RFC y CURP normalizados, KYC vencido, fecha compromiso y avisos de renovación o revisión"),
    ("Seguridad", f"{len(PERSONAS)} niveles, de asesor a dirección; cada quien ve lo suyo y lo de su equipo"),
    ("Reportes", f"{TOT['Reportes']} reportes y {TOT['Dashboards']} dashboards: operación y uno por industria"),
    ("Experiencia", "App con la marca del cliente, pantallas y vistas listas, en escritorio y móvil"),
]
trs = "".join(f'<tr><td class="ka">{E(a)}</td><td>{E(b)}</td></tr>' for a, b in rows)
slide("light", "Qué incluye", "Todo lo que una operación financiera necesita para arrancar",
      f'<table class="tbl tbl-inc"><thead><tr><th>Área</th><th>Qué incluye</th></tr></thead><tbody>{trs}</tbody></table>')

# ================= 4 Verticales
def fld(mod, obj=None):
    return [f for f in DD[mod]["fields"] if obj is None or f["object"] == obj]
VERT = [
    ("Seguros", "Aseguradoras, agentes y corredurías", [
        f"Pólizas con {', '.join(f['label'].lower() for f in fld('insurance', 'InsurancePolicy'))}",
        "Siniestros con número de la aseguradora, deducible y coaseguro",
        "Casos de atención ligados a la póliza",
        "Aviso automático de renovación antes del fin de vigencia",
        f"{CNT['insurance']['Reportes']} reportes y un dashboard: pólizas por ramo, por vencer y siniestros"]),
    ("Banca", "Bancos, SOFOM y financieras", [
        "Cuentas financieras con CLABE validada, moneda, nivel de cuenta y canal de apertura",
        "Aclaraciones ligadas a la cuenta, con monto reclamado",
        "Fecha de cierre automática al cerrar una cuenta",
        "Titulares, movimientos y sucursales del modelo estándar de FSC",
        f"{CNT['banking']['Reportes']} reportes y un dashboard: cuentas por tipo y aperturas por canal"]),
    ("Patrimonial", "Gestores de patrimonio y asesores de inversión", [
        "Perfil de inversionista con fecha de perfilamiento",
        "Revisiones de cartera con próxima fecha calculada y aviso al asesor",
        "Objetivos financieros con horizonte, monto y fecha meta",
        "Cuentas de inversión, instrumentos y tenencias del modelo estándar de FSC",
        f"{CNT['wealth']['Reportes']} reporte y un dashboard de clientes por perfil"]),
]
cols = "".join(f'<div class="vcard"><div class="vn">{E(n)}</div><div class="vc">{E(w)}</div><ul class="ck ck-l">{"".join(f"<li>{E(x)}</li>" for x in items)}</ul></div>' for n, w, items in VERT)
slide("light", "El módulo de industria", "Cada cliente elige la industria; la base común siempre va incluida",
      f'<div class="vgrid">{cols}</div><div class="note-light">Se despliega solo el módulo que el cliente confirma. Los otros dos quedan disponibles para crecer.</div>')

# ================= 5 Componentes por módulo
trs = "".join(f'<tr><td class="mn">{E(l)}</td>' + "".join(f'<td class="nm">{CNT[m][k] or "—"}</td>' for k in COLS) + "</tr>" for m, l in MODS)
trs += '<tr class="tot"><td class="mn">Total</td>' + "".join(f'<td class="nm">{TOT[k]}</td>' for k in COLS) + "</tr>"
slide("light", "Qué se construyó por módulo", "Componentes listos en cada módulo", f"""
<table class="tbl tbl-num"><thead><tr><th>Módulo</th>{"".join(f"<th>{E(k)}</th>" for k in COLS)}</tr></thead><tbody>{trs}</tbody></table>
<div class="sol"><b>Para toda la solución:</b> {EXTRA_CNT['Roles']} roles · {EXTRA_CNT['Grupos de permisos']} grupos de permisos · {EXTRA_CNT['Apps']} app con la marca del cliente · {CRITERIOS} criterios configurables sin tocar los flows</div>""")

# ================= 6 Ruta
slide("light", "Ruta del proyecto", "4 semanas al go-live, 30 días de garantía", """
<div class="tl">
  <div class="tlw"><div class="wk">SEMANA 1</div><div class="tb"><b>Kick Off</b><span>Arranque y equipo</span></div><div class="tb"><b>Discovery</b><span>Diagnóstico de su org y fit-gap</span></div></div>
  <div class="tlw"><div class="wk">SEMANA 2</div><div class="tb"><b>Construcción</b><span>Paquete con su marca y su industria</span></div></div>
  <div class="tlw"><div class="wk">SEMANA 3</div><div class="tb"><b>Pruebas</b><span>Ajustes y UAT</span></div></div>
  <div class="tlw"><div class="wk">SEMANA 4</div><div class="tb"><b>Despliegue PRD</b><span>Paso a producción</span></div><div class="tb"><b>Capacitación</b><span>Por rol</span></div><div class="tb tb-go"><b>GO LIVE</b><span>Equipo operando</span></div></div>
  <div class="tlw tlw-g"><div class="wk">+30 DÍAS</div><div class="tb"><b>Garantía</b><span>30 días naturales</span></div></div>
</div>
<div class="small">Ruta estimada; se confirma con el piloto.</div>""")

# ================= 7 Qué pasa cada semana
W = [
    ("SEMANA 1", "Discovery", "Kickoff, diagnóstico de licencias FSC de su org y mapa de su operación",
     "Líder de negocio y admin; licencias FSC, la industria a implementar, logo y formato de solicitud contestado",
     "Alcance cerrado y diagnóstico de su org"),
    ("SEMANA 2", "Liberación del paquete", "Instalamos la base común y su industria con su marca y corremos las pruebas funcionales",
     "Revisar la app, las pantallas y el proceso", "Su FSC funcionando en pruebas, con su marca"),
    ("SEMANA 3", "Ajustes", "Ajustamos criterios, vistas, reportes y permisos a su operación",
     "Un usuario por rol prueba y firma", "Configuración final aprobada en UAT"),
    ("SEMANA 4", "Productivo y capacitación", "Pase a producción, alta de usuarios y capacitación por rol",
     "Lista de usuarios, roles y asistencia", "Equipo operando en Salesforce"),
]
head = '<div class="wg-h"></div>' + "".join(f'<div class="wg-w"><span>{E(a)}</span><b>{E(b)}</b></div>' for a, b, *_ in W)
body = "".join(f'<div class="wg-l">{E(lbl)}</div>' + "".join(f'<div class="wg-c">{E(w[i])}</div>' for w in W)
               for i, lbl in [(2, "Qué hacemos"), (3, "Qué pedimos al cliente"), (4, "Qué recibe el cliente")])
slide("light", "Plan de entrega", "Qué pasa cada semana", f'<div class="wgrid">{head}{body}</div>')

# ================= 8 Cliente ideal
slide("dark", "A quién venderlo", "El cliente ideal y lo que se vende como fase 2", """
<div class="two">
  <div class="col"><div class="ch">Cliente ideal</div><ul class="ck">
    <li>Org con licencias de Financial Services Cloud, nueva o sin configurar</li>
    <li>Aseguradora o agente, banco o financiera, o gestor patrimonial en México</li>
    <li>Clientes personas y empresas con RFC, CURP y expediente KYC</li>
    <li>Necesita operar rápido con un proceso estándar en una industria</li></ul></div>
  <div class="col"><div class="ch">No incluido: oportunidad de fase 2</div><ul class="xk">
    <li>Integración con el core bancario y saldos en línea</li>
    <li>Posiciones y valoración de inversiones</li>
    <li>KYC/AML y screening con proveedores especializados</li>
    <li>Métricas actuariales</li>
    <li>Migración de datos históricos</li></ul></div>
</div>
<div class="note-dark"><b>Para cumplir 4 semanas:</b> líder y admin disponibles, licencias FSC activas y formato de solicitud contestado en la semana 1, y usuarios listos en la semana 4.</div>""")

# ================= 9 Cómo venderlo
B = [("Rápido:", "operación financiera en español, con su industria lista desde el primer día."),
     ("Datos confiables:", "RFC y CURP validados y alertas de clientes duplicados."),
     ("Cumplimiento ordenado:", "KYC con vigencia y riesgo PLD visible solo para quien corresponde."),
     ("Nada se olvida:", "fecha compromiso en cada caso y avisos de renovación o revisión."),
     ("Visibilidad:", "dashboards de operación y de su industria."),
     ("Su marca:", "la app con su logo y colores, en escritorio y móvil."),
     ("Sin deuda técnica:", "solo funcionalidad estándar, fácil de mantener y crecer.")]
slide("dark", "Cómo venderlo", "“En 4 semanas su equipo opera Financial Services Cloud con un proceso probado”",
      '<ul class="pitch">' + "".join(f"<li><b>{E(a)}</b> {E(b)}</li>" for a, b in B) + "</ul>", cls="quote")

# ================= 10 Por qué es más rápido
R = [("Diseño", "Desde cero", f"{COMPONENTES} componentes listos"),
     ("Industria", "Se diseña en cada proyecto", "Seguros, Banca o Patrimonial, listos para elegir"),
     ("Despliegue", "Manual", "Por etapas, validado antes de cada paso"),
     ("Pruebas y documentos", "Se hacen en cada proyecto", f"{TEST['total']} pruebas y {DOCS} documentos"),
     ("Marca del cliente", "Configuración manual", "Un paso de configuración"),
     ("Tiempo a productivo", "Depende del diseño", "4 semanas")]
trs = "".join(f'<tr><td class="ka">{E(a)}</td><td class="km">{E(b)}</td><td class="kb">{E(c_)}</td></tr>' for a, b, c_ in R)
slide("light", "Por qué es más rápido", "Partimos de lo construido, no de una hoja en blanco", f"""
<table class="tbl tbl-cmp"><thead><tr><th>Aspecto</th><th>A la medida</th><th>Con Starter Pack</th></tr></thead><tbody>{trs}</tbody></table>
<div class="note-light">El tiempo se invierte en lo que hace único al cliente, no en lo que se repite en todos.</div>""")

# ================= 11 Beneficios para ETC
G = [("Ciclos de venta más cortos", "Una propuesta con alcance, tiempo y entregables cerrados se decide más rápido."),
     ("Más proyectos, mismo equipo", "Dejamos de configurar lo básico de FSC en cada cliente."),
     ("Fácil de cotizar", "Un paquete estándar con precio y tiempos predecibles."),
     ("Calidad consistente", "Mismas buenas prácticas, seguridad y pruebas en cada cliente."),
     ("Menor riesgo", "Sin código, con cambios reversibles y validados antes de desplegar."),
     ("Puerta a la fase 2", "Cada cliente queda listo para integraciones, KYC/AML o una segunda industria.")]
slide("dark", "Beneficios para ETC", "Lo que gana la organización",
      '<div class="bgrid">' + "".join(f'<div class="bc"><div class="bt">{E(a)}</div><div class="bd">{E(b)}</div></div>' for a, b in G) + "</div>")

# ================= 12 Recomendación
slide("dark", "Recomendación", "Lanzar el Starter Pack como nuestra oferta estándar de Financial Services Cloud", f"""
<ol class="recs">
  <li><span class="rn">1</span><span>Definir el paquete comercial: alcance, precio <span class="ph">[$__]</span> y condiciones {tag('Placeholder')}</span></li>
  <li><span class="rn">2</span><span>Elegir un cliente piloto para el primer Quick Start: <span class="ph">[Cliente]</span> {tag('Placeholder')}</span></li>
  <li><span class="rn">3</span><span>Preparar demo y materiales de venta sobre la org de referencia</span></li>
  <li><span class="rn">4</span><span>Medir tiempo real y margen del piloto para ajustar la oferta</span></li>
</ol>""")

# ================= Anexo
TYPE = {"Text": "Texto", "Picklist": "Lista", "Date": "Fecha", "Checkbox": "Casilla", "LongTextArea": "Texto largo", "Currency": "Moneda", "Lookup": "Búsqueda"}
OBJ = {"InsurancePolicy": "Póliza", "Claim": "Siniestro", "FinancialAccount": "Cuenta financiera", "FinancialGoal": "Objetivo financiero", "Account": "Cliente", "Case": "Caso", "Contact": "Contacto", "Lead": "Prospecto", "Opportunity": "Oportunidad", "PersonAccount": "Cliente persona"}
def ftype(f):
    t = TYPE.get(f["type"], f["type"])
    if f.get("length") and f["type"] == "Text":
        t += f" ({f['length']})"
    if f["type"] == "Lookup":
        t += f" a {OBJ.get(f['referenceTo'], f['referenceTo'])}"
    return t
def fdesc(f):
    vals = " · ".join(f.get("values") or [])
    return f"{vals}: {f['purpose']}" if vals else f["purpose"]
def field_rows(fields):
    return [(f["label"], ftype(f), fdesc(f)) for f in fields]
def annex(eyebrow, title, head, rows, per=11, note=""):
    chunks = [rows[i:i + per] for i in range(0, len(rows), per)] or [[]]
    for k, ch in enumerate(chunks, 1):
        part = f" · {k} de {len(chunks)}" if len(chunks) > 1 else ""
        trs = "".join("<tr>" + "".join(f"<td>{E(str(x))}</td>" for x in r) + "</tr>" for r in ch)
        slide("light", f"Anexo · {eyebrow}{part}", title,
              f'<table class="tbl tbl-ax"><thead><tr>{"".join(f"<th>{E(h)}</th>" for h in head)}</tr></thead><tbody>{trs}</tbody></table>' +
              (f'<div class="small">{E(note)}</div>' if note and k == len(chunks) else ""), cls="annex")
FHEAD = ["Campo", "Tipo", "Valores y para qué sirve"]
RHEAD = ["Tipo", "Regla", "Qué asegura o hace"]
def nice(name):
    return name.replace("ETC_", "").replace("__c", "").replace("__pc", "").replace("_", " ")
VR = lambda mod, objs: [("Validación", v["purpose"], v["message"]) for v in DD[mod]["validationRules"] if v["object"] in objs]
DUP = lambda objs: [("Duplicado", OBJ.get(r["object"], r["object"]), r["match"]) for r in DD["common"]["duplicateRules"] if r["object"] in objs]
FLABEL = {f["apiName"]: f["label"] for m in DD for f in DD[m]["fields"]}
def lv_filter(field, op, val):
    key = field.split(".")[-1]
    if key in ("CLOSED", "CONVERTED") and val == "0":
        return "sin cerrar" if key == "CLOSED" else "sin convertir"
    std = {"TYPE": "tipo", "STATUS": "estado", "Status": "estado", "ExpirationDate": "fin de vigencia", "OpeningDate": "fecha de apertura"}
    name = FLABEL.get(key, std.get(key, nice(key)))
    name = name[0].lower() + name[1:] if not name[:3].isupper() else name
    val = {"Closed": "Cerrado", "Active": "Activa"}.get(val, val)
    if val.startswith("NEXT_N_DAYS:"):
        return f"{name} en los próximos {val.split(':')[1]} días"
    if op == "lessThan" and val == "TODAY":
        return f"{name} vencida"
    if op == "notEqual":
        return f"{name} distinto de {val}"
    return f"{name}: {val.replace(',', ', ')}"
def lv_desc(v):
    s_ = "Mis registros" if v["scope"] == "Mine" else "Todos los registros"
    return s_ + ("; " + "; ".join(lv_filter(*f) for f in v["filters"]) if v["filters"] else "")
LV = lambda mod, objs: [("Vista", v["label"], lv_desc(v)) for v in UI[mod].get("listViews", []) if v["object"] in objs]
FLOWS = {
    "common": [("Flow", "Normalización de RFC y CURP", "Al guardar: mayúsculas, sin espacios ni guiones"),
               ("Flow", "Vencimiento KYC", "Diario: marca Vencido el KYC aprobado que superó su vigencia"),
               ("Flow", "Fecha compromiso", "Al crear un caso: calcula la fecha según el tipo de solicitud")],
    "insurance": [("Flow", "Aviso de renovación", "Diario: tarea al responsable antes del fin de vigencia")],
    "banking": [("Flow", "Fecha de cierre", "Al cerrar una cuenta sin fecha, registra la de hoy")],
    "wealth": [("Flow", "Próxima revisión", "Calcula la próxima revisión según la frecuencia"),
               ("Flow", "Aviso de revisión", "Diario: tarea al asesor antes de la revisión de cartera")],
}

annex("Clientes", "Clientes: campos nuevos para personas y empresas", FHEAD, field_rows(fld("common", "Account")))
annex("Clientes", "Clientes: reglas, duplicados y automatización", RHEAD,
      VR("common", {"Account"}) + DUP({"Account", "PersonAccount"}) + FLOWS["common"][:2] + LV("common", {"Account"}))
annex("Contactos", "Contactos: datos personales, preferencias y consentimiento", FHEAD,
      field_rows(fld("common", "Contact")) + [(r[1], r[0], r[2]) for r in VR("common", {"Contact"}) + DUP({"Contact"})],
      note="En clientes persona, estos campos aparecen en la misma ficha del cliente.")
annex("Casos", "Casos: aclaraciones y quejas con fecha compromiso y dictamen", FHEAD,
      field_rows(fld("common", "Case")) + [("Tipo de solicitud", "Lista estándar", "Consulta · Aclaración · Queja · Solicitud de servicio · Actualización de datos")] +
      [(r[1], r[0], r[2]) for r in VR("common", {"Case"}) + FLOWS["common"][2:] + LV("common", {"Case"})], per=12,
      note="Asignación automática a colas: " + " · ".join(q["label"].replace("ETC ", "") + ({"insurance": " (Seguros)", "banking": " (Banca)", "wealth": " (Patrimonial)"}.get(q["module"], "")) for q in spec("common-process.json")["queues"]) + ".")
annex("Oportunidades y prospectos", "Oportunidades y prospectos: producto de interés y motivo de cierre", FHEAD,
      [(f"{f['label']} ({OBJ[f['object']]})", ftype(f), fdesc(f)) for f in fld("common", "Opportunity") + fld("common", "Lead")] +
      [(r[1], r[0], r[2]) for r in VR("common", {"Opportunity", "Lead"}) + DUP({"Lead"}) + LV("common", {"Opportunity", "Lead"})], per=12)
_PROC = spec("common-process.json")
annex("Etapas y Path", "Etapas guiadas: cada una dice qué hacer y qué capturar", ["Etapa", "Probabilidad", "Qué hacer en esta etapa"],
      [(s_["value"], f'{s_["probability"]}%', s_["info"]) for s_ in _PROC["opportunityStages"]] +
      [(f'Prospecto: {s_["value"]}', "Convierte" if s_.get("converted") else "—", s_["info"]) for s_ in _PROC["leadStatuses"]], per=12,
      note="Path muestra la guía y los campos clave de cada etapa en la parte superior del registro.")
annex("Seguridad", "Seguridad: cada nivel ve lo suyo y lo de su equipo", ["Nivel", "Qué hace", "Qué ve"],
      [(p["label"], p["description"], AM["recordScope"].get(p["id"], "")) for p in PERSONAS],
      note="Privado por defecto en clientes, oportunidades, casos y prospectos. KYC y riesgo PLD con acceso restringido; nadie puede eliminar registros. Planes de acción listos: " + ", ".join(t["label"].replace("ETC ", "") for t in spec("common-process.json")["actionPlans"]) + ".")
for mod, name, title in [("insurance", "Seguros", "Seguros: pólizas, siniestros y renovaciones"),
                         ("banking", "Banca", "Banca: cuentas financieras y aclaraciones"),
                         ("wealth", "Patrimonial", "Patrimonial: perfil, revisiones y objetivos")]:
    rows = [(f"{f['label']} ({OBJ.get(f['object'], f['object'])})", ftype(f), fdesc(f)) for f in fld(mod)]
    objs = {f["object"] for f in fld(mod)} | {v["object"] for v in DD[mod]["validationRules"]} | {v["object"] for v in UI[mod].get("listViews", [])}
    rows += [(r[1], r[0], r[2]) for r in VR(mod, objs) + FLOWS[mod] + LV(mod, objs)]
    annex(name, title, FHEAD, rows)
REP = []
for m, l in MODS:
    REP += [(r["label"], l, r["description"]) for r in UI[m].get("reports", [])]
    REP += [(f"Dashboard {d['title']}", l, d["description"]) for d in UI[m].get("dashboards", [])]
annex("Reportes y dashboards", "Reportes y dashboards: cada nivel ve sus números", ["Reporte o dashboard", "Módulo", "Qué muestra"], REP, per=10)

# ================= Ensamble
N = len(slides)
secs = []
for i, (theme, eb, ti, body, cls) in enumerate(slides, 1):
    h = "h1" if i == 1 else "h2"
    secs.append(f'''<section class="slide {theme} {cls}" id="s{i}" data-label="{E(ti)}" aria-label="Diapositiva {i} de {N}">
<div class="inner"><div class="eyebrow">{E(eb)}</div><{h} class="title">{E(ti)}</{h}>{body}</div>
<div class="foot"><span>ETC · Financial Services Cloud Starter Pack</span><span>{i}</span></div></section>''')
CSS = open(sys.argv[2]).read()
JS = open(sys.argv[3]).read().replace("__N__", str(N))
doc = f'''<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Financial Services Cloud Starter Pack — Quick Start V3</title>
<meta name="presentation-title" content="Financial Services Cloud Starter Pack — Quick Start">
<meta name="presentation-version" content="0.3"><meta name="presentation-date" content="2026-11-17">
<meta name="presentation-author" content="ETC · Especialistas en Transformación Cloud">
<meta name="presentation-classification" content="Uso interno ETC">
<style>{CSS}</style></head><body>
<main id="deck">{"".join(secs)}</main>
<div id="hud" aria-live="polite"><div id="prog"><div id="bar"></div></div><span id="cnt">1 / {N}</span></div>
<script>{JS}</script></body></html>'''
open(OUT, "w").write(doc)
print(OUT, N, "diapositivas ·", COMPONENTES, "componentes")
