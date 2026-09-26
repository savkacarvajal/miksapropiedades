// ── Capa de datos ─────────────────────────────────────────────────────────────
// ÚNICO archivo que toca el almacenamiento del navegador. Hoy usa localStorage; para pasar a un backend
// (p. ej. Supabase) se reemplaza este archivo manteniendo estas funciones (hoy son síncronas; con backend
// pasarán a ser async y habrá que agregar `await` en quienes las llaman). Una prueba estática impide usar
// localStorage fuera de este archivo.

// ── Primitivas, a prueba de fallos (modo privado, cuota llena, datos corruptos) ──
function lsGet(k, def) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? def : v; } catch (e) { return def; } }
// Las propiedades de demostración (fotos de relleno) solo se ven con localStorage.miksa_demo = 1 (lo usan las pruebas automáticas)
function demoActivo() { return lsGet('miksa_demo', 0) == 1; }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* sin acceso */ } }
const lista = k => { const v = lsGet(k, []); return Array.isArray(v) ? v : []; };

// ── Sesión y usuarios ──
function getSesion() {
  const s = lsGet('miksa_session', null);
  if (s && s.exp && Date.now() > s.exp) { lsDel('miksa_session'); return null; }
  return s;
}
function setSesion(s) { return lsSet('miksa_session', s); }
function limpiarSesion() { lsDel('miksa_session'); }
function getUsuarios() { return lista('miksa_users'); }
function guardarUsuarios(l) { return lsSet('miksa_users', l); }

// Control de intentos de login (en cliente; el control real irá en el servidor)
function getThrottle() { return lsGet('miksa_throttle', { n: 0, until: 0 }); }
function setThrottle(t) { return lsSet('miksa_throttle', t); }
function limpiarThrottle() { lsDel('miksa_throttle'); }

// ── Avisos publicados por los usuarios ──
function getAvisosUsuario() { return lista('miksa_avisos'); }
function guardarAviso(a) { const l = getAvisosUsuario(); l.push(a); return lsSet('miksa_avisos', l); }
function actualizarAviso(id, cambios) {
  const l = getAvisosUsuario(), x = l.find(a => a.id === id);
  if (!x) return false; Object.assign(x, cambios); return lsSet('miksa_avisos', l);
}
function eliminarAviso(id, ownerEmail) {
  const l = getAvisosUsuario(), i = l.findIndex(a => a.id === id && (a.owner || (a.contacto || {}).email) === ownerEmail);
  if (i < 0) return false; l.splice(i, 1); return lsSet('miksa_avisos', l);
}

// ── Leads: consultas, visitas, tasaciones, captación, cotizaciones y búsquedas encargadas ──
function getLeads() { return lista('miksa_leads'); }
function guardarLead(l) {
  const todos = getLeads();
  const lead = Object.assign({ id: 'L-' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8).toUpperCase() : Date.now()), creado: new Date().toISOString(), estado: 'nuevo' }, l);
  todos.push(lead);
  return lsSet('miksa_leads', todos) ? lead : null;
}
function actualizarLead(id, cambios) {
  const todos = getLeads(), l = todos.find(x => x.id === id);
  if (!l) return false; Object.assign(l, cambios); return lsSet('miksa_leads', todos);
}

// ── Favoritos y comparador ──
function getFavs() { return lista('miksa_favs'); }
function setFavs(l) { return lsSet('miksa_favs', l); }
function getComp() { return lista('miksa_compare'); }
function setComp(l) { return lsSet('miksa_compare', l); }

// ── Búsquedas guardadas ──
function getBusquedas() { return lista('miksa_busquedas'); }
function setBusquedas(l) { return lsSet('miksa_busquedas', l); }

// ── Estadísticas por aviso (solo de este navegador hasta que exista backend) ──
function sumarStat(id, campo) { const s = lsGet('miksa_stats', {}); s[id] = s[id] || { vistas: 0, contactos: 0 }; s[id][campo]++; lsSet('miksa_stats', s); }
function getStats(id) { return (lsGet('miksa_stats', {})[id]) || { vistas: 0, contactos: 0 }; }
// true la primera vez que se ve un aviso en esta pestaña (sessionStorage)
function marcarVista(id) {
  try { if (sessionStorage.getItem('v_' + id)) return false; sessionStorage.setItem('v_' + id, '1'); return true; } catch (e) { return false; }
}

// ── Caché de la UF y borrador del formulario de publicar ──
function getUFCache() { return lsGet('miksa_uf', null); }
function setUFCache(o) { return lsSet('miksa_uf', o); }
function getBorrador() { return lsGet('miksa_borrador', null); }
function setBorrador(o) { return lsSet('miksa_borrador', o); }
function limpiarBorrador() { lsDel('miksa_borrador'); }
