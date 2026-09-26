// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
 var n=()=>document.querySelectorAll('#resultados .pcard').length;
ok('9 disponibles (3 reales + 8 demo - 1 vendida - 1 reservada)', n()===9);
document.getElementById('f-estado').value='todas';document.getElementById('f-estado').dispatchEvent(new Event('change')); ok('todas = 11', n()===11);
ok('ribbon vendida', !!document.querySelector('#resultados .ribbon.vendida'));
document.getElementById('f-estado').value='disp';document.getElementById('f-estado').dispatchEvent(new Event('change'));
var fb=document.querySelector('#resultados .fav-btn'); fb.click(); ok('corazon en tarjeta', getFavs().length===1 && fb.classList.contains('on'));
var cb=document.querySelectorAll('#resultados .cmp-btn input'); cb[0].click(); cb[1].click(); cb[2].click(); cb[3].click();
ok('comparar maximo 3', getComp().length===3 && !cb[3].checked);
ok('barra comparar visible', !!document.getElementById('cmp-bar'));
guardarBusqueda(); ok('sin filtros no guarda', getBusquedas().length===0);
document.getElementById('f-op').value='arriendo';document.getElementById('f-op').dispatchEvent(new Event('change')); guardarBusqueda();
ok('guarda busqueda con filtro', getBusquedas().length===1 && getBusquedas()[0].nombre.indexOf('Arriendo')>-1);
ok('enlace mapa con filtros', document.getElementById('ver-mapa').getAttribute('href').indexOf('op=arriendo')>-1);
});
