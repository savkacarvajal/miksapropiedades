// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
ok('3 corredores', document.querySelectorAll('.corr-card').length===3);
ok('aviso de perfiles de ejemplo', !$id('corr-note').hidden);
ok('propiedades por corredor', document.querySelectorAll('.corr-card .pcard').length>=3);
});
