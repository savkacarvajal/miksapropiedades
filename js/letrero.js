(function () {
  const id = new URLSearchParams(window.location.search).get('id') || '';
  const a = getPorId(id);
  window.imprimirLetrero = () => window.print();
  if (!a) { $id('lt-nf').hidden = false; return; }
  document.title = 'Letrero — ' + (a.titulo || a.id);
  $id('lt-volver').href = 'propiedad.html?id=' + encodeURIComponent(a.id);
  $id('poster').hidden = false;
  $id('lt-op').textContent = LABEL_OP[a.op] || 'Propiedad';
  const foto = fotoPrincipal(a); if (foto) $id('lt-foto').appendChild(el('img', { src: foto, alt: '' }));
  $id('lt-titulo').textContent = a.titulo || '';
  $id('lt-precio').textContent = formatPrecio(a);
  [a.superficie && a.superficie + ' m²', a.dormitorios && a.dormitorios + ' dorm.', a.banos && a.banos + ' baños', a.sector].filter(Boolean).forEach(t => $id('lt-facts').appendChild(el('span', { text: t })));
  const url = urlSitio('propiedad.html?id=' + encodeURIComponent(a.id));
  dibujarQR($id('lt-qr'), url, 380);
  $id('lt-url').textContent = url;
  const c = a.contacto || {}, ag = MIKSA_CONFIG.AGENCIA;
  const tel = c.tel || ag.telefono || ag.whatsapp, mail = c.email || ag.email;
  $id('lt-contacto').textContent = [tel && 'Tel: ' + tel, mail].filter(Boolean).join(' · ');
  $id('lt-code').textContent = 'Código ' + a.id;
})();
