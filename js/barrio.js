// Descripciones referenciales y generales de cada barrio (complétalas con información local verificada).
const BARRIOS = {
  'Av. del Mar': 'Sector costero de La Serena junto a la playa, con edificios frente al mar, hoteles y servicios turísticos. Muy buscado para segunda vivienda e inversión.',
  'El Faro': 'Zona del Faro Monumental, en la costanera de La Serena. Ambiente turístico y residencial, cerca de la playa y de la Av. del Mar.',
  'Las Compañías': 'Amplio sector residencial en el norte de La Serena, con comercio, colegios y buena oferta de casas y departamentos.',
  'Centro La Serena': 'Casco histórico de La Serena: Plaza de Armas, comercio, servicios y patrimonio. Ideal para quienes buscan cercanía a todo.',
  'Serena Golf': 'Sector residencial de condominios y casas cercano al mar, con áreas verdes y ambiente tranquilo.',
  'Valle del Sol': 'Sector residencial de La Serena con condominios y oferta de casas, orientado a familias.',
  'Antofagasta (La Serena)': 'Zona residencial y comercial de La Serena, con buena conectividad urbana.',
  'Guayacán': 'Barrio costero de Coquimbo con vista a la bahía, ambiente residencial y cercanía a servicios portuarios y empresariales.',
  'La Herradura': 'Sector residencial costero de Coquimbo, cercano a la bahía y a la playa, con casas amplias y buena plusvalía.',
  'Peñuelas': 'Sector residencial de Coquimbo con conectividad hacia La Serena, con oferta de departamentos y casas.',
  'Centro Coquimbo': 'Centro comercial, portuario y cultural de Coquimbo, con servicios, transporte y vida de barrio.',
  'Pan de Azúcar': 'Sector de playa y parcelas al sur de Coquimbo, muy usado como segunda vivienda y arriendo de temporada.',
  'Puerto Aldea': 'Caleta costera de ritmo tranquilo, buscada para descanso y arriendo de temporada.',
};
(function () {
  const s = new URLSearchParams(window.location.search).get('s');
  const todos = getTodos();
  if (!s || !BARRIOS[s]) {
    $id('b-index').hidden = false;
    const g = $id('b-grid');
    Object.keys(BARRIOS).forEach(b => {
      const n = todos.filter(a => a.sector === b && (!a.estado || a.estado === 'disponible')).length;
      g.appendChild(el('a', { class: 'barrio-card', href: 'barrio.html?s=' + encodeURIComponent(b) }, [el('span', { class: 'badge-soft', text: comunaDe(b) }), el('h3', { text: b }), el('p', { text: n + (n === 1 ? ' propiedad disponible' : ' propiedades disponibles') })]));
    });
    return;
  }
  $id('b-detail').hidden = false;
  document.title = 'Propiedades en ' + s + ' — miksapropiedades';
  $id('b-crumb').textContent = s;
  $id('b-com').textContent = comunaDe(s);
  $id('b-title').textContent = s + ', ' + comunaDe(s);
  $id('b-blurb').textContent = BARRIOS[s] + ' (Descripción referencial).';
  const disp = todos.filter(a => a.sector === s && (!a.estado || a.estado === 'disponible'));
  const ventas = disp.filter(a => a.op === 'venta' && Number(a.precio) > 0 && Number(a.superficie) > 0);
  const arr = disp.filter(a => a.op === 'arriendo' && Number(a.precio) > 0);
  const prom = l => l.reduce((t, x) => t + x, 0) / l.length;
  const stats = [[String(disp.length), 'Disponibles']];
  if (ventas.length) stats.push([prom(ventas.map(a => a.precio / a.superficie)).toLocaleString('es-CL', { maximumFractionDigits: 1 }), 'UF/m² venta']);
  if (arr.length) stats.push([prom(arr.map(a => Number(a.precio))).toLocaleString('es-CL', { maximumFractionDigits: 1 }), 'UF/mes arriendo']);
  stats.forEach(([v, k]) => $id('b-stats').appendChild(el('div', { class: 'fact' }, [el('b', { text: v }), el('span', { text: k })])));
  const q = encodeURIComponent(s);
  $id('b-actions').appendChild(el('a', { class: 'btn btn-brand', href: 'listado.html?sector=' + q, text: 'Ver con filtros' }));
  $id('b-actions').appendChild(el('a', { class: 'btn btn-ghost', href: 'mapa.html?sector=' + q, text: 'Ver en el mapa' }));
  $id('b-actions').appendChild(el('a', { class: 'btn btn-ghost', href: 'tasacion.html?sector=' + q, text: 'Tasar mi propiedad aquí' }));
  disp.forEach(a => $id('b-props').appendChild(crearTarjeta(a)));
  $id('b-empty').hidden = disp.length > 0;
})();
