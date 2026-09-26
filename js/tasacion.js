// Valores REFERENCIALES DE EJEMPLO (UF por m² de venta). Reemplázalos con datos reales de mercado de la agencia.
const BASE_UF_M2 = {
  'Av. del Mar': 52, 'El Faro': 48, 'Serena Golf': 50, 'Centro La Serena': 40, 'Valle del Sol': 38, 'Antofagasta (La Serena)': 36, 'Las Compañías': 32,
  'La Herradura': 38, 'Guayacán': 36, 'Peñuelas': 34, 'Centro Coquimbo': 34, 'Pan de Azúcar': 30, 'Puerto Aldea': 24,
};
const F_TIPO = { depto: 1, casa: 0.92, oficina: 1.05, terreno: 0.22 };
const F_CONS = { buena: 1.04, regular: 1, mejorable: 0.88 };
const F_DORM = { 1: 0.96, 2: 1, 3: 1.02, 4: 1.03, 5: 1.04 };
const RENTA_MENSUAL = 0.004;   // 0,4% mensual del valor (≈ 4,8% anual)

function estimar(d) {
  const base = BASE_UF_M2[d.sector]; if (!base) return null;
  let v = d.sup * base * F_TIPO[d.tipo] * F_CONS[d.cons];
  if (d.tipo !== 'terreno') {
    v *= Math.max(0.75, 1 - 0.006 * d.anio);
    if (d.tipo === 'depto' || d.tipo === 'casa') v *= F_DORM[d.dorm] || 1;
    v += d.est * 120;
  }
  if (d.op === 'arriendo') {
    if (d.tipo === 'terreno') return null;
    const m = v * RENTA_MENSUAL, r = x => Math.round(x * 2) / 2;
    return { unidad: 'UF / mes', bajo: r(m * 0.9), medio: r(m), alto: r(m * 1.1) };
  }
  const r = x => Math.round(x / 10) * 10;
  return { unidad: 'UF', bajo: r(v * 0.9), medio: r(v), alto: r(v * 1.1) };
}

(function () {
  const p = new URLSearchParams(window.location.search);
  if (p.get('sector') && BASE_UF_M2[p.get('sector')]) $id('t-sector').value = p.get('sector');
  const s = getSesion(); if (s) { $id('t-nombre').value = s.nombre || ''; $id('t-email').value = s.email || ''; }
  $id('t-tipo').addEventListener('change', () => { $id('t-rooms').hidden = $id('t-tipo').value === 'terreno' || $id('t-tipo').value === 'oficina'; });
  const marca = (idc, bad) => { const f = $id(idc).closest('.fld'); if (f) f.classList.toggle('bad', bad); const e = $id('e-' + idc); if (e) e.classList.toggle('show', bad); return bad; };
  const fmt = n => n.toLocaleString('es-CL', { maximumFractionDigits: 1 });

  $id('tas-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if ($id('t-web').value) return;
    let bad = false;
    bad = marca('t-sector', !$id('t-sector').value) || bad;
    bad = marca('t-sup', !(Number($id('t-sup').value) > 0)) || bad;
    bad = marca('t-nombre', $id('t-nombre').value.trim().length < 2) || bad;
    bad = marca('t-email', !validEmail($id('t-email').value)) || bad;
    bad = marca('t-tel', !validTel($id('t-tel').value)) || bad;
    const okc = $id('t-ok').checked; $id('e-t-ok').classList.toggle('show', !okc); bad = !okc || bad;
    if (bad) return;

    const d = { op: $id('t-op').value, tipo: $id('t-tipo').value, sector: $id('t-sector').value, sup: Number($id('t-sup').value),
      anio: Math.max(0, Number($id('t-anio').value) || 0), dorm: Number($id('t-dorm').value), est: Number($id('t-est').value), cons: $id('t-cons').value };
    const est = estimar(d);
    const box = $id('t-result'); box.textContent = '';
    if (!est) { box.hidden = false; $id('t-empty').hidden = true; box.appendChild(el('p', { text: 'No pudimos estimar este caso (los terrenos no se tasan para arriendo). Un corredor puede ayudarte.' })); return; }

    const uf = await getUF();
    const lead = guardarLead({ tipo: $id('t-gestion').checked ? 'captacion' : 'tasacion', nombre: $id('t-nombre').value.trim(), email: $id('t-email').value.trim(), tel: $id('t-tel').value.trim(),
      mensaje: 'Tasación ' + (LABEL_TIPO[d.tipo] || d.tipo) + ' en ' + d.sector + ', ' + d.sup + ' m² — estimado ' + fmt(est.bajo) + '–' + fmt(est.alto) + ' ' + est.unidad,
      datos: d, estimacion: est });
    $id('t-empty').hidden = true; box.hidden = false;
    box.appendChild(el('div', { style: 'font-size:0.8rem;color:var(--muted);font-weight:700;letter-spacing:.06em;text-transform:uppercase', text: d.op === 'venta' ? 'Valor de venta estimado' : 'Arriendo mensual estimado' }));
    box.appendChild(el('div', { style: 'font-size:1.9rem;font-weight:800;color:var(--brand);letter-spacing:-0.03em;margin:4px 0', text: fmt(est.bajo) + ' – ' + fmt(est.alto) + ' ' + est.unidad }));
    box.appendChild(el('div', { style: 'color:var(--muted);font-size:0.9rem', text: '≈ ' + formatCLP(est.bajo * uf.valor) + ' a ' + formatCLP(est.alto * uf.valor) + ' CLP' + (uf.fuente === 'referencial' ? ' (UF referencial)' : '') }));
    if (d.op === 'venta' && d.sup) box.appendChild(el('div', { style: 'color:var(--muted);font-size:0.85rem;margin-top:6px', text: 'Valor central: ' + fmt(est.medio) + ' UF · ' + fmt(est.medio / d.sup) + ' UF/m²' }));
    const sim = filtrarLista(getTodos(), { op: d.op, tipo: d.tipo, sector: d.sector, estado: 'todas' });
    if (sim.length) box.appendChild(el('p', { style: 'margin:12px 0 0;font-size:0.85rem' }, [sim.length + ' propiedades similares publicadas: ', el('a', { href: 'listado.html?op=' + d.op + '&tipo=' + d.tipo + '&sector=' + encodeURIComponent(d.sector) + '&estado=todas', text: 'verlas', style: 'color:var(--brand);font-weight:700' })]));
    box.appendChild(el('div', { class: 'okmsg', text: lead ? 'Recibimos tu solicitud (código ' + lead.id + '). Un corredor te contactará para confirmar el valor con una visita.' : 'No pudimos guardar tu solicitud, pero puedes contactarnos directamente.' }));
    if (window.innerWidth < 860) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
