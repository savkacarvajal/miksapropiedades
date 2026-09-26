// Tarjeta de propiedad reutilizable (construida con DOM, sin innerHTML).
const HEART_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 000-7.8z"/></svg>';

function crearTarjeta(a, opciones) {
  opciones = opciones || {};
  const foto = fotoPrincipal(a);
  const ph = el('div', { class: 'ph' });
  if (foto) ph.appendChild(el('img', { src: foto, alt: a.titulo || 'Propiedad', loading: 'lazy' }));
  else ph.appendChild(el('div', { class: 'noimg', text: 'Sin foto' }));
  ph.appendChild(el('span', { class: 'tag', text: LABEL_OP[a.op] || 'Propiedad' }));
  if (a.estado && a.estado !== 'disponible') ph.appendChild(el('span', { class: 'ribbon ' + a.estado, text: LABEL_ESTADO[a.estado] || a.estado }));
  else if (!a.demo && opciones.marcaPropio) ph.appendChild(el('span', { class: 'tag mine', text: 'Tu aviso' }));

  const specs = el('div', { class: 'specs' });
  if (a.dormitorios) specs.appendChild(el('span', { text: a.dormitorios + ' dorm.' }));
  if (a.banos) specs.appendChild(el('span', { text: a.banos + ' baño' + (a.banos === '1' ? '' : 's') }));
  if (a.superficie) specs.appendChild(el('span', { text: a.superficie + ' m²' }));
  if (!specs.children.length) specs.appendChild(el('span', { text: LABEL_TIPO[a.tipo] || '' }));

  const body = el('div', { class: 'pb' }, [
    el('div', { class: 'price', text: formatPrecio(a) }),
    el('h' + (opciones.nivel || 3), { text: a.titulo || 'Sin título' }),
    el('div', { class: 'loc', text: [a.sector, comunaDe(a.sector)].filter(Boolean).join(', ') }),
    specs,
  ]);
  const link = el('a', { class: 'pcard' + (a.estado && a.estado !== 'disponible' ? ' off' : ''), href: 'propiedad.html?id=' + encodeURIComponent(a.id) }, [ph, body]);

  const fav = el('button', { type: 'button', class: 'fav-btn' + (isFav(a.id) ? ' on' : ''), 'data-act': 'favBtn', 'data-args': JSON.stringify([a.id, '@this']), 'aria-label': 'Guardar en favoritos', 'aria-pressed': String(isFav(a.id)) });
  fav.innerHTML = HEART_SVG;   // SVG estático (sin datos del usuario)
  const cmp = el('label', { class: 'cmp-btn' }, [
    el('input', { type: 'checkbox', 'data-act': 'compBtn', 'data-args': JSON.stringify([a.id, '@this']), checked: getComp().includes(a.id) ? 'checked' : null }),
    'Comparar',
  ]);
  return el('div', { class: 'pcard-w' }, [link, fav, cmp]);
}

function favBtn(id, btn) {
  const on = toggleFav(id);
  btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', String(on));
  if (document.body.dataset.favs === '1' && !on) { const w = btn.closest('.pcard-w'); if (w) w.remove(); document.dispatchEvent(new Event('favs-changed')); }
}
function compBtn(id, input) {
  const r = toggleComp(id);
  if (!r.ok) { input.checked = false; avisoFlotante('Puedes comparar hasta 3 propiedades.'); }
  pintarBarraComparar();
}

function avisoFlotante(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = el('div', { id: 'toast', role: 'status' }); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(avisoFlotante._t); avisoFlotante._t = setTimeout(() => t.classList.remove('show'), 2600);
}

function pintarBarraComparar() {
  let bar = document.getElementById('cmp-bar');
  const ids = getComp();
  if (!ids.length) { if (bar) bar.remove(); return; }
  if (!bar) { bar = el('div', { id: 'cmp-bar' }); document.body.appendChild(bar); }
  bar.textContent = '';
  bar.appendChild(el('span', { text: ids.length + (ids.length === 1 ? ' propiedad seleccionada' : ' propiedades seleccionadas') + ' para comparar' }));
  bar.appendChild(el('span', { class: 'cmp-actions' }, [
    el('button', { type: 'button', class: 'btn btn-ghost', 'data-act': 'limpiarComparacion', text: 'Limpiar' }),
    el('a', { class: 'btn btn-brand', href: 'comparar.html', text: 'Comparar' }),
  ]));
}
function limpiarComparacion() {
  setComp([]);
  document.querySelectorAll('.cmp-btn input').forEach(i => { i.checked = false; });
  pintarBarraComparar();
}
pintarBarraComparar();
