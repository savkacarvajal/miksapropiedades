(function () {
  const p = getProyecto(new URLSearchParams(window.location.search).get('id') || '');
  if (!p) { $id('pj-nf').hidden = false; $id('pj-crumb').textContent = 'No encontrado'; return; }
  document.title = p.nombre + ' — miksapropiedades';
  $id('pj').hidden = false; $id('pj-crumb').textContent = p.nombre;
  $id('pj-titulo').textContent = p.nombre;
  const d = new Date(p.entrega + '-01T12:00:00');
  $id('pj-sub').textContent = p.sector + ', ' + comunaDe(p.sector) + ' · ' + p.inmobiliaria + ' · Entrega ' + d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  $id('pj-badges').appendChild(el('span', { class: 'chip', text: LABEL_PROY[p.estado] }));
  $id('pj-avance').style.width = p.avance + '%';
  $id('pj-avance-txt').textContent = p.estado === 'inmediata' ? 'Obra terminada' : 'Avance de obra: ' + p.avance + '%';
  $id('pj-desc').textContent = p.descripcion;
  (p.beneficios || []).forEach(b => $id('pj-ben').appendChild(el('span', { class: 'chip', text: b }))); $id('pj-ben-wrap').hidden = !(p.beneficios || []).length;
  (p.amenidades || []).forEach(b => $id('pj-am').appendChild(el('span', { class: 'chip', text: b }))); $id('pj-am-wrap').hidden = !(p.amenidades || []).length;
  $id('pj-mapa').href = 'mapa.html?sector=' + encodeURIComponent(p.sector);
  $id('pj-note').textContent = p.demo ? 'Proyecto de ejemplo para mostrar el sitio. Precios y condiciones referenciales.' : 'Precios, plazos y condiciones sujetos a confirmación de la inmobiliaria.';

  // Galería
  const main = $id('pj-main'), th = $id('pj-thumbs');
  function mostrar(i) { main.textContent = ''; main.appendChild(el('img', { src: p.fotos[i], alt: p.nombre + ' — imagen ' + (i + 1) })); th.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i)); }
  window.verFotoProyecto = i => mostrar(Number(i));
  if (p.fotos.length > 1) p.fotos.forEach((f, i) => th.appendChild(el('button', { type: 'button', 'data-act': 'verFotoProyecto', 'data-args': JSON.stringify([i]), 'aria-label': 'Ver imagen ' + (i + 1) }, [el('img', { src: f, alt: '' })])));
  mostrar(0);

  // Tipologías
  const t = $id('pj-tipos');
  t.appendChild(el('tr', {}, ['Tipología', 'Dorm.', 'Baños', 'm²', 'Desde (UF)', 'Disponibles'].map(h => el('th', { text: h }))));
  p.tipologias.forEach(x => t.appendChild(el('tr', {}, [x.nombre, x.dorm, x.banos, x.m2, x.desde.toLocaleString('es-CL'), x.disp].map(v => el('td', { text: String(v) })))));

  // Plan de pagos
  const sel = $id('pl-tipo');
  p.tipologias.forEach((x, i) => sel.appendChild(el('option', { value: String(i), text: x.nombre + ' — desde UF ' + x.desde.toLocaleString('es-CL') })));
  const f1 = n => n.toLocaleString('es-CL', { maximumFractionDigits: 1 });
  let uf = { valor: MIKSA_CONFIG.UF_FALLBACK };
  function plan() {
    const x = p.tipologias[Number(sel.value)] || p.tipologias[0], pl = p.plan;
    const pie = x.desde * pl.piePct / 100, cuotas = Math.max(1, pl.cuotasPie), cuota = Math.max(0, pie - pl.reservaUF) / cuotas, credito = x.desde - pie, div = dividendo(credito * uf.valor, 4.5, 25);
    const cont = $id('pl-res'); cont.textContent = '';
    [['Precio desde', 'UF ' + f1(x.desde) + ' · ' + formatCLP(x.desde * uf.valor)], ['Reserva', 'UF ' + f1(pl.reservaUF)], ['Pie (' + pl.piePct + '%)', 'UF ' + f1(pie)],
     ['Cuota mensual del pie (' + cuotas + ' cuotas)', 'UF ' + f1(cuota) + ' · ' + formatCLP(cuota * uf.valor)], ['Crédito a la entrega (' + (100 - pl.piePct) + '%)', 'UF ' + f1(credito)],
     ['Dividendo estimado (25 años, 4,5%)', formatCLP(div) + ' / mes']]
      .forEach(([k, v]) => cont.appendChild(el('div', { class: 'plan-row' }, [el('span', { text: k }), el('b', { text: v })])));
    cont.appendChild(el('a', { href: 'simulador.html?precio=' + x.desde + '&pie=' + pl.piePct, text: 'Simular con tus datos →', style: 'display:block;margin-top:10px;color:var(--brand);font-weight:700;font-size:0.85rem' }));
  }
  sel.addEventListener('change', plan); plan();
  getUF().then(u => { uf = u; plan(); });

  // Cotización → lead
  const marca = (idc, bad) => { const f = $id(idc).closest('.fld'); if (f) f.classList.toggle('bad', bad); const e = $id('e-' + idc); if (e) e.classList.toggle('show', bad); return bad; };
  const s = getSesion(); if (s) { $id('ct-nombre').value = s.nombre || ''; $id('ct-email').value = s.email || ''; }
  $id('cot-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if ($id('ct-web').value) return;
    let bad = false;
    bad = marca('ct-nombre', $id('ct-nombre').value.trim().length < 2) || bad;
    bad = marca('ct-email', !validEmail($id('ct-email').value)) || bad;
    bad = marca('ct-tel', !validTel($id('ct-tel').value)) || bad;
    const okc = $id('ct-ok').checked; $id('e-ct-ok').classList.toggle('show', !okc); bad = !okc || bad;
    if (bad) return;
    const x = p.tipologias[Number(sel.value)] || p.tipologias[0];
    const lead = guardarLead({ tipo: 'cotizacion', proyectoId: p.id, propiedadTitulo: p.nombre + ' — ' + x.nombre, tipologia: x.nombre, nombre: $id('ct-nombre').value.trim(), email: $id('ct-email').value.trim(), tel: $id('ct-tel').value.trim(), mensaje: $id('ct-msg').value.trim() });
    if (!lead) { avisoFlotante('No pudimos guardar tu solicitud. Intenta de nuevo.'); return; }
    const done = $id('ct-done'); done.hidden = false; done.textContent = '¡Listo! Recibimos tu solicitud (código ' + lead.id + '). Un corredor te enviará la cotización.';
    $id('cot-form').querySelectorAll('input,textarea,button').forEach(el2 => { el2.disabled = true; });
  });
})();
