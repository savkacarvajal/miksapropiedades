// Registro, login, hash de contraseñas, bloqueo por intentos, migración de cuentas antiguas y formularios reales.
__run(async T => {
  const s = window.setTimeout; window.setTimeout = (f, ms) => (ms > 1000 ? 0 : s(f, ms));   // evita las redirecciones a index.html
  const users = () => JSON.parse(localStorage.getItem('miksa_users') || '[]');
  const wait = async () => { await T.sleep(0); await T.waitFor(() => !document.querySelector('.alert.show') === false, 3000); };

  T.eq('el panel de login es un <form>', document.getElementById('panel-login').tagName, 'FORM');
  T.eq('el panel de registro es un <form>', document.getElementById('panel-register').tagName, 'FORM');

  // registro vacío → errores de campo
  T.submit(document.getElementById('panel-register')); await T.sleep(30);
  T.ok('registro vacío marca errores', document.getElementById('err-reg-nombre').classList.contains('show'));

  // registro válido
  document.querySelector('[data-act="switchTab"][data-args*="register"]').click();
  T.ok('cambia a la pestaña de registro (data-act)', document.getElementById('panel-register').classList.contains('active'));
  const v = (id, x) => { document.getElementById(id).value = x; };
  v('reg-nombre', 'Ana'); v('reg-apellido', 'Lopez'); v('reg-email', 'ana@test.cl'); v('reg-pwd', 'claveSegura1'); v('reg-pwd2', 'claveSegura1');
  document.getElementById('reg-terms').checked = true;
  T.submit(document.getElementById('panel-register'));
  await T.waitFor(() => users().length === 1);
  const u = users()[0];
  T.ok('guarda hash y sal', !!u.hash && !!u.salt && u.hash.length === 64);
  T.ok('no guarda la contraseña en claro', !u.pwd && JSON.stringify(u).indexOf('claveSegura1') < 0);
  const ses = JSON.parse(localStorage.getItem('miksa_session'));
  T.ok('crea sesión con expiración', !!ses && ses.exp > Date.now() && ses.email === 'ana@test.cl');

  // correo repetido: mensaje que no confirma si la cuenta existe
  localStorage.removeItem('miksa_session');
  T.submit(document.getElementById('panel-register')); await T.sleep(400);
  T.ok('correo repetido → mensaje neutro', document.getElementById('alert-error').textContent.indexOf('No pudimos crear la cuenta') > -1 && users().length === 1);

  // login: 5 fallos → bloqueo; luego correcto
  v('login-email', 'ana@test.cl'); v('login-pwd', 'mala');
  for (let i = 0; i < 5; i++) { T.submit(document.getElementById('panel-login')); await T.sleep(250); }
  const th = JSON.parse(localStorage.getItem('miksa_throttle'));
  T.ok('5 fallos activan el bloqueo', th && th.until > Date.now());
  T.submit(document.getElementById('panel-login')); await T.sleep(100);
  T.ok('durante el bloqueo se rechaza el intento', document.getElementById('alert-error').textContent.indexOf('Demasiados intentos') > -1);
  localStorage.removeItem('miksa_throttle');
  v('login-pwd', 'claveSegura1'); T.submit(document.getElementById('panel-login'));
  T.ok('login correcto crea sesión', await T.waitFor(() => !!localStorage.getItem('miksa_session')));

  // migración de cuenta antigua (contraseña en claro → hash)
  localStorage.clear();
  localStorage.setItem('miksa_users', JSON.stringify([{ nombre: 'Old', email: 'old@t.cl', pwd: 'vieja1234' }]));
  v('login-email', 'old@t.cl'); v('login-pwd', 'vieja1234'); T.submit(document.getElementById('panel-login'));
  T.ok('cuenta antigua migrada a hash', await T.waitFor(() => { const o = users()[0]; return o && o.hash && !o.pwd; }));
});
