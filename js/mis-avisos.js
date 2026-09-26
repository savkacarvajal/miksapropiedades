(function () {
  const $ = i => document.getElementById(i);
  const s = getSesion();
  if (!s) { $('need-login').hidden = false; return; }
  $('mine').hidden = false;
  $('hello').textContent = 'Hola, ' + (s.nombre || 'bienvenido/a');
  $('who').textContent = s.email;

  function propios() {
    // avisos antiguos sin "owner" se asignan por el correo de contacto
    return getAvisosUsuario().filter(a => (a.owner || (a.contacto || {}).email) === s.email).reverse();
  }
  function fecha(iso) { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }); }

  function pintar() {
    const lista = $('lista'); lista.textContent = '';
    const av = propios();
    $('vacio').hidden = av.length > 0;
    av.forEach(a => {
      const foto = (a.fotos || []).find(f => typeof f === 'string' && f.indexOf('data:image/') === 0);
      const th = el('div', { class: 'th' }, foto ? [el('img', { src: foto, alt: '' })] : []);
      const info = el('div', {}, [
        el('h3', { text: a.titulo || 'Sin título' }),
        el('div', { class: 'meta', text: [formatPrecio(a), LABEL_OP[a.op], a.sector].filter(Boolean).join(' · ') }),
        el('div', { class: 'meta', text: 'Código ' + a.id + (fecha(a.fecha) ? ' · ' + fecha(a.fecha) : '') }),
      ]);
      const st = getStats(a.id), nLeads = getLeads().filter(l => l.propiedadId === a.id).length;
      info.appendChild(el('div', { class: 'meta', text: st.vistas + ' vistas · ' + st.contactos + ' contactos · ' + nLeads + ' consultas (solo este navegador)' }));
      const sel = el('select', { class: 'mini-sel', 'aria-label': 'Estado del aviso', 'data-aviso': a.id });
      Object.keys(LABEL_ESTADO).forEach(k => sel.appendChild(el('option', { value: k, text: LABEL_ESTADO[k], selected: (a.estado || 'disponible') === k ? 'selected' : null })));
      sel.addEventListener('change', () => cambiarEstado(a.id, sel.value));
      const acts = el('div', { class: 'acts' }, [sel,
        el('a', { class: 'btn btn-ghost', href: 'propiedad.html?id=' + encodeURIComponent(a.id), text: 'Ver' }),
        el('button', { class: 'btn btn-danger', type: 'button', 'data-act': 'eliminarAviso', 'data-args': JSON.stringify([a.id, '@this']), text: 'Eliminar' }),
      ]);
      lista.appendChild(el('div', { class: 'arow' }, [th, info, acts]));
    });
  }

  // Eliminación en dos pasos (primer clic pide confirmación, segundo elimina)
  window.eliminarAviso = function (id, btn) {
    if (!btn.classList.contains('confirm')) {
      btn.classList.add('confirm'); btn.textContent = '¿Confirmar?';
      setTimeout(() => { btn.classList.remove('confirm'); btn.textContent = 'Eliminar'; }, 3500);
      return;
    }
    const todos = getAvisosUsuario();
    const i = todos.findIndex(a => a.id === id && (a.owner || (a.contacto || {}).email) === s.email);
    if (i > -1) { todos.splice(i, 1); localStorage.setItem('miksa_avisos', JSON.stringify(todos)); }
    pintar();
  };
  function cambiarEstado(id, estado) {
    const todos = getAvisosUsuario(); const x = todos.find(a => a.id === id);
    if (x) { x.estado = estado; lsSet('miksa_avisos', todos); avisoFlotante('Estado actualizado: ' + LABEL_ESTADO[estado]); }
  }

  // Consultas recibidas en mis avisos
  function pintarConsultas() {
    const ids = propios().map(a => a.id), cont = $id('consultas'); cont.textContent = '';
    const L = getLeads().filter(l => ids.includes(l.propiedadId)).reverse();
    $id('consultas-wrap').hidden = !L.length;
    L.forEach(l => cont.appendChild(el('div', { class: 'arow', style: 'grid-template-columns:minmax(0,1fr)' }, [el('div', {}, [
      el('h3', { text: l.nombre + ' · ' + (l.tipo === 'visita' ? 'Solicita visita' : 'Consulta') }),
      el('div', { class: 'meta', text: [l.email, l.tel].filter(Boolean).join(' · ') }),
      el('div', { class: 'meta', text: (l.propiedadTitulo || '') + (l.fecha ? ' · ' + l.fecha + ' ' + (l.hora || '') : '') }),
      l.mensaje ? el('div', { class: 'meta', text: '“' + l.mensaje + '”' }) : '',
    ].filter(Boolean))])));
  }

  // Búsquedas guardadas (con contador de propiedades nuevas desde que se guardó)
  function pintarBusquedas() {
    const cont = $id('busquedas'); cont.textContent = '';
    const B = getBusquedas(); $id('busquedas-wrap').hidden = !B.length;
    B.forEach(b => {
      const p = new URLSearchParams(b.qs); const fl = {};
      ['q', 'op', 'tipo', 'sector', 'dorm', 'pmax', 'estado'].forEach(k => { fl[k] = (p.get(k) || '').trim(); }); if (fl.estado !== 'todas') fl.estado = 'disp';
      const nuevas = filtrarLista(getTodos(), fl).filter(a => !(b.visto || []).includes(a.id)).length;
      cont.appendChild(el('div', { class: 'arow', style: 'grid-template-columns:minmax(0,1fr) auto' }, [
        el('div', {}, [el('h3', { text: b.nombre }), el('div', { class: 'meta', text: nuevas ? nuevas + ' propiedades nuevas desde que guardaste la búsqueda' : 'Sin novedades' })]),
        el('div', { class: 'acts' }, [el('a', { class: 'btn btn-brand', href: 'listado.html' + b.qs, text: 'Ver' }), el('button', { type: 'button', class: 'btn btn-danger', 'data-act': 'borrarBusqueda', 'data-args': JSON.stringify([b.id]), text: 'Quitar' })]),
      ]));
    });
  }
  window.borrarBusqueda = function (id) { lsSet('miksa_busquedas', getBusquedas().filter(b => b.id !== id)); pintarBusquedas(); };

  pintar(); pintarConsultas(); pintarBusquedas();
})();
