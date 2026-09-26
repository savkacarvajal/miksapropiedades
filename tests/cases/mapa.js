// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var sleep=ms=>new Promise(f=>setTimeout(f,ms));
 await sleep(800);
ok('Leaflet cargado localmente', typeof L!=='undefined' && !!L.map);
ok('marcadores = items de lista', document.querySelectorAll('.leaflet-marker-icon').length===document.querySelectorAll('.map-item').length && document.querySelectorAll('.map-item').length===9);
document.querySelector('.map-item').click(); await sleep(900);
ok('click en item abre popup', !!document.querySelector('.leaflet-popup') && document.querySelector('.map-item').classList.contains('on'));
ok('atribucion OSM', document.querySelector('.leaflet-control-attribution').textContent.indexOf('OpenStreetMap')>-1);
ok('tiles cargan (sin CSP block)', document.querySelectorAll('.leaflet-tile').length>0);
});
