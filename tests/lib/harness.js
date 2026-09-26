// Arnés mínimo de pruebas dentro de la página. Uso en un caso:  __run(async T => { T.ok('algo', cond); });
(function () {
  const T = { results: [], done: false };
  T.ok = (name, cond, detail) => { T.results.push({ name: name, pass: !!cond, detail: detail === undefined || cond ? undefined : String(detail) }); };
  T.eq = (name, a, b) => T.ok(name, a === b, 'obtenido ' + JSON.stringify(a) + ', esperado ' + JSON.stringify(b));
  T.near = (a, b, eps) => Math.abs(a - b) <= (eps === undefined ? 1e-9 : eps);
  T.sleep = ms => new Promise(r => setTimeout(r, ms));
  T.waitFor = async (fn, ms) => {
    const t = Date.now();
    while (Date.now() - t < (ms || 5000)) { try { if (await fn()) return true; } catch (e) { /* aún no */ } await T.sleep(40); }
    return false;
  };
  T.submit = form => form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  T.change = (el, v) => { if (v !== undefined) el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
  T.input = (el, v) => { if (v !== undefined) el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  window.T = T;
  window.__run = async fn => {
    try { await fn(T); } catch (e) { T.results.push({ name: 'excepción en la prueba: ' + e.message, pass: false, detail: e.stack }); }
    T.done = true;
  };
})();
