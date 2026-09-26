// Ficha de la casa en Bosque Oriente: precio anterior y comisión.
__run(async T => {
  await T.sleep(1500);
  T.ok('precio en pesos', $id('d-precio').textContent === '$155.000.000');
  T.ok('muestra precio anterior', $id('d-clp').textContent.indexOf('Antes $165.000.000') === 0);
  T.ok('comisión 2%', $id('d-extra').textContent.indexOf('2% del precio') > -1);
  T.ok('3 dormitorios y 1 baño', $id('d-facts').textContent.indexOf('3') > -1 && $id('d-facts').textContent.indexOf('Baños') > -1);
  T.ok('amenidad quincho', $id('d-amen').textContent.indexOf('Quincho') > -1);
  T.ok('casa sí muestra dividendo estimado', !$id('d-hipo').hidden);
  T.ok('sin cesión de derechos', $id('d-badges').textContent.indexOf('Cesión') < 0);
});
