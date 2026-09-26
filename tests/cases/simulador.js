// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var sleep=ms=>new Promise(f=>setTimeout(f,ms));
 await sleep(1500);
ok('UF cargada', Number($id('s-uf').value)>1000);
$id('s-uf').value='40000';$id('s-precio').value='3000';$id('s-pie').value='24000000';$id('s-pie').dispatchEvent(new Event('input',{bubbles:true}));$id('s-plazo').value='25';$id('s-tasa').value='4.5';
$id('sim-form').dispatchEvent(new Event('input'));
var d=dividendo(3000*40000*0.8,4.5,25); 
ok('dividendo coincide con formula ('+Math.round(d)+')', $id('r-div').textContent.replace(/\D/g,'')===String(Math.round(d)));
ok('dividendo razonable (~533 mil)', d>500000 && d<570000);
ok('pie en CLP muestra su % del precio', $id('s-pie-v').textContent.indexOf('20')===0);
ok('lista de resultados', $id('r-list').children.length===6);
$id('s-tasa').value='0'; $id('sim-form').dispatchEvent(new Event('input')); ok('tasa 0 = credito/n', Math.abs(dividendo(1200000,0,10)-10000)<1e-6);
});
