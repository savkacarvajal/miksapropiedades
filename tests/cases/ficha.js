// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var sleep=ms=>new Promise(f=>setTimeout(f,ms));
await sleep(1500);
ok('ficha visible', !$id('detail').hidden);
ok('estado disponible sin ribbon', $id('d-badges').textContent.indexOf('Reservada')<0);
ok('publicado hace', $id('d-loc').textContent.indexOf('Publicado hace')>-1);
ok('CLP con UF', /≈ \$/.test($id('d-clp').textContent));
ok('dividendo estimado (venta)', !$id('d-hipo').hidden && $id('d-hipo').textContent.indexOf('Dividendo')>-1);
ok('datos adicionales', $id('d-extra').children.length>=4);
ok('corredor asignado', !$id('corredor-card').hidden);
ok('JSON-LD presente', !!document.querySelector('script[type="application/ld+json"]') && JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@type']==='RealEstateListing');
$id('b-fav').click(); ok('favorito via data-act', isFav('DEMO-1'));
$id('b-cmp').click(); ok('comparar via data-act', getComp().includes('DEMO-1') && !!$id('cmp-bar'));
// formulario invalido
var f=$id('lead-form'); f.dispatchEvent(new Event('submit',{cancelable:true}));
ok('form vacio muestra errores', $id('e-lf-nombre').classList.contains('show') && $id('e-lf-ok').classList.contains('show'));
$id('lf-nombre').value='Ana Perez';$id('lf-email').value='ana@test.cl';$id('lf-tel').value='+56 9 1234 5678';
var d=new Date();d.setDate(d.getDate()+3);$id('lf-fecha').value=d.toISOString().slice(0,10);$id('lf-ok').checked=true;
$id('lf-web').value='bot'; f.dispatchEvent(new Event('submit',{cancelable:true})); ok('honeypot bloquea', getLeads().length===0);
$id('lf-web').value=''; f.dispatchEvent(new Event('submit',{cancelable:true}));
var L=getLeads(); ok('lead guardado tipo visita', L.length===1 && L[0].tipo==='visita' && L[0].propiedadId==='DEMO-1' && L[0].estado==='nuevo');
ok('mensaje de confirmacion', !$id('lf-done').hidden);
});
