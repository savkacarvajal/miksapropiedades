// Auditoría de accesibilidad ligera (subconjunto de reglas WCAG 2.1 AA verificables sin librerías).
// Se evalúa en cada página; devuelve una lista de problemas { regla, detalle }.
window.__a11y = function () {
  const out = [], seen = new Set();
  const add = (regla, detalle) => { const k = regla + '|' + detalle; if (!seen.has(k)) { seen.add(k); out.push({ regla: regla, detalle: detalle }); } };
  const sel = e => { let s = e.tagName.toLowerCase(); if (e.id) s += '#' + e.id; else if (e.className && typeof e.className === 'string') s += '.' + e.className.trim().split(/\s+/)[0]; return s; };
  const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };

  // ── Contraste de texto ──
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  function fondo(e) {
    let stack = [];
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== 'none') return null;                    // sobre imagen / degradado: no se puede evaluar
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const done = new Set();
  for (let t; (t = walker.nextNode());) {
    if (!t.nodeValue.trim()) continue;
    const e = t.parentElement;
    if (!e || done.has(e) || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'OPTION'].includes(e.tagName) || !vis(e) || e.closest('[aria-hidden="true"],[hidden],.leaflet-container,canvas,svg')) continue;
    done.add(e);
    if (e.closest('a,button,input,select,textarea,label') && e.closest(':disabled')) continue;
    // texto sobre una foto de fondo (hero, tarjetas destacadas): la foto es un <img> absoluto que cubre a un ancestro
    let sobreFoto = false;
    for (let n = e, k = 0; n && k < 6 && !sobreFoto; n = n.parentElement, k++) {
      const w = n.getBoundingClientRect().width;
      sobreFoto = [...n.children].some(ch => ch.tagName === 'IMG' && getComputedStyle(ch).position === 'absolute' && ch.getBoundingClientRect().width >= w * 0.8);
    }
    if (sobreFoto || e.closest('.card-lift')) continue;   // las tarjetas destacadas llevan texto blanco sobre foto con degradado oscuro
    const cs = getComputedStyle(e), fg = parse(cs.color), bg = fondo(e);
    if (!fg || !bg) continue;
    const c = over({ r: fg.r, g: fg.g, b: fg.b, a: fg.a * (parseFloat(cs.opacity) || 1) }, bg);
    const L1 = lum(c), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700, grande = px >= 24 || (px >= 18.66 && bold);
    const min = grande ? 3 : 4.5;
    const hx = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    if (ratio < min) add('contraste', sel(e) + ' ' + ratio.toFixed(2) + ':1 (mín. ' + min + ') ' + hx(c) + ' sobre ' + hx(bg) + ' «' + t.nodeValue.trim().slice(0, 28) + '»');
  }

  // ── Nombres accesibles ──
  const nombre = e => (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.getAttribute('title') || e.textContent.trim() || (e.querySelector('img[alt]:not([alt=""])') || {}).alt || '');
  document.querySelectorAll('a[href],button,[role="button"]').forEach(e => { if (vis(e) && !nombre(e)) add('nombre', 'sin nombre accesible: ' + sel(e)); });
  document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(e => {
    if (!vis(e) && getComputedStyle(e).position !== 'absolute') return;
    if (e.closest('[aria-hidden="true"]') || e.getAttribute('aria-hidden') === 'true') return;
    const ok = e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.closest('label') || (e.id && document.querySelector('label[for="' + e.id + '"]')) || e.getAttribute('title');
    if (!ok) add('etiqueta', 'campo sin etiqueta: ' + sel(e));
  });
  document.querySelectorAll('img').forEach(i => { if (!i.hasAttribute('alt')) add('imagen', 'img sin alt: ' + (i.getAttribute('src') || '').slice(0, 40)); });

  // ── Estructura ──
  const h = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis);
  if ([...document.querySelectorAll('h1')].filter(vis).length > 1) add('encabezados', 'más de un <h1>');
  let prev = 0; h.forEach(x => { const n = +x.tagName[1]; if (prev && n > prev + 1) add('encabezados', 'salto de nivel h' + prev + ' → h' + n + ' («' + x.textContent.trim().slice(0, 24) + '»)'); prev = n; });
  if (!document.querySelector('main, [role="main"], #main')) add('estructura', 'sin región <main>');
  if (![...document.querySelectorAll('nav')].every(n => n.getAttribute('aria-label') || n.getAttribute('aria-labelledby'))) add('estructura', '<nav> sin aria-label');
  if (document.querySelector('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])')) add('teclado', 'tabindex positivo');
  const ids = {}; document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; });
  Object.keys(ids).forEach(k => { if (ids[k] > 1) add('estructura', 'id duplicado en el DOM: ' + k); });
  const skip = document.querySelector('a.skip-link');
  if (!skip) add('teclado', 'falta el enlace "Saltar al contenido"');
  return out;
};
