// Portada: cifras calculadas, anclas, menú móvil y buscador.
__run(async T => {
  const stat = k => document.querySelector('[data-stat="' + k + '"]').textContent;
  T.eq('cifra: propiedades disponibles (3 reales + demo)', stat('disp'), '9');
  T.eq('cifra: barrios', stat('barrios'), '16');
  T.eq('cifra: corredores', stat('corredores'), '3');
  T.eq('cifra: guías', stat('guias'), '4');
  T.ok('anclas de sección existen', ['destacados', 'servicios', 'herramientas', 'testimonios', 'contacto'].every(i => document.getElementById(i)));
  T.ok('sin handlers inline', !document.querySelector('[onclick],[onmouseover],[oninput]'));
  T.ok('chips "Popular" llevan a barrios', !!document.querySelector('a[href^="barrio.html?s="]'));
  T.ok('tarjetas destacadas clicables (data-href)', document.querySelectorAll('[data-href]').length === 5);
  T.ok('buscador tiene ids', !!document.getElementById('h-op') && !!document.getElementById('h-tipo') && !!document.getElementById('h-q'));
});
