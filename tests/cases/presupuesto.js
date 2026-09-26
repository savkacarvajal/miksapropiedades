// ¿Cuánto puedo comprar? — matemática (identidades verificables) e interfaz.
__run(async T => {
  const base = { ingreso: 2000000, deudas: 0, pctIngreso: 25, pieUF: 600, plazo: 25, tasa: 4.5, uf: 40000, costoCompraPct: 3, ltv: 80 };
  const r = capacidadCompra(base);
  T.ok('precio positivo', r.precio > 0);
  T.ok('el dividendo respeta el máximo por ingreso', r.dividendo <= r.divMax + 1e-6);
  T.ok('el crédito no supera el financiamiento máximo', r.credito <= 0.8 * r.precio + 1e-9);
  T.ok('el pie cubre (precio − crédito) + costos', T.near(600, r.precio - r.credito + r.costos, 1e-6));
  T.ok('dividendo coincide con la fórmula del simulador', T.near(dividendo(r.credito * 40000, 4.5, 25), r.dividendo, 1e-3));
  T.eq('con poco ahorro el límite es el pie', capacidadCompra(Object.assign({}, base, { pieUF: 100, ingreso: 9000000 })).limitante, 'pie');
  T.eq('con mucho ahorro y poco ingreso el límite es el ingreso', capacidadCompra(Object.assign({}, base, { pieUF: 3000, ingreso: 800000 })).limitante, 'ingreso');
  // régimen limitado por ingreso: más ingreso sube el precio y más deudas lo bajan
  const li = Object.assign({}, base, { ingreso: 1200000 }), ri = capacidadCompra(li);
  T.eq('con ingreso bajo el límite es el ingreso', ri.limitante, 'ingreso');
  T.ok('más ingreso → puede comprar más', capacidadCompra(Object.assign({}, li, { ingreso: 1500000 })).precio > ri.precio);
  T.ok('más deudas → puede comprar menos', capacidadCompra(Object.assign({}, li, { deudas: 150000 })).precio < ri.precio);
  // régimen limitado por el pie: más ingreso no ayuda, más ahorro sí
  T.eq('con poco pie, más ingreso no cambia el precio', capacidadCompra(Object.assign({}, base, { ingreso: 3000000 })).precio, capacidadCompra(Object.assign({}, base, { ingreso: 6000000 })).precio);
  T.ok('más ahorro → puede comprar más', capacidadCompra(Object.assign({}, base, { pieUF: 900 })).precio > r.precio);
  T.eq('sin ahorro no hay compra', capacidadCompra(Object.assign({}, base, { pieUF: 0 })).precio, 0);
  const cero = capacidadCompra(Object.assign({}, base, { ingreso: 0 }));
  T.ok('sin ingreso solo alcanza al contado (crédito 0)', cero.credito === 0 && T.near(cero.precio, 600 / 1.03, 1e-6));

  // interfaz
  await T.waitFor(() => /UF\s\d/.test($id('p-precio').textContent));
  T.ok('muestra precio máximo', /UF\s[\d.]+/.test($id('p-precio').textContent));
  T.ok('lista de resultados', $id('p-list').children.length === 5);
  T.ok('botones de acción con tope', !!document.querySelector('#p-ctas a[href^="listado.html?op=venta&pmax="]') && !!document.querySelector('#p-ctas a[href^="busco.html?op=venta&pmax="]'));
  T.input($id('p-pie'), '0');
  T.ok('sin ahorro se advierte', $id('p-limit').textContent.indexOf('no alcanza') > -1 && $id('p-ctas').children.length === 0);
});
