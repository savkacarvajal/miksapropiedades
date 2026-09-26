__run(async T => {
  T.eq('2 favoritos guardados', document.querySelectorAll('#favs .pcard-w').length, 2);
  T.ok('subtítulo con conteo', document.getElementById('fav-sub').textContent.indexOf('2 propiedades') === 0);
  T.ok('estado vacío oculto', document.getElementById('fav-empty').hidden);
  document.querySelector('#favs .fav-btn').click();
  T.eq('quitar un favorito lo elimina de la página', document.querySelectorAll('#favs .pcard-w').length, 1);
  document.querySelector('#favs .fav-btn').click();
  T.ok('sin favoritos aparece el estado vacío', !document.getElementById('fav-empty').hidden && getFavs().length === 0);
});
