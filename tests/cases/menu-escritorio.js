// Barra superior en escritorio y estado de sesión.
__run(async T => {
  T.ok('enlaces visibles en escritorio', getComputedStyle(document.querySelector('.tn-links')).display !== 'none');
  T.ok('hamburguesa oculta en escritorio', getComputedStyle(document.querySelector('.tn-burger')).display === 'none');
  T.ok('enlace de la página actual resaltado', !!document.querySelector('.tn-links a.current'));
  T.ok('sin sesión: "Ingresar"', document.querySelector('.tn-login').textContent === 'Ingresar');
  T.ok('contador de favoritos oculto en 0', document.querySelector('[data-fav-count]').hidden);
  toggleFav('DEMO-1'); toggleFav('DEMO-2');
  T.eq('contador de favoritos = 2', document.querySelector('[data-fav-count]').textContent, '2');
  lsSet('miksa_session', { email: 'a@b.cl', nombre: 'Ana', exp: Date.now() + 1e6 });
  T.ok('con sesión el enlace pasaría a "Mis avisos" al recargar', getSesion() !== null);
});
