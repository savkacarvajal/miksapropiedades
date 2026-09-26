"""Cliente mínimo del protocolo DevTools de Chrome para las pruebas del sitio.

- Lanza Chrome headless con un perfil temporal.
- Intercepta TODA la red externa (UF, fotos, teselas, fuentes) con respuestas falsas y deterministas,
  de modo que las pruebas no dependan de internet.
"""
import asyncio, base64, json, os, shutil, socket, subprocess, tempfile, time, urllib.request
import websockets

PNG_1X1 = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
UF_JSON = json.dumps({'serie': [{'fecha': '2026-09-25T03:00:00.000Z', 'valor': 41000}]}).encode()


def find_chrome():
    if os.environ.get('CHROME'):
        return os.environ['CHROME']
    for n in ('google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser', 'chrome'):
        p = shutil.which(n)
        if p:
            return p
    raise SystemExit('No se encontró Chrome/Chromium. Instálalo o define la variable CHROME.')


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


class Page:
    def __init__(self, ws, local_host):
        self.ws, self.local_host, self._id, self._fut, self.events = ws, local_host, 0, {}, []
        self._load = asyncio.Event()
        self.problems = []          # errores de página: excepciones, violaciones de CSP, console.error propios
        self._reader = asyncio.ensure_future(self._read())

    async def _read(self):
        async for raw in self.ws:
            m = json.loads(raw)
            if 'id' in m:
                f = self._fut.pop(m['id'], None)
                if f and not f.done():
                    f.set_result(m)
                continue
            meth, p = m.get('method'), m.get('params', {})
            if meth == 'Page.loadEventFired':
                self._load.set()
            elif meth == 'Fetch.requestPaused':
                asyncio.ensure_future(self._fulfill(p))
            elif meth == 'Runtime.exceptionThrown':
                d = p['exceptionDetails']
                self.problems.append('excepción: ' + (d.get('exception', {}).get('description') or d.get('text', ''))[:300])
            elif meth == 'Log.entryAdded':
                e = p['entry']
                if e.get('source') == 'security' or (e.get('level') == 'error' and e.get('source') != 'network'):
                    self.problems.append('%s: %s' % (e.get('source'), e.get('text', '')[:300]))
            elif meth == 'Runtime.consoleAPICalled' and p.get('type') == 'error':
                self.problems.append('console.error: ' + ' '.join(str(a.get('value', a.get('description', ''))) for a in p.get('args', []))[:300])

    async def _fulfill(self, p):
        url, rid = p['request']['url'], p['requestId']
        try:
            if url.startswith(('http://127.0.0.1', 'http://localhost')) or url.startswith(('data:', 'blob:')):
                await self.call('Fetch.continueRequest', requestId=rid)
            elif 'mindicador' in url:
                await self._answer(rid, UF_JSON, 'application/json', cors=True)
            elif 'fonts.googleapis' in url or 'fonts.gstatic' in url:
                await self._answer(rid, b'', 'text/css')
            else:                                   # fotos, teselas, avatares…
                await self._answer(rid, PNG_1X1, 'image/png')
        except Exception:
            pass

    async def _answer(self, rid, body, ctype, cors=False):
        hdr = [{'name': 'Content-Type', 'value': ctype}]
        if cors:
            hdr.append({'name': 'Access-Control-Allow-Origin', 'value': '*'})
        await self.call('Fetch.fulfillRequest', requestId=rid, responseCode=200, responseHeaders=hdr, body=base64.b64encode(body).decode())

    async def call(self, method, **params):
        self._id += 1
        i = self._id
        fut = asyncio.get_event_loop().create_future()
        self._fut[i] = fut
        await self.ws.send(json.dumps({'id': i, 'method': method, 'params': params}))
        r = await asyncio.wait_for(fut, 30)
        if 'error' in r:
            raise RuntimeError('%s: %s' % (method, r['error'].get('message')))
        return r.get('result', {})

    async def setup(self):
        for d in ('Page', 'Runtime', 'Log', 'Network'):
            await self.call(d + '.enable')
        await self.call('Fetch.enable', patterns=[{'urlPattern': '*'}])
        # las propiedades de demostración solo se muestran con este flag; las pruebas dependen de ellas
        await self.call('Page.addScriptToEvaluateOnNewDocument', source="try{localStorage.setItem('miksa_demo','1')}catch(e){}")

    async def viewport(self, w, h, mobile=False):
        await self.call('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=1, mobile=mobile)

    async def goto(self, url, timeout=20):
        self._load.clear()
        self.problems.clear()
        await self.call('Page.navigate', url=url)
        await asyncio.wait_for(self._load.wait(), timeout)

    async def eval(self, expr):
        r = await self.call('Runtime.evaluate', expression=expr, returnByValue=True, awaitPromise=True)
        if 'exceptionDetails' in r:
            raise RuntimeError(r['exceptionDetails'].get('text', 'error de evaluación'))
        return r['result'].get('value')

    async def clear_storage(self, origin):
        await self.call('Storage.clearDataForOrigin', origin=origin, storageTypes='all')

    async def screenshot(self, path, full=False):
        r = await self.call('Page.captureScreenshot', format='png', captureBeyondViewport=full)
        with open(path, 'wb') as f:
            f.write(base64.b64decode(r['data']))


class Browser:
    def __init__(self):
        self.port, self.proc, self.tmp = free_port(), None, tempfile.mkdtemp(prefix='miksa-chrome-')

    async def start(self, local_host='127.0.0.1'):
        args = [find_chrome(), '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars',
                '--mute-audio', '--no-first-run', '--remote-debugging-port=%d' % self.port, '--user-data-dir=' + self.tmp, 'about:blank']
        self.proc = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        tabs = None
        for _ in range(100):
            try:
                tabs = json.load(urllib.request.urlopen('http://127.0.0.1:%d/json' % self.port))
                if any(t['type'] == 'page' for t in tabs):
                    break
            except Exception:
                pass
            time.sleep(0.2)
        if not tabs:
            raise SystemExit('Chrome no respondió en el puerto de depuración.')
        ws_url = [t for t in tabs if t['type'] == 'page'][0]['webSocketDebuggerUrl']
        ws = await websockets.connect(ws_url, max_size=None)
        self.page = Page(ws, local_host)
        await self.page.setup()
        return self.page

    def stop(self):
        if self.proc:
            self.proc.terminate()
            try:
                self.proc.wait(5)
            except Exception:
                self.proc.kill()
        shutil.rmtree(self.tmp, ignore_errors=True)
