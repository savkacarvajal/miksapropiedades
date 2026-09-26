// Ficha con mapa: zona referencial (círculo) cuando no hay coordenadas exactas.
__run(async T => {
  await T.sleep(1200);
  T.ok('sección de ubicación visible', !$id('d-map-wrap').hidden);
  T.ok('mapa Leaflet montado', !!document.querySelector('#d-map.leaflet-container'));
  T.ok('círculo de zona (sin punto exacto)', !!document.querySelector('#d-map path.leaflet-interactive') && !document.querySelector('#d-map .leaflet-marker-icon'));
  T.ok('nota de zona referencial', $id('d-map-note').textContent.indexOf('Zona referencial')>-1);
  var a = $id('d-map-note').querySelector('a');
  T.ok('enlace a OpenStreetMap seguro', !!a && a.href.indexOf('https://www.openstreetmap.org/')===0 && a.rel.indexOf('noopener')>-1);
  T.ok('no ofrece «Cómo llegar» con coordenadas aproximadas', $id('d-map-note').textContent.indexOf('Cómo llegar')<0);
  var sinPunto = coordsDe({ id: 'X-1', sector: 'Guayacán', lat: null, lng: null });
  T.ok('lat/lng null no cae en 0,0 (usa el sector)', sinPunto && Math.abs(sinPunto[0] + 29.968) < 0.02);
  T.ok('lat/lng vacíos tampoco', coordsDe({ id: 'X-2', sector: 'Guayacán', lat: '', lng: '' })[0] < -29);
});
