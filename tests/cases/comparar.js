// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
ok('3 columnas', document.querySelectorAll('#cmp-table tr:first-child th').length===4);
ok('resalta mejor valor', document.querySelectorAll('#cmp-table td.best').length>0);
ok('sin tabla vacia', $id('cmp-empty').hidden);
});
