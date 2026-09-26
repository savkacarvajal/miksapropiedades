// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var sleep=ms=>new Promise(f=>setTimeout(f,ms));
 await sleep(1200);
ok('6 KPIs', $id('r-kpi').children.length===6);
ok('tabla = horizonte + encabezado', $id('r-tabla').querySelectorAll('tr').length===11);
ok('grafico SVG con 3 lineas', document.querySelectorAll('#r-chart polyline').length===3);
$id('r-hor').value='5'; $id('rent-form').dispatchEvent(new Event('input')); ok('cambia horizonte a 5', $id('r-tabla').querySelectorAll('tr').length===6);
$id('r-arriendo').value='0'; $id('rent-form').dispatchEvent(new Event('input')); ok('flujo negativo se advierte', $id('r-note').textContent.indexOf('aportarías')>-1);
ok('toolnav resalta pagina actual', !!document.querySelector('.toolnav a.current'));
});
