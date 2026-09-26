(function () {
  const q = new URLSearchParams(window.location.search);
  ['op', 'tipo', 'dorm'].forEach(k => { const v = q.get(k); if (v && $id('b-' + k)) { $id('b-' + k).value = v; if ($id('b-' + k).value !== v) $id('b-' + k).value = ''; } });
  if (Number(q.get('pmax')) > 0) $id('b-pmax').value = Number(q.get('pmax'));
  if (q.get('sector')) document.querySelectorAll('input[name="b-sector"]').forEach(c => { if (c.value === q.get('sector')) c.checked = true; });
  if (q.get('q')) $id('b-msg').value = q.get('q');
  const s = getSesion(); if (s) { $id('b-nombre').value = s.nombre || ''; $id('b-email').value = s.email || ''; }

  const sectores = () => [...document.querySelectorAll('input[name="b-sector"]:checked')].map(c => c.value);
  function filtros() { return { op: $id('b-op').value, tipo: $id('b-tipo').value, dorm: $id('b-dorm').value, pmax: $id('b-pmax').value, estado: 'disp', q: '', sector: '' }; }
  function coincidencias() {
    const f = filtros(), sec = sectores();
    return filtrarLista(getTodos(), f).filter(a => !sec.length || sec.includes(a.sector));
  }
  function qsListado() {
    const f = filtros(), p = new URLSearchParams(), sec = sectores();
    ['op', 'tipo', 'dorm', 'pmax'].forEach(k => { if (f[k]) p.set(k, f[k]); });
    if (sec.length === 1) p.set('sector', sec[0]);
    const t = p.toString(); return t ? '?' + t : '';
  }
  function vistaPrevia() {
    const L = coincidencias();
    $id('b-count').textContent = L.length ? L.length + (L.length === 1 ? ' propiedad coincide' : ' propiedades coinciden') + ' con lo que buscas.' : 'Hoy no hay propiedades que coincidan. Encarga la búsqueda y te avisamos.';
    const cont = $id('b-preview'); cont.textContent = '';
    L.slice(0, 2).forEach(a => cont.appendChild(crearTarjeta(a)));
    if (L.length) cont.appendChild(el('a', { class: 'btn btn-ghost btn-block', style: 'margin-top:10px', href: 'listado.html' + qsListado(), text: 'Ver las ' + L.length + (sectores().length > 1 ? ' (filtra por sector en el listado)' : '') }));
  }
  const marca = (idc, bad) => { const f = $id(idc).closest('.fld'); if (f) f.classList.toggle('bad', bad); const e = $id('e-' + idc); if (e) e.classList.toggle('show', bad); return bad; };
  $id('b-op').addEventListener('change', () => { $id('b-pago-wrap').hidden = $id('b-op').value !== 'venta'; });
  $id('b-pago-wrap').hidden = $id('b-op').value !== 'venta';
  $id('busco-form').addEventListener('input', vistaPrevia);
  $id('busco-form').addEventListener('change', vistaPrevia);

  $id('busco-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if ($id('b-web').value) return;
    let bad = false;
    bad = marca('b-nombre', $id('b-nombre').value.trim().length < 2) || bad;
    bad = marca('b-email', !validEmail($id('b-email').value)) || bad;
    bad = marca('b-tel', !validTel($id('b-tel').value)) || bad;
    const okc = $id('b-ok').checked; $id('e-b-ok').classList.toggle('show', !okc); bad = !okc || bad;
    if (bad) return;
    const f = filtros(), sec = sectores();
    const resumen = [LABEL_OP[f.op] === 'Venta' ? 'Comprar' : LABEL_OP[f.op], f.tipo ? LABEL_TIPO[f.tipo] : 'cualquier tipo', sec.length ? 'en ' + sec.join(', ') : 'en La Serena y Coquimbo', f.pmax ? 'hasta UF ' + Number(f.pmax).toLocaleString('es-CL') : '', f.dorm ? f.dorm + '+ dorm.' : ''].filter(Boolean).join(' · ');
    const lead = guardarLead({ tipo: 'requerimiento', propiedadTitulo: 'Busca: ' + resumen, nombre: $id('b-nombre').value.trim(), email: $id('b-email').value.trim(), tel: $id('b-tel').value.trim(),
      mensaje: $id('b-msg').value.trim(), datos: { op: f.op, tipo: f.tipo, sectores: sec, pmax: Number(f.pmax) || null, dorm: f.dorm, pago: f.op === 'venta' ? $id('b-pago').value : '', plazo: $id('b-plazo').value } });
    if (!lead) { avisoFlotante('No pudimos guardar tu solicitud. Intenta de nuevo.'); return; }
    if ($id('b-avisar').checked) {
      const qs = qsListado(), B = getBusquedas();
      if (!B.some(x => x.qs === qs)) { B.push({ id: 'B-' + Date.now(), nombre: resumen, qs: qs, visto: getTodos().map(a => a.id), creada: new Date().toISOString() }); setBusquedas(B); }
    }
    const box = $id('b-result'); box.textContent = ''; box.hidden = false; $id('b-live').hidden = true;
    box.appendChild(el('h2', { class: 'h-sec', style: 'margin-top:0', text: '¡Búsqueda recibida!' }));
    box.appendChild(el('p', { style: 'margin:0 0 8px;color:var(--muted)', text: resumen }));
    box.appendChild(el('div', { class: 'okmsg', text: 'Código ' + lead.id + '. Un corredor te contactará para afinar lo que buscas y enviarte opciones.' }));
    box.appendChild(el('a', { class: 'btn btn-brand btn-block', style: 'margin-top:12px', href: 'listado.html' + qsListado(), text: 'Ver propiedades ahora' }));
    $id('busco-form').querySelectorAll('input,select,textarea,button').forEach(x => { x.disabled = true; });
  });
  vistaPrevia();
})();
