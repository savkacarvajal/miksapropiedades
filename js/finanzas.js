// Funciones financieras puras (sin DOM) usadas por las herramientas. Requiere common.js (dividendo).

// Saldo pendiente de un crédito de cuota fija tras `meses` pagos.
function saldoCredito(monto, tasaAnualPct, anios, meses) {
  const n = anios * 12, m = Math.min(Math.max(meses, 0), n), r = tasaAnualPct / 100 / 12;
  if (monto <= 0) return 0;
  if (m >= n) return 0;
  const c = dividendo(monto, tasaAnualPct, anios);
  if (r === 0) return Math.max(0, monto - c * m);
  return Math.max(0, monto * Math.pow(1 + r, m) - c * ((Math.pow(1 + r, m) - 1) / r));
}

// TIR anual de flujos [f0, f1, ..., fn] (bisección). Devuelve null si no hay cambio de signo.
function tir(flujos) {
  const vpn = t => flujos.reduce((s, f, i) => s + f / Math.pow(1 + t, i), 0);
  let lo = -0.95, hi = 5;
  if (vpn(lo) * vpn(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (vpn(lo) * vpn(mid) <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

// ── Rentabilidad de una inversión en propiedad para arriendo (todo en UF, valores reales) ──
// p: { precio, piePct, plazo, tasa, arriendo, vacancia, adminPct, mantPct, contribAnual, gcAnual, plusvalia, costoCompraPct, costoVentaPct, horizonte }
function analizarInversion(p) {
  const pie = p.precio * p.piePct / 100, credito = p.precio - pie, costosCompra = p.precio * p.costoCompraPct / 100;
  const inversion = pie + costosCompra;
  const cobrado = p.arriendo * (12 - p.vacancia);
  const egresos = cobrado * (p.adminPct + p.mantPct) / 100 + p.contribAnual + p.gcAnual;
  const noi = cobrado - egresos;
  const divMensual = dividendo(credito, p.tasa, p.plazo), divAnual = divMensual * 12;
  const N = Math.min(p.horizonte, p.plazo);
  const flujoAnual = noi - divAnual;
  const tabla = [], flujos = [-inversion];
  for (let t = 1; t <= N; t++) {
    const valor = p.precio * Math.pow(1 + p.plusvalia / 100, t);
    const saldo = saldoCredito(credito, p.tasa, p.plazo, 12 * t);
    const venta = valor * (1 - p.costoVentaPct / 100) - saldo;
    tabla.push({ año: t, flujo: flujoAnual, valor, saldo, patrimonio: valor - saldo, neto: venta });
    flujos.push(flujoAnual + (t === N ? venta : 0));
  }
  const ingresos = flujos.slice(1).reduce((s, x) => s + x, 0);
  return {
    pie, credito, costosCompra, inversion, cobrado, egresos, noi,
    capRate: p.precio > 0 ? noi / p.precio : 0, rentBruta: p.precio > 0 ? p.arriendo * 12 / p.precio : 0,
    divMensual, flujoAnual, flujoMensual: flujoAnual / 12, cashOnCash: inversion > 0 ? flujoAnual / inversion : 0,
    tir: tir(flujos), multiplo: inversion > 0 ? ingresos / inversion : 0, tabla, flujos, horizonte: N,
  };
}

// ── Arrendar vs comprar (UF, valores reales). Ambos gastan el mismo presupuesto mensual de vivienda;
//    lo que sobra se invierte. ──
// p: { precio, piePct, plazo, tasa, arriendo, reajuste, plusvalia, gastosPct, rentInversion, costoCompraPct, costoVentaPct, horizonte }
function arrendarVsComprar(p) {
  const pie = p.precio * p.piePct / 100, credito = p.precio - pie, costosCompra = p.precio * p.costoCompraPct / 100;
  const div = dividendo(credito, p.tasa, p.plazo), rm = Math.pow(1 + p.rentInversion / 100, 1 / 12) - 1;
  let carteraCompra = 0, carteraArriendo = pie + costosCompra;
  const filas = []; let equilibrio = null;
  for (let m = 1; m <= p.horizonte * 12; m++) {
    const anioM = Math.floor((m - 1) / 12), valorM = p.precio * Math.pow(1 + p.plusvalia / 100, m / 12);
    const costoDueño = (m <= p.plazo * 12 ? div : 0) + valorM * p.gastosPct / 100 / 12;
    const renta = p.arriendo * Math.pow(1 + p.reajuste / 100, anioM);
    const presupuesto = Math.max(costoDueño, renta);
    carteraCompra = carteraCompra * (1 + rm) + (presupuesto - costoDueño);
    carteraArriendo = carteraArriendo * (1 + rm) + (presupuesto - renta);
    if (m % 12 === 0) {
      const y = m / 12, saldo = saldoCredito(credito, p.tasa, p.plazo, m);
      const patCompra = valorM * (1 - p.costoVentaPct / 100) - saldo + carteraCompra, patArriendo = carteraArriendo;
      filas.push({ año: y, compra: patCompra, arriendo: patArriendo, diferencia: patCompra - patArriendo });
      if (equilibrio === null && patCompra >= patArriendo) equilibrio = y;
    }
  }
  const last = filas[filas.length - 1] || { compra: 0, arriendo: 0, diferencia: 0 };
  return { filas, equilibrio, gana: last.diferencia >= 0 ? 'compra' : 'arriendo', diferencia: last.diferencia, div, pie, costosCompra };
}

// ── Costos de compra ──
// c: { precio, piePct, notariaPct, cbrPct, timbresPct, tasacion, titulos, otros, corretajePct }
function costosCompra(c) {
  const credito = c.precio * (1 - c.piePct / 100);
  const items = [
    ['Notaría (compraventa e hipoteca)', c.precio * c.notariaPct / 100],
    ['Conservador de Bienes Raíces', c.precio * c.cbrPct / 100],
    ['Impuesto de timbres y estampillas (sobre el crédito)', credito * c.timbresPct / 100],
    ['Tasación del banco', c.tasacion],
    ['Estudio de títulos', c.titulos],
    ['Certificados y otros trámites', c.otros],
  ];
  if (c.corretajePct > 0) items.push(['Comisión de corretaje', c.precio * c.corretajePct / 100]);
  const total = items.reduce((s, [, v]) => s + v, 0), pie = c.precio * c.piePct / 100;
  return { items, total, pie, necesarioInicial: pie + total, credito };
}

// ── ¿Cuánto puedo comprar? ──
// p: { ingreso (CLP/mes), deudas (CLP/mes), pctIngreso (% máx. del ingreso al dividendo), pieUF (ahorro disponible), plazo, tasa, uf, costoCompraPct, ltv (% máx. de financiamiento) }
function capacidadCompra(p) {
  const divMax = Math.max(0, p.ingreso * p.pctIngreso / 100 - p.deudas);
  const n = p.plazo * 12, r = p.tasa / 100 / 12, cc = p.costoCompraPct / 100, ltv = p.ltv / 100;
  const factor = r === 0 ? 1 / n : r / (1 - Math.pow(1 + r, -n));          // dividendo por cada $ de crédito
  const creditoMaxUF = divMax / factor / p.uf;
  if (p.pieUF <= 0) return { precio: 0, credito: 0, dividendo: 0, piePct: 0, costos: 0, limitante: 'pie', divMax, creditoMaxUF, ingresoNecesario: 0 };
  const porIngreso = (creditoMaxUF + p.pieUF) / (1 + cc);                   // el crédito no puede superar lo que permite el ingreso
  const porPie = p.pieUF / (1 + cc - ltv);                                  // el pie debe cubrir (1 − ltv) del precio y los costos
  const precio = Math.min(porIngreso, porPie);
  const pieUsado = p.pieUF - cc * precio, credito = Math.max(0, precio - pieUsado);
  const dividendo = credito * p.uf * factor;
  return { precio, credito, dividendo, piePct: pieUsado / precio * 100, costos: cc * precio, limitante: porIngreso <= porPie ? 'ingreso' : 'pie',
    divMax, creditoMaxUF, ingresoNecesario: p.pctIngreso > 0 ? (dividendo + p.deudas) / (p.pctIngreso / 100) : 0 };
}
