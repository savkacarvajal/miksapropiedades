// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var sleep=ms=>new Promise(f=>setTimeout(f,ms));
 await sleep(1000);
ok('QR en ficha', (function(){var cv=$id('qr'),d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,dk=0;for(var i=0;i<d.length;i+=4)if(d[i]<60)dk++;return dk/(d.length/4)>0.05})());
ok('WhatsApp con texto y URL', $id('sh-wa').href.indexOf('https://wa.me/?text=')===0 && decodeURIComponent($id('sh-wa').href).indexOf('propiedad.html?id=DEMO-1')>-1);
ok('enlace a letrero', $id('sh-letrero').getAttribute('href')==='letrero.html?id=DEMO-1');
ok('enlace analizar como inversion (venta)', !!document.querySelector('#d-links a[href^="rentabilidad.html?precio=2180"]'));
window.__b=[]; var oc=URL.createObjectURL; URL.createObjectURL=function(b){window.__b.push(b);return oc.call(URL,b)}; descargarQR(); await sleep(300);
ok('descargar QR genera PNG', window.__b.length===1 && window.__b[0].type==='image/png');
});
