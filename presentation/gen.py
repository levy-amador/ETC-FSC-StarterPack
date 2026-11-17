import json, html, collections, sys
OUT = sys.argv[4] if len(sys.argv) > 4 else "Financial Services Cloud Starter Pack — Quick Start V1.html"
# Uso: python3 presentation/gen.py config/catalog/fsc-catalog.json presentation/style.css presentation/deck.js [salida.html]
_items = json.load(open(sys.argv[1]))["items"]
_by = lambda m: [{"id": i["id"], "area": i["area"], "item": i["item"], "quien": i["ejecutor"]} for i in _items if i["module"] == m]
COM, INS, BNK, WLT = (_by(m) for m in ("common", "insurance", "banking", "wealth"))
E = html.escape

WHO = {
    "Claude Code (con aprobación)": ("cc", "◆", "Claude Code + aprobación"),
    "Humano con apoyo de IA": ("hi", "◐", "Humano con apoyo de IA"),
    "Humano": ("hu", "●", "Humano"),
}
def who(q, short=False):
    k, ic, lbl = WHO[q]
    if short:
        lbl = {"cc": "Claude Code", "hi": "Humano + IA", "hu": "Humano"}[k]
    return f'<span class="who who-{k}"><span aria-hidden="true">{ic}</span> {E(lbl)}</span>'

def tag(kind, text=None):
    return f'<span class="tag tag-{kind.lower()[:3]}">{E(text or kind)}</span>'

slides = []
def slide(theme, eyebrow, title, body, cls="", notes=""):
    slides.append((theme, eyebrow, title, body, cls, notes))

SRC = '<div class="src">Fuente: Catálogo de configuraciones Financial Services Cloud (hojas Común FSC, Seguros, Banking, Wealth Management).</div>'

# 1 Portada
slide("dark", "Propuesta interna · Borrador v0.1", "Financial Services Cloud Starter Pack", f"""
<p class="cover-sub">Una base FSC lista, con el módulo de industria que el cliente necesita</p>
<p class="cover-meta">ETC · Noviembre 2026</p>
<div class="cover-mods">
  <span class="mod mod-base">Base común</span><span class="plus">+</span>
  <span class="mod">Seguros</span><span class="or">o</span><span class="mod">Banca</span><span class="or">o</span><span class="mod">Patrimonial</span>
</div>""", cls="cover")

# 2 Qué es
slide("dark", "Qué es", "Una base FSC reutilizable que se ajusta a la industria del cliente", f"""
<p class="lead">Sin una base reutilizable, cada implementación de Financial Services Cloud arranca desde cero. El Starter Pack parte de un catálogo de configuraciones ya clasificadas por industria y por responsable.</p>
<div class="kpis">
  <div class="kpi"><div class="n">71</div><div class="l">configuraciones catalogadas</div></div>
  <div class="kpi"><div class="n">3</div><div class="l">verticales: Seguros, Banca y Patrimonial</div></div>
  <div class="kpi"><div class="n">44</div><div class="l">ejecutables por Claude Code, con aprobación humana</div></div>
  <div class="kpi"><div class="n">0</div><div class="l">código a la medida como principio {tag('Recomendación')}</div></div>
</div>
<div class="note-dark"><b>Modelo de datos:</b> FSC Core, con objetos estándar de la plataforma y sin el paquete gestionado FinServ__. Decisión ETC del 17-nov-2026.</div>
{SRC}""")

# 3 Arquitectura
slide("light", "Arquitectura modular", "Una base común y solo la vertical que el cliente contrata", f"""
<div class="arch">
  <div class="arch-left">
    <div class="verts">
      <div class="vert"><div class="vn">Seguros</div><div class="vc">{len(INS)} configuraciones</div><div class="vd">Pólizas, coberturas, siniestros y renovaciones</div></div>
      <div class="vert"><div class="vn">Banca</div><div class="vc">{len(BNK)} configuraciones</div><div class="vd">Clientes, cuentas financieras, productos y sucursales</div></div>
      <div class="vert"><div class="vn">Patrimonial</div><div class="vc">{len(WLT)} configuraciones</div><div class="vd">Hogares, inversiones, objetivos y asesores</div></div>
    </div>
    <div class="pick">▲ Se elige una por cliente ▲</div>
    <div class="basebar"><div class="vn">Base común FSC</div><div class="vc">{len(COM)} configuraciones · seguridad, app, modelo de datos, interfaz, procesos, servicio, reportes y despliegue</div></div>
  </div>
  <div class="arch-right">
    <div class="steps-title">Al desplegar con cada cliente</div>
    <ol class="nsteps">
      <li><b>Configurar:</b> el script pregunta qué vertical se implementa.</li>
      <li><b>Diagnosticar:</b> revisa en modo lectura que la org tenga objetos y licencias de esa vertical.</li>
      <li><b>Confirmar:</b> muestra la vertical y la org, y pide una confirmación explícita.</li>
      <li><b>Desplegar:</b> solo la base común y la vertical elegida.</li>
    </ol>
    <div class="small">Diseño acordado el 17-nov-2026. Los scripts están en construcción.</div>
  </div>
</div>""")

# 4 Base común
by_area = collections.OrderedDict()
for d in COM: by_area.setdefault(d["area"], []).append(d)
cards = "".join(
    f'<div class="acard"><div class="ah">{E(a)} <span class="cnt">{len(v)}</span></div>'
    + "".join(f'<div class="ai"><span class="id">{E(d["id"])}</span>{E(d["item"])}</div>' for d in v)
    + "</div>" for a, v in by_area.items())
slide("light", "Base común · 30 configuraciones", "La base común cubre lo que toda implementación FSC necesita",
      f'<div class="agrid">{cards}</div>{SRC}', cls="dense")

# 5-7 Verticales
def vert_slide(rows, eyebrow, title):
    items = "".join(
        f'<div class="vi"><span class="id">{E(d["id"])}</span><span class="vt">{E(d["item"])}<span class="va">{E(d["area"])}</span></span>{who(d["quien"], True)}</div>'
        for d in rows)
    c = collections.Counter(d["quien"] for d in rows)
    LB = {"cc": "Claude Code con aprobación", "hi": "Humano con apoyo de IA", "hu": "Humano"}
    summ = " · ".join(f'{c[q]} {LB[WHO[q][0]]}' for q in WHO if c[q])
    slide("light", eyebrow, title, f'<div class="vlist">{items}</div><div class="vsum"><b>{E(summ)}</b><span>Fuente: Catálogo de configuraciones Financial Services Cloud.</span></div>', cls="dense")

vert_slide(INS, f"Vertical Seguros · {len(INS)} configuraciones", "Seguros agrega pólizas, siniestros y renovaciones a la base común")
vert_slide(BNK, f"Vertical Banca · {len(BNK)} configuraciones", "Banca agrega clientes, cuentas financieras y servicio por sucursal")
vert_slide(WLT, f"Vertical Patrimonial · {len(WLT)} configuraciones", "Patrimonial agrega hogares, inversiones y objetivos financieros")

# 8 Quién hace qué
rows = [("Común FSC", COM), ("Seguros", INS), ("Banca", BNK), ("Patrimonial", WLT), ("Total", COM + INS + BNK + WLT)]
maxn = 71
bars = ""
for name, rs in rows:
    c = collections.Counter(d["quien"] for d in rs)
    segs = ""
    for q in WHO:
        n = c[q]
        if not n: continue
        k = WHO[q][0]
        segs += f'<div class="seg seg-{k}" style="width:{n / maxn * 100:.3f}%" title="{E(WHO[q][2])}: {n}">{n}</div>'
    bars += f'<div class="brow{" btotal" if name == "Total" else ""}"><div class="bl">{name} <span>{len(rs)}</span></div><div class="bt">{segs}</div></div>'
legend = "".join(f'<span class="lg"><span class="sw sw-{WHO[q][0]}"></span><span aria-hidden="true">{WHO[q][1]}</span> {E(WHO[q][2])}</span>' for q in WHO)
slide("dark", "Quién hace qué", "La IA acelera la configuración; una persona aprueba cada decisión", f"""
<div class="chart"><div class="legend">{legend}</div>{bars}</div>
<div class="who-notes">
  <div><b>44 de 71 (62%)</b> las ejecuta Claude Code vía metadata, siempre con aprobación previa.</div>
  <div><b>Siempre las decide una persona:</b> licencias, acceso y seguridad, KYC/AML, reglas de negocio y cifras financieras o actuariales.</div>
</div>
{SRC}""")

# 9 Cómo se despliega
steps = [
    ("configure", "Marca y vertical", "Logo, colores y la vertical de este cliente"),
    ("assess", "Diagnóstico", "Licencias y objetos FSC de la org, en modo lectura"),
    ("build", "Paquete", "Manifiestos por etapa: base común + vertical elegida"),
    ("validate", "Validación", "Check-only completo en la org destino"),
    ("deploy", "Despliegue", "Se escribe la vertical, exige diagnóstico Listo y valida cada etapa"),
    ("test", "Pruebas", "Pruebas funcionales con datos de prueba y limpieza"),
    ("deployment-report", "Evidencia", "Reporte de lo desplegado y verificado"),
]
flow = "".join(f'<div class="fs"><div class="fn">{i + 1}</div><div class="fc">npm run {E(c)}</div><div class="fh">{E(h)}</div><div class="fd">{E(d)}</div></div>' for i, (c, h, d) in enumerate(steps))
slide("light", "Cómo se despliega", "Un despliegue por etapas que confirma vertical y org antes de cambiar nada", f"""
<div class="flow">{flow}</div>
<div class="note-light">Es el mismo patrón probado en el Sales Cloud Starter Pack: etapas ordenadas por dependencias, sin cambios destructivos y con evidencia por instancia. Scripts implementados y probados en local; falta la primera ejecución en una org FSC.</div>""")

# 10 Ruta
slide("light", "Ruta del proyecto", "Cuatro semanas a go-live con la base común y una vertical", f"""
<div class="est-row">{tag('Estimación')} {tag('Supuesto', 'Supuesto: se valida con el piloto')}</div>
<div class="tl">
  <div class="tlw"><div class="wk">SEMANA 1</div><div class="tb">Kickoff y Discovery</div><div class="tb">Diagnóstico de licencias y objetos FSC</div></div>
  <div class="tlw"><div class="wk">SEMANA 2</div><div class="tb">Construcción: base común + vertical con su marca</div></div>
  <div class="tlw"><div class="wk">SEMANA 3</div><div class="tb">Pruebas y UAT por rol</div><div class="tb">Ajustes</div></div>
  <div class="tlw"><div class="wk">SEMANA 4</div><div class="tb">Despliegue PRD</div><div class="tb">Capacitación</div><div class="tb tb-go">◆ GO LIVE</div></div>
  <div class="tlw tlw-g"><div class="wk">+30 DÍAS</div><div class="tb">Garantía</div></div>
</div>
<div class="note-light">Toma como referencia la ruta del Sales Cloud Starter Pack. FSC agrega el diagnóstico de licencias y más decisiones de negocio, así que la duración real se mide con el piloto.</div>""")

# 11 Cliente ideal
slide("dark", "A quién venderlo", "El cliente ideal ya tiene FSC y necesita operar rápido", f"""
<div class="two">
  <div class="col">
    <div class="ch">Cliente ideal {tag('Supuesto')}</div>
    <ul class="ck">
      <li>Org con licencias FSC Core nueva o sin configurar</li>
      <li>Aseguradora o agente, banco o financiera, o gestor patrimonial en México</li>
      <li>Una vertical principal para arrancar</li>
      <li>Equipo con jerarquía y procesos estándar</li>
    </ul>
  </div>
  <div class="col">
    <div class="ch">Fuera de alcance: oportunidad de fase 2</div>
    <ul class="xk">
      <li>Integración con core bancario y saldos reales <span class="id">BNK-003 · BNK-005</span></li>
      <li>Posiciones, valoración y resumen patrimonial <span class="id">WLT-004 · WLT-010</span></li>
      <li>KYC/AML y screening <span class="id">BNK-009 · WLT-011</span></li>
      <li>Métricas actuariales y financieras <span class="id">INS-012</span></li>
      <li>Migración de datos históricos</li>
    </ul>
  </div>
</div>
<div class="note-dark">Según el catálogo, estos temas requieren integración, especialistas o decisiones regulatorias. Claude Code solo prepara la estructura.</div>""")

# 12 Estado
st = [
    ("ok", "✓", "Hecho", "Catálogo de 71 configuraciones con responsable", "Equipo ETC"),
    ("ok", "✓", "Hecho", "Arquitectura modular y modelo FSC Core acordados", "17-nov-2026"),
    ("ok", "✓", "Hecho", "Repo privado ETC-FSC-StarterPack: scripts modulares, aún sin metadata", "17-nov-2026"),
    ("wip", "◐", "En curso", "Org FSC de pruebas", "La gestiona el equipo"),
    ("pen", "○", "Pendiente", "Diccionario de campos, reglas y reportes por vertical", "Por definir"),
    ("pen", "○", "Pendiente", "Primer despliegue y pruebas en la org FSC", "Depende de la org"),
]
srows = "".join(f'<div class="sr"><span class="st st-{k}"><span aria-hidden="true">{i}</span> {E(l)}</span><span class="stt">{E(t)}</span><span class="sto">{E(o)}</span></div>' for k, i, l, t, o in st)
slide("light", "Estado hoy · 17-nov-2026", "Catálogo, arquitectura y repo listos; falta la org de pruebas", f'<div class="slist">{srows}</div>')

# 13 Recomendación
slide("dark", "Recomendación", "Definir campos y conseguir la org para construir la base común", f"""
<ol class="recs">
  <li><span class="rn">1</span><span>Aprobar el alcance de la base común: 30 configuraciones</span></li>
  <li><span class="rn">2</span><span>Definir el diccionario de campos, reglas y reportes de cada vertical</span></li>
  <li><span class="rn">3</span><span>Conseguir la org FSC y correr el diagnóstico de licencias</span></li>
  <li><span class="rn">4</span><span>Elegir el cliente piloto: <span class="ph">[Cliente]</span> {tag('Placeholder')}</span></li>
  <li><span class="rn">5</span><span>Definir paquete comercial y precio: <span class="ph">[$__]</span> {tag('Placeholder')}</span></li>
</ol>""")

# Anexo
def annex(rows, name, total, part, parts):
    trs = "".join(f'<tr><td class="id">{E(d["id"])}</td><td>{E(d["item"])}</td><td class="ar">{E(d["area"])}</td><td>{who(d["quien"])}</td></tr>' for d in rows)
    slide("light", f"Anexo · {name} · {part} de {parts}", f"{name}: {total} configuraciones del catálogo",
          f'<table class="tbl"><thead><tr><th>ID</th><th>Configuración</th><th>Área</th><th>Responsable</th></tr></thead><tbody>{trs}</tbody></table>{SRC}', cls="annex")
annex(COM[:15], "Común FSC", 30, 1, 2); annex(COM[15:], "Común FSC", 30, 2, 2)
annex(INS, "Seguros", 12, 1, 1)
annex(BNK, "Banca", 13, 1, 1)
annex(WLT[:8], "Patrimonial", 16, 1, 2); annex(WLT[8:], "Patrimonial", 16, 2, 2)

N = len(slides)
secs = []
for i, (theme, eb, ti, body, cls, notes) in enumerate(slides, 1):
    secs.append(f'''<section class="slide {theme} {cls}" id="s{i}" data-label="{E(ti)}" aria-label="Diapositiva {i} de {N}">
<div class="inner"><div class="eyebrow">{E(eb)}</div><h{"1" if i == 1 else "2"} class="title">{E(ti)}</h{"1" if i == 1 else "2"}>{body}</div>
<div class="foot"><span>ETC · Financial Services Cloud Starter Pack</span><span>{i}</span></div></section>''')

CSS = open(sys.argv[2]).read()
JS = open(sys.argv[3]).read().replace("__N__", str(N))
doc = f'''<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Financial Services Cloud Starter Pack — Quick Start V1</title>
<meta name="presentation-title" content="Financial Services Cloud Starter Pack — Quick Start">
<meta name="presentation-version" content="0.1"><meta name="presentation-date" content="2026-11-17">
<meta name="presentation-author" content="ETC · Especialistas en Transformación Cloud">
<meta name="presentation-status" content="Borrador">
<style>{CSS}</style></head><body>
<main id="deck">{"".join(secs)}</main>
<div id="hud" aria-live="polite"><div id="prog"><div id="bar"></div></div><span id="cnt">1 / {N}</span></div>
<script>{JS}</script></body></html>'''
open(OUT, "w").write(doc)
print(OUT, N)
