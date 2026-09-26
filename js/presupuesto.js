(async function () {
  const uf = await getUF();
  const num = (id, min, max, def) => { const v = Number($id(id).value); return isFinite(v) && v >= min ? Math.min(v, max) : def; };
  const uf1 = n => n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  function calcular() {
    const p = { ingreso: num('p-ingreso', 0, 1e9, 0), deudas: num('p-deudas', 0, 1e9, 0), pctIngreso: num('p-pct', 1, 60, 25), pieUF: num('p-pie', 0, 1e6, 0),
      plazo: Math.max(1, Math.round(num('p-plazo', 1, 40, 25))), tasa: num('p-tasa', 0, 30, 4.5), uf: uf.valor, costoCompraPct: num('p-cc', 0, 30, 3), ltv: num('p-ltv', 10, 100, 80) };
    $id('p-pct-v').textContent = p.pctIngreso;
    const r = capacidadCompra(p);
    $id('p-precio').textContent = 'UF ' + uf1(r.precio);
    $id('p-precio-clp').textContent = '≈ ' + formatCLP(r.precio * uf.valor) + ' CLP' + (uf.fuente === 'referencial' ? ' (UF referencial)' : '');
    const list = $id('p-list'); list.textContent = '';
    [['Dividendo mensual', formatCLP(r.dividendo)], ['Crédito hipotecario', 'UF ' + uf1(r.credito) + ' · ' + formatCLP(r.credito * uf.valor)], ['Pie (' + r.piePct.toLocaleString('es-CL', { maximumFractionDigits: 0 }) + '% del precio)', 'UF ' + uf1(r.precio * r.piePct / 100)],
     ['Gastos de compra estimados', 'UF ' + uf1(r.costos)], ['Dividendo máximo por tu ingreso', formatCLP(r.divMax)]]
      .forEach(([k, v]) => list.appendChild(el('div', {}, [el('dt', { text: k }), el('dd', { text: v })])));
    $id('p-limit').textContent = r.precio <= 0 ? 'Con estos datos no alcanza para comprar. Prueba con más ahorro o menos deudas.'
      : r.limitante === 'ingreso' ? 'Tu límite es el ingreso: el dividendo no debe pasar de ' + p.pctIngreso + '% de lo que ganas. Más ahorro para el pie te permitiría un crédito menor, y más ingreso, una propiedad mayor.'
      : 'Tu límite es el ahorro: el banco financia como máximo ' + p.ltv + '% del precio, así que necesitas más pie para llegar más alto. Tu ingreso permitiría un crédito mayor.';
    const c = $id('p-ctas'); c.textContent = '';
    if (r.precio > 0) {
      const tope = Math.floor(r.precio / 10) * 10;
      c.appendChild(el('a', { class: 'btn btn-brand', href: 'listado.html?op=venta&pmax=' + tope, text: 'Ver propiedades hasta UF ' + uf1(tope) }));
      c.appendChild(el('a', { class: 'btn btn-ghost', href: 'busco.html?op=venta&pmax=' + tope, text: 'Encargar búsqueda' }));
      c.appendChild(el('a', { class: 'btn btn-ghost', href: 'simulador.html?precio=' + Math.round(r.precio) + '&pie=' + Math.max(5, Math.min(60, Math.round(r.piePct))), text: 'Simular' }));
    }
  }
  $id('pres-form').addEventListener('input', calcular);
  $id('pres-form').addEventListener('submit', e => e.preventDefault());
  calcular();
})();
