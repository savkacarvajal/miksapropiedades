// Lado comprador en el listado: etiquetas y enlace a "encargar búsqueda" con los filtros aplicados.
__run(async T => {
  T.eq('la opción de venta se llama "Comprar"', [...$id('f-op').options].find(o => o.value === 'venta').textContent, 'Comprar');
  T.eq('la de arriendo se llama "Arrendar"', [...$id('f-op').options].find(o => o.value === 'arriendo').textContent, 'Arrendar');
  T.ok('banner "¿No encuentras lo que buscas?" visible', !!$id('no-encuentras'));
  T.change($id('f-op'), 'venta'); $id('f-pmax').value = '3000'; T.submit($id('filtros')); await T.sleep(30);
  const h = $id('btn-busco').getAttribute('href');
  T.ok('el enlace lleva los filtros', h.indexOf('busco.html?') === 0 && h.indexOf('op=venta') > -1 && h.indexOf('pmax=3000') > -1);
});
