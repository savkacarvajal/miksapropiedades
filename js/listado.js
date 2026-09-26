const CAMPOS = { q: 'f-q', op: 'f-op', tipo: 'f-tipo', sector: 'f-sector', dorm: 'f-dorm', pmax: 'f-pmax', estado: 'f-estado', orden: 'f-orden' };
const DEFAULTS = { orden: 'recientes', estado: 'disp' };

function leerFiltros() {
  const f = {};
  for (const k in CAMPOS) f[k] = document.getElementById(CAMPOS[k]).value.trim();
  return f;
}
function aplicarParamsURL() {
  const p = new URLSearchParams(window.location.search);
  for (const k in CAMPOS) {
    const campo = document.getElementById(CAMPOS[k]);
    const v = p.get(k);
    if (v === null) continue;
    campo.value = v;
    if (campo.tagName === 'SELECT' && campo.value !== v) campo.value = '';   // valor no válido en el select
  }
}
function escribirURL(f) {
  const p = new URLSearchParams();
  for (const k in f) if (f[k] && f[k] !== DEFAULTS[k]) p.set(k, f[k]);
  const qs = p.toString();
  history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
  document.getElementById('ver-mapa').href = 'mapa.html' + (qs ? '?' + qs : '');
}
function render() {
  const f = leerFiltros();
  escribirURL(f);
  let lista = filtrarLista(getTodos(), f);
  if (f.orden === 'precio-asc') lista.sort((a, b) => Number(a.precio) - Number(b.precio));
  if (f.orden === 'precio-desc') lista.sort((a, b) => Number(b.precio) - Number(a.precio));
  const cont = document.getElementById('resultados');
  cont.textContent = '';
  document.getElementById('count').textContent = lista.length + (lista.length === 1 ? ' propiedad encontrada' : ' propiedades encontradas');
  if (!lista.length) {
    cont.style.display = 'block';
    cont.appendChild(el('div', { class: 'empty' }, [
      el('h2', { text: 'No hay resultados' }),
      el('p', { text: 'Prueba con menos filtros o un precio máximo mayor.' }),
    ]));
    return;
  }
  cont.style.display = '';
  const s = getSesion();
  lista.forEach(a => cont.appendChild(crearTarjeta(a, { marcaPropio: !!s && a.owner === s.email })));
}

function guardarBusqueda() {
  const f = leerFiltros();
  const activos = Object.keys(f).filter(k => f[k] && f[k] !== DEFAULTS[k]);
  if (!activos.length) { avisoFlotante('Aplica al menos un filtro para guardar la búsqueda.'); return; }
  const partes = [];
  if (f.op) partes.push(LABEL_OP[f.op]); if (f.tipo) partes.push(LABEL_TIPO[f.tipo]); if (f.sector) partes.push(f.sector);
  if (f.dorm) partes.push(f.dorm + '+ dorm.'); if (f.pmax) partes.push('hasta UF ' + Number(f.pmax).toLocaleString('es-CL')); if (f.q) partes.push('"' + f.q + '"');
  const b = getBusquedas();
  const qs = window.location.search;
  if (b.some(x => x.qs === qs)) { avisoFlotante('Esa búsqueda ya está guardada.'); return; }
  b.push({ id: 'B-' + Date.now(), nombre: partes.join(' · ') || 'Búsqueda', qs: qs, visto: getTodos().map(a => a.id), creada: new Date().toISOString() });
  lsSet('miksa_busquedas', b);
  avisoFlotante('Búsqueda guardada. La encuentras en "Mis avisos".');
}

function limpiarFiltros() {
  for (const k in CAMPOS) document.getElementById(CAMPOS[k]).value = DEFAULTS[k] || '';
  render();
}

document.getElementById('filtros').addEventListener('submit', function (e) { e.preventDefault(); render(); });
['f-op', 'f-tipo', 'f-sector', 'f-dorm', 'f-estado', 'f-orden'].forEach(id => document.getElementById(id).addEventListener('change', render));
aplicarParamsURL();
render();
