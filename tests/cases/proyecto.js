// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var sleep=ms=>new Promise(f=>setTimeout(f,ms));
 await sleep(1200);
ok('proyecto visible', !$id('pj').hidden && $id('pj-titulo').textContent==='Edificio Vista Faro');
ok('3 tipologias en tabla', $id('pj-tipos').querySelectorAll('tr').length===4);
var txt=$id('pl-res').textContent; ok('plan: pie 20% de 2100 = 420', txt.indexOf('UF 420')>-1);
ok('plan: cuota = (420-20)/24 = 16,7', txt.indexOf('16,7')>-1);
$id('pl-tipo').value='1'; $id('pl-tipo').dispatchEvent(new Event('change')); ok('plan cambia con la tipologia (610)', $id('pl-res').textContent.indexOf('UF 610')>-1);
var f=$id('cot-form'); f.dispatchEvent(new Event('submit',{cancelable:true})); ok('form vacio valida', $id('e-ct-nombre').classList.contains('show') && getLeads().length===0);
$id('ct-nombre').value='Ana Perez';$id('ct-email').value='ana@test.cl';$id('ct-tel').value='912345678';$id('ct-ok').checked=true; f.dispatchEvent(new Event('submit',{cancelable:true}));
var L=getLeads(); ok('lead cotizacion guardado', L.length===1 && L[0].tipo==='cotizacion' && L[0].proyectoId==='PR-1' && L[0].tipologia.indexOf('2 dorm')===0);
ok('barra de avance', $id('pj-avance').style.width==='45%');
});
