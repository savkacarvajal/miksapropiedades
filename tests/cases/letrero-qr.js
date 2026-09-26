// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var sleep=ms=>new Promise(f=>setTimeout(f,ms));
 await sleep(1000);
var cv=$id('lt-qr')||$id('qr'); var g=cv.getContext('2d'), d=g.getImageData(0,0,cv.width,cv.height).data, dark=0; for(var i=0;i<d.length;i+=4){ if(d[i]<60) dark++; }
ok('QR dibujado (px oscuros >5%)', dark/(d.length/4)>0.05);
ok('QR cuadrado', cv.width===cv.height && cv.width>=100);
});
