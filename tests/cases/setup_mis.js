localStorage.setItem('miksa_session',JSON.stringify({email:'a@b.cl',nombre:'Ana',exp:Date.now()+1e6}));
localStorage.setItem('miksa_avisos',JSON.stringify([{id:'M-1',titulo:'Mio',op:'venta',precio:'10',sector:'Guayacán',owner:'a@b.cl',fecha:new Date().toISOString(),fotos:[]}]));
localStorage.setItem('miksa_leads',JSON.stringify([{id:'L-9',creado:new Date().toISOString(),tipo:'visita',estado:'nuevo',nombre:'Zoe',email:'z@z.cl',tel:'912345678',propiedadId:'M-1',propiedadTitulo:'Mio',fecha:'2026-10-02',hora:'Mañana (9–13 h)',mensaje:'hola'}]));
localStorage.setItem('miksa_busquedas',JSON.stringify([{id:'B-1',nombre:'Arriendo',qs:'?op=arriendo',visto:['DEMO-2'],creada:new Date().toISOString()}]));
