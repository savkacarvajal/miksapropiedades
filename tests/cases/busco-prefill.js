// La página se prellena desde el listado / calculadora de presupuesto.
__run(async T => {
  T.eq('operación desde la URL', $id('b-op').value, 'venta');
  T.eq('presupuesto desde la URL', $id('b-pmax').value, '2500');
  T.eq('tipo desde la URL', $id('b-tipo').value, 'casa');
  T.ok('sector desde la URL', document.querySelector('input[name="b-sector"][value="Guayacán"]').checked);
});
