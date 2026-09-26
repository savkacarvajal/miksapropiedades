  

// Buscador del hero → listado con filtros
(function () {
  function buscar() {
    var p = new URLSearchParams();
    p.set('op', document.getElementById('h-op').value);
    p.set('tipo', document.getElementById('h-tipo').value);
    var q = document.getElementById('h-q').value.trim();
    if (q) p.set('q', q);
    window.location.href = 'listado.html?' + p.toString();
  }
  document.getElementById('h-buscar').addEventListener('click', buscar);
  document.getElementById('h-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') buscar(); });

  // Tarjetas destacadas clicables
  document.querySelectorAll('[data-href]').forEach(function (c) {
    c.addEventListener('click', function () { window.location.href = c.dataset.href; });
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter') window.location.href = c.dataset.href; });
  });
})();

// Cifras reales calculadas con los datos del sitio
(function () {
  var disp = getTodos().filter(function (a) { return !a.estado || a.estado === 'disponible'; }).length;
  var v = { disp: disp, barrios: Object.keys(SECTORES).reduce(function (t, c) { return t + SECTORES[c].length; }, 0), corredores: (MIKSA_CONFIG.CORREDORES || []).length, guias: 4 };
  document.querySelectorAll('[data-stat]').forEach(function (n) { n.textContent = String(v[n.dataset.stat] || 0); });
})();
