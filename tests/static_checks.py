"""Chequeos estáticos del sitio (sin navegador): enlaces, ids, CSP, accesibilidad básica y sincronía del menú."""
import glob, os, re, subprocess, sys
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = sorted(glob.glob(os.path.join(ROOT, '*.html')) + glob.glob(os.path.join(ROOT, 'blog', '*.html')))


class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.errors, self.title, self.meta, self.lang = [], [], [], '', {}, None
        self._in_title, self._script = False, None
        self.scripts, self.has_h1, self.uses_act = [], 0, False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.append(a['id'])
        if 'data-act' in a:
            self.uses_act = True
        for k in a:
            if k.startswith('on'):
                self.errors.append('atributo inline <%s %s> (rompe la CSP)' % (tag, k))
        if tag == 'html':
            self.lang = a.get('lang')
        if tag == 'title':
            self._in_title = True
        if tag == 'h1':
            self.has_h1 += 1
        if tag == 'meta':
            key = a.get('name') or a.get('http-equiv') or a.get('property')
            if key:
                self.meta[key] = a.get('content', '')
        if tag == 'script':
            if a.get('src'):
                self.refs.append(('script', a['src']))
                self.scripts.append(a['src'])
            elif a.get('type') != 'application/ld+json':
                self.errors.append('<script> inline sin src (rompe la CSP)')
        if tag == 'link' and a.get('href'):
            self.refs.append(('link', a['href']))
        if tag == 'a':
            h = a.get('href', '')
            self.refs.append(('a', h))
            if h.lower().startswith('javascript:'):
                self.errors.append('enlace javascript:')
            if a.get('target') == '_blank' and 'noopener' not in a.get('rel', ''):
                self.errors.append('target=_blank sin rel="noopener": ' + h)
        if tag == 'img':
            if 'alt' not in a:
                self.errors.append('<img> sin alt: ' + a.get('src', ''))
            if a.get('src'):
                self.refs.append(('img', a['src']))

    def handle_endtag(self, tag):
        if tag == 'title':
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def parse(path):
    p = P()
    p.feed(open(path, encoding='utf-8').read())
    return p


def local_target(page, ref):
    if not ref or re.match(r'^(https?:|mailto:|tel:|data:|blob:|//)', ref):
        return None
    u = urlparse(ref)
    path = unquote(u.path)
    if not path:                                   # solo #ancla en la misma página
        return page, u.fragment
    return os.path.normpath(os.path.join(os.path.dirname(page), path)), u.fragment


def csp_from_headers():
    m = re.search(r'Content-Security-Policy:\s*(.+)', open(os.path.join(ROOT, '_headers'), encoding='utf-8').read())
    return re.sub(r';\s*frame-ancestors[^;]*', '', m.group(1).strip()) if m else None


def run():
    errors = []
    parsed = {pg: parse(pg) for pg in PAGES}
    rel = lambda p: os.path.relpath(p, ROOT)
    hdr_csp = csp_from_headers()
    if not hdr_csp:
        errors.append('_headers: falta Content-Security-Policy')
    for pg, p in parsed.items():
        name = rel(pg)
        for e in p.errors:
            errors.append('%s: %s' % (name, e))
        dup = sorted({i for i in p.ids if p.ids.count(i) > 1})
        if dup:
            errors.append('%s: ids duplicados %s' % (name, dup))
        if not p.title.strip():
            errors.append('%s: falta <title>' % name)
        if p.lang != 'es':
            errors.append('%s: <html lang="es"> requerido' % name)
        if not p.meta.get('description'):
            errors.append('%s: falta meta description' % name)
        if not p.meta.get('viewport'):
            errors.append('%s: falta meta viewport' % name)
        if not p.has_h1 and not name.startswith('index'):
            errors.append('%s: falta <h1>' % name)
        csp = p.meta.get('Content-Security-Policy', '')
        if "script-src 'self'" not in csp:
            errors.append("%s: CSP ausente o sin script-src 'self'" % name)
        elif hdr_csp and csp.strip() != hdr_csp:
            errors.append('%s: la CSP del <meta> difiere de la de _headers' % name)
        if p.uses_act and not any(x.endswith('js/actions.js') for x in p.scripts):
            errors.append('%s: usa data-act pero no carga js/actions.js (los botones no funcionarían)' % name)
        if any(x.endswith('js/common.js') for x in p.scripts):
            nm = [os.path.basename(x) for x in p.scripts]
            if 'store.js' not in nm or nm.index('store.js') > nm.index('common.js'):
                errors.append('%s: store.js debe cargarse antes que common.js' % name)
        # config.js debe cargarse antes que common.js
        if any(s.endswith('js/common.js') for s in p.scripts):
            names = [os.path.basename(s) for s in p.scripts]
            if 'config.js' not in names or names.index('config.js') > names.index('common.js'):
                errors.append('%s: config.js debe cargarse antes que common.js' % name)
        for kind, ref in p.refs:
            t = local_target(pg, ref)
            if not t:
                continue
            path, frag = t
            if not os.path.exists(path):
                errors.append('%s: enlace roto (%s) → %s' % (name, kind, ref))
            elif frag and path.endswith('.html'):
                ids = parsed[path].ids if path in parsed else parse(path).ids
                if frag not in ids:
                    errors.append('%s: ancla inexistente %s' % (name, ref))
    # El almacenamiento del navegador solo se toca desde js/store.js (capa de datos)
    for js in sorted(glob.glob(os.path.join(ROOT, 'js', '*.js'))):
        if os.path.basename(js) == 'store.js':
            continue
        txt = open(js, encoding='utf-8').read()
        for m in re.finditer(r'\b(localStorage|sessionStorage)\b', txt):
            line = txt.count('\n', 0, m.start()) + 1
            errors.append('js/%s:%d: usa %s directamente; usa las funciones de js/store.js' % (os.path.basename(js), line, m.group(1)))
    r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'sync-layout.py'), '--check'], capture_output=True, text=True)
    if r.returncode:
        errors.append('menú/footer desincronizados (ejecuta python3 tools/sync-layout.py): ' + r.stdout.strip().replace('\n', ', '))
    return len(PAGES), errors


if __name__ == '__main__':
    n, errs = run()
    print('%d páginas revisadas' % n)
    for e in errs:
        print('  ✗', e)
    sys.exit(1 if errs else 0)
