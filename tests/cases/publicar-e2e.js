// Publicar de punta a punta: foto real reducida, drag & drop, pasos con Enter/submit, XSS en el resumen y guardado.
__run(async T => {
  const s = window.setTimeout; window.setTimeout = (f, ms) => (ms > 1000 ? 0 : s(f, ms));
  const v = (id, x) => { document.getElementById(id).value = x; };
  v('titulo', 'Casa <b>linda</b> en Guayacán'); v('descripcion', 'Descripción de prueba'); v('precio', '4500'); v('superficie', '120');
  v('dormitorios', '3'); v('banos', '2'); v('estacionamientos', '1'); v('sector', 'Guayacán'); v('direccion', 'Calle 1');
  v('c-nombre', 'Ana'); v('c-apellido', 'Lopez'); v('c-email', 'ana@test.cl'); v('c-tel', '912345678');

  // foto real 2000×1000 → se reduce a JPEG ≤ 900 px
  const cv = document.createElement('canvas'); cv.width = 2000; cv.height = 1000;
  const g = cv.getContext('2d'); g.fillStyle = '#E8631A'; g.fillRect(0, 0, 2000, 1000);
  const blob = await new Promise(f => cv.toBlob(f, 'image/png'));
  const file = new File([blob], 'foto.png', { type: 'image/png' });

  // drag & drop sobre la zona de carga (regresión: antes eran atributos inline bloqueados por la CSP)
  const zone = document.getElementById('upload-zone');
  zone.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true }));
  T.ok('dragover marca la zona', zone.classList.contains('drag'));
  const dt = new DataTransfer(); dt.items.add(file);
  zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  T.ok('drop agrega la foto', await T.waitFor(() => state.fotos.length === 1));
  T.ok('drop limpia el estado visual', !zone.classList.contains('drag'));
  const img = new Image(); img.src = state.fotos[0].src; await new Promise(r => { img.onload = r; });
  T.ok('foto reducida a JPEG de ≤ 900 px', state.fotos[0].src.indexOf('data:image/jpeg') === 0 && Math.max(img.width, img.height) <= 900);

  // archivos no permitidos
  handleFiles([new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' })]); await T.sleep(150);
  T.ok('rechaza SVG', state.fotos.length === 1);

  const f = document.getElementById('pub-form'), pasos = [currentStep];
  for (let i = 0; i < 4; i++) { T.submit(f); await T.sleep(60); pasos.push(currentStep); }
  T.eq('avanza 1→4 y publica', pasos.join(','), '1,2,3,4,4');
  T.ok('muestra la pantalla de éxito', document.getElementById('success-screen').classList.contains('show'));
  T.ok('el resumen no ejecuta HTML del título', !document.querySelector('#resumen-content b'));
  const av = JSON.parse(localStorage.getItem('miksa_avisos') || '[]');
  T.ok('aviso guardado con foto', av.length === 1 && av[0].fotos.length === 1 && av[0].estado === 'disponible');
  const lnk = document.querySelector('#success-screen a[href^="propiedad.html"]');
  T.ok('enlace "Ver mi aviso"', !!lnk && lnk.href.indexOf(av[0].id) > -1);
});
