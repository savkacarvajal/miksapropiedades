(function () {
  const lista = MIKSA_CONFIG.CORREDORES || [];
  if (lista.some(c => /ejemplo/i.test(c.nombre))) $id('corr-note').textContent = 'Perfiles de ejemplo. Reemplázalos por los corredores reales (nombre, foto, N° de inscripción y contacto) en js/config.js.';
  else $id('corr-note').hidden = true;
  const cont = $id('corredores');
  lista.forEach(c => {
    const left = el('div', {}, [
      el('div', { class: 'corr', style: 'margin-bottom:12px' }, [el('div', { class: 'av', text: c.nombre.charAt(0).toUpperCase() }), el('div', {}, [el('b', { text: c.nombre }), el('span', { text: c.cargo })])]),
      el('p', { style: 'margin:0 0 6px;font-weight:700;color:var(--brand);font-size:0.85rem', text: c.especialidad || '' }),
      el('p', { style: 'margin:0 0 12px;color:var(--muted);font-size:0.85rem;line-height:1.5', text: c.bio || '' }),
      el('p', { style: 'margin:0 0 12px;font-size:0.78rem;color:var(--muted)', text: 'N° de inscripción: ' + (c.registro || 'por completar') }),
    ]);
    const wa = waLink(c.tel || MIKSA_CONFIG.AGENCIA.whatsapp, 'Hola ' + c.nombre + ', vi tu perfil en miksapropiedades y quisiera asesoría.');
    const mail = c.email || MIKSA_CONFIG.AGENCIA.email;
    const btns = el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' });
    if (wa) btns.appendChild(el('a', { class: 'btn btn-wa', href: wa, target: '_blank', rel: 'noopener noreferrer', text: 'WhatsApp' }));
    if (validEmail(mail)) btns.appendChild(el('a', { class: 'btn btn-ghost', href: 'mailto:' + mail.trim(), text: 'Correo' }));
    if (!btns.children.length) btns.appendChild(el('span', { class: 'note', text: 'Contacto directo por completar en js/config.js. Mientras tanto, agenda una visita desde cualquier ficha.' }));
    left.appendChild(btns);
    const props = getTodos().filter(a => a.corredor === c.id && (!a.estado || a.estado === 'disponible')).slice(0, 2);
    const right = el('div', {}, [el('p', { style: 'margin:0 0 10px;font-weight:800', text: 'Propiedades a su cargo' })]);
    const grid = el('div', { class: 'props' });
    props.forEach(a => grid.appendChild(crearTarjeta(a)));
    if (!props.length) grid.appendChild(el('p', { style: 'color:var(--muted);font-size:0.9rem', text: 'Sin propiedades disponibles por ahora.' }));
    right.appendChild(grid);
    cont.appendChild(el('div', { class: 'corr-card' }, [left, right]));
  });
})();
