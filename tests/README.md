# Pruebas

Un solo comando ejecuta todo:

```sh
pip install -r tests/requirements.txt   # solo la primera vez (websockets)
python3 tests/run.py                    # estáticas + navegador + humo/responsive
python3 tests/run.py -v                 # detalle de cada comprobación
python3 tests/run.py --only ficha panel # solo casos cuyo nombre contenga esas palabras
python3 tests/run.py --no-browser       # solo chequeos estáticos (no requiere Chrome)
```

Necesita Python 3.9+ y Chrome o Chromium (o la variable `CHROME` con la ruta al binario).

## Qué se prueba

1. **Estáticas** (`static_checks.py`): enlaces y anclas rotos, ids duplicados, sin scripts ni handlers inline (CSP), CSP del `<meta>` igual a la de `_headers`, `alt` en imágenes, `rel="noopener"`, páginas con `data-act` que cargan `actions.js`, menú y footer sincronizados.
2. **Casos en el navegador** (`cases.py` + `cases/*.js`): cada uno carga la **página real** con un arnés inyectado (`tests/lib/harness.js`) y comprueba comportamiento: formularios, cálculos, XSS almacenado, drag & drop, panel, etc.
3. **Humo y responsive**: todas las páginas en 1280 px y 390 px, sin errores de consola, sin violaciones de CSP y sin desborde horizontal.

La red externa (UF, fotos, teselas, fuentes) está **simulada**: las pruebas no dependen de internet ni del valor real de la UF (en las pruebas vale 41.000).

## Agregar un caso

1. Crea `tests/cases/mi-caso.js`:
   ```js
   __run(async T => {
     T.ok('algo funciona', document.getElementById('x') !== null);
     T.eq('valor esperado', 2 + 2, 4);
     await T.waitFor(() => document.querySelector('.listo'));
   });
   ```
   Ayudas: `T.ok`, `T.eq`, `T.near`, `T.sleep`, `T.waitFor`, `T.submit(form)`, `T.change(el, v)`, `T.input(el, v)`.
2. Regístralo en `tests/cases.py` (página, query, viewport y, si necesitas datos previos, un `setup` que se ejecuta antes de los scripts de la página).

El almacenamiento del navegador se borra entre casos.

## CI

`.github/workflows/tests.yml` ejecuta `python3 tests/run.py` en cada push y pull request.
