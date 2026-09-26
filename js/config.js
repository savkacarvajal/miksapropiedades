// Configuración de la agencia. Completa estos datos antes de publicar el sitio.
// Los corredores de abajo son de EJEMPLO: reemplázalos por personas reales con su N° de inscripción.
const MIKSA_CONFIG = {
  AGENCIA: {
    nombre: 'miksapropiedades',
    whatsapp: '56961357871',          // ej: '56912345678' (solo dígitos, con código de país). Vacío = se oculta el botón
    telefono: '+56961357871',
    email: '',
    direccion: 'La Serena y Coquimbo',
  },
  // Correos con acceso al panel de corredor (panel.html). Vacío = panel deshabilitado.
  // OJO: sin backend esto solo oculta la pantalla; no es control de acceso real.
  ADMIN_EMAILS: [],
  SITIO_URL: '',            // ej: 'https://miksapropiedades.cl' (para los códigos QR y enlaces compartidos). Vacío = usa la URL actual
  UF_FALLBACK: 41000,       // valor referencial si no hay conexión con mindicador.cl
  CORREDORES: [
    { id: 'c1', nombre: 'Asesor/a de ejemplo 1', cargo: 'Corredor de propiedades', especialidad: 'Ventas · La Serena', registro: '', tel: '', email: '', bio: 'Perfil de ejemplo. Reemplaza por los datos reales del corredor: trayectoria, zonas y tipo de propiedades que maneja.' },
    { id: 'c2', nombre: 'Asesor/a de ejemplo 2', cargo: 'Corredor de propiedades', especialidad: 'Arriendos · Coquimbo', registro: '', tel: '', email: '', bio: 'Perfil de ejemplo. Reemplaza por los datos reales del corredor.' },
    { id: 'c3', nombre: 'Asesor/a de ejemplo 3', cargo: 'Asesor de inversión', especialidad: 'Inversión y terrenos', registro: '', tel: '', email: '', bio: 'Perfil de ejemplo. Reemplaza por los datos reales del asesor.' },
  ],
};
