(async function () {
  const q = new URLSearchParams(window.location.search);
  ['precio', 'arriendo', 'contrib', 'gc'].forEach(k => { const v = Number(q.get(k)); if (v > 0) $id('r-' + k).value = v; });
  if (Number(q.get('precio')) > 0 && !(Number(q.get('arriendo')) > 0)) $id('r-arriendo').value = Math.round(Number(q.get('precio')) * 0.004 * 2) / 2;
  const uf = await getUF();
  const num = (id, min, max, def) => { const v = Number($id(id).value); return isFinite(v) && v >= min ? Math.min(v, max) : def; };
  const uf2 = n => n.toLocaleString('es-CL', { maximumFractionDigits: 1 });
  const pct = n => (n * 100).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + '%';

  function calcular() {
    const p = {
      precio: num('r-precio', 1, 1e6, 3000), piePct: num('r-pie', 0, 100, 20), plazo: Math.max(1, Math.round(num('r-plazo', 1, 40, 25))), tasa: num('r-tasa', 0, 30, 4.5),
      arriendo: num('r-arriendo', 0, 1e5, 12), vacancia: num('r-vac', 0, 12, 1), adminPct: num('r-admin', 0, 100, 0), mantPct: num('r-mant', 0, 100, 5),
      contribAnual: num('r-contrib', 0, 1e9, 0) * 4 / uf.valor, gcAnual: num('r-gc', 0, 1e9, 0) * 12 / uf.valor,
      plusvalia: num('r-plus', -20, 30, 2), costoCompraPct: num('r-cc', 0, 30, 3), costoVentaPct: num('r-cv', 0, 30, 2), horizonte: Math.max(1, Math.round(num('r-hor', 1, 40, 10))),
    };
    $id('r-pie-v').textContent = p.piePct;
    const a = analizarInversion(p);
    const k = $id('r-kpi'); k.textContent = '';
    const kpi = (label, val, small, cls) => k.appendChild(el('div', { class: 'kpi' }, [el('span', { text: label }), el('b', { class: cls || '', text: val }), small ? el('small', { text: small }) : '']));
    kpi('Cap rate', pct(a.capRate), 'Ingreso neto / precio');
    kpi('Rentabilidad bruta', pct(a.rentBruta), 'Arriendo anual / precio');
    kpi('Flujo mensual', uf2(a.flujoMensual) + ' UF', formatCLP(a.flujoMensual * uf.valor) + ' CLP', a.flujoMensual >= 0 ? 'pos' : 'neg');
    kpi('Retorno s/ tu capital', pct(a.cashOnCash), 'Flujo anual / capital inicial', a.cashOnCash >= 0 ? 'pos' : 'neg');
    kpi('TIR anual', a.tir === null ? '—' : pct(a.tir), 'A ' + a.horizonte + ' años, vendiendo');
    kpi('Capital inicial', uf2(a.inversion) + ' UF', formatCLP(a.inversion * uf.valor) + ' CLP');
    const nota = [];
    nota.push('Dividendo: ' + uf2(a.divMensual) + ' UF/mes (' + formatCLP(a.divMensual * uf.valor) + '). Ingreso neto anual: ' + uf2(a.noi) + ' UF.');
    if (a.flujoMensual < 0) nota.push('El arriendo no alcanza para cubrir el dividendo y los gastos: aportarías ' + uf2(-a.flujoMensual) + ' UF al mes. Tu retorno depende de la plusvalía.');
    if (p.horizonte > p.plazo) nota.push('El horizonte se limita al plazo del crédito (' + p.plazo + ' años).');
    $id('r-note').textContent = nota.join(' ');
    graficoLineas($id('r-chart'), { labels: a.tabla.map(f => f.año), aria: 'Patrimonio neto por año', series: [
      { name: 'Valor de la propiedad', color: '#E8631A', values: a.tabla.map(f => f.valor) },
      { name: 'Patrimonio (valor − deuda)', color: '#1C1009', values: a.tabla.map(f => f.patrimonio) },
      { name: 'Deuda', color: '#B0A09A', values: a.tabla.map(f => f.saldo) }] });
    const t = $id('r-tabla'); t.textContent = '';
    t.appendChild(el('tr', {}, ['Año', 'Flujo (UF)', 'Valor (UF)', 'Deuda (UF)', 'Patrimonio (UF)', 'Si vendes (UF)'].map(h => el('th', { text: h }))));
    a.tabla.forEach(f => t.appendChild(el('tr', {}, [f.año, uf2(f.flujo), uf2(f.valor), uf2(f.saldo), uf2(f.patrimonio), uf2(f.neto)].map(v => el('td', { text: String(v) })))));
  }
  $id('rent-form').addEventListener('input', calcular);
  $id('rent-form').addEventListener('submit', e => e.preventDefault());
  calcular();
})();
