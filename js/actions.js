// Delegación de eventos: reemplaza los onclick="..." inline (permite CSP sin 'unsafe-inline')
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-act]');
  if (!el) return;
  var fn = window[el.dataset.act];
  if (typeof fn !== 'function') return;
  var args = JSON.parse(el.dataset.args || '[]').map(function (a) { return a === '@this' ? el : a; });
  fn.apply(null, args);
});
