MIKSA_CONFIG.ADMIN_EMAILS.push('corredor@test.cl');
localStorage.setItem('miksa_session',JSON.stringify({email:'corredor@test.cl',nombre:'Cor',exp:Date.now()+1e6}));
localStorage.setItem('miksa_leads',JSON.stringify([
 {id:'L-1',creado:new Date().toISOString(),tipo:'visita',estado:'nuevo',nombre:'=CMD|calc',email:'a@b.cl',tel:'912345678',propiedadId:'DEMO-1',propiedadTitulo:'Edificio, Borde "Mar"',fecha:'2026-10-01',hora:'Tarde (14–19 h)',mensaje:'hola; adios'},
 {id:'L-2',creado:new Date().toISOString(),tipo:'tasacion',estado:'contactado',nombre:'Luis',email:'l@b.cl',tel:'912345678',mensaje:'x'},
 {id:'L-3',creado:new Date().toISOString(),tipo:'visita',estado:'cerrado',nombre:'Eva',email:'e@b.cl',tel:'912345678',propiedadId:'DEMO-2',propiedadTitulo:'Depto',fecha:'2026-09-30',hora:'Mañana (9–13 h)'}]));
window.__blobs=[]; var oc=URL.createObjectURL; URL.createObjectURL=function(b){window.__blobs.push(b);return oc.call(URL,b)};
