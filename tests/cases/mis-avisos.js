// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
ok('avisos propios', document.querySelectorAll('#lista .arow').length===1);
ok('stats visibles', document.querySelector('#lista .meta:nth-of-type(3)').textContent.indexOf('vistas')>-1 || document.querySelector('#lista').textContent.indexOf('vistas')>-1);
var sel=document.querySelector('#lista select[data-aviso]'); sel.value='vendida'; sel.dispatchEvent(new Event('change'));
ok('cambiar estado del aviso', getAvisosUsuario()[0].estado==='vendida' && getPorId('M-1').estado==='vendida');
ok('consultas recibidas', !$id('consultas-wrap').hidden && document.querySelectorAll('#consultas .arow').length===1);
ok('busqueda guardada + nuevas', !$id('busquedas-wrap').hidden && $id('busquedas').textContent.indexOf('nuevas')>-1);
document.querySelector('[data-act="borrarBusqueda"]').click(); ok('quitar busqueda', getBusquedas().length===0 && $id('busquedas-wrap').hidden);
});
