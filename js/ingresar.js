  // ─── PASSWORD HASH (PBKDF2-SHA256 + salt por usuario) ───
  const toHex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  const fromHex = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
  async function hashPwd(pwd, saltHex) {
    if (!window.crypto || !crypto.subtle) throw new Error('nocrypto');
    const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
    const key  = await crypto.subtle.importKey('raw', new TextEncoder().encode(pwd), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 150000 }, key, 256);
    return { salt: toHex(salt), hash: toHex(bits) };
  }
  const CRYPTO_ERR = 'Tu navegador no permite cifrar la contraseña (abre el sitio por https).';

  // ─── TAB SWITCH ───
  function switchTab(tab) {
    ['login','register'].forEach(t => {
      document.getElementById('panel-' + t).classList.toggle('active', t === tab);
      document.getElementById('tab-' + t).className = 'tab-btn ' + (t === tab ? 'active' : 'inactive');
    });
    clearAlerts();
  }

  // ─── ALERTS ───
  function showAlert(type, msg) {
    clearAlerts();
    const el = document.getElementById('alert-' + type);
    el.textContent = msg;
    el.classList.add('show');
  }
  function clearAlerts() {
    ['success','error'].forEach(t => {
      const el = document.getElementById('alert-' + t);
      el.textContent = '';
      el.classList.remove('show');
    });
  }

  // ─── FIELD ERROR ───
  function setError(id, show) {
    const input = document.getElementById(id);
    const err   = document.getElementById('err-' + id);
    if (!input || !err) return;
    input.classList.toggle('error', show);
    err.classList.toggle('show', show);
  }

  // ─── PASSWORD TOGGLE ───
  function togglePwd(inputId, btn) {
    const input = document.getElementById(inputId);
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.innerHTML = isText
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  }

  // ─── PASSWORD STRENGTH ───
  function checkPwdStrength(val) {
    let score = 0;
    if (val.length >= 8)   score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const colors = ['#EDE4DC','#EDE4DC','#EDE4DC','#EDE4DC'];
    const labels = ['','Débil','Regular','Buena','Fuerte'];
    const active = ['#DC2626','#F59E0B','#22C55E','#16A34A'];
    for (let i = 0; i < 4; i++) {
      document.getElementById('sb'+(i+1)).style.background = i < score ? active[score-1] : '#EDE4DC';
    }
    document.getElementById('strength-label').textContent = val ? labels[score] : '';
    document.getElementById('strength-label').style.color = score > 0 ? active[score-1] : '#655E58';
  }

  // ─── LOGIN ───
  async function handleLogin() {
    clearAlerts();
    const email = document.getElementById('login-email').value.trim();
    const pwd   = document.getElementById('login-pwd').value;
    let valid   = true;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setError('login-email', !emailOk); if (!emailOk) valid = false;
    setError('login-pwd', !pwd);       if (!pwd)     valid = false;
    if (!valid) return;

    // Límite de intentos: 5 fallos → bloqueo de 60 s (mitigación en cliente; el control real va en el servidor)
    const th = getThrottle();
    if (Date.now() < th.until) { showAlert('error', 'Demasiados intentos. Espera ' + Math.ceil((th.until - Date.now())/1000) + ' s.'); return; }

    const users = getUsuarios();
    const user  = users.find(u => u.email === email);
    let ok = false;
    if (user) {
      try {
        if (user.hash) {
          ok = (await hashPwd(pwd, user.salt)).hash === user.hash;
        } else if (user.pwd === pwd) {           // cuenta antigua: migrar a hash
          Object.assign(user, await hashPwd(pwd)); delete user.pwd;
          guardarUsuarios(users);
          ok = true;
        }
      } catch (e) { showAlert('error', CRYPTO_ERR); return; }
    }
    if (!ok) {
      th.n++; if (th.n >= 5) { th.until = Date.now() + 60000; th.n = 0; }
      setThrottle(th);
      showAlert('error', 'Correo o contraseña incorrectos. Verifica tus datos.');
      return;
    }

    limpiarThrottle();
    setSesion({ email: user.email, nombre: user.nombre, exp: Date.now() + 7*24*3600*1000 });
    showAlert('success', '¡Bienvenido de vuelta, ' + user.nombre + '! Redirigiendo...');
    setTimeout(() => { window.location.href = 'index.html'; }, 1400);
  }

  // ─── REGISTER ───
  async function handleRegister() {
    clearAlerts();
    const nombre  = document.getElementById('reg-nombre').value.trim();
    const apellido= document.getElementById('reg-apellido').value.trim();
    const email   = document.getElementById('reg-email').value.trim();
    const pwd     = document.getElementById('reg-pwd').value;
    const pwd2    = document.getElementById('reg-pwd2').value;
    const terms   = document.getElementById('reg-terms').checked;
    let valid     = true;

    setError('reg-nombre',  !nombre);          if (!nombre)   valid = false;
    setError('reg-apellido',!apellido);         if (!apellido) valid = false;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setError('reg-email', !emailOk);            if (!emailOk)  valid = false;
    setError('reg-pwd',   pwd.length < 8);      if (pwd.length < 8) valid = false;
    setError('reg-pwd2',  pwd !== pwd2);        if (pwd !== pwd2)   valid = false;
    setError('reg-terms', !terms);              if (!terms)    valid = false;
    if (!valid) return;

    const users = getUsuarios();
    if (users.find(u => u.email === email)) {
      showAlert('error', 'No pudimos crear la cuenta con esos datos. Si ya tienes cuenta, ingresa.');
      return;
    }

    let cred;
    try { cred = await hashPwd(pwd); } catch (e) { showAlert('error', CRYPTO_ERR); return; }
    users.push({ nombre, apellido, email, salt: cred.salt, hash: cred.hash, tel: document.getElementById('reg-tel').value.trim(), fecha: new Date().toISOString() });
    guardarUsuarios(users);
    setSesion({ email, nombre, exp: Date.now() + 7*24*3600*1000 });

    showAlert('success', '¡Cuenta creada con éxito! Bienvenido/a, ' + nombre + '. Redirigiendo...');
    setTimeout(() => { window.location.href = 'index.html'; }, 1600);
  }

  // ─── INIT — check session ───
  window.addEventListener('DOMContentLoaded', () => {
    const session = getSesion();
    if (session) {
      showAlert('success', 'Ya estás conectado como ' + session.nombre + '. Redirigiendo...');
      setTimeout(() => { window.location.href = 'index.html'; }, 1200);
    }
  });

document.getElementById('reg-pwd').addEventListener('input', function () { checkPwdStrength(this.value); });

document.getElementById('panel-login').addEventListener('submit', function (e) { e.preventDefault(); handleLogin(); });
document.getElementById('panel-register').addEventListener('submit', function (e) { e.preventDefault(); handleRegister(); });
