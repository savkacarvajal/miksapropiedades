# Verificación de seguridad — OWASP Top 10 (2021) y ASVS 5.0

Alcance: frontend estático (3 páginas). Revisión por lectura de código, sin pruebas dinámicas ni de navegador.
Estados: ✅ cumple · 🟡 mitigado en cliente / parcial · ❌ no cumple · ➖ no aplica hoy.

## OWASP Top 10

| # | Categoría | Estado | Detalle |
|---|-----------|--------|---------|
| A01 | Broken Access Control | ❌ | No hay control de acceso real: sesión y usuarios en `localStorage`, editable desde DevTools. Cualquiera puede forjar `miksa_session`. Requiere backend (Supabase Auth + RLS). |
| A02 | Cryptographic Failures | 🟡 | Contraseñas con PBKDF2-SHA256 (150k iter., sal por usuario). Pero el hash sigue en el navegador del usuario: sin backend no protege nada real. |
| A03 | Injection (incl. XSS) | 🟡 | Corregido XSS en `buildResumen()` (escape de HTML). Restan `innerHTML` con datos controlados por el código, no por el usuario. CSP añadida. |
| A04 | Insecure Design | ❌ | Modelo sin servidor: sin verificación de correo, sin recuperación de contraseña, sin moderación de avisos. |
| A05 | Security Misconfiguration | 🟡 | CSP estricta vía `<meta>` (`script-src 'self'`, sin inline; sin `frame-ancestors`, no se puede en meta) y Referrer-Policy. Cabeceras HTTP reales (HSTS, nosniff, X-Frame-Options, CSP con `frame-ancestors`) listas en `_headers`, efectivas solo en Cloudflare Pages/Netlify (GitHub Pages las ignora). |
| A06 | Vulnerable Components | ✅ | Eliminado el CDN de Tailwind: CSS propio (`styles.css`). Sin librerías JS de terceros. |
| A07 | Identification & Auth Failures | 🟡 | Mínimo 8 caracteres, bloqueo de 60 s tras 5 fallos y sesión con expiración de 7 días, todo en cliente (evitable). Sin MFA. |
| A08 | Software & Data Integrity | 🟡 | Sin SRI en scripts externos; sin pipeline de despliegue verificado. |
| A09 | Logging & Monitoring | ❌ | Sin registro de eventos de seguridad (requiere backend). |
| A10 | SSRF | ➖ | Sin componente de servidor. |

## ASVS 5.0 (capítulos relevantes)

| Capítulo | Estado | Nota |
|----------|--------|------|
| V1 Codificación y saneamiento | 🟡 | Escape en salida donde se usa `innerHTML`; falta política uniforme (preferir `textContent`). |
| V2 Validación y lógica de negocio | 🟡 | Validación solo en cliente; debe repetirse en servidor. |
| V3 Seguridad del frontend web | ✅ | Sin scripts ni handlers inline; `script-src 'self'`. Solo `style-src` conserva `'unsafe-inline'` (estilos inline del diseño). |
| V4 API y servicios web | ➖ | No hay API todavía. |
| V5 Gestión de archivos | 🟡 | Solo JPG/PNG/WebP ≤ 5 MB, máx. 10 (sin SVG). Sin validación de contenido real ni almacenamiento seguro (fotos solo como data URL en memoria). |
| V6 Autenticación | 🟡 | Ver A07. Sin verificación de correo ni recuperación. |
| V7 Gestión de sesiones | ❌ | Token de sesión no aleatorio ni revocable; vive en `localStorage`. |
| V8 Autorización | ❌ | Ver A01. |
| V9 Tokens autocontenidos | ➖ | — |
| V11 Criptografía | 🟡 | Primitivas correctas (WebCrypto), contexto inadecuado (cliente). |
| V12 Comunicación segura | 🟡 | Depende de servir por HTTPS con HSTS. |
| V13 Configuración | 🟡 | Sin secretos en el repo (revisado el historial de git). Falta SRI. |
| V14 Protección de datos | ❌ | Datos personales (nombre, correo, teléfono) en `localStorage` sin cifrar. |
| V16 Registro y manejo de errores | ❌ | Sin logging de seguridad. |

## Cambios aplicados en esta revisión
- Enlaces `mailto:`/`wa.me` construidos con validación y `rel="noopener noreferrer"`; render de avisos con DOM (`textContent`), fotos solo `data:image/`.
- Login y registro como `<form>` reales.
- Escape HTML en el resumen de `publicar.html` (XSS).
- CSP + Referrer-Policy en las 3 páginas.
- Subida de fotos: lista blanca de tipos, 5 MB máx.
- ID de aviso con `crypto.randomUUID` en vez de `Date.now()`.
- Login: bloqueo tras 5 fallos; sesión con expiración; mensaje de registro que no revela si el correo existe.

## Camino a cumplimiento real
1. Supabase: Auth (correo verificado, recuperación, MFA opcional), tablas con Row Level Security, Storage con políticas por usuario.
2. (Hecho) Sin Tailwind CDN ni scripts/handlers inline. Pendiente: mover estilos inline a clases para quitar `'unsafe-inline'` de `style-src`.
3. Hosting con cabeceras HTTP: HSTS, `X-Content-Type-Options`, `frame-ancestors`.
4. Validación de servidor y registro de eventos de seguridad.

## Controles añadidos con las funciones de corretaje
- Formularios de visita/tasación: validación, casilla de consentimiento, honeypot anti-bots y texto libre siempre renderizado con `textContent`.
- Exportación CSV del panel neutraliza fórmulas (`=`, `+`, `-`, `@`) para evitar CSV injection; el `.ics` escapa caracteres especiales.
- Enlaces de video/tour: solo `https` y dominios permitidos (YouTube, Vimeo, Matterport, Kuula); externos con `rel="noopener noreferrer"`.
- Leaflet alojado en `vendor/` (sin CDN); CSP de `connect-src` limitada a mindicador.cl y de `img-src` a OSM/picsum.
- **Limitación:** `panel.html` se protege con `ADMIN_EMAILS` en el cliente; sin backend no es control de acceso real (A01/V8 siguen ❌). Los leads viven en `localStorage`.

- Herramientas financieras y QR: cálculo 100% en el navegador, sin envío de datos; el QR se genera con una librería MIT alojada en `vendor/qrcode` (sin CDN) y se dibuja en `<canvas>`.
- Formulario de cotización de proyectos: mismas validaciones, consentimiento y honeypot que las demás solicitudes.

## Verificación funcional (Chrome headless, CSP activa)
17 comprobaciones automáticas OK: hash+sal sin contraseña en claro, migración de cuentas antiguas, bloqueo tras 5 fallos, sesión con expiración, escape de XSS en el resumen, menú móvil y despachador `data-act`. Sin violaciones de CSP en las 3 páginas.
