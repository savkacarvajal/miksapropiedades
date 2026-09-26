(function () {
  function pintar() {
    const cont = $id('favs'); cont.textContent = '';
    const lista = getFavs().map(getPorId).filter(Boolean);
    $id('fav-sub').textContent = lista.length ? lista.length + (lista.length === 1 ? ' propiedad guardada' : ' propiedades guardadas') : '';
    $id('fav-empty').hidden = lista.length > 0;
    lista.forEach(a => cont.appendChild(crearTarjeta(a)));
  }
  document.addEventListener('favs-changed', () => {
    const n = document.querySelectorAll('#favs .pcard-w').length;
    $id('fav-empty').hidden = n > 0;
    $id('fav-sub').textContent = n ? n + (n === 1 ? ' propiedad guardada' : ' propiedades guardadas') : '';
  });
  pintar();
})();
