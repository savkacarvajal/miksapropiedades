(function () {
  const params = new URLSearchParams(window.location.search);
  const idSel = params.get('id');
  const f = filtrosDesdeURL();
  let lista = filtrarLista(getTodos(), f);
  if (idSel) { const sel = getPorId(idSel); if (sel && !lista.some(a => a.id === sel.id)) lista.unshift(sel); }
  lista = lista.filter(a => coordsDe(a));

  const map = L.map('map', { scrollWheelZoom: true }).setView([-29.94, -71.31], 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' }).addTo(map);

  const markers = {}, items = {};
  const cont = $id('map-list');
  function popup(a) {
    const foto = fotoPrincipal(a);
    return el('div', { style: 'min-width:170px' }, [
      foto ? el('img', { src: foto, alt: '', style: 'width:100%;border-radius:8px;margin-bottom:6px' }) : '',
      el('div', { style: 'font-weight:800;color:#E8631A', text: formatPrecio(a) }),
      el('div', { style: 'font-weight:600;margin:2px 0 6px', text: a.titulo || '' }),
      el('a', { href: 'propiedad.html?id=' + encodeURIComponent(a.id), text: 'Ver ficha →', style: 'color:#E8631A;font-weight:700' }),
    ].filter(Boolean));
  }
  lista.forEach(a => {
    const c = coordsDe(a);
    const m = L.marker(c).addTo(map).bindPopup(popup(a));
    markers[a.id] = m;
    const foto = fotoPrincipal(a);
    const it = el('button', { type: 'button', class: 'map-item', 'data-act': 'mapFoco', 'data-args': JSON.stringify([a.id]) }, [
      foto ? el('img', { src: foto, alt: '' }) : el('img', { alt: '' }),
      el('div', {}, [el('span', { class: 'pr', text: formatPrecio(a) }), el('b', { text: a.titulo || '' }), el('span', { text: a.sector || '' })]),
    ]);
    items[a.id] = it; cont.appendChild(it);
  });
  if (!lista.length) cont.appendChild(el('div', { class: 'empty', style: 'padding:24px' }, [el('h2', { text: 'Sin resultados' }), el('p', { text: 'No hay propiedades con esos filtros.' })]));

  window.mapFoco = function (id) {
    const m = markers[id]; if (!m) return;
    map.flyTo(m.getLatLng(), 15, { duration: 0.6 }); m.openPopup();
    Object.keys(items).forEach(k => items[k].classList.toggle('on', k === id));
    if (items[id]) items[id].scrollIntoView({ block: 'nearest' });
  };

  if (idSel && markers[idSel]) setTimeout(() => window.mapFoco(idSel), 200);
  else if (lista.length > 1) map.fitBounds(L.latLngBounds(lista.map(a => coordsDe(a))), { padding: [40, 40] });
  else if (lista.length === 1) map.setView(coordsDe(lista[0]), 14);
  setTimeout(() => map.invalidateSize(), 300);
})();
