#!/usr/bin/env python3
"""Ejecuta todas las pruebas del sitio.

    python3 tests/run.py            # todo: chequeos estáticos + casos en Chrome + humo/responsive
    python3 tests/run.py -v         # muestra cada comprobación
    python3 tests/run.py --only ficha
    python3 tests/run.py --no-browser   # solo los chequeos estáticos (no requiere Chrome)

Requisitos: Python 3.9+, Chrome/Chromium y `pip install -r tests/requirements.txt`.
"""
import argparse, asyncio, glob, os, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import static_checks
from server import ROOT, start

GREEN, RED, DIM, END = '\033[32m', '\033[31m', '\033[2m', '\033[0m'
if not sys.stdout.isatty():
    GREEN = RED = DIM = END = ''

SMOKE_QUERIES = {
    'propiedad.html': '?id=DEMO-1', 'proyecto.html': '?id=PR-1', 'letrero.html': '?id=DEMO-1',
    'barrio.html': '?s=El%20Faro', 'comparar.html': '?ids=DEMO-1,DEMO-2',
}


def pages():
    return [os.path.relpath(p, ROOT) for p in sorted(glob.glob(os.path.join(ROOT, '*.html')) + glob.glob(os.path.join(ROOT, 'blog', '*.html')))]


async def run_case(page, base, cid, c, verbose):
    await page.clear_storage(base)
    w, h = c.get('viewport', (1280, 900))
    await page.viewport(w, h, mobile=w < 600)
    await page.goto('%s/__t/%s/%s%s' % (base, cid, c['page'], c.get('query', '')))
    ok = False
    for _ in range(int(c.get('timeout', 25) * 10)):
        if await page.eval('!!(window.T && window.T.done)'):
            ok = True
            break
        await asyncio.sleep(0.1)
    if not ok:
        return [{'name': 'la prueba no terminó a tiempo', 'pass': False}], page.problems[:]
    res = await page.eval('window.T.results')
    return res, page.problems[:]


async def smoke(page, base, verbose):
    """Cada página: sin errores de consola / CSP y sin desbordamiento horizontal (escritorio y móvil)."""
    fails, n = [], 0
    for w, h, mobile in ((1280, 800, False), (390, 800, True)):
        await page.viewport(w, h, mobile=mobile)
        for pg in pages():
            await page.clear_storage(base)
            await page.goto('%s/%s%s' % (base, pg, SMOKE_QUERIES.get(pg, '')))
            await asyncio.sleep(0.9)
            n += 2
            for pr in page.problems:
                fails.append('%s @%d: %s' % (pg, w, pr))
            over = await page.eval('document.documentElement.scrollWidth - document.documentElement.clientWidth')
            if over > 1:
                fails.append('%s @%d: desborde horizontal de %dpx' % (pg, w, over))
            if verbose:
                print('    %s· %s @%d%s' % (DIM, pg, w, END))
    return n, fails


A11Y = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lib', 'a11y.js'), encoding='utf-8').read()


async def a11y_audit(page, base, verbose):
    """Reglas WCAG verificables automáticamente en cada página (escritorio)."""
    await page.viewport(1280, 800)
    fails, n = [], 0
    for pg in pages():
        await page.clear_storage(base)
        await page.goto('%s/%s%s' % (base, pg, SMOKE_QUERIES.get(pg, '')))
        await asyncio.sleep(0.9)
        await page.eval(A11Y)
        issues = await page.eval('window.__a11y()')
        n += 1
        for i in issues:
            fails.append('%s [%s] %s' % (pg, i['regla'], i['detalle']))
    return n, fails


async def browser_tests(args):
    from cdp import Browser
    from cases import CASES
    only = [o.lower() for o in args.only] if args.only else None
    cases = {}
    for i, c in enumerate(CASES):
        cases['c%d' % i] = {'setup': c.get('setup'), 'case': c['case']}
    srv, base = start(cases)
    br = Browser()
    total = failed = 0
    try:
        page = await br.start()
        for i, c in enumerate(CASES):
            if only and not any(o in c['name'].lower() for o in only):
                continue
            t0 = time.time()
            res, problems = await run_case(page, base, 'c%d' % i, c, args.verbose)
            bad = [r for r in res if not r['pass']]
            probs = [] if c.get('allow_problems') else problems
            total += len(res)
            failed += len(bad) + len(probs)
            status = GREEN + '✓' + END if not bad and not probs else RED + '✗' + END
            print('%s %-46s %3d comprobaciones  %s%.1fs%s' % (status, c['name'], len(res), DIM, time.time() - t0, END))
            for r in res:
                if args.verbose and r['pass']:
                    print('    %s✓ %s%s' % (DIM, r['name'], END))
                if not r['pass']:
                    print('    %s✗ %s%s' % (RED, r['name'], END) + (('\n      ' + r['detail'][:300]) if r.get('detail') else ''))
            for p in probs:
                print('    %s! %s%s' % (RED, p, END))
        if not only:
            t0 = time.time()
            n, fails = await smoke(page, base, args.verbose)
            total += n
            failed += len(fails)
            print('%s %-46s %3d comprobaciones  %s%.1fs%s' % (GREEN + '✓' + END if not fails else RED + '✗' + END, 'Humo: consola/CSP y desborde horizontal', n, DIM, time.time() - t0, END))
            for f in fails:
                print('    %s! %s%s' % (RED, f, END))
        if not only and not args.no_a11y:
            t0 = time.time()
            n, fails = await a11y_audit(page, base, args.verbose)
            total += n
            failed += len(fails)
            print('%s %-46s %3d páginas  %s%.1fs%s' % (GREEN + '✓' + END if not fails else RED + '✗' + END, 'Accesibilidad (contraste, nombres, estructura)', n, DIM, time.time() - t0, END))
            for f in fails[:80]:
                print('    %s! %s%s' % (RED, f, END))
            if len(fails) > 80:
                print('    %s… y %d más%s' % (RED, len(fails) - 80, END))
    finally:
        br.stop()
        srv.shutdown()
    return total, failed


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('-v', '--verbose', action='store_true')
    ap.add_argument('--only', nargs='+', help='ejecuta solo los casos cuyo nombre contenga estas palabras')
    ap.add_argument('--no-browser', action='store_true')
    ap.add_argument('--no-static', action='store_true')
    ap.add_argument('--no-a11y', action='store_true', help='omite la auditoría de accesibilidad')
    args = ap.parse_args()
    total = failed = 0
    if not args.no_static and not args.only:
        n, errs = static_checks.run()
        print('%s %-46s %3d páginas' % (GREEN + '✓' + END if not errs else RED + '✗' + END, 'Chequeos estáticos (enlaces, CSP, ids, a11y)', n))
        for e in errs:
            print('    %s✗ %s%s' % (RED, e, END))
        failed += len(errs)
    if not args.no_browser:
        t, f = asyncio.run(browser_tests(args))
        total += t
        failed += f
    print('\n%s' % ((GREEN + 'Todo en orden.' + END) if not failed else (RED + '%d problema(s).' % failed + END)))
    if total:
        print('%d comprobaciones en el navegador.' % total)
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
