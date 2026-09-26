// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var sleep=ms=>new Promise(f=>setTimeout(f,ms));
var e=estimar({op:'venta',tipo:'depto',sector:'Av. del Mar',sup:60,anio:10,dorm:2,est:1,cons:'regular'});
ok('estimar venta coherente (rango bajo<medio<alto)', e && e.bajo<e.medio && e.medio<e.alto && e.unidad==='UF');
var a=estimar({op:'arriendo',tipo:'depto',sector:'Av. del Mar',sup:60,anio:10,dorm:2,est:1,cons:'regular'});
ok('arriendo ~0,4% mensual', a && a.medio>5 && a.medio<30 && a.unidad==='UF / mes');
ok('terreno no se tasa para arriendo', estimar({op:'arriendo',tipo:'terreno',sector:'El Faro',sup:500,anio:0,dorm:1,est:0,cons:'regular'})===null);
var f=$id('tas-form'); f.dispatchEvent(new Event('submit',{cancelable:true})); await sleep(50);
ok('form vacio marca errores', $id('e-t-sector').classList.contains('show') && $id('e-t-ok').classList.contains('show') && $id('t-result').hidden);
$id('t-sector').value='El Faro';$id('t-sup').value='70';$id('t-nombre').value='Ana Perez';$id('t-email').value='ana@test.cl';$id('t-tel').value='912345678';$id('t-ok').checked=true;$id('t-gestion').checked=true;
f.dispatchEvent(new Event('submit',{cancelable:true})); await sleep(1500);
ok('resultado visible con rango', !$id('t-result').hidden && $id('t-result').textContent.indexOf('–')>-1);
var L=getLeads(); ok('lead captacion guardado', L.length===1 && L[0].tipo==='captacion' && !!L[0].estimacion);
});
