// Propiedades reales de la agencia: precio en pesos exacto y demos ocultas sin el flag.
__run(async T => {
  var ids = getTodos().map(function (a) { return a.id; });
  T.ok('las 3 reales están', ['MP-001', 'MP-002', 'MP-003'].every(function (i) { return ids.indexOf(i) > -1; }));
  T.eq('precio exacto casa Bosque Oriente', formatPrecio(getPorId('MP-001')), '$155.000.000');
  T.eq('precio exacto casa San Ramón', formatPrecio(getPorId('MP-002')), '$100.000.000');
  T.eq('precio exacto terreno', formatPrecio(getPorId('MP-003')), '$28.000.000');
  T.ok('precio en UF referencial coherente', getPorId('MP-002').precio === Math.round(100000000 / MIKSA_CONFIG.UF_FALLBACK));
  T.ok('sectores nuevos con coordenadas y comuna', ['Bosque Oriente', 'Palmas San Ramón IV', 'Cruz de Caña'].every(function (s) { return !!coordsDe({ id: 'x', sector: s }) && comunaDe(s) === 'Coquimbo'; }));
  T.ok('todas las fotos existen', (await Promise.all(getPorId('MP-001').fotos.concat(getPorId('MP-003').fotos, getPorId('MP-002').fotos).map(function (f) { return fetch(f).then(function (r) { return r.ok; }); }))).every(Boolean));
  // sin el flag no se ven las de demostración
  localStorage.setItem('miksa_demo', '0');
  var sin = getTodos().map(function (a) { return a.id; });
  T.ok('sin flag: solo reales', sin.length === 3 && sin.every(function (i) { return i.indexOf('MP-') === 0; }));
  localStorage.setItem('miksa_demo', '1');
});
