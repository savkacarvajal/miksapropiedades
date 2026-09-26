// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
ok('detalle El Faro', !$id('b-detail').hidden && $id('b-title').textContent.indexOf('El Faro')===0);
ok('stats y propiedades', $id('b-stats').children.length>=1 && document.querySelectorAll('#b-props .pcard').length>=1);
ok('enlaces a mapa/tasacion', $id('b-actions').querySelectorAll('a').length===3);
});
