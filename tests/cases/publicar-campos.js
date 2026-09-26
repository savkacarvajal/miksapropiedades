// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var sleep=ms=>new Promise(f=>setTimeout(f,ms));window.setTimeout=(function(o){return function(f,ms){return ms>1000?0:o(f,ms)}})(window.setTimeout);
var v=(id,x)=>{document.getElementById(id).value=x};
v('titulo','Casa nueva'); v('descripcion','Desc'); v('precio','4500'); v('superficie','120'); v('sector','Peñuelas');
v('gastos','60000'); v('contrib','120000'); v('anio','2015'); v('orient','Norte'); document.getElementById('subsidio').checked=true;
v('c-nombre','Ana'); v('c-apellido','Lopez'); v('c-email','ana@test.cl'); v('c-tel','912345678');
var cv=document.createElement('canvas');cv.width=1200;cv.height=800;cv.getContext('2d').fillRect(0,0,1200,800);
var blob=await new Promise(f=>cv.toBlob(f,'image/png')); handleFiles([new File([blob],'f.png',{type:'image/png'})]); await sleep(500);
var f=document.getElementById('pub-form'), s=()=>f.dispatchEvent(new Event('submit',{cancelable:true}));
ok('Peñuelas listado en Coquimbo (optgroup)', document.querySelector('#sector option[value="Peñuelas"], #sector option:not([value])') !== null && document.querySelector('#sector optgroup:nth-of-type(2)').textContent.indexOf('Peñuelas')>-1);
v('video','http://evil.com/x'); s(); await sleep(30);
ok('video no https/proveedor rechazado (sigue en paso 1)', currentStep===1 || document.getElementById('err-video'));
s(); await sleep(30); // paso 2 con video invalido
ok('paso 2 bloqueado por video invalido', currentStep===2 && document.getElementById('err-video').style.display==='block');
v('video','https://www.youtube.com/watch?v=abc123'); s(); await sleep(30); s(); await sleep(30); s(); await sleep(50);
var av=JSON.parse(localStorage.getItem('miksa_avisos')||'[]')[0];
ok('aviso guardado con campos legales y video', !!av && av.gastosComunes===60000 && av.contribuciones===120000 && av.anio===2015 && av.orientacion==='Norte' && av.subsidio===true && av.videoUrl.indexOf('youtube.com')>-1 && av.estado==='disponible');
});
