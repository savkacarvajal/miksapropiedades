// Ficha de la cesión de derechos (terreno en Cruz de Caña).
__run(async T => {
  await T.sleep(1500);
  T.ok('precio en pesos', $id('d-precio').textContent === '$28.000.000');
  T.ok('etiqueta de cesión de derechos', $id('d-badges').textContent.indexOf('Cesión de derechos') > -1);
  T.ok('dato «Tipo de venta»', $id('d-extra').textContent.indexOf('Cesión de derechos') > -1);
  T.ok('sin dividendo hipotecario en cesión de derechos', $id('d-hipo').hidden);
  T.ok('equivalente en UF', /≈ [\d.]+ UF/.test($id('d-clp').textContent));
  T.ok('superficie 2.500 m²', $id('d-facts').textContent.indexOf('2500 m²') > -1);
  T.ok('galería con 5 fotos', $id('g-thumbs').children.length === 5);
  T.ok('mapa de zona de Cruz de Caña', !$id('d-map-wrap').hidden && $id('d-map-note').textContent.indexOf('Cruz de Caña') > -1);
  T.ok('WhatsApp de la agencia', !!document.querySelector('#d-contact a[href^="https://wa.me/56961357871"]'));
  var ld = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
  T.ok('JSON-LD en CLP', ld.offers.priceCurrency === 'CLP' && ld.offers.price === 28000000);
});
