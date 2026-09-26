// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var near=(a,b,e)=>Math.abs(a-b)<=e;
ok('TIR simple 10%', near(tir([-100,110]),0.10,1e-6));
ok('TIR con cupones 10%', near(tir([-100,10,10,110]),0.10,1e-6));
ok('TIR sin cambio de signo = null', tir([100,10])===null);
ok('saldo tasa 0 a mitad', near(saldoCredito(1000,0,10,60),500,1e-6));
ok('saldo inicial = monto', near(saldoCredito(1000,4.5,25,0),1000,1e-6));
ok('saldo final = 0', saldoCredito(1000,4.5,25,300)===0);
ok('saldo decrece', saldoCredito(1000,4.5,25,60)<1000 && saldoCredito(1000,4.5,25,120)<saldoCredito(1000,4.5,25,60));
// coherencia: pagar cuota n veces con interes = saldo 0 (fin)
var c=dividendo(1000,4.5,25), r_=0.045/12, s=1000; for(var i=0;i<300;i++){ s=s*(1+r_)-c; } ok('amortizacion simulada llega a ~0', Math.abs(s)<1e-6);
ok('saldo analitico = simulado a 60 meses', (function(){var s2=1000;for(var i=0;i<60;i++)s2=s2*(1+r_)-c;return near(s2,saldoCredito(1000,4.5,25,60),1e-6)})());
// inversion sin credito: cap rate 6%, TIR 6%
var a=analizarInversion({precio:1000,piePct:100,plazo:25,tasa:4.5,arriendo:5,vacancia:0,adminPct:0,mantPct:0,contribAnual:0,gcAnual:0,plusvalia:0,costoCompraPct:0,costoVentaPct:0,horizonte:10});
ok('cap rate 6%', near(a.capRate,0.06,1e-9)); ok('flujo anual 60', near(a.flujoAnual,60,1e-9)); ok('TIR = 6% sin plusvalia', near(a.tir,0.06,1e-6)); ok('tabla de 10 filas', a.tabla.length===10);
// con gastos: NOI
var b=analizarInversion({precio:1000,piePct:20,plazo:25,tasa:4.5,arriendo:5,vacancia:1,adminPct:10,mantPct:5,contribAnual:4,gcAnual:2,plusvalia:2,costoCompraPct:3,costoVentaPct:2,horizonte:10});
var cobr=5*11, egr=cobr*0.15+4+2; ok('NOI = cobrado - egresos', near(b.noi,cobr-egr,1e-9));
ok('inversion = pie + costos', near(b.inversion,200+30,1e-9));
ok('flujo = NOI - dividendos', near(b.flujoAnual,b.noi-dividendo(800,4.5,25)*12,1e-9));
ok('patrimonio crece con plusvalia', b.tabla[9].patrimonio>b.tabla[0].patrimonio);
// arrendar vs comprar
var base={precio:3000,piePct:20,plazo:25,tasa:4.5,arriendo:12,reajuste:0,plusvalia:2,gastosPct:1.5,rentInversion:3,costoCompraPct:3,costoVentaPct:2,horizonte:20};
var boom=arrendarVsComprar(Object.assign({},base,{plusvalia:8,arriendo:20})); ok('plusvalia alta -> gana comprar', boom.gana==='compra' && boom.equilibrio!==null);
var caro=arrendarVsComprar(Object.assign({},base,{plusvalia:-2,arriendo:6,horizonte:10})); ok('plusvalia negativa + arriendo barato -> gana arrendar', caro.gana==='arriendo' && caro.equilibrio===null);
ok('filas por año = horizonte', boom.filas.length===20);
var cero=arrendarVsComprar(Object.assign({},base,{piePct:100,costoCompraPct:0,costoVentaPct:0,gastosPct:0,plusvalia:0,rentInversion:0,arriendo:0,horizonte:5}));
ok('sin costos ni rentas: compra = arriendo (pie 100%)', near(cero.filas[4].compra,cero.filas[4].arriendo,1e-6));
// costos de compra
var cc=costosCompra({precio:3000,piePct:20,notariaPct:0.5,cbrPct:0.9,timbresPct:0.8,tasacion:4,titulos:5,otros:3,corretajePct:0});
ok('suma de items = total', near(cc.items.reduce((s,x)=>s+x[1],0),cc.total,1e-9));
ok('timbres solo sobre el credito', near(cc.items[2][1],2400*0.008,1e-9));
ok('necesario = pie + total', near(cc.necesarioInicial,600+cc.total,1e-9)); ok('sin corretaje no hay fila', cc.items.length===6);
ok('con corretaje agrega fila', costosCompra({precio:3000,piePct:20,notariaPct:0,cbrPct:0,timbresPct:0,tasacion:0,titulos:0,otros:0,corretajePct:2}).items.length===7);
});
