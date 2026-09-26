<div align="center">

# 🏠 miksapropiedades

**La agencia naranja de La Serena y Coquimbo**

Portal inmobiliario con búsqueda, mapa, tasación online, simulador hipotecario y panel para corredores.
Frontend estático: **HTML + CSS + JavaScript puro**, sin dependencias ni paso de compilación.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?logo=leaflet&logoColor=white)
![CSP](https://img.shields.io/badge/CSP-estricta-E8631A)
![Estado](https://img.shields.io/badge/estado-maqueta%20funcional-orange)

<img src="docs/screenshots/inicio.png" alt="Portada de miksapropiedades" width="820">

</div>

---

## ✨ Qué incluye

### Para quien busca propiedad
| | |
|---|---|
| 🔎 **Listado con filtros** | Operación, tipo, sector, dormitorios, precio máximo y estado. Los filtros viajan en la URL, así que se pueden compartir. |
| 🗺️ **Mapa** | Leaflet + OpenStreetMap, con lista lateral sincronizada. |
| 🏡 **Ficha completa** | Galería, gastos comunes, contribuciones, orientación, subsidio, video/tour, corredor asignado y propiedades similares. |
| 💱 **UF en vivo** | Precio en pesos con la UF del día ([mindicador.cl](https://mindicador.cl)) y dividendo estimado. |
| 🧮 **Simulador hipotecario** | Pie, plazo y tasa a tu medida, con ingreso mensual sugerido. |
| 📈 **Rentabilidad** | Cap rate, flujo mensual, retorno sobre tu capital y TIR de una propiedad para arriendo, con gráfico. |
| 🧾 **Costos de compra** | Notaría, conservador, timbres y tasación: cuánto dinero necesitas además del pie. |
| ⚖️ **Arrendar vs comprar** | Patrimonio a 10 o más años y año de equilibrio. |
| 🏗️ **Proyectos nuevos** | En blanco, en construcción o entrega inmediata; plan de pagos y cotización. |
| 📲 **Compartir** | WhatsApp, enlace, código QR y letrero imprimible por propiedad. |
| ❤️ **Favoritos y comparador** | Guarda propiedades y compara hasta 3 lado a lado. |
| 🔔 **Búsquedas guardadas** | Cuenta cuántas propiedades nuevas aparecieron desde que la guardaste. |
| 🏘️ **Barrios y guías** | Una página por barrio y guías sobre arriendo seguro, contribuciones, subsidio y compra. |

### Para propietarios y corredores
| | |
|---|---|
| 📝 **Publicar en 4 pasos** | Fotos reducidas en el navegador, datos legales opcionales y enlace a video. |
| 📐 **Tasación online** | Rango estimado en UF y pesos; opción de que la agencia gestione la propiedad. |
| 📅 **Agenda de visitas** | Formulario en cada ficha; el panel exporta cada visita al calendario (`.ics`). |
| 📊 **Panel de corredor** | CRM con estados (nuevo → cerrado), agenda, estadísticas por aviso y exportación CSV. |
| 🏷️ **Estado del aviso** | Disponible, reservada, vendida o arrendada. |
| 📄 **Ficha en PDF** | Vista de impresión lista para enviar al cliente. |

<details>
<summary><b>📸 Más capturas</b></summary>

<br>

| Listado | Ficha |
|---|---|
| <img src="docs/screenshots/listado.png" alt="Listado"> | <img src="docs/screenshots/ficha.png" alt="Ficha de propiedad"> |

| Mapa | Tasación |
|---|---|
| <img src="docs/screenshots/mapa.png" alt="Mapa"> | <img src="docs/screenshots/tasacion.png" alt="Tasación online"> |

<p align="center"><img src="docs/screenshots/movil.png" alt="Vista móvil" width="260"></p>

</details>

---

## 🚀 Empezar

```sh
git clone https://github.com/savkacarvajal/miksapropiedades.git
cd miksapropiedades
python3 -m http.server 8000
# abrir http://localhost:8000
```

> Hay que servirlo por HTTP (`localhost` cuenta como contexto seguro). Abrirlo con `file://` desactiva WebCrypto y el login no funciona.

## 🧭 Páginas

| Archivo | Función |
|---|---|
| `index.html` | Portada: buscador, destacados, servicios |
| `listado.html` | Listado con filtros, orden, favoritos y comparador |
| `propiedad.html?id=…` | Ficha de la propiedad |
| `mapa.html` | Mapa de propiedades |
| `herramientas.html` | Centro de calculadoras |
| `simulador.html` · `rentabilidad.html` · `costos.html` · `arrendar-vs-comprar.html` | Hipotecario, rentabilidad de inversión (cap rate, flujo, TIR), costos de compra y arrendar vs comprar |
| `tasacion.html` | Tasación online referencial |
| `proyectos.html` · `proyecto.html?id=…` | Proyectos nuevos con tipologías, plan de pagos y cotización |
| `letrero.html?id=…` | Letrero imprimible con código QR |
| `favoritos.html` · `comparar.html` | Favoritos y comparador |
| `corredores.html` · `barrio.html?s=…` | Equipo y landing por barrio |
| `blog.html` · `blog/*.html` | Guías |
| `publicar.html` · `ingresar.html` · `mis-avisos.html` | Cuenta y avisos propios |
| `panel.html` | Panel de corredor (requiere configuración, ver abajo) |
| `privacidad.html` · `terminos.html` | Textos legales **base** |
| `404.html` | Página de error |

## ⚙️ Configuración

Todo lo propio de la agencia está en **`js/config.js`**:

```js
AGENCIA:      { whatsapp: '56912345678', telefono: '', email: '' },  // botones de contacto
ADMIN_EMAILS: ['corredor@tuagencia.cl'],                             // habilita panel.html
CORREDORES:   [ { id, nombre, cargo, registro, tel, email, bio } ],  // hoy son de ejemplo
```

Después de editar el menú o el footer, replícalos en todas las páginas:

```sh
python3 tools/sync-layout.py
```

### 🔧 Datos de ejemplo que debes reemplazar

- Propiedades demo (`SEED`) y proyectos (`PROYECTOS`) en `js/common.js`, con fotos de picsum.
- `SITIO_URL` en `js/config.js`: dominio que llevarán los códigos QR y enlaces compartidos.
- Porcentajes por defecto de costos de compra en `costos.html` (referenciales y editables).
- Tabla de UF/m² de la tasación: `js/tasacion.js` → `BASE_UF_M2`.
- Descripciones de barrios: `js/barrio.js` → `BARRIOS`.
- Testimonios: `index.html` (están rotulados como "de ejemplo").
- Textos legales: `privacidad.html` y `terminos.html` son borradores; revísalos con un abogado.

## 🗂️ Estructura

```
├── index.html, listado.html, propiedad.html, …   páginas
├── blog/                                          guías
├── js/
│   ├── config.js        configuración de la agencia
│   ├── common.js        utilidades, datos de ejemplo, leads, favoritos, UF, QR
│   ├── finanzas.js      crédito, TIR, rentabilidad, arrendar vs comprar, costos
│   ├── actions.js       despacha los data-act (no hay JS inline)
│   └── <pagina>.js      lógica de cada página
├── styles.css           reset + componentes
├── vendor/leaflet/      Leaflet 1.9.4 (mapa), alojado localmente
├── vendor/qrcode/       qrcode-generator 1.4.4 (QR), alojado localmente
├── tools/sync-layout.py sincroniza menú y footer
├── _headers             cabeceras de seguridad (Cloudflare Pages / Netlify)
└── SEGURIDAD.md         verificación OWASP Top 10 / ASVS 5.0
```

## 🔐 Seguridad

- **CSP estricta**: `script-src 'self'`, sin scripts ni handlers inline.
- Contraseñas con **PBKDF2-SHA256** (150 mil iteraciones y sal por usuario).
- Todo texto de usuario se renderiza con `textContent`; escape de HTML donde se usa `innerHTML`.
- Validación de fotos (JPG/PNG/WebP, 5 MB), enlaces de video con lista blanca de dominios, honeypot anti-bots.
- Exportación CSV neutraliza inyección de fórmulas.

La verificación completa está en [`SEGURIDAD.md`](SEGURIDAD.md).

> ⚠️ **Limitación importante:** hoy usuarios, avisos, leads y favoritos viven en `localStorage`. Es una **maqueta funcional**: los avisos no se comparten entre visitantes y el panel no tiene control de acceso real. Eso se resuelve con el backend (ver hoja de ruta).

## ☁️ Deploy

| Plataforma | Notas |
|---|---|
| **Cloudflare Pages / Netlify** *(recomendado)* | Publicar la raíz, sin comando de build. `_headers` aplica HSTS, `frame-ancestors`, `X-Frame-Options` y demás. |
| **GitHub Pages** | Funciona, pero ignora `_headers`: solo queda la CSP por `<meta>`. |

El navegador consulta estos servicios externos (todos declarados en la CSP): mindicador.cl (UF), teselas de OpenStreetMap, Google Fonts y picsum.photos.

## 🛣️ Hoja de ruta

- [ ] **Supabase**: Auth con correo verificado, Postgres con Row Level Security y Storage para fotos.
- [ ] Alertas por correo de búsquedas guardadas.
- [ ] Edición de avisos.
- [ ] `sitemap.xml`, `og:image` y dominio propio.
- [ ] Sustituir datos de ejemplo por datos reales de la agencia.

---

<div align="center">
<sub>Hecho para La Serena y Coquimbo · Los datos de propiedades, corredores y valores de tasación son de ejemplo.</sub>
</div>
