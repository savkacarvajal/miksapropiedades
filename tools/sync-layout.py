#!/usr/bin/env python3
"""Regenera el <nav> (todas las páginas) y el <footer> (todas menos index.html, que tiene el suyo)
para que sean idénticos. Uso: python3 tools/sync-layout.py   (con --check solo verifica y falla si hay diferencias)"""
import glob, re, os, sys

CHECK = '--check' in sys.argv
OUT_OF_SYNC = []
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINKS = [('listado.html', 'Propiedades'), ('proyectos.html', 'Proyectos'), ('mapa.html', 'Mapa'),
         ('herramientas.html', 'Herramientas'), ('corredores.html', 'Corredores'), ('blog.html', 'Guías')]

HEART = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 000-7.8z"/></svg>'

links = ''.join(f'<a href="{h}" class="nav-link">{t}</a>' for h, t in LINKS)
mlinks = ''.join(f'<a href="{h}" class="mm-link">{t}</a>' for h, t in LINKS)
NAV = f'''<nav class="topnav" aria-label="Principal">
  <a class="skip-link" href="#main">Saltar al contenido</a>
  <div class="topnav-in">
    <a class="brand" href="index.html" aria-label="Miksa Propiedades, inicio"><img class="brand-logo" src="img/logo.png" width="160" height="50" alt="Miksa Propiedades" /></a>
    <div class="tn-links">{links}</div>
    <div class="tn-actions">
      <a href="favoritos.html" class="tn-fav" aria-label="Favoritos">{HEART}<b data-fav-count hidden></b></a>
      <a href="ingresar.html" class="tn-login">Ingresar</a>
      <a href="publicar.html" class="btn-pub">Publicar propiedad</a>
      <button type="button" class="tn-burger" data-act="toggleMenu" aria-label="Menú" aria-expanded="false" aria-controls="mobile-menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </div>
  </div>
  <div id="mobile-menu" hidden>{mlinks}<a href="favoritos.html" class="mm-link">Favoritos</a></div>
</nav>'''

FOOT = '''<footer class="site-footer">
  <div class="sf-in">
    <p>© 2026 miksapropiedades SpA. Todos los derechos reservados.</p>
    <div class="sf-links">
      <a href="corredores.html" class="footer-link">Corredores</a>
      <a href="blog.html" class="footer-link">Guías</a>
      <a href="privacidad.html" class="footer-link">Privacidad</a>
      <a href="terminos.html" class="footer-link">Términos</a>
    </div>
  </div>
</footer>'''

for f in sorted(glob.glob(os.path.join(ROOT, '*.html')) + glob.glob(os.path.join(ROOT, 'blog', '*.html'))):
    s = open(f, encoding='utf-8').read()
    pre = '../' if os.sep + 'blog' + os.sep in f else ''
    nav = NAV if not pre else re.sub(r'((?:href|src)=")(?!https?:|#|\.\./)', r'\1../', NAV)
    foot = FOOT if not pre else re.sub(r'(href=")(?!https?:|#|\.\./)', r'\1../', FOOT)
    s2 = re.sub(r'<nav\b.*?</nav>', lambda m: nav, s, count=1, flags=re.S)
    s2 = re.sub(r'<main\b(?![^>]*\bid=)', '<main id="main" tabindex="-1"', s2, count=1)
    if not f.endswith('index.html'):
        s2 = re.sub(r'<footer\b.*?</footer>', lambda m: foot, s2, count=1, flags=re.S)
    if s2 != s:
        if CHECK:
            print('desincronizado', os.path.relpath(f, ROOT))
            OUT_OF_SYNC.append(f)
            continue
        open(f, 'w', encoding='utf-8').write(s2)
        print('actualizado', os.path.relpath(f, ROOT))
if CHECK and OUT_OF_SYNC:
    sys.exit(1)
