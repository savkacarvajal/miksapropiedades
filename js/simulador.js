(async function () {
  const q = new URLSearchParams(window.location.search);
  const precio = Number(q.get('precio')); if (precio > 0) $id('s-precio').value = precio;
  const pieQ = Number(q.get('pie')); if (pieQ >= 5 && pieQ <= 60) $id('s-pie').value = pieQ;
  const uf = await getUF();
  $id('s-uf').value = uf.valor.toFixed(2);
  $id('s-uf-src').textContent = uf.fuente === 'referencial' ? '(referencial, sin conexión)' : '(' + uf.fuente + (uf.fecha ? ', ' + new Date(uf.fecha).toLocaleDateString('es-CL') : '') + ')';

  function num(id, min, max, def) { const v = Number($id(id).value); return isFinite(v) && v >= min ? Math.min(v, max) : def; }
  function calcular() {
    const precioUF = num('s-precio', 1, 1e6, 1), piePct = num('s-pie', 0, 90, 20), anios = num('s-plazo', 1, 40, 25), tasa = num('s-tasa', 0, 30, 4.5), valUF = num('s-uf', 1, 1e6, uf.valor);
    $id('s-pie-v').textContent = piePct; $id('s-plazo-v').textContent = anios;
    const precioCLP = precioUF * valUF, pieCLP = precioCLP * piePct / 100, credito = precioCLP - pieCLP;
    const div = dividendo(credito, tasa, anios), total = div * anios * 12;
    $id('r-div').textContent = formatCLP(div);
    $id('r-div-uf').textContent = '≈ ' + (div / valUF).toLocaleString('es-CL', { maximumFractionDigits: 2 }) + ' UF al mes';
    const rows = [
      ['Precio', precioUF.toLocaleString('es-CL') + ' UF · ' + formatCLP(precioCLP)],
      ['Pie (' + piePct + '%)', formatCLP(pieCLP)],
      ['Crédito', formatCLP(credito) + ' · ' + (credito / valUF).toLocaleString('es-CL', { maximumFractionDigits: 0 }) + ' UF'],
      ['Total a pagar', formatCLP(total)],
      ['Intereses totales', formatCLP(total - credito)],
      ['Ingreso mensual sugerido', formatCLP(div / 0.25)],
    ];
    const list = $id('r-list'); list.textContent = '';
    rows.forEach(([k, v]) => list.appendChild(el('div', {}, [el('dt', { text: k }), el('dd', { text: v })])));
    $id('r-note').textContent = 'Como referencia, el dividendo no debería superar cerca del 25% de tus ingresos líquidos mensuales. Cálculo con cuota fija en pesos; el crédito real (en UF) varía con la inflación, seguros y gastos operacionales.';
  }
  $id('sim-form').addEventListener('input', calcular);
  $id('sim-form').addEventListener('submit', e => e.preventDefault());
  calcular();
})();
