// La tipografía se sirve desde el propio sitio (sin Google Fonts) y carga.
__run(async T => {
  await document.fonts.ready;
  const faces = [...document.fonts].filter(f => f.family.replace(/['"]/g, '') === 'Outfit');
  T.ok('hay @font-face de Outfit', faces.length >= 1);
  await Promise.all(faces.map(f => f.load().catch(() => {})));
  T.ok('la fuente latina carga desde el sitio', faces.some(f => f.status === 'loaded'));
  T.ok('la fuente se aplica al texto', getComputedStyle(document.body).fontFamily.indexOf('Outfit') > -1);
  T.ok('sin hojas de estilo de terceros', ![...document.querySelectorAll('link[rel=stylesheet]')].some(l => /^https?:/.test(l.getAttribute('href'))));
  T.ok('vino con font-display: swap', [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => r.cssText.indexOf('font-display: swap') > -1); } catch (e) { return false; } }));
});
