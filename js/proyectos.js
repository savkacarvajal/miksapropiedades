(function () {
  const fEstado = $id('pf-estado'), fSector = $id('pf-sector'), fOrden = $id('pf-orden');
  [...new Set(PROYECTOS.map(p => p.sector))].forEach(s => fSector.appendChild(el('option', { value: s, text: s })));
  if (!PROYECTOS.some(p => p.demo)) $id('pr-note').hidden = true;
  const params = new URLSearchParams(window.location.search);
  ['estado', 'sector'].forEach(k => { const v = params.get(k); if (v) (k === 'estado' ? fEstado : fSector).value = v; });

  const desde = p => Math.min.apply(null, p.tipologias.map(t => t.desde));
  const fechaEntrega = iso => { const d = new Date(iso + '-01T12:00:00'); return isNaN(d) ? '' : d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }); };
  function tarjeta(p) {
    const ph = el('div', { class: 'ph' }, [el('img', { src: p.fotos[0], alt: p.nombre, loading: 'lazy' }), el('span', { class: 'tag', text: LABEL_PROY[p.estado] })]);
    const body = el('div', { class: 'pb' }, [
      el('div', { class: 'price', text: 'Desde UF ' + desde(p).toLocaleString('es-CL') }),
      el('h3', { text: p.nombre }),
      el('div', { class: 'loc', text: p.sector + ', ' + comunaDe(p.sector) + ' · ' + p.inmobiliaria }),
      el('div', { class: 'specs' }, [el('span', { text: 'Entrega ' + fechaEntrega(p.entrega) }), el('span', { text: p.tipologias.reduce((t, x) => t + x.disp, 0) + ' unidades' })]),
      el('div', { class: 'progress', style: 'margin-top:12px' }, [el('div', { style: 'width:' + p.avance + '%' })]),
    ]);
    return el('div', { class: 'pcard-w pj-card' }, [el('a', { class: 'pcard', href: 'proyecto.html?id=' + encodeURIComponent(p.id) }, [ph, body])]);
  }
  function render() {
    let L = PROYECTOS.filter(p => (!fEstado.value || p.estado === fEstado.value) && (!fSector.value || p.sector === fSector.value));
    L = L.slice().sort((a, b) => fOrden.value === 'precio' ? desde(a) - desde(b) : a.entrega.localeCompare(b.entrega));
    const g = $id('pr-grid'); g.textContent = ''; L.forEach(p => g.appendChild(tarjeta(p)));
    $id('pr-empty').hidden = L.length > 0;
  }
  [fEstado, fSector, fOrden].forEach(x => x.addEventListener('change', render));
  render();
})();
