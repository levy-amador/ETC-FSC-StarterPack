'use strict';
// Selección de vertical por cliente.
// El paquete incluye la base común y las tres verticales (Seguros, Banca, Patrimonial), pero cada cliente
// implementa la base común + la vertical que confirme. Ningún script de build/deploy corre sin esa decisión.
const readline = require('readline');
const { MODULES_FILE, IMPLEMENTATION_FILE, c, fail, readJson, writeJson } = require('./common');

function modules() {
  return readJson(MODULES_FILE).modules;
}

function verticals() {
  return modules().filter((m) => m.kind === 'vertical');
}

function normalize(value) {
  if (!value) return [];
  const all = verticals();
  return String(value)
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .map((v) => {
      const hit = all.find((m) => m.id === v || m.aliases.includes(v) || m.label.toLowerCase() === v);
      if (!hit) fail(`Vertical desconocida: "${v}". Opciones: ${all.map((m) => `${m.id} (${m.label})`).join(', ')}`);
      return hit.id;
    });
}

function readImplementation() {
  return readJson(IMPLEMENTATION_FILE, { client: null, verticals: [] });
}

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const a = await new Promise((r) => rl.question(question, r));
  rl.close();
  return a.trim();
}

async function promptVertical(current) {
  const all = verticals();
  console.log(c.bold('\n¿Qué vertical de Financial Services Cloud se implementará con este cliente?'));
  all.forEach((m, i) => console.log(`  ${i + 1}) ${m.label}  ·  ${m.description}`));
  const def = current.length ? ` [Enter = ${current.join(',')}]` : '';
  const a = await ask(`Elige el número o el id (varias separadas por coma)${def}: `);
  if (!a && current.length) return current;
  const picked = a.split(',').map((x) => x.trim()).map((x) => (/^\d+$/.test(x) ? all[Number(x) - 1]?.id : x));
  if (picked.some((x) => !x)) fail('Opción inválida.');
  return normalize(picked.join(','));
}

// Resuelve la vertical con este orden: --vertical, config/implementation.json, pregunta interactiva.
// Con { persist: true } guarda la elección en config/implementation.json.
async function resolveVerticals(args, { interactive = true, persist = false } = {}) {
  const impl = readImplementation();
  let selected = args.vertical ? normalize(args.vertical) : normalize((impl.verticals || []).join(','));
  if (!selected.length || (interactive && args['change-vertical'])) {
    if (!interactive || !process.stdin.isTTY) {
      fail('No hay vertical seleccionada. Ejecuta npm run configure o indica --vertical insurance|banking|wealth.');
    }
    selected = await promptVertical(selected);
  }
  if (!selected.length) fail('Debes elegir al menos una vertical.');
  if (persist) writeJson(IMPLEMENTATION_FILE, { ...impl, verticals: selected, updatedAt: new Date().toISOString() });
  return selected;
}

// Módulos a construir/desplegar: base común + verticales elegidas, en el orden de config/modules.json.
function activeModules(selected) {
  return modules().filter((m) => m.kind === 'base' || selected.includes(m.id));
}

function labelOf(ids) {
  const all = modules();
  return ids.map((id) => all.find((m) => m.id === id)?.label || id).join(' + ');
}

module.exports = { modules, verticals, normalize, readImplementation, resolveVerticals, activeModules, labelOf, ask };
