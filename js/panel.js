(function () {
  const s = getSesion();
  const deny = msg => { $id('p-deny').hidden = false; $id('p-deny-msg').textContent = msg; };
  if (!s) return deny('Ingresa con una cuenta autorizada para ver el panel.');
  if (!(MIKSA_CONFIG.ADMIN_EMAILS || []).length) return deny('El panel está deshabilitado. Agrega tu correo en ADMIN_EMAILS dentro de js/config.js para habilitarlo.');
  if (!esAdmin()) return deny('Tu cuenta no tiene permisos de corredor.');
  $id('p-main').hidden = false;

  const fEstado = $id('p-filtro');
  Object.keys(LABEL_LEAD).forEach(k => fEstado.appendChild(el('option', { value: k, text: LABEL_LEAD[k] })));
  const TIPO_TXT = { visita: 'Visita', contacto: 'Consulta', tasacion: 'Tasación', captacion: 'Captación', cotizacion: 'Cotización', requerimiento: 'Búsqueda' };
  const fecha = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };

  function kpis() {
    const L = getLeads(), k = $id('p-kpi'); k.textContent = '';
    [[L.length, 'Consultas'], [L.filter(l => l.estado === 'nuevo').length, 'Nuevas'], [L.filter(l => l.tipo === 'visita' && l.estado !== 'cerrado' && l.estado !== 'descartado').length, 'Visitas activas'], [L.filter(l => l.estado === 'cerrado').length, 'Cerradas']]
      .forEach(([v, t]) => k.appendChild(el('div', { class: 'fact' }, [el('b', { text: String(v) }), el('span', { text: t })])));
  }

  function pintarLeads() {
    const cont = $id('p-leads'); cont.textContent = '';
    let L = getLeads().slice().reverse();
    if (fEstado.value) L = L.filter(l => l.estado === fEstado.value);
    if ($id('p-tipo').value) L = L.filter(l => l.tipo === $id('p-tipo').value);
    if (!L.length) { cont.appendChild(el('div', { class: 'empty', style: 'padding:28px' }, [el('p', { text: 'No hay consultas con estos filtros.' })])); return; }
    L.forEach(l => {
      const sel = el('select', { class: 'mini-sel', 'data-lead': l.id, 'aria-label': 'Estado de la consulta' });
      Object.keys(LABEL_LEAD).forEach(k => sel.appendChild(el('option', { value: k, text: LABEL_LEAD[k], selected: l.estado === k ? 'selected' : null })));
      sel.addEventListener('change', () => { actualizarLead(l.id, { estado: sel.value }); kpis(); pintarAgenda(); });
      const meta = [l.nombre, l.email, l.tel].filter(Boolean).join(' · ');
      const card = el('div', { class: 'lead-card' }, [
        el('div', {}, [
          el('h3', {}, [el('span', { class: 'lead-tag', text: TIPO_TXT[l.tipo] || l.tipo }), l.propiedadTitulo || (l.tipo === 'tasacion' || l.tipo === 'captacion' ? 'Solicitud de tasación' : 'Consulta')]),
          el('div', { class: 'm', text: meta }),
          l.fecha ? el('div', { class: 'm', text: 'Visita: ' + l.fecha + (l.hora ? ' · ' + l.hora : '') }) : '',
          l.mensaje ? el('div', { class: 'm', text: '“' + l.mensaje + '”' }) : '',
          el('div', { class: 'm', text: 'Recibida ' + fecha(l.creado) + ' · ' + l.id }),
        ].filter(Boolean)),
        sel,
      ]);
      cont.appendChild(card);
    });
  }

  // Agenda + calendario (.ics)
  const HORA = { 'Mañana (9–13 h)': '100000', 'Tarde (14–19 h)': '160000' };
  const icsEsc = t => String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  window.descargarIcs = function (id) {
    const l = getLeads().find(x => x.id === id); if (!l || !l.fecha) return;
    const ymd = l.fecha.replace(/-/g, ''), h = HORA[l.hora] || '100000', hf = String(Number(h.slice(0, 2)) + 1).padStart(2, '0') + h.slice(2);
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//miksapropiedades//Agenda//ES', 'BEGIN:VEVENT', 'UID:' + l.id + '@miksapropiedades', 'DTSTAMP:' + stamp,
      'DTSTART:' + ymd + 'T' + h, 'DTEND:' + ymd + 'T' + hf, 'SUMMARY:' + icsEsc('Visita: ' + (l.propiedadTitulo || l.propiedadId)),
      'DESCRIPTION:' + icsEsc('Cliente: ' + l.nombre + '\n' + (l.tel || '') + '\n' + (l.email || '') + '\n' + (l.mensaje || '')),
      'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Recordatorio de visita', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    descargar('visita-' + l.id + '.ics', 'text/calendar;charset=utf-8', ics);
  };
  function descargar(nombre, tipo, contenido) {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = el('a', { href: url, download: nombre }); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function pintarAgenda() {
    const cont = $id('p-agenda'); cont.textContent = '';
    const V = getLeads().filter(l => l.tipo === 'visita' && l.fecha && l.estado !== 'descartado').sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    if (!V.length) { cont.appendChild(el('div', { class: 'empty', style: 'padding:28px' }, [el('p', { text: 'No hay visitas agendadas.' })])); return; }
    V.forEach(l => {
      const d = new Date(l.fecha + 'T12:00:00');
      cont.appendChild(el('div', { class: 'lead-card' }, [
        el('div', {}, [el('h3', { text: d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + (l.hora || '')}), el('div', { class: 'm', text: l.propiedadTitulo || l.propiedadId }), el('div', { class: 'm', text: [l.nombre, l.tel, l.email].filter(Boolean).join(' · ') }), el('span', { class: 'lead-tag', text: LABEL_LEAD[l.estado] || l.estado })]),
        el('button', { type: 'button', class: 'btn btn-ghost', 'data-act': 'descargarIcs', 'data-args': JSON.stringify([l.id]), text: 'Añadir al calendario' }),
      ]));
    });
  }

  // Exportar CSV (neutraliza fórmulas para evitar CSV injection)
  window.exportarLeads = function () {
    const cel = v => { let t = String(v ?? ''); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
    const cols = ['id', 'creado', 'tipo', 'estado', 'nombre', 'email', 'tel', 'propiedadId', 'propiedadTitulo', 'fecha', 'hora', 'mensaje'];
    const csv = [cols.join(',')].concat(getLeads().map(l => cols.map(c => cel(l[c])).join(','))).join('\r\n');
    descargar('consultas-miksapropiedades.csv', 'text/csv;charset=utf-8', '\ufeff' + csv);
  };

  function pintarStats() {
    const t = $id('p-stats'); t.textContent = '';
    t.appendChild(el('tr', {}, ['Aviso', 'Estado', 'Vistas*', 'Contactos*', 'Consultas'].map(h => el('th', { text: h }))));
    const L = getLeads();
    getTodos().forEach(a => {
      const st = getStats(a.id);
      t.appendChild(el('tr', {}, [
        el('td', {}, [el('a', { href: 'propiedad.html?id=' + encodeURIComponent(a.id), text: a.titulo || a.id, style: 'color:var(--ink);font-weight:600' })]),
        el('td', { text: LABEL_ESTADO[a.estado || 'disponible'] }), el('td', { text: a.demo ? '—' : String(st.vistas) }), el('td', { text: a.demo ? '—' : String(st.contactos) }),
        el('td', { text: String(L.filter(l => l.propiedadId === a.id).length) }),
      ]));
    });
  }

  window.panelTab = function (name, btn) {
    ['leads', 'agenda', 'stats'].forEach(n => { $id('tab-' + n).hidden = n !== name; });
    btn.parentNode.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b === btn));
    if (name === 'agenda') pintarAgenda(); if (name === 'stats') pintarStats();
  };
  fEstado.addEventListener('change', pintarLeads); $id('p-tipo').addEventListener('change', pintarLeads);
  kpis(); pintarLeads();
})();
