(function () {
  const id = new URLSearchParams(window.location.search).get('id') || '';
  const a = getPorId(id);
  if (!a) { $id('notfound').hidden = false; $id('crumb').textContent = 'No encontrada'; return; }

  const disponible = !a.estado || a.estado === 'disponible';
  const corredor = getCorredor(a.corredor);
  const c = a.contacto || {};
  document.title = (a.titulo || 'Propiedad') + ' — miksapropiedades';
  $id('detail').hidden = false;
  $id('crumb').textContent = a.titulo || 'Propiedad';
  $id('d-titulo').textContent = a.titulo || 'Sin título';
  const dir = a.direccion || a.sector || '', com = comunaDe(a.sector);
  $id('d-loc').textContent = (com && dir.indexOf(com) === -1 ? (dir ? dir + ' · ' : '') + com : dir) + (a.fecha ? ' · Publicado ' + hace(a.fecha) : '');
  $id('d-precio').textContent = formatPrecio(a);
  $id('d-code').textContent = 'Código ' + a.id;
  $id('print-code').textContent = a.id;
  $id('d-desc').textContent = a.descripcion || 'El publicador no agregó una descripción.';

  const badges = $id('d-badges');
  [LABEL_OP[a.op], LABEL_TIPO[a.tipo]].filter(Boolean).forEach(t => badges.appendChild(el('span', { class: 'chip', text: t })));
  if (!disponible) badges.appendChild(el('span', { class: 'chip', style: 'background:#B45309;color:#fff', text: LABEL_ESTADO[a.estado] || a.estado }));

  // Vistas (una por sesión de navegador)
  try { if (!sessionStorage.getItem('v_' + a.id)) { sessionStorage.setItem('v_' + a.id, '1'); if (!a.demo) sumarStat(a.id, 'vistas'); } } catch (e) {}

  // Galería
  const fotos = a.fotos || [], main = $id('g-main'), thumbs = $id('g-thumbs');
  function mostrar(i) {
    main.textContent = '';
    main.appendChild(el('img', { src: fotos[i], alt: (a.titulo || 'Propiedad') + ' — foto ' + (i + 1) }));
    thumbs.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i));
  }
  window.verFoto = function (i) { mostrar(Number(i)); };
  if (fotos.length) {
    if (fotos.length > 1) fotos.forEach((f, i) => thumbs.appendChild(el('button', { type: 'button', 'data-act': 'verFoto', 'data-args': JSON.stringify([i]), 'aria-label': 'Ver foto ' + (i + 1) }, [el('img', { src: f, alt: '' })])));
    mostrar(0);
  } else main.appendChild(el('div', { style: 'height:100%;display:flex;align-items:center;justify-content:center;color:rgba(232,99,26,.5);font-weight:700', text: 'Sin fotos' }));

  // Datos principales
  const facts = [
    a.superficie && [a.superficie + ' m²', 'Superficie'], a.dormitorios && [a.dormitorios, 'Dormitorios'],
    a.banos && [a.banos, 'Baños'], (a.estacionamientos !== '' && a.estacionamientos !== undefined) && [a.estacionamientos, 'Estac.'],
  ].filter(Boolean);
  facts.forEach(([v, k]) => $id('d-facts').appendChild(el('div', { class: 'fact' }, [el('b', { text: v }), el('span', { text: k })])));
  if (!facts.length) $id('d-facts').hidden = true;

  // Datos adicionales / legales
  const extra = [
    a.gastosComunes && ['Gastos comunes', formatCLP(a.gastosComunes) + ' / mes'],
    a.contribuciones && ['Contribuciones', formatCLP(a.contribuciones) + ' / trimestre'],
    a.anio && ['Año de construcción', String(a.anio)],
    a.orientacion && ['Orientación', a.orientacion],
    (a.op === 'venta' && typeof a.subsidio === 'boolean') && ['Acepta subsidio', a.subsidio ? 'Sí' : 'No'],
  ].filter(Boolean);
  extra.forEach(([k, v]) => $id('d-extra').appendChild(el('div', {}, [el('dt', { text: k }), el('dd', { text: v })])));
  if (!extra.length) $id('d-extra-wrap').hidden = true;
  const amen = a.amenidades || [];
  amen.forEach(x => $id('d-amen').appendChild(el('span', { class: 'chip', text: x })));
  if (!amen.length) $id('d-amen-wrap').hidden = true;

  // Enlaces: mapa, video/tour
  const links = $id('d-links');
  if (a.op === 'venta') links.appendChild(el('a', { class: 'btn btn-ghost', href: 'rentabilidad.html?precio=' + encodeURIComponent(a.precio) + (a.contribuciones ? '&contrib=' + Math.round(a.contribuciones) : '') + (a.gastosComunes ? '&gc=0' : ''), text: 'Analizar como inversión' }));
  if (coordsDe(a)) links.appendChild(el('a', { class: 'btn btn-ghost', href: 'mapa.html?id=' + encodeURIComponent(a.id), text: 'Ver en el mapa' }));
  const vid = videoSeguro(a.videoUrl);
  if (vid) links.appendChild(el('a', { class: 'btn btn-ghost', href: vid, target: '_blank', rel: 'noopener noreferrer', text: 'Ver video / tour virtual' }));
  if (!links.children.length) links.hidden = true;

  // Compartir: WhatsApp, enlace, QR y letrero
  const urlFicha = urlSitio('propiedad.html?id=' + encodeURIComponent(a.id));
  dibujarQR($id('qr'), urlFicha, 240);
  $id('sh-wa').href = 'https://wa.me/?text=' + encodeURIComponent((a.titulo || 'Propiedad') + ' — ' + formatPrecio(a) + '\n' + urlFicha);
  $id('sh-letrero').href = 'letrero.html?id=' + encodeURIComponent(a.id);
  window.copiarEnlace = function () {
    const ok = () => avisoFlotante('Enlace copiado');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(urlFicha).then(ok, () => avisoFlotante(urlFicha));
    else avisoFlotante(urlFicha);
  };
  window.descargarQR = function () {
    $id('qr').toBlob(b => { const u = URL.createObjectURL(b); const l = el('a', { href: u, download: 'qr-' + a.id + '.png' }); document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); });
  };

  // Precio en pesos + dividendo estimado (UF del día)
  getUF().then(uf => {
    const n = Number(a.precio);
    if (!(n > 0)) return;
    $id('d-clp').textContent = '≈ ' + formatCLP(n * uf.valor) + ' CLP · UF ' + formatCLP(uf.valor).slice(1) + (uf.fuente === 'referencial' ? ' (referencial)' : '');
    if (a.op === 'venta') {
      const monto = n * uf.valor * 0.8, div = dividendo(monto, 4.5, 25);
      const box = $id('d-hipo'); box.hidden = false; box.textContent = '';
      box.appendChild(el('b', { text: 'Dividendo estimado: ' + formatCLP(div) + ' / mes' }));
      box.appendChild(document.createElement('br'));
      box.appendChild(document.createTextNode('Pie 20%, 25 años, tasa 4,5% anual. Referencial, no es una oferta de crédito. '));
      box.appendChild(el('a', { href: 'simulador.html?precio=' + encodeURIComponent(a.precio), text: 'Simular con tus datos', style: 'color:var(--brand);font-weight:700' }));
    }
  });

  // Contacto directo
  const nombreCont = [c.nombre, c.apellido].filter(Boolean).join(' ');
  const msg = 'Hola' + (c.nombre ? ' ' + c.nombre : '') + ', me interesa la propiedad "' + (a.titulo || '') + '" (código ' + a.id + ') que vi en miksapropiedades.';
  const tel = c.tel || (corredor && corredor.tel) || MIKSA_CONFIG.AGENCIA.whatsapp;
  const mail = c.email || (corredor && corredor.email) || MIKSA_CONFIG.AGENCIA.email;
  const box = $id('d-contact');
  const wa = waLink(tel, msg);
  const cuenta = () => { if (!a.demo) sumarStat(a.id, 'contactos'); };
  if (wa && c.medio !== 'Solo correo') { const b = el('a', { class: 'btn btn-wa btn-block', href: wa, target: '_blank', rel: 'noopener noreferrer', text: 'Contactar por WhatsApp' }); b.addEventListener('click', cuenta); box.appendChild(b); }
  if (validEmail(mail) && c.medio !== 'Solo teléfono') { const b = el('a', { class: 'btn btn-ghost btn-block', href: 'mailto:' + mail.trim() + '?subject=' + encodeURIComponent('Consulta por ' + (a.titulo || a.id)) + '&body=' + encodeURIComponent(msg), text: 'Enviar correo' }); b.addEventListener('click', cuenta); box.appendChild(b); }
  if (c.tel && c.medio === 'Solo teléfono') box.appendChild(el('a', { class: 'btn btn-brand btn-block', href: 'tel:' + String(c.tel).replace(/[^\d+]/g, ''), text: 'Llamar' }));
  if (!box.children.length) box.hidden = true;

  // Corredor asignado
  if (corredor) {
    const card = $id('corredor-card'); card.hidden = false;
    card.appendChild(el('div', { class: 'corr' }, [
      el('div', { class: 'av', text: corredor.nombre.charAt(0).toUpperCase() }),
      el('div', {}, [el('b', { text: corredor.nombre }), el('span', { text: corredor.cargo + (corredor.registro ? ' · N° ' + corredor.registro : '') })]),
    ]));
    card.appendChild(el('a', { href: 'corredores.html', style: 'display:block;margin-top:10px;font-size:0.8rem;color:var(--brand);font-weight:600', text: 'Ver todos los corredores' }));
  }

  // Favorito / comparar / PDF
  const bf = $id('b-fav'), bc = $id('b-cmp');
  const pintar = () => { bf.classList.toggle('on', isFav(a.id)); bc.classList.toggle('on', getComp().includes(a.id)); bc.textContent = getComp().includes(a.id) ? '✓ Comparando' : 'Comparar'; };
  window.favFicha = () => { toggleFav(a.id); pintar(); };
  window.compFicha = () => { const r = toggleComp(a.id); if (!r.ok) avisoFlotante('Puedes comparar hasta 3 propiedades.'); pintar(); pintarBarraComparar(); };
  window.imprimirFicha = () => window.print();
  pintar();

  // Formulario de visita / consulta
  const form = $id('lead-form');
  if (!disponible) {
    $id('lf-title').textContent = 'Esta propiedad está ' + (LABEL_ESTADO[a.estado] || '').toLowerCase();
    $id('lf-sub').textContent = 'Déjanos tus datos y te avisamos si vuelve a estar disponible o te mostramos alternativas similares.';
    $id('lf-visita').hidden = true; $id('lf-btn').textContent = 'Avisarme';
  }
  const hoy = new Date(); hoy.setDate(hoy.getDate() + 1);
  $id('lf-fecha').min = hoy.toISOString().slice(0, 10);
  const s = getSesion(); if (s) { $id('lf-nombre').value = s.nombre || ''; $id('lf-email').value = s.email || ''; }
  const marca = (idc, bad) => { const f = $id(idc).closest('.fld'); if (f) f.classList.toggle('bad', bad); const e = $id('e-' + idc); if (e) e.classList.toggle('show', bad); return bad; };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if ($id('lf-web').value) return;    // honeypot anti-bots
    let bad = false;
    bad = marca('lf-nombre', $id('lf-nombre').value.trim().length < 2) || bad;
    bad = marca('lf-email', !validEmail($id('lf-email').value)) || bad;
    bad = marca('lf-tel', !validTel($id('lf-tel').value)) || bad;
    if (disponible) bad = marca('lf-fecha', !$id('lf-fecha').value || $id('lf-fecha').value < $id('lf-fecha').min) || bad;
    const okc = $id('lf-ok').checked; $id('e-lf-ok').classList.toggle('show', !okc); bad = !okc || bad;
    if (bad) return;
    const lead = guardarLead({
      tipo: disponible ? 'visita' : 'contacto', propiedadId: a.id, propiedadTitulo: a.titulo || '', corredor: a.corredor || '',
      nombre: $id('lf-nombre').value.trim(), email: $id('lf-email').value.trim(), tel: $id('lf-tel').value.trim(),
      fecha: disponible ? $id('lf-fecha').value : '', hora: disponible ? $id('lf-hora').value : '', mensaje: $id('lf-msg').value.trim(),
    });
    if (!lead) { avisoFlotante('No pudimos guardar tu solicitud. Intenta de nuevo.'); return; }
    if (!a.demo) sumarStat(a.id, 'contactos');
    const done = $id('lf-done'); done.hidden = false;
    done.textContent = '¡Listo! Recibimos tu solicitud (código ' + lead.id + '). Un corredor te contactará pronto.';
    form.querySelectorAll('input,select,textarea,button').forEach(x => { x.disabled = true; });
  });

  $id('d-note').textContent = a.demo
    ? 'Esta es una propiedad de ejemplo para mostrar el sitio.'
    : (nombreCont ? 'Publicado por ' + nombreCont + '. ' : '') + 'Coordina siempre la visita en persona y no envíes dinero por adelantado: no pagues reservas ni "garantías" sin ver la propiedad y firmar un contrato.';

  // Similares
  const sim = getTodos().filter(x => x.id !== a.id && (!x.estado || x.estado === 'disponible') && (x.tipo === a.tipo || x.sector === a.sector)).slice(0, 3);
  if (sim.length) { $id('similar-wrap').hidden = false; sim.forEach(x => $id('similares').appendChild(crearTarjeta(x))); }

  // Datos estructurados (schema.org) para buscadores
  try {
    const ld = { '@context': 'https://schema.org', '@type': 'RealEstateListing', name: a.titulo, description: a.descripcion, url: location.href, datePosted: a.fecha,
      offers: { '@type': 'Offer', price: Number(a.precio) || undefined, priceCurrency: 'CLF', availability: disponible ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut' },
      about: { '@type': 'Residence', address: { '@type': 'PostalAddress', addressLocality: com || undefined, streetAddress: a.direccion, addressCountry: 'CL' }, floorSize: a.superficie ? { '@type': 'QuantitativeValue', value: Number(a.superficie), unitCode: 'MTK' } : undefined } };
    const sc = document.createElement('script'); sc.type = 'application/ld+json';
    sc.textContent = JSON.stringify(ld).replace(/</g, '\\u003c'); document.head.appendChild(sc);
  } catch (e) { /* opcional */ }
})();
