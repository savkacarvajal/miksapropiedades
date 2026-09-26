(async function () {
  const uf = await getUF();
  const q = new URLSearchParams(window.location.search); const pr = Number(q.get('precio'));
  if (pr > 0) { $id('a-precio').value = pr; $id('a-arriendo').value = Math.round(pr * 0.004 * 2) / 2; }
  const num = (id, min, max, def) => { const v = Number($id(id).value); return isFinite(v) && v >= min ? Math.min(v, max) : def; };
  const uf2 = n => n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  function calcular() {
    const p = { precio: num('a-precio', 1, 1e6, 3000), piePct: num('a-pie', 0, 100, 20), plazo: Math.max(1, Math.round(num('a-plazo', 1, 40, 25))), tasa: num('a-tasa', 0, 30, 4.5), arriendo: num('a-arriendo', 0, 1e5, 12),
      reajuste: num('a-reaj', -20, 30, 0), plusvalia: num('a-plus', -20, 30, 2), gastosPct: num('a-gastos', 0, 20, 1.5), rentInversion: num('a-inv', -10, 30, 3),
      costoCompraPct: num('a-cc', 0, 30, 3), costoVentaPct: num('a-cv', 0, 30, 2), horizonte: Math.round(num('a-hor', 1, 40, 10)) };
    $id('a-pie-v').textContent = p.piePct; $id('a-hor-v').textContent = p.horizonte;
    const r = arrendarVsComprar(p);
    const gana = r.gana === 'compra' ? 'Comprar' : 'Arrendar e invertir';
    $id('a-veredicto').textContent = gana + ' te deja ' + uf2(Math.abs(r.diferencia)) + ' UF más a los ' + p.horizonte + ' años';
    $id('a-detalle').textContent = '≈ ' + formatCLP(Math.abs(r.diferencia) * uf.valor) + ' CLP. ' + (r.equilibrio ? 'Comprar supera a arrendar desde el año ' + r.equilibrio + '.' : 'En este horizonte comprar no alcanza a superar a arrendar.') +
      ' Dividendo: ' + r.div.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' UF/mes frente a un arriendo de ' + p.arriendo.toLocaleString('es-CL') + ' UF.';
    graficoLineas($id('a-chart'), { labels: r.filas.map(f => f.año), aria: 'Patrimonio comprando y arrendando', series: [
      { name: 'Comprar', color: '#E8631A', values: r.filas.map(f => f.compra) }, { name: 'Arrendar e invertir', color: '#1C1009', values: r.filas.map(f => f.arriendo) }] });
    const t = $id('a-tabla'); t.textContent = '';
    t.appendChild(el('tr', {}, ['Año', 'Patrimonio comprando (UF)', 'Patrimonio arrendando (UF)', 'Diferencia (UF)'].map(h => el('th', { text: h }))));
    r.filas.forEach(f => t.appendChild(el('tr', {}, [f.año, uf2(f.compra), uf2(f.arriendo), uf2(f.diferencia)].map(v => el('td', { text: String(v) })))));
  }
  $id('avc-form').addEventListener('input', calcular);
  $id('avc-form').addEventListener('submit', e => e.preventDefault());
  calcular();
})();
