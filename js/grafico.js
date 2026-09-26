// Gráfico de líneas en SVG (sin dependencias; se construye con createElementNS, sin innerHTML).
function graficoLineas(cont, o) {
  const NS = 'http://www.w3.org/2000/svg', W = 600, H = 260, m = { l: 54, r: 12, t: 12, b: 28 };
  const all = o.series.reduce((a, s) => a.concat(s.values), []);
  let min = Math.min.apply(null, all.concat(0)), max = Math.max.apply(null, all.concat(1));
  if (max === min) max = min + 1;
  const paso = Math.pow(10, Math.floor(Math.log10((max - min) / 4))), nice = [1, 2, 5, 10].map(x => x * paso).find(s => (max - min) / s <= 5) || paso * 10;
  min = Math.floor(min / nice) * nice; max = Math.ceil(max / nice) * nice;
  const n = o.labels.length, x = i => m.l + (n === 1 ? 0 : i * (W - m.l - m.r) / (n - 1)), y = v => m.t + (max - v) * (H - m.t - m.b) / (max - min);
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('class', 'chart-svg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', o.aria || 'Gráfico');
  const add = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k])); if (text !== undefined) e.textContent = text; svg.appendChild(e); return e; };
  for (let v = min; v <= max + 1e-9; v += nice) {
    add('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: '#EDE4DC', 'stroke-width': 1 });
    add('text', { x: m.l - 6, y: y(v) + 4, 'text-anchor': 'end' }, Math.round(v).toLocaleString('es-CL'));
  }
  const cada = Math.max(1, Math.ceil(n / 8));
  o.labels.forEach((l, i) => { if (i % cada === 0 || i === n - 1) add('text', { x: x(i), y: H - 8, 'text-anchor': 'middle' }, String(l)); });
  o.series.forEach(s => {
    add('polyline', { points: s.values.map((v, i) => x(i) + ',' + y(v)).join(' '), fill: 'none', stroke: s.color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    s.values.forEach((v, i) => { if (n <= 12 || i === n - 1) add('circle', { cx: x(i), cy: y(v), r: 3, fill: s.color }); });
  });
  cont.textContent = ''; cont.appendChild(svg);
  const leg = document.createElement('div'); leg.className = 'legend';
  o.series.forEach(s => { const it = document.createElement('span'), dot = document.createElement('i'); dot.style.background = s.color; it.appendChild(dot); it.appendChild(document.createTextNode(s.name)); leg.appendChild(it); });
  cont.appendChild(leg);
}
