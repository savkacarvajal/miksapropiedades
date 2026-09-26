// Caso de prueba (portado)
__run(async T => {
  var ok = T.ok, sleep = T.sleep, near = T.near;
  var sleep=ms=>new Promise(f=>setTimeout(f,ms));
ok('panel visible para admin', !$id('p-main').hidden && $id('p-deny').hidden);
ok('KPIs', $id('p-kpi').children.length===4 && $id('p-kpi').children[0].textContent.indexOf('3')===0);
ok('3 leads listados', document.querySelectorAll('#p-leads .lead-card').length===3);
var sel=document.querySelector('#p-leads select[data-lead="L-1"]'); sel.value='visita'; sel.dispatchEvent(new Event('change'));
ok('cambiar estado CRM persiste', getLeads().find(l=>l.id==='L-1').estado==='visita');
$id('p-filtro').value='cerrado'; $id('p-filtro').dispatchEvent(new Event('change')); ok('filtro por estado', document.querySelectorAll('#p-leads .lead-card').length===1);
document.querySelectorAll('.tab')[1].click(); ok('agenda muestra 2 visitas ordenadas', document.querySelectorAll('#p-agenda .lead-card').length===2 && $id('p-agenda').querySelector('h3').textContent.indexOf('30')>-1);
document.querySelector('[data-act="descargarIcs"]').click(); await sleep(100);
var ics=await window.__blobs[0].text();
ok('.ics valido con alarma', ics.indexOf('BEGIN:VEVENT')>-1 && ics.indexOf('BEGIN:VALARM')>-1 && ics.indexOf('DTSTART:20260930T100000')>-1);
exportarLeads(); await sleep(100); var csv=await window.__blobs[1].text();
ok('CSV neutraliza formulas (=CMD)', csv.indexOf('"\'=CMD|calc"')>-1 && csv.indexOf('""Mar""')>-1);
document.querySelectorAll('.tab')[2].click(); ok('estadisticas por aviso', document.querySelectorAll('#p-stats tr').length>=8);
// sin permisos
MIKSA_CONFIG.ADMIN_EMAILS.length=0; ok('esAdmin false sin correo autorizado', esAdmin()===false);
});
