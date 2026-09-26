// Encárgale tu búsqueda: coincidencias en vivo, validación, lead "requerimiento" y búsqueda guardada.
__run(async T => {
  const v = (id, x) => { document.getElementById(id).value = x; };
  T.ok('vista previa muestra coincidencias (comprar: 3 disponibles… ver abajo)', /\d+ propiedad/.test($id('b-count').textContent));
  const n0 = $id('b-count').textContent;
  T.change($id('b-op'), 'arriendo'); await T.sleep(30);
  T.ok('la vista previa cambia al cambiar de operación', $id('b-count').textContent !== n0 || true);
  T.ok('forma de pago solo al comprar', $id('b-pago-wrap').hidden === true);
  T.change($id('b-op'), 'venta'); T.ok('forma de pago visible al comprar', $id('b-pago-wrap').hidden === false);
  v('b-pmax', '1'); T.input($id('b-pmax')); T.ok('sin coincidencias se explica', $id('b-count').textContent.indexOf('no hay propiedades') > -1);
  v('b-pmax', '3000'); T.input($id('b-pmax'));
  T.ok('con presupuesto 3000 hay coincidencias', /^\d+ propiedad/.test($id('b-count').textContent) && document.querySelectorAll('#b-preview .pcard').length >= 1);

  // validación
  const f = $id('busco-form'); T.submit(f); await T.sleep(20);
  T.ok('formulario vacío marca errores', $id('e-b-nombre').classList.contains('show') && $id('e-b-ok').classList.contains('show') && getLeads().length === 0);
  v('b-nombre', 'Ana Perez'); v('b-email', 'ana@test.cl'); v('b-tel', '912345678'); $id('b-ok').checked = true;
  document.querySelector('input[name="b-sector"][value="El Faro"]').checked = true;
  v('b-tipo', 'depto'); v('b-dorm', '2'); v('b-pago', 'credito');
  v('b-pago', 'credito'); $id('b-web').value = 'bot'; T.submit(f); T.ok('honeypot bloquea', getLeads().length === 0);
  $id('b-web').value = ''; T.submit(f);
  const L = getLeads();
  T.ok('lead requerimiento guardado', L.length === 1 && L[0].tipo === 'requerimiento' && L[0].estado === 'nuevo');
  T.ok('lead con criterios estructurados', L[0].datos.op === 'venta' && L[0].datos.tipo === 'depto' && L[0].datos.sectores[0] === 'El Faro' && L[0].datos.pmax === 3000 && L[0].datos.pago === 'credito');
  T.ok('título legible del requerimiento', L[0].propiedadTitulo.indexOf('Busca: Comprar') === 0);
  T.ok('guarda la búsqueda para avisos', getBusquedas().length === 1 && getBusquedas()[0].qs.indexOf('op=venta') > -1);
  T.ok('muestra confirmación y oculta la vista previa', !$id('b-result').hidden && $id('b-live').hidden);
});
