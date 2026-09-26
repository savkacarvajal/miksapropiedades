// Utilidades compartidas: escape HTML, sesión, almacenamiento, datos de ejemplo, leads, favoritos, UF.
// Cuando exista backend (Supabase) se reemplazan las funciones de la sección "Almacenamiento".

const LABEL_TIPO = { depto: 'Departamento', casa: 'Casa', oficina: 'Oficina', terreno: 'Terreno' };
const LABEL_OP = { venta: 'Venta', arriendo: 'Arriendo', temporal: 'Arriendo temporal' };
const LABEL_ESTADO = { disponible: 'Disponible', reservada: 'Reservada', vendida: 'Vendida', arrendada: 'Arrendada' };
const LABEL_LEAD = { nuevo: 'Nuevo', contactado: 'Contactado', visita: 'Visita agendada', negociacion: 'En negociación', cerrado: 'Cerrado', descartado: 'Descartado' };
const SECTORES = {
  'La Serena': ['Av. del Mar', 'El Faro', 'Las Compañías', 'Centro La Serena', 'Serena Golf', 'Valle del Sol', 'Antofagasta (La Serena)'],
  'Coquimbo': ['Guayacán', 'La Herradura', 'Peñuelas', 'Centro Coquimbo', 'Pan de Azúcar', 'Puerto Aldea'],
};
// Coordenadas APROXIMADAS por sector (para el mapa). Al haber backend se guardan lat/lng exactas por aviso.
const COORDS = {
  'Av. del Mar': [-29.9170, -71.2770], 'El Faro': [-29.9075, -71.2790], 'Las Compañías': [-29.8690, -71.2380],
  'Centro La Serena': [-29.9027, -71.2519], 'Serena Golf': [-29.9430, -71.2790], 'Valle del Sol': [-29.9330, -71.2380],
  'Antofagasta (La Serena)': [-29.9100, -71.2310], 'Guayacán': [-29.9680, -71.3560], 'La Herradura': [-29.9870, -71.3450],
  'Peñuelas': [-29.9930, -71.2900], 'Centro Coquimbo': [-29.9533, -71.3395], 'Pan de Azúcar': [-30.0170, -71.3650],
  'Puerto Aldea': [-30.2600, -71.4700],
};

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function el(tag, attrs, children) {
  const n = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (k === 'text') n.textContent = v;
    else if (k === 'class') n.className = v;
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  });
  (children || []).forEach(c => n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return n;
}
const $id = i => document.getElementById(i);

// ── Almacenamiento (localStorage, a prueba de fallos) ──
function lsGet(k, def) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? def : v; } catch (e) { return def; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

// ── Sesión ──
function getSesion() {
  const s = lsGet('miksa_session', null);
  if (s && s.exp && Date.now() > s.exp) { try { localStorage.removeItem('miksa_session'); } catch (e) {} return null; }
  return s;
}
function cerrarSesion() { try { localStorage.removeItem('miksa_session'); } catch (e) {} window.location.href = 'index.html'; }
function esAdmin() { const s = getSesion(); return !!s && (MIKSA_CONFIG.ADMIN_EMAILS || []).map(x => x.toLowerCase()).includes(String(s.email).toLowerCase()); }

// ── Formato ──
function formatPrecio(a) {
  const n = Number(a.precio);
  if (!isFinite(n) || n <= 0) return 'Consultar';
  const suf = a.op === 'arriendo' ? ' / mes' : a.op === 'temporal' ? ' / día' : '';
  return 'UF ' + n.toLocaleString('es-CL') + suf;
}
function formatCLP(n) { return '$' + Math.round(Number(n) || 0).toLocaleString('es-CL'); }
function waLink(tel, texto) {
  let d = String(tel || '').replace(/\D/g, '');
  if (d.length === 9 && d[0] === '9') d = '56' + d;
  if (d.length < 10) return null;
  return 'https://wa.me/' + d + '?text=' + encodeURIComponent(texto || '');
}
function comunaDe(sector) { for (const c in SECTORES) if (SECTORES[c].includes(sector)) return c; return ''; }
function hace(iso) {
  const d = new Date(iso); if (isNaN(d)) return '';
  const dias = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (dias < 1) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 30) return 'hace ' + dias + ' días';
  const m = Math.floor(dias / 30); return 'hace ' + m + (m === 1 ? ' mes' : ' meses');
}
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim()); }
function validTel(t) { const d = String(t || '').replace(/\D/g, ''); return d.length >= 8 && d.length <= 12; }
function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

// Solo se aceptan enlaces https a estos proveedores de video / tour virtual
function videoSeguro(u) {
  try {
    const x = new URL(String(u || '').trim());
    if (x.protocol !== 'https:') return null;
    const ok = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com|matterport\.com|my\.matterport\.com|kuula\.co)$/i.test(x.hostname);
    return ok ? x.href : null;
  } catch (e) { return null; }
}

// ── Valor UF (mindicador.cl, con caché de 12 h y valor referencial de respaldo) ──
async function getUF() {
  const c = lsGet('miksa_uf', null);
  if (c && Date.now() - c.t < 12 * 3600 * 1000) return c;
  try {
    const r = await fetch('https://mindicador.cl/api/uf', { cache: 'no-store' });
    const j = await r.json();
    const v = j.serie && j.serie[0] && Number(j.serie[0].valor);
    if (v > 1000) { const o = { valor: v, fecha: j.serie[0].fecha, fuente: 'mindicador.cl', t: Date.now() }; lsSet('miksa_uf', o); return o; }
  } catch (e) { /* sin red: se usa respaldo */ }
  return c || { valor: MIKSA_CONFIG.UF_FALLBACK, fecha: null, fuente: 'referencial', t: 0 };
}

// ── Datos de ejemplo ──
const img = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const dias = n => new Date(Date.now() - n * 86400000).toISOString();
const SEED = [
  { id: 'DEMO-1', demo: true, tipo: 'depto', op: 'venta', estado: 'disponible', fecha: dias(3), corredor: 'c1', titulo: 'Edificio Borde Mar — Av. del Mar', descripcion: 'Proyecto frente al mar con vista despejada, terminaciones de primer nivel y áreas comunes completas. Entrega inmediata en unidades seleccionadas.', precio: 2180, superficie: 78, dormitorios: '3', banos: '2', estacionamientos: '1', sector: 'Av. del Mar', direccion: 'Av. del Mar, La Serena', amenidades: ['Vista al mar', 'Piscina', 'Gimnasio', 'Conserje', 'Estacionamiento'], gastosComunes: 95000, contribuciones: 180000, anio: 2023, orientacion: 'Poniente', subsidio: false, fotos: [img('building-laserena', 800, 1000), img('demo1-b', 800, 600), img('demo1-c', 800, 600)] },
  { id: 'DEMO-2', demo: true, tipo: 'depto', op: 'arriendo', estado: 'disponible', fecha: dias(8), corredor: 'c2', titulo: 'Depto. El Faro — La Serena', descripcion: 'Departamento luminoso a pasos del Faro y la costanera. Cocina equipada, buena conectividad y estacionamiento.', precio: 14, superficie: 55, dormitorios: '2', banos: '1', estacionamientos: '1', sector: 'El Faro', direccion: 'El Faro, La Serena', amenidades: ['Estacionamiento', 'Bodega', 'Mascotas permitidas'], gastosComunes: 45000, anio: 2015, orientacion: 'Norte', fotos: [img('depto-faro', 800, 600), img('demo2-b', 800, 600)] },
  { id: 'DEMO-3', demo: true, tipo: 'casa', op: 'venta', estado: 'reservada', fecha: dias(21), corredor: 'c1', titulo: 'Casa en La Herradura — Coquimbo', descripcion: 'Amplia casa familiar con quincho y jardín, en uno de los sectores más buscados de Coquimbo.', precio: 5900, superficie: 198, dormitorios: '4', banos: '3', estacionamientos: '3+', sector: 'La Herradura', direccion: 'La Herradura, Coquimbo', amenidades: ['Quincho', 'Terraza/Balcón', 'Estacionamiento', 'Calefacción central'], contribuciones: 320000, anio: 2008, orientacion: 'Norponiente', subsidio: false, fotos: [img('casa-coquimbo', 800, 600), img('demo3-b', 800, 600), img('demo3-c', 800, 600)] },
  { id: 'DEMO-4', demo: true, tipo: 'depto', op: 'arriendo', estado: 'disponible', fecha: dias(12), corredor: 'c2', titulo: 'Depto. Peñuelas — Coquimbo', descripcion: 'Departamento cómodo cerca de universidades y comercio, ideal para estudiantes o parejas.', precio: 11, superficie: 48, dormitorios: '2', banos: '1', estacionamientos: '0', sector: 'Peñuelas', direccion: 'Peñuelas, Coquimbo', amenidades: ['Amoblado', 'Lavandería'], gastosComunes: 30000, anio: 2012, orientacion: 'Oriente', fotos: [img('depto-penuela', 800, 600)] },
  { id: 'DEMO-5', demo: true, tipo: 'oficina', op: 'arriendo', estado: 'disponible', fecha: dias(30), corredor: 'c3', titulo: 'Oficina en Guayacán — Coquimbo', descripcion: 'Oficina habilitada en sector empresarial, con recepción y estacionamientos para clientes.', precio: 22, superficie: 62, dormitorios: '', banos: '1', estacionamientos: '2', sector: 'Guayacán', direccion: 'Guayacán, Coquimbo', amenidades: ['Estacionamiento', 'Conserje'], gastosComunes: 60000, anio: 2018, orientacion: 'Norte', fotos: [img('oficina-coquimbo', 800, 600)] },
  { id: 'DEMO-6', demo: true, tipo: 'terreno', op: 'venta', estado: 'disponible', fecha: dias(45), corredor: 'c3', titulo: 'Terreno en Serena Golf', descripcion: 'Terreno plano con factibilidad de servicios, en condominio con acceso controlado.', precio: 3200, superficie: 500, dormitorios: '', banos: '', estacionamientos: '', sector: 'Serena Golf', direccion: 'Serena Golf, La Serena', amenidades: [], contribuciones: 90000, orientacion: 'Poniente', subsidio: false, fotos: [img('demo6-terreno', 800, 600)] },
  { id: 'DEMO-7', demo: true, tipo: 'casa', op: 'temporal', estado: 'disponible', fecha: dias(5), corredor: 'c2', titulo: 'Casa de verano en Pan de Azúcar', descripcion: 'Casa equipada para vacaciones, a minutos de la playa. Ideal para familias.', precio: 6, superficie: 120, dormitorios: '3', banos: '2', estacionamientos: '2', sector: 'Pan de Azúcar', direccion: 'Pan de Azúcar, Coquimbo', amenidades: ['Amoblado', 'Quincho', 'Terraza/Balcón', 'Mascotas permitidas'], anio: 2010, orientacion: 'Poniente', fotos: [img('demo7-verano', 800, 600), img('demo7-b', 800, 600)] },
  { id: 'DEMO-8', demo: true, tipo: 'depto', op: 'venta', estado: 'vendida', fecha: dias(60), corredor: 'c1', titulo: 'Depto. Centro La Serena', descripcion: 'Departamento en pleno centro histórico, cerca de todo. Excelente para inversión.', precio: 2450, superficie: 60, dormitorios: '2', banos: '2', estacionamientos: '1', sector: 'Centro La Serena', direccion: 'Centro, La Serena', amenidades: ['Conserje', 'Bodega'], gastosComunes: 70000, contribuciones: 150000, anio: 2019, orientacion: 'Norte', subsidio: true, fotos: [img('demo8-centro', 800, 600)] },
];

function getAvisosUsuario() { const a = lsGet('miksa_avisos', []); return Array.isArray(a) ? a : []; }
function getTodos() {
  const propios = getAvisosUsuario().map(a => Object.assign({ estado: 'disponible' }, a, {
    fotos: (a.fotos || []).filter(f => typeof f === 'string' && f.indexOf('data:image/') === 0),
  }));
  return propios.reverse().concat(SEED);
}
function getPorId(id) { return getTodos().find(a => a.id === id) || null; }
function fotoPrincipal(a) { return (a.fotos && a.fotos[0]) || null; }
function getCorredor(id) { return (MIKSA_CONFIG.CORREDORES || []).find(c => c.id === id) || null; }

// Posición estable por aviso: coordenadas del sector + pequeño desplazamiento determinista
function coordsDe(a) {
  if (isFinite(a.lat) && isFinite(a.lng)) return [Number(a.lat), Number(a.lng)];
  const base = COORDS[a.sector]; if (!base) return null;
  let h = 0; const s = String(a.id); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return [base[0] + (((h & 255) / 255) - 0.5) * 0.008, base[1] + ((((h >> 8) & 255) / 255) - 0.5) * 0.008];
}

// ── Favoritos y comparador ──
function getFavs() { const f = lsGet('miksa_favs', []); return Array.isArray(f) ? f : []; }
function isFav(id) { return getFavs().includes(id); }
function toggleFav(id) {
  const f = getFavs(); const i = f.indexOf(id);
  if (i > -1) f.splice(i, 1); else f.push(id);
  lsSet('miksa_favs', f); pintarContadorFav(); return i === -1;
}
function getComp() { const c = lsGet('miksa_compare', []); return Array.isArray(c) ? c : []; }
function toggleComp(id) {
  const c = getComp(); const i = c.indexOf(id);
  if (i > -1) { c.splice(i, 1); lsSet('miksa_compare', c); return { ok: true, on: false }; }
  if (c.length >= 3) return { ok: false, on: false };
  c.push(id); lsSet('miksa_compare', c); return { ok: true, on: true };
}

// ── Leads (consultas, visitas, tasaciones, captación) ──
function getLeads() { const l = lsGet('miksa_leads', []); return Array.isArray(l) ? l : []; }
function guardarLead(l) {
  const todos = getLeads();
  const lead = Object.assign({ id: 'L-' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8).toUpperCase() : Date.now()), creado: new Date().toISOString(), estado: 'nuevo' }, l);
  todos.push(lead);
  return lsSet('miksa_leads', todos) ? lead : null;
}
function actualizarLead(id, cambios) {
  const todos = getLeads(); const l = todos.find(x => x.id === id);
  if (!l) return false; Object.assign(l, cambios); return lsSet('miksa_leads', todos);
}

// ── Estadísticas por aviso (solo de este navegador hasta que exista backend) ──
function sumarStat(id, campo) { const s = lsGet('miksa_stats', {}); s[id] = s[id] || { vistas: 0, contactos: 0 }; s[id][campo]++; lsSet('miksa_stats', s); }
function getStats(id) { return (lsGet('miksa_stats', {})[id]) || { vistas: 0, contactos: 0 }; }

// ── Búsquedas guardadas ──
function getBusquedas() { const b = lsGet('miksa_busquedas', []); return Array.isArray(b) ? b : []; }

// ── UI global ──
function toggleMenu() {
  const m = $id('mobile-menu'), b = document.querySelector('.tn-burger');
  if (!m || !b) return;
  m.hidden = !m.hidden; b.setAttribute('aria-expanded', String(!m.hidden));
}
function pintarContadorFav() {
  const n = getFavs().length;
  document.querySelectorAll('[data-fav-count]').forEach(b => { b.textContent = n ? String(n) : ''; b.hidden = !n; });
}
(function initNav() {
  const s = getSesion();
  if (s) document.querySelectorAll('nav a[href="ingresar.html"]').forEach(a => { a.textContent = 'Mis avisos'; a.setAttribute('href', 'mis-avisos.html'); });
  const menu = $id('mobile-menu');
  if (menu) menu.addEventListener('click', e => { if (e.target.closest('a')) toggleMenu(); });
  pintarContadorFav();
  const cur = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav .tn-links a').forEach(a => { if (a.getAttribute('href') === cur) a.classList.add('current'); });
})();

// ── Crédito hipotecario (sistema francés, cuota fija) ──
function dividendo(montoCLP, tasaAnualPct, anios) {
  const n = anios * 12, r = tasaAnualPct / 100 / 12;
  if (montoCLP <= 0 || n <= 0) return 0;
  return r === 0 ? montoCLP / n : montoCLP * r / (1 - Math.pow(1 + r, -n));
}

// ── Búsqueda / filtros compartidos (listado, mapa, barrios) ──
function normalizar(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function filtrarLista(lista, f) {
  const q = normalizar(f.q);
  return lista.filter(a => {
    if (f.estado !== 'todas' && a.estado && a.estado !== 'disponible') return false;
    if (f.op && a.op !== f.op) return false;
    if (f.tipo && a.tipo !== f.tipo) return false;
    if (f.sector && a.sector !== f.sector) return false;
    if (f.dorm && (parseInt(a.dormitorios, 10) || 0) < parseInt(f.dorm, 10)) return false;
    if (f.pmax && Number(a.precio) > Number(f.pmax)) return false;
    if (q && normalizar([a.titulo, a.descripcion, a.sector, a.direccion, comunaDe(a.sector)].join(' ')).indexOf(q) === -1) return false;
    return true;
  });
}
function filtrosDesdeURL() {
  const p = new URLSearchParams(window.location.search), f = {};
  ['q', 'op', 'tipo', 'sector', 'dorm', 'pmax', 'estado', 'orden'].forEach(k => { f[k] = (p.get(k) || '').trim(); });
  if (f.estado !== 'todas') f.estado = 'disp';
  return f;
}
