// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var sleep=ms=>new Promise(f=>setTimeout(f,ms));
 await sleep(1200);
ok('veredicto', /UF más a los 10 años/.test($id('a-veredicto').textContent));
ok('grafico 2 lineas', document.querySelectorAll('#a-chart polyline').length===2);
$id('a-hor').value='20'; $id('avc-form').dispatchEvent(new Event('input')); ok('horizonte 20 => 20 filas', $id('a-tabla').querySelectorAll('tr').length===21);
$id('a-plus').value='9'; $id('a-arriendo').value='25'; $id('avc-form').dispatchEvent(new Event('input')); ok('escenario alcista -> comprar', $id('a-veredicto').textContent.indexOf('Comprar')===0);
});
