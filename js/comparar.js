(function () {
  const q = new URLSearchParams(window.location.search).get('ids');
  const ids = (q ? q.split(',') : getComp()).slice(0, 3);
  const props = ids.map(getPorId).filter(Boolean);
  const table = $id('cmp-table');
  if (!props.length) { $id('cmp-empty').hidden = false; table.parentNode.hidden = true; return; }

  const perM2 = a => (Number(a.precio) > 0 && Number(a.superficie) > 0) ? Number(a.precio) / Number(a.superficie) : null;
  // [etiqueta, obtener valor numérico o null, formato, mejor = 'min' | 'max' | null]
  const filas = [
    ['Operación', a => LABEL_OP[a.op] || '', null, null],
    ['Tipo', a => LABEL_TIPO[a.tipo] || '', null, null],
    ['Estado', a => LABEL_ESTADO[a.estado || 'disponible'] || '', null, null],
    ['Sector', a => [a.sector, comunaDe(a.sector)].filter(Boolean).join(', '), null, null],
    ['Precio', a => Number(a.precio) || null, (v, a) => formatPrecio(a), 'min'],
    ['Superficie', a => Number(a.superficie) || null, v => v + ' m²', 'max'],
    ['UF por m²', perM2, v => v.toLocaleString('es-CL', { maximumFractionDigits: 1 }), 'min'],
    ['Dormitorios', a => parseInt(a.dormitorios, 10) || null, v => String(v), 'max'],
    ['Baños', a => parseInt(a.banos, 10) || null, v => String(v), 'max'],
    ['Estacionamientos', a => (a.estacionamientos === '' || a.estacionamientos === undefined) ? null : parseInt(a.estacionamientos, 10), v => String(v), 'max'],
    ['Gastos comunes', a => Number(a.gastosComunes) || null, v => formatCLP(v) + ' / mes', 'min'],
    ['Contribuciones', a => Number(a.contribuciones) || null, v => formatCLP(v) + ' / trim.', 'min'],
    ['Año de construcción', a => Number(a.anio) || null, v => String(v), 'max'],
    ['Orientación', a => a.orientacion || '', null, null],
    ['Acepta subsidio', a => (a.op === 'venta' && typeof a.subsidio === 'boolean') ? (a.subsidio ? 'Sí' : 'No') : '', null, null],
  ];
  // Encabezado
  const head = el('tr', {}, [el('th', { text: '' })]);
  props.forEach(a => {
    const foto = fotoPrincipal(a);
    head.appendChild(el('th', { style: 'text-transform:none;letter-spacing:0;white-space:normal;min-width:190px' }, [
      foto ? el('img', { src: foto, alt: '' }) : '',
      el('a', { href: 'propiedad.html?id=' + encodeURIComponent(a.id), text: a.titulo || 'Sin título', style: 'display:block;margin-top:8px;color:var(--ink);font-size:0.95rem' }),
      el('button', { type: 'button', class: 'btn btn-ghost', style: 'padding:6px 10px;font-size:0.72rem;margin-top:8px', 'data-act': 'quitarComp', 'data-args': JSON.stringify([a.id]), text: 'Quitar' }),
    ].filter(Boolean)));
  });
  table.appendChild(head);
  filas.forEach(([label, get, fmt, best]) => {
    const vals = props.map(get);
    if (vals.every(v => v === null || v === '')) return;
    const nums = vals.filter(v => typeof v === 'number');
    let mejor = null;
    if (best && nums.length > 1 && new Set(nums).size > 1) mejor = best === 'min' ? Math.min.apply(null, nums) : Math.max.apply(null, nums);
    const tr = el('tr', {}, [el('th', { text: label })]);
    props.forEach((a, i) => {
      const v = vals[i];
      const txt = (v === null || v === '') ? '—' : (fmt ? fmt(v, a) : v);
      tr.appendChild(el('td', { class: mejor !== null && v === mejor ? 'best' : '', text: txt }));
    });
    table.appendChild(tr);
  });
  window.quitarComp = function (id) {
    lsSet('miksa_compare', getComp().filter(x => x !== id));
    window.location.href = 'comparar.html';
  };
})();
