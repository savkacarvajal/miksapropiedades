"""Servidor local de las pruebas: sirve el sitio tal cual y, bajo /__t/<caso>/<pagina>, inyecta el
arnés, el script de preparación (opcional) y el caso de prueba en la página real."""
import http.server, os, re, threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS = os.path.join(ROOT, 'tests')


class Handler(http.server.SimpleHTTPRequestHandler):
    cases = {}          # id -> {'setup': ruta|None, 'case': ruta}

    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def _send(self, body, ctype):
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split('?')[0]
        m = re.match(r'^/__t/([\w-]+)/(.*)$', path)
        if path.startswith('/__tests/'):                       # recursos de prueba
            f = os.path.join(TESTS, path[len('/__tests/'):])
            if os.path.isfile(f):
                return self._send(open(f, 'rb').read(), 'text/javascript; charset=utf-8')
            self.send_error(404)
            return
        if m:
            cid, rest = m.group(1), m.group(2) or 'index.html'
            case = self.cases.get(cid)
            f = os.path.join(ROOT, rest)
            if not case or not os.path.isfile(f):
                self.send_error(404)
                return
            if not rest.endswith('.html'):
                self.path = '/' + rest
                return super().do_GET()
            html = open(f, encoding='utf-8').read()
            up = '../' * rest.count('/')                       # páginas dentro de subcarpetas (blog/)
            inj = '<script src="/__tests/lib/harness.js"></script>'
            if case.get('setup'):
                inj += '<script src="/__tests/%s"></script>' % case['setup']
            html = re.sub(r'(<script src="[^"]*js/common\.js"></script>)', lambda mm: mm.group(1) + inj, html, count=1)
            html = html.replace('</body>', '<script src="/__tests/%s"></script></body>' % case['case'], 1)
            return self._send(html.encode('utf-8'), 'text/html; charset=utf-8')
        return super().do_GET()


def start(cases):
    Handler.cases = cases
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, 'http://127.0.0.1:%d' % srv.server_address[1]
