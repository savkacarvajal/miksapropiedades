// Menú móvil de la barra superior (viewport 390 px).
__run(async T => {
  const burger = document.querySelector('.tn-burger'), menu = document.getElementById('mobile-menu');
  T.ok('hamburguesa visible en móvil', getComputedStyle(burger).display !== 'none');
  T.ok('enlaces de escritorio ocultos', getComputedStyle(document.querySelector('.tn-links')).display === 'none');
  T.ok('menú cerrado al inicio', menu.hidden && burger.getAttribute('aria-expanded') === 'false');
  burger.click();
  T.ok('abre el menú (aria-expanded)', !menu.hidden && burger.getAttribute('aria-expanded') === 'true');
  T.ok('menú lista todas las secciones', menu.querySelectorAll('a').length >= 7);
  const w = window.setTimeout; menu.querySelector('a').addEventListener('click', e => e.preventDefault());
  menu.querySelector('a').click();
  T.ok('tocar un enlace cierra el menú', menu.hidden);
  T.ok('botón Publicar sigue visible', getComputedStyle(document.querySelector('.btn-pub')).display !== 'none');
});
