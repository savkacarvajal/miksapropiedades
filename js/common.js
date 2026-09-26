// Utilidades compartidas: escape HTML, sesión, almacenamiento, datos de ejemplo, leads, favoritos, UF.
// Cuando exista backend (Supabase) se reemplazan las funciones de la sección "Almacenamiento".

const LABEL_TIPO = { depto: 'Departamento', casa: 'Casa', oficina: 'Oficina', terreno: 'Terreno' };
const LABEL_OP = { venta: 'Venta', arriendo: 'Arriendo', temporal: 'Arriendo temporal' };
const LABEL_ESTADO = { disponible: 'Disponible', reservada: 'Reservada', vendida: 'Vendida', arrendada: 'Arrendada' };
const LABEL_LEAD = { nuevo: 'Nuevo', contactado: 'Contactado', visita: 'Visita agendada', negociacion: 'En negociación', cerrado: 'Cerrado', descartado: 'Descartado' };
const SECTORES = {
  'La Serena': ['Av. del Mar', 'El Faro', 'Las Compañías', 'Centro La Serena', 'Serena Golf', 'Valle del Sol', 'Antofagasta (La Serena)'],
  'Coquimbo': ['Guayacán', 'La Herradura', 'Peñuelas', 'Centro Coquimbo', 'Pan de Azúcar', 'Puerto Aldea', 'Bosque Oriente', 'Palmas San Ramón IV', 'Cruz de Caña'],
};
// Coordenadas APROXIMADAS por sector (para el mapa). Al haber backend se guardan lat/lng exactas por aviso.
const COORDS = {
  'Av. del Mar': [-29.9170, -71.2770], 'El Faro': [-29.9075, -71.2790], 'Las Compañías': [-29.8690, -71.2380],
  'Centro La Serena': [-29.9027, -71.2519], 'Serena Golf': [-29.9430, -71.2790], 'Valle del Sol': [-29.9330, -71.2380],
  'Antofagasta (La Serena)': [-29.9100, -71.2310], 'Guayacán': [-29.9680, -71.3560], 'La Herradura': [-29.9870, -71.3450],
  'Peñuelas': [-29.9930, -71.2900], 'Centro Coquimbo': [-29.9533, -71.3395], 'Pan de Azúcar': [-30.0170, -71.3650],
  'Puerto Aldea': [-30.2600, -71.4700], 'Bosque Oriente': [-29.9715, -71.2466], 'Palmas San Ramón IV': [-29.9805, -71.2433], 'Cruz de Caña': [-30.0239, -71.2094],
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

// ── Sesión (los datos viven en store.js) ──
function cerrarSesion() { limpiarSesion(); window.location.href = 'index.html'; }
function esAdmin() { const s = getSesion(); return !!s && (MIKSA_CONFIG.ADMIN_EMAILS || []).map(x => x.toLowerCase()).includes(String(s.email).toLowerCase()); }

// ── Formato ──
function formatPrecio(a) {
  const n = Number(a.precio);
  if (!isFinite(n) || n <= 0) return 'Consultar';
  const suf = a.op === 'arriendo' ? ' / mes' : a.op === 'temporal' ? ' / día' : '';
  if (Number(a.precioCLP) > 0) return formatCLP(a.precioCLP) + suf;   // avisos publicados en pesos: se muestra el valor exacto (precio en UF es solo referencia)
  return 'UF ' + n.toLocaleString('es-CL') + suf;
}
function formatCLP(n) { const v = Math.round(Number(n) || 0); return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('es-CL'); }
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
  const c = getUFCache();
  if (c && Date.now() - c.t < 12 * 3600 * 1000) return c;
  try {
    const r = await fetch('https://mindicador.cl/api/uf', { cache: 'no-store' });
    const j = await r.json();
    const v = j.serie && j.serie[0] && Number(j.serie[0].valor);
    if (v > 1000) { const o = { valor: v, fecha: j.serie[0].fecha, fuente: 'mindicador.cl', t: Date.now() }; setUFCache(o); return o; }
  } catch (e) { /* sin red: se usa respaldo */ }
  return c || { valor: MIKSA_CONFIG.UF_FALLBACK, fecha: null, fuente: 'referencial', t: 0 };
}

// ── Datos de ejemplo ──
const img = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const dias = n => new Date(Date.now() - n * 86400000).toISOString();
// ── Proyectos nuevos (inmobiliarias). DATOS DE EJEMPLO: reemplaza por proyectos reales. ──
const LABEL_PROY = { blanco: 'En blanco', construccion: 'En construcción', inmediata: 'Entrega inmediata' };
const PROYECTOS = [
  { id: 'PR-1', demo: true, nombre: 'Edificio Vista Faro', inmobiliaria: 'Inmobiliaria de ejemplo', sector: 'El Faro', estado: 'construccion', entrega: '2027-12', avance: 45,
    descripcion: 'Edificio de departamentos a pasos de la costanera de La Serena, con áreas comunes completas, terrazas y estacionamientos subterráneos.',
    amenidades: ['Piscina', 'Gimnasio', 'Quincho', 'Terraza/Balcón', 'Conserje'], beneficios: ['Bono pie del 10% (ejemplo)', 'Cocina equipada incluida'],
    plan: { reservaUF: 20, piePct: 20, cuotasPie: 24 }, fotos: [img('proy1-a', 900, 600), img('proy1-b', 900, 600), img('proy1-c', 900, 600)],
    tipologias: [{ nombre: '1 dorm. + 1 baño', dorm: 1, banos: 1, m2: 38, desde: 2100, disp: 6 }, { nombre: '2 dorm. + 2 baños', dorm: 2, banos: 2, m2: 58, desde: 3050, disp: 9 }, { nombre: '3 dorm. + 2 baños', dorm: 3, banos: 2, m2: 82, desde: 4300, disp: 3 }] },
  { id: 'PR-2', demo: true, nombre: 'Condominio Los Aromos', inmobiliaria: 'Constructora de ejemplo', sector: 'La Herradura', estado: 'blanco', entrega: '2028-06', avance: 5,
    descripcion: 'Condominio de casas en Coquimbo, con áreas verdes, sede social y control de acceso. Preventa con condiciones especiales.',
    amenidades: ['Quincho', 'Estacionamiento', 'Terraza/Balcón', 'Mascotas permitidas'], beneficios: ['Precio de lanzamiento', 'Personalización de terminaciones'],
    plan: { reservaUF: 30, piePct: 15, cuotasPie: 36 }, fotos: [img('proy2-a', 900, 600), img('proy2-b', 900, 600)],
    tipologias: [{ nombre: 'Casa 3 dorm.', dorm: 3, banos: 2, m2: 110, desde: 5200, disp: 12 }, { nombre: 'Casa 4 dorm.', dorm: 4, banos: 3, m2: 148, desde: 6900, disp: 5 }] },
  { id: 'PR-3', demo: true, nombre: 'Torre Centro Coquimbo', inmobiliaria: 'Inmobiliaria de ejemplo', sector: 'Centro Coquimbo', estado: 'inmediata', entrega: '2026-10', avance: 100,
    descripcion: 'Departamentos de entrega inmediata en el centro de Coquimbo, ideales para inversión y arriendo. Subsidio aplicable según programa.',
    amenidades: ['Conserje', 'Bodega', 'Estacionamiento', 'Lavandería'], beneficios: ['Entrega inmediata', 'Acepta subsidio (consultar)'],
    plan: { reservaUF: 10, piePct: 10, cuotasPie: 6 }, fotos: [img('proy3-a', 900, 600)],
    tipologias: [{ nombre: 'Estudio', dorm: 1, banos: 1, m2: 30, desde: 1650, disp: 8 }, { nombre: '2 dorm. + 1 baño', dorm: 2, banos: 1, m2: 50, desde: 2400, disp: 4 }] },
];
function getProyecto(id) { return PROYECTOS.find(p => p.id === id) || null; }

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

// Propiedades reales de la agencia (precio en pesos exacto; «precio» en UF es referencial, calculado con UF_FALLBACK)
const REALES = [
  { id: 'MP-001', tipo: 'casa', op: 'venta', estado: 'disponible', fecha: '2026-09-26T12:00:00.000Z', titulo: 'Casa en Bosque Oriente — Coquimbo',
    descripcion: 'Casa de 3 dormitorios y 1 baño con sala/comedor, cocina, estacionamiento, área de lavado y quincho, en Bosque Oriente (Tierras Blancas, Coquimbo). Oferta: antes $165.000.000.',
    precioCLP: 155000000, precioAnterior: 165000000, comision: 2, precio: Math.round(155000000 / MIKSA_CONFIG.UF_FALLBACK), superficie: null, dormitorios: '3', banos: '1', estacionamientos: '1',
    sector: 'Bosque Oriente', direccion: 'Bosque Oriente, Coquimbo', amenidades: ['Sala / comedor', 'Cocina', 'Estacionamiento', 'Área de lavado', 'Quincho'], subsidio: null,
    contacto: { nombre: 'Miksa', apellido: 'Propiedades', tel: '+56961357871' },
    fotos: ['img/propiedades/bosque-oriente-1.jpg', 'img/propiedades/bosque-oriente-2.jpg', 'img/propiedades/bosque-oriente-3.jpg', 'img/propiedades/bosque-oriente-4.jpg', 'img/propiedades/bosque-oriente-5.jpg'] },
  { id: 'MP-002', tipo: 'casa', op: 'venta', estado: 'disponible', fecha: '2026-09-26T12:00:00.000Z', titulo: 'Casa de 2 pisos ampliada en Palmas de San Ramón IV — Coquimbo',
    descripcion: 'Casa de 2 pisos ampliada en un sector seguro y tranquilo, cercana a colegios, jardines, supermercados, farmacias, comisaría, centros comerciales y servicentro. Cuenta con 4 dormitorios, 1 baño, cocina ampliada, lavandería, 2 estacionamientos, antejardín, patio pequeño y bodega exterior. Se acepta efectivo, leasing y crédito hipotecario.',
    precioCLP: 100000000, comision: 2, precio: Math.round(100000000 / MIKSA_CONFIG.UF_FALLBACK), superficie: null, dormitorios: '4', banos: '1', estacionamientos: '2',
    sector: 'Palmas San Ramón IV', direccion: 'Palmas de San Ramón IV, Coquimbo', amenidades: ['Cocina ampliada', 'Lavandería', 'Antejardín', 'Patio pequeño', 'Bodega exterior', 'Estacionamiento'], subsidio: null,
    contacto: { nombre: 'Miksa', apellido: 'Propiedades', tel: '+56961357871' },
    fotos: ['img/propiedades/palmas-san-ramon-1.jpg'] },
  { id: 'MP-003', tipo: 'terreno', op: 'venta', estado: 'disponible', fecha: '2026-09-26T12:00:00.000Z', titulo: 'Terreno de 2.500 m² en Cruz de Caña — Coquimbo (cesión de derechos)',
    descripcion: 'Terreno de 2.500 m² en venta por cesión de derechos, con contribuciones al día. Cuenta con terraza, radier de 96 m², portón eléctrico, cabaña de 18 m² sin terminar, estanque de agua de 2.500 litros sin conectar, agua y luz, árboles frutales, cierre completo con pandereta bulldogs y fosa instalada.',
    precioCLP: 28000000, cesionDerechos: true, precio: Math.round(28000000 / MIKSA_CONFIG.UF_FALLBACK), superficie: 2500, dormitorios: '', banos: '', estacionamientos: '',
    sector: 'Cruz de Caña', direccion: 'Cruz de Caña, Coquimbo', amenidades: ['Agua y luz', 'Portón eléctrico', 'Terraza', 'Fosa instalada', 'Árboles frutales', 'Cierre perimetral'], subsidio: null,
    contacto: { nombre: 'Miksa', apellido: 'Propiedades', tel: '+56961357871' },
    fotos: ['img/propiedades/cruz-de-cana-1.jpg', 'img/propiedades/cruz-de-cana-2.jpg', 'img/propiedades/cruz-de-cana-3.jpg', 'img/propiedades/cruz-de-cana-4.jpg', 'img/propiedades/cruz-de-cana-5.jpg'] },
];
function getTodos() {
  const propios = getAvisosUsuario().map(a => Object.assign({ estado: 'disponible' }, a, {
    fotos: (a.fotos || []).filter(f => typeof f === 'string' && f.indexOf('data:image/') === 0),
  }));
  return propios.reverse().concat(REALES, SEED.filter(a => !a.demo || demoActivo()));
}
function getPorId(id) { return getTodos().find(a => a.id === id) || null; }
function fotoPrincipal(a) { return (a.fotos && a.fotos[0]) || null; }
function getCorredor(id) { return (MIKSA_CONFIG.CORREDORES || []).find(c => c.id === id) || null; }

// Posición estable por aviso: coordenadas del sector + pequeño desplazamiento determinista
// (isFinite(null) es true: sin este chequeo un aviso con lat/lng null caería en 0,0)
function tienePunto(a) { return a.lat != null && a.lng != null && a.lat !== '' && a.lng !== '' && isFinite(a.lat) && isFinite(a.lng); }
function coordsDe(a) {
  if (tienePunto(a)) return [Number(a.lat), Number(a.lng)];
  const base = COORDS[a.sector]; if (!base) return null;
  let h = 0; const s = String(a.id); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return [base[0] + (((h & 255) / 255) - 0.5) * 0.008, base[1] + ((((h >> 8) & 255) / 255) - 0.5) * 0.008];
}

// ── Favoritos y comparador ──
function isFav(id) { return getFavs().includes(id); }
function toggleFav(id) {
  const f = getFavs(); const i = f.indexOf(id);
  if (i > -1) f.splice(i, 1); else f.push(id);
  setFavs(f); pintarContadorFav(); return i === -1;
}
function toggleComp(id) {
  const c = getComp(); const i = c.indexOf(id);
  if (i > -1) { c.splice(i, 1); setComp(c); return { ok: true, on: false }; }
  if (c.length >= 3) return { ok: false, on: false };
  c.push(id); setComp(c); return { ok: true, on: true };
}

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
  document.querySelectorAll('.toolnav a').forEach(a => { if (a.getAttribute('href') === cur) a.classList.add('current'); });
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

// ── Compartir: URL base del sitio y códigos QR (librería local vendor/qrcode) ──
function urlSitio(ruta) {
  const base = (MIKSA_CONFIG.SITIO_URL || '').replace(/\/+$/, '') || (location.origin + location.pathname.replace(/\/[^\/]*$/, ''));
  return base + '/' + ruta;
}
// Dibuja el QR de `texto` en un <canvas> (sin innerHTML). Devuelve false si la librería no está cargada.
function dibujarQR(canvas, texto, px) {
  if (typeof qrcode !== 'function') return false;
  const qr = qrcode(0, 'M'); qr.addData(texto); qr.make();
  const n = qr.getModuleCount(), cell = Math.max(2, Math.floor((px || 220) / (n + 8))), size = cell * (n + 8);
  canvas.width = size; canvas.height = size;
  const g = canvas.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, size, size); g.fillStyle = '#1F1A16';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect((c + 4) * cell, (r + 4) * cell, cell, cell);
  return true;
}

// Pie ingresado en CLP → % del precio (0-100). Mientras el usuario no lo edite, sigue el % por defecto (data-pct, 20) del precio.
function pieDesdeCLP(id, precioUF, valorUF, hintId) {
  const inp = $id(id), precioCLP = precioUF * valorUF;
  if (!inp.dataset.init) { inp.dataset.init = '1'; inp.addEventListener('input', () => { inp.dataset.touched = '1'; }); }
  if (!inp.dataset.touched) inp.value = Math.round(precioCLP * (Number(inp.dataset.pct) || 20) / 100 / 1000) * 1000;
  const clp = Math.min(Math.max(0, Number(inp.value) || 0), precioCLP);
  const pct = precioCLP > 0 ? clp / precioCLP * 100 : 0;
  if (hintId) $id(hintId).textContent = pct.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + '% del precio';
  return pct;
}
