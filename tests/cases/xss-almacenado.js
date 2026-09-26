// Un aviso con contenido malicioso guardado en localStorage no debe inyectar HTML en listado, ficha, mapa ni comparador.
__run(async T => {
  const evil = { id: 'X-1', tipo: 'casa', op: 'venta', estado: 'disponible', titulo: '<img src=x id=pwn1>Casa', descripcion: '<script>window.__x=1</script><b id=pwn2>hola</b>',
    precio: '100', sector: 'Guayacán', direccion: '"><img src=x id=pwn3>', fecha: new Date().toISOString(), owner: 'a@b.cl',
    fotos: ['javascript:alert(1)', 'data:image/png;base64,AAAA'], videoUrl: 'javascript:alert(1)', amenidades: ['<i id=pwn4>x</i>'],
    contacto: { nombre: '<u id=pwn5>N</u>', email: 'x@y.cl"><img id=pwn6>', tel: '9"onmouseover="alert(1)', medio: 'Cualquiera' } };
  localStorage.setItem('miksa_avisos', JSON.stringify([evil]));
  const seguro = () => ['pwn1', 'pwn2', 'pwn3', 'pwn4', 'pwn5', 'pwn6'].every(i => !document.getElementById(i)) && window.__x === undefined;

  // ficha
  const f = document.createElement('iframe'); f.src = 'propiedad.html?id=X-1'; document.body.appendChild(f);
  await new Promise(r => { f.onload = r; }); await T.sleep(800);
  const d = f.contentDocument, w = f.contentWindow;
  T.ok('ficha renderiza el aviso', !d.getElementById('detail').hidden);
  T.ok('ficha: sin nodos inyectados', ['pwn1', 'pwn2', 'pwn3', 'pwn4', 'pwn5', 'pwn6'].every(i => !d.getElementById(i)) && w.__x === undefined);
  T.ok('ficha: título como texto', d.getElementById('d-titulo').textContent === '<img src=x id=pwn1>Casa');
  T.ok('ficha: foto javascript: descartada', ![...d.querySelectorAll('#g-main img')].some(i => i.src.indexOf('javascript:') === 0));
  T.ok('ficha: video javascript: no se enlaza', !d.querySelector('#d-links a[href^="javascript"]') && ![...d.querySelectorAll('a')].some(a => (a.getAttribute('href') || '').toLowerCase().startsWith('javascript')));
  T.ok('ficha: correo inválido no genera mailto', !d.querySelector('a[href^="mailto:"]'));
  T.ok('ficha: teléfono inválido no genera WhatsApp', !d.querySelector('a[href*="wa.me"]') || !/onmouseover/.test(d.querySelector('a[href*="wa.me"]').outerHTML));
  T.ok('ficha: sin atributos de evento inyectados', !d.querySelector('[onmouseover]'));
  T.ok('JSON-LD seguro (sin cierre de script)', !/<\/script/i.test((d.querySelector('script[type="application/ld+json"]') || { textContent: '' }).textContent));
  f.remove();

  // listado (el propio documento cargó propiedad.html; comprobamos con las funciones de tarjeta)
  const tarjeta = crearTarjeta(getPorId('X-1'), {});
  document.body.appendChild(tarjeta);
  T.ok('tarjeta: sin nodos inyectados', seguro());
  T.eq('tarjeta: título literal', tarjeta.querySelector('h3').textContent, '<img src=x id=pwn1>Casa');
  T.ok('tarjeta: foto javascript: descartada', getPorId('X-1').fotos.every(f => f.indexOf('data:image/') === 0));
});
