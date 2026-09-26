// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
ok('3 proyectos', document.querySelectorAll('#pr-grid .pcard').length===3);
$id('pf-estado').value='inmediata'; $id('pf-estado').dispatchEvent(new Event('change')); ok('filtro entrega inmediata', document.querySelectorAll('#pr-grid .pcard').length===1);
$id('pf-estado').value=''; $id('pf-orden').value='precio'; $id('pf-orden').dispatchEvent(new Event('change')); ok('orden por precio (menor primero)', document.querySelector('#pr-grid .price').textContent.indexOf('1.650')>-1);
$id('pf-sector').value='El Faro'; $id('pf-sector').dispatchEvent(new Event('change')); ok('filtro sector', document.querySelectorAll('#pr-grid .pcard').length===1);
});
