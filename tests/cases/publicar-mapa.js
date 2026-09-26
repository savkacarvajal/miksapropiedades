// Publicar: marcar la ubicación exacta en el mapa.
__run(async T => {
  T.ok('sin punto al inicio', window.PIN === null);
  $id('sector').value = 'Guayacán'; $id('sector').dispatchEvent(new Event('change'));
  document.getElementById('step1').classList.remove('active'); document.getElementById('step2').classList.add('active');
  await T.waitFor(function () { return !!document.querySelector('#pin-map.leaflet-container'); });
  T.ok('mapa montado al llegar al paso 2', !!document.querySelector('#pin-map.leaflet-container'));
  var m = document.getElementById('pin-map'), r = m.getBoundingClientRect();
  // clic dentro de La Serena–Coquimbo (centro del mapa, centrado en Guayacán)
  m.querySelector('.leaflet-container') ; m.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
  await T.sleep(200);
  T.ok('clic marca la ubicación', Array.isArray(window.PIN) && Math.abs(window.PIN[0] + 29.968) < 0.05 && Math.abs(window.PIN[1] + 71.356) < 0.05);
  T.ok('aparece el marcador y el botón quitar', !!document.querySelector('#pin-map .leaflet-marker-icon') && !$id('pin-clear').hidden);
  $id('pin-clear').click(); await T.sleep(100);
  T.ok('quitar marcador limpia la ubicación', window.PIN === null && $id('pin-clear').hidden);
});
