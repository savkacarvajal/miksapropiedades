// Selector de ubicación exacta en «Publicar»: clic en el mapa para marcar, arrastrar para ajustar. window.PIN = [lat, lng] | null
(function () {
  const BOX = { s: -30.35, n: -29.70, w: -71.60, e: -71.10 };            // La Serena–Coquimbo (+ margen)
  const dentro = ll => ll.lat >= BOX.s && ll.lat <= BOX.n && ll.lng >= BOX.w && ll.lng <= BOX.e;
  const panel = $id('step2'), sector = $id('sector'), hint = $id('pin-hint'), clear = $id('pin-clear');
  const HINT = hint.textContent;
  let map = null, marker = null;
  window.PIN = null;

  function poner(ll) {
    window.PIN = [Number(ll.lat.toFixed(6)), Number(ll.lng.toFixed(6))];
    if (!marker) {
      marker = L.marker(ll, { draggable: true, alt: 'Ubicación de la propiedad', title: 'Arrastra para ajustar' }).addTo(map);
      marker.on('dragend', () => { const p = marker.getLatLng(); if (dentro(p)) window.PIN = [Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6))]; else { marker.setLatLng(window.PIN); hint.textContent = 'Ese punto queda fuera de La Serena y Coquimbo; volvimos al anterior.'; } });
    } else marker.setLatLng(ll);
    clear.hidden = false; hint.textContent = HINT;
  }
  window.pinLimpiar = function () {
    if (marker) { map.removeLayer(marker); marker = null; }
    window.PIN = null; clear.hidden = true;
  };
  function iniciar() {
    if (map) { map.invalidateSize(); return; }
    map = L.map('pin-map', { scrollWheelZoom: false }).setView([-29.94, -71.31], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' }).addTo(map);
    map.on('click', e => { if (dentro(e.latlng)) poner(e.latlng); else hint.textContent = 'Marca un punto dentro de La Serena o Coquimbo.'; });
    setTimeout(() => map.invalidateSize(), 200);
    centrar();
  }
  function centrar() { const c = COORDS[sector.value]; if (map && c && !window.PIN) map.setView(c, 14); }
  sector.addEventListener('change', centrar);
  new MutationObserver(() => { if (panel.classList.contains('active')) iniciar(); }).observe(panel, { attributes: true, attributeFilter: ['class'] });
})();
