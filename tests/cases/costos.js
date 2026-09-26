// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var sleep=ms=>new Promise(f=>setTimeout(f,ms));
 await sleep(1200);
ok('total mostrado', /\$[\d.]+/.test($id('c-total').textContent));
ok('6 filas de costos + total', document.querySelectorAll('#c-bars .cost-row').length===6);
$id('c-corretaje').value='2'; $id('cost-form').dispatchEvent(new Event('input')); ok('corretaje agrega fila', document.querySelectorAll('#c-bars .cost-row').length===7);
});
