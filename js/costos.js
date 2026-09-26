(async function () {
  const uf = await getUF();
  const q = new URLSearchParams(window.location.search); if (Number(q.get('precio')) > 0) $id('c-precio').value = Number(q.get('precio'));
  const num = (id, min, max, def) => { const v = Number($id(id).value); return isFinite(v) && v >= min ? Math.min(v, max) : def; };
  const uf2 = n => n.toLocaleString('es-CL', { maximumFractionDigits: 1 });
  function calcular() {
    const r = costosCompra({ precio: num('c-precio', 1, 1e6, 3000), piePct: num('c-pie', 0, 100, 20), notariaPct: num('c-notaria', 0, 10, 0.5), cbrPct: num('c-cbr', 0, 10, 0.9), timbresPct: num('c-timbres', 0, 5, 0.8),
      tasacion: num('c-tasacion', 0, 1e4, 4), titulos: num('c-titulos', 0, 1e4, 5), otros: num('c-otros', 0, 1e4, 3), corretajePct: num('c-corretaje', 0, 10, 0) });
    $id('c-pie-v').textContent = num('c-pie', 0, 100, 20);
    const precio = num('c-precio', 1, 1e6, 3000);
    $id('c-total').textContent = formatCLP(r.necesarioInicial * uf.valor);
    $id('c-total-uf').textContent = uf2(r.necesarioInicial) + ' UF · pie ' + uf2(r.pie) + ' UF + gastos ' + uf2(r.total) + ' UF (' + (r.total / precio * 100).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + '% del precio)';
    const cont = $id('c-bars'); cont.textContent = '';
    const mx = Math.max.apply(null, r.items.map(i => i[1]).concat(1e-9));
    r.items.forEach(([n, v]) => cont.appendChild(el('div', { class: 'cost-row' }, [
      el('div', {}, [el('span', { text: n }), el('b', { text: uf2(v) + ' UF · ' + formatCLP(v * uf.valor) })]),
      el('div', { class: 'cost-bar' }, [el('i', { style: 'width:' + Math.max(2, v / mx * 100) + '%' })]),
    ])));
    cont.appendChild(el('div', { class: 'plan-row', style: 'margin-top:8px' }, [el('span', { text: 'Total gastos' }), el('b', { text: uf2(r.total) + ' UF · ' + formatCLP(r.total * uf.valor) })]));
  }
  $id('cost-form').addEventListener('input', calcular);
  $id('cost-form').addEventListener('submit', e => e.preventDefault());
  calcular();
})();
