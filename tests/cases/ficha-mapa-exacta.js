// Ficha con mapa: marcador y «Cómo llegar» cuando el aviso trae lat/lng.
__run(async T => {
  await T.sleep(1200);
  T.ok('mapa visible', !$id('d-map-wrap').hidden && !!document.querySelector('#d-map.leaflet-container'));
  T.ok('marcador exacto', !!document.querySelector('#d-map .leaflet-marker-icon') && !document.querySelector('#d-map path.leaflet-interactive'));
  var links = [].slice.call($id('d-map-note').querySelectorAll('a'));
  T.ok('cómo llegar con las coordenadas', links.some(function (x) { return x.href.indexOf('destination=-29.97010,-71.35020')>-1 && x.rel.indexOf('noopener')>-1; }));
  T.ok('texto de ubicación indicada', $id('d-map-note').textContent.indexOf('indicada por quien publica')>-1);
});
