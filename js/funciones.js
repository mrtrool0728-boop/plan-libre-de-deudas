/* Plan Libre de Deudas: funciones nuevas (recordatorios, simulador, prima, historial, logros, perfiles, respaldo).
   Usa window.PLD (de js/app.js) y simulate() (de js/calculos.js). Cada bloque registra su render en PLD.hooks. */
(function(){
const P=PLD,{$,$$,S,money,short,mlabel,esc,todayISO}=P;
const guardarLS=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},leerLS=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const K=PERFILES.clave();
const mesesEntre=(a,b)=>(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();

/* =========================================================
   Recordatorios
   ========================================================= */
// Calendario: un evento mensual por deuda, con aviso dos días antes a las 9 a. m.
function calendario(){
  const ds=P.activas().filter(d=>d.diaPago);if(!ds.length){P.toast('Pon el día de pago en tus deudas para crear recordatorios');return}
  const p=P.plan(),f=d=>d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
  const txt=s=>String(s).replace(/[\\;,]/g,m=>'\\'+m).replace(/\n/g,'\\n');
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Plan Libre de Deudas//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  ds.forEach(d=>{const ini=P.dueItems().find(x=>x.d.id===d.id)?.due||new Date();const dia=+d.diaPago;
    const fin=p.payoff.find(x=>x.ref.id===d.id)?.fin;const regla=dia>=31?'BYMONTHDAY=28,29,30,31;BYSETPOS=-1':'BYMONTHDAY='+dia;
    L.push('BEGIN:VEVENT','UID:pld-'+d.id+'@plan-libre-de-deudas','DTSTAMP:'+f(new Date())+'T000000Z','DTSTART;VALUE=DATE:'+f(ini),
      'RRULE:FREQ=MONTHLY;'+regla+(fin?';UNTIL='+f(new Date(fin.getFullYear(),fin.getMonth()+1,0)):''),
      'SUMMARY:'+txt('Pagar '+d.nombre+' · '+money(d.cuota)),
      'DESCRIPTION:'+txt('Cuota de '+d.nombre+(d.entidad?' ('+d.entidad+')':'')+'. Cuando pagues, regístralo en Plan Libre de Deudas.'),
      'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+txt('En 2 días pagas '+d.nombre),'TRIGGER:-PT39H','END:VALARM','END:VEVENT')});
  L.push('END:VCALENDAR');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([L.join('\r\n')],{type:'text/calendar'}));a.download='recordatorios_pagos.ics';
  document.body.appendChild(a);a.click();a.remove();P.toast('Abre el archivo para agregarlo a tu calendario')}
$('#btnCal').addEventListener('click',calendario);$('#btnCal2').addEventListener('click',calendario);

// Avisos del navegador: cuando abres la app, te avisa de cuotas de los próximos 3 días.
const avisosOn=()=>leerLS('pld-avisos')==='1'&&'Notification' in window&&Notification.permission==='granted';
function pintarAvisos(){const b=$('#btnAvisos');if(!('Notification' in window)){b.hidden=true;return}$('#avisosTxt').textContent=avisosOn()?'Avisos activados':'Avisarme al abrir la app';b.classList.toggle('on',avisosOn())}
$('#btnAvisos').addEventListener('click',async()=>{
  if(avisosOn()){guardarLS('pld-avisos','0');pintarAvisos();P.toast('Avisos desactivados');return}
  const r=await Notification.requestPermission();
  if(r==='granted'){guardarLS('pld-avisos','1');pintarAvisos();P.toast('Listo: te avisamos al abrir la app');revisarAvisos(true)}
  else P.toast('El navegador bloqueó los avisos. Actívalos en la configuración del sitio.')});
async function revisarAvisos(forzar){
  if(!avisosOn())return;const hoy=todayISO(),k='pld-aviso-dia:'+K;if(!forzar&&leerLS(k)===hoy)return;
  const xs=P.dueItems().filter(x=>!x.pagado&&x.dias<=3);if(!xs.length)return;guardarLS(k,hoy);
  const t=xs.length===1?'Pago próximo: '+xs[0].d.nombre:xs.length+' pagos en los próximos días';
  const body=xs.map(x=>(x.dias===0?'Hoy':x.dias===1?'Mañana':'En '+x.dias+' días')+': '+x.d.nombre+' '+money(x.d.cuota)).join('\n');
  const op={body,icon:'iconos/icono-192.png',badge:'iconos/icono-192.png',tag:'pld-pagos'};
  try{const reg=await navigator.serviceWorker?.getRegistration();if(reg)await reg.showNotification(t,op);else new Notification(t,op)}catch(e){}}

/* =========================================================
   Simulador "¿y si…?"
   ========================================================= */
let simIni=false;
function opcionesMes(){const s=new Date();s.setDate(1);let def=1;const o=[];
  for(let m=1;m<=12;m++){const d=new Date(s.getFullYear(),s.getMonth()+m,1);o.push(`<option value="${m}">${mlabel(d)}</option>`);if(def===1&&(d.getMonth()===6||d.getMonth()===0)&&m>1)def=m}
  $('#sMes').innerHTML=o.join('');$('#sMes').value=String(def)}
function iniciarSim(){if(simIni||!S.ready.c)return;simIni=true;opcionesMes();$('#sExtra').value=+S.pres?.abonoExtra||0;$('#sEstr').value=S.pres?.estrategia||'avalancha'}
function renderSim(){
  iniciarSim();const out=$('#simOut');if(!P.activas().length){out.innerHTML='<p class="empty">Agrega tus deudas para probar escenarios.</p>';return}
  const p=P.plan(),ex=+$('#sExtra').value||0,un=+$('#sUnico').value||0,mes=+$('#sMes').value||1;
  const e=simulate(S.deudas,ex,$('#sEstr').value,true,un?{[mes]:un}:null);
  const dm=p.meses-e.meses,di=p.interes-e.interes;
  const tile=(l,v,d,bueno)=>`<div class="simtile"><span class="label">${l}</span><b>${v}</b><span class="delta ${bueno===null?'':bueno?'up':'down'}">${d}</span></div>`;
  const hoy=+S.pres?.abonoExtra||0;
  out.innerHTML=tile('Quedas libre en',e.fin?mlabel(e.fin):'—',dm?`${Math.abs(dm)} ${Math.abs(dm)===1?'mes':'meses'} ${dm>0?'antes':'después'}`:'igual que tu plan',dm?dm>0:null)+
    tile('Intereses que pagarías',money(e.interes),Math.round(di)?`${money(Math.abs(di))} ${di>0?'menos':'más'}`:'igual que tu plan',Math.round(di)?di>0:null)+
    tile('Pagas cada mes',money(P.cuotasMes()+ex),ex!==hoy?`${ex>hoy?'+':'−'}${money(Math.abs(ex-hoy))} frente a hoy`:'lo mismo que hoy',null);
  const sobra=P.ingresoMes()-P.gastosMes()-P.cuotasMes();
  if(P.gastosMes()>0&&ex>sobra)out.insertAdjacentHTML('beforeend',`<p class="callout warn small">Ese abono es mayor a lo que te sobra al mes (${money(Math.max(0,sobra))}). Revísalo antes de comprometerte.</p>`)}
['#sExtra','#sUnico'].forEach(s=>$(s).addEventListener('input',renderSim));['#sMes','#sEstr'].forEach(s=>$(s).addEventListener('change',renderSim));
$('#sAplicar').addEventListener('click',async()=>{if(!P.canWrite())return;try{await P.db().doc('config/presupuesto').update({abonoExtra:+$('#sExtra').value||0,estrategia:$('#sEstr').value});P.toast('Tu plan ahora usa este abono')}catch(e){P.toast('No se pudo guardar')}});
$('#sReset').addEventListener('click',()=>{$('#sExtra').value=+S.pres?.abonoExtra||0;$('#sUnico').value='';$('#sEstr').value=S.pres?.estrategia||'avalancha';renderSim()});
P.hooks.push(renderSim);

/* =========================================================
   Prima, bono o cesantías
   ========================================================= */
function renderPrima(){
  const out=$('#prOut'),monto=+$('#prMonto').value||0,tipo=$('#prTipo').value;
  const nota=tipo==='cesantias'?'<p class="callout small">Las cesantías, mientras sigas en tu trabajo, solo se pueden retirar para vivienda o educación. Si te las entregaron porque terminó tu contrato, sí puedes usarlas libremente. Confírmalo con tu fondo.</p>':'';
  if(!monto){out.innerHTML=nota+'<p class="small muted">Escribe el valor y te decimos cómo repartirlo para salir antes de deudas sin quedarte sin colchón.</p>';return}
  const top=P.activas().sort((a,b)=>b.tasaEA-a.tasaEA)[0];
  const meta=+S.pres?.colchonMeta||0,act=+S.pres?.colchonActual||0,col=Math.min(monto,Math.max(0,meta-act)),abono=monto-col,gusto=Math.round(monto*.1/1000)*1000;
  const pasos=[];
  if(col>0)pasos.push(`<li><b>${money(col)} a tu colchón.</b> Te faltaban ${money(meta-act)} para completarlo. Es lo que te protege de volver a la tarjeta.</li>`);
  if(abono>0&&top){const p=P.plan(),e=simulate(S.deudas,+S.pres?.abonoExtra||0,S.pres?.estrategia||'avalancha',true,{1:abono});
    const dm=p.meses-e.meses,di=p.interes-e.interes;
    pasos.push(`<li><b>${money(abono)} como abono a capital a ${esc(top.nombre)}</b> (${(+top.tasaEA).toFixed(2)}% EA, tu deuda más cara). ${dm>0?`Terminas <b>${dm} ${dm===1?'mes':'meses'} antes</b> y `:''}te ahorras <b>${money(Math.max(0,di))}</b> en intereses. Pide "abono a capital con reducción de plazo".</li>`)}
  else if(abono>0)pasos.push(`<li><b>${money(abono)} para tu ahorro.</b> Ya no tienes deudas activas.</li>`);
  out.innerHTML=nota+`<ol class="rules">${pasos.join('')}</ol><p class="small muted">Si quieres darte un gusto, que no pase de ${money(gusto)} (el 10%) y descuéntalo del abono.</p>`+
    (abono>0&&top?'<div class="row"><button class="btn" type="button" id="prSim">Verlo en el simulador</button></div>':'');
  $('#prSim')?.addEventListener('click',()=>{$('#sUnico').value=abono;$('#sMes').value='1';renderSim();$('#simCard').scrollIntoView({behavior:P.reduce?'auto':'smooth',block:'center'})})}
$('#prMonto').addEventListener('input',renderPrima);$('#prTipo').addEventListener('change',renderPrima);
P.hooks.push(renderPrima);

/* =========================================================
   Historial real de la deuda
   ========================================================= */
function renderHist(){
  const el=$('#histChart'),note=$('#histNote');
  const pts=[...S.hist].filter(h=>h&&h.fecha).sort((a,b)=>a.fecha<b.fecha?-1:1).map(h=>({d:new Date(h.fecha+'T00:00'),v:+h.total||0}));
  if(pts.length<2){el.innerHTML=`<p class="empty">Cada vez que registres un pago o actualices un saldo, aquí se dibuja cómo baja tu deuda de verdad. Hoy debes <b>${money(P.totalSaldo())}</b>.</p>`;note.textContent='';return}
  const W=820,H=220,L=58,R=20,T=14,B=28,t0=+pts[0].d,t1=+pts[pts.length-1].d||t0+1,mx=Math.max(...pts.map(p=>p.v),1);
  const x=t=>L+(W-L-R)*((t-t0)/Math.max(1,t1-t0)),y=v=>T+(H-T-B)*(1-v/mx);
  let g='';for(let k=0;k<=3;k++){const v=mx*k/3;g+=`<line x1="${L}" x2="${W-R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--line)"/><text x="${L-8}" y="${(y(v)+4).toFixed(1)}" text-anchor="end">${(v/1e6).toFixed(1)}M</text>`}
  const ln=pts.map(p=>`${x(+p.d).toFixed(1)},${y(p.v).toFixed(1)}`).join(' L');
  const lab=[pts[0],pts[pts.length-1]].map((p,i)=>`<text x="${x(+p.d).toFixed(1)}" y="${H-8}" text-anchor="${i?'end':'start'}">${p.d.getDate()} ${MESES[p.d.getMonth()]} ${String(p.d.getFullYear()).slice(2)}</text>`).join('');
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Deuda total registrada a lo largo del tiempo"><defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--primary-2)" stop-opacity=".35"/><stop offset="1" stop-color="var(--primary-2)" stop-opacity="0"/></linearGradient></defs>${g}<path d="M${ln} L${x(t1).toFixed(1)},${y(0)} L${L},${y(0)} Z" fill="url(#hg)"/><path class="drawline" d="M${ln}" fill="none" stroke="var(--primary-2)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" pathLength="1"/>${pts.map(p=>`<circle cx="${x(+p.d).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="4" fill="var(--glass-strong)" stroke="var(--primary-2)" stroke-width="2" data-tip="${esc(`<div class='tt'>${p.d.getDate()} ${MESES[p.d.getMonth()]} ${p.d.getFullYear()}</div>${money(p.v)}`)}"/>`).join('')}${lab}</svg>`;
  const baj=pts[0].v-pts[pts.length-1].v;
  note.textContent=baj>0?`Desde el ${pts[0].d.getDate()} de ${MESES[pts[0].d.getMonth()]} tu deuda bajó ${money(baj)} (${Math.round(baj/Math.max(pts[0].v,1)*100)}%).`:'Todavía no se ve una bajada. Sigue registrando tus pagos.'}
P.hooks.push(renderHist);

/* =========================================================
   Logros y racha
   ========================================================= */
const mesKey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
function racha(){const set=new Set(S.pagos.map(p=>String(p.fecha||'').slice(0,7)));const d=new Date();d.setDate(1);
  if(!set.has(mesKey(d)))d.setMonth(d.getMonth()-1);let n=0;while(set.has(mesKey(d))){n++;d.setMonth(d.getMonth()-1)}return{n,set}}
function insignias(){
  const t=P.totalSaldo(),ini=P.totalIni(),av=ini>0?(ini-t)/ini:0,tar=S.deudas.filter(x=>/tarjeta/i.test(x.tipo||'')),r=racha().n;
  const meta=+S.pres?.colchonMeta||0,act=+S.pres?.colchonActual||0;
  return[
    {id:'diagnostico',ic:'#i-check',n:'Diagnóstico hecho',d:'Anotaste tus deudas',ok:S.deudas.length>0},
    {id:'presupuesto',ic:'#i-pie',n:'Cuentas claras',d:'Llenaste tus gastos fijos',ok:P.gastosMes()>0},
    {id:'primer-pago',ic:'#i-receipt',n:'Primer pago',d:'Registraste tu primer pago',ok:S.pagos.length>0,fiesta:1},
    {id:'primer-abono',ic:'#i-down',n:'Abono a capital',d:'Hiciste tu primer abono extra',ok:S.pagos.some(p=>p.tipo==='capital'),fiesta:1},
    {id:'colchon',ic:'#i-shield',n:'Colchón listo',d:'Completaste tu ahorro para imprevistos',ok:meta>0&&act>=meta,fiesta:1},
    {id:'p25',ic:'#i-flag',n:'25% pagado',d:'Ya va un cuarto del camino',ok:av>=.25,fiesta:1},
    {id:'p50',ic:'#i-flag',n:'Mitad del camino',d:'Pagaste la mitad de tu deuda',ok:av>=.5,fiesta:1},
    {id:'p75',ic:'#i-flag',n:'75% pagado',d:'La recta final',ok:av>=.75,fiesta:1},
    {id:'primera-pagada',ic:'#i-card',n:'Primera deuda en cero',d:'Liquidaste una deuda completa',ok:S.deudas.some(x=>+x.saldo<=0&&+x.saldoInicial>0)},
    {id:'tarjetas',ic:'#i-flame',n:'Tarjetas en cero',d:'Ninguna tarjeta con saldo',ok:tar.length>0&&tar.every(x=>+x.saldo<=0),fiesta:1},
    {id:'racha3',ic:'#i-spark',n:'Racha de 3 meses',d:'Tres meses seguidos registrando pagos',ok:r>=3,fiesta:1},
    {id:'racha6',ic:'#i-spark',n:'Racha de 6 meses',d:'Medio año sin fallar',ok:r>=6,fiesta:1},
    {id:'libre',ic:'#i-trophy',n:'Libre de deudas',d:'Lo lograste',ok:S.deudas.length>0&&t<=0,fiesta:1}]}
function renderLogros(){
  const bs=insignias(),{n,set}=racha(),gan=bs.filter(b=>b.ok);
  $('#lgCuenta').textContent=`${gan.length} de ${bs.length} insignias`;
  $('#lgRacha').textContent=n+(n===1?' mes':' meses');
  $('#lgRachaTxt').textContent=n?`${n===1?'con pagos registrados.':'seguidos registrando pagos.'} ${n<3?'Llega a 3 para tu primera insignia de racha.':n<6?'Llega a 6 para la siguiente.':'Vas muy bien.'}`:'Registra tus pagos cada mes para construir tu racha.';
  const s=new Date();s.setDate(1);
  $('#lgMeses').innerHTML=Array.from({length:12},(_,i)=>{const d=new Date(s.getFullYear(),s.getMonth()-11+i,1),on=set.has(mesKey(d));return `<span class="${on?'on':''}" title="${mlabel(d)}${on?': con pagos':''}"><i></i>${MESES[d.getMonth()]}</span>`}).join('');
  $('#lgBadges').innerHTML=bs.map(b=>`<div class="badge ${b.ok?'ok':''}"><div class="tile ${b.ok?'':'gray'}"><svg class="i" aria-hidden="true"><use href="${b.ok?b.ic:b.ic}"/></svg></div><div><b>${b.n}</b><span>${b.ok?b.d:'Pendiente: '+b.d.toLowerCase()}</span></div></div>`).join('');
  // Celebra las insignias nuevas (la primera vez solo se guardan, sin fiesta).
  const k='pld-logros:'+K,prev=leerLS(k);const ids=gan.map(b=>b.id);
  if(prev!==null){const viejos=new Set(JSON.parse(prev||'[]'));const nueva=gan.find(b=>b.fiesta&&!viejos.has(b.id));
    if(nueva&&$('#celebra').hidden)document.dispatchEvent(new CustomEvent('pld:celebrar',{detail:{titulo:'Nueva insignia: '+nueva.n,texto:nueva.d+'. Mírala en Logros.'}}))}
  guardarLS(k,JSON.stringify(ids))}
P.hooks.push(renderLogros);

/* =========================================================
   Perfiles
   ========================================================= */
function renderPerfiles(){const act=PERFILES.activo().id,nom=(S.pres?.nombre||'').trim();
  $('#perfilesList').innerHTML=PERFILES.lista().map(p=>`<li><span><b>${esc(p.nombre)}</b>${p.id===act&&nom?' · '+esc(nom):''}${p.id===act?' <span class="pill good">En uso</span>':''}</span><span class="row" style="gap:6px">${p.id!==act?`<button class="btn ghost" type="button" data-usar="${p.id}">Usar</button>`:''}${p.id!=='principal'?`<button class="btn ghost danger" type="button" data-borrar="${p.id}">Eliminar</button>`:''}</span></li>`).join('');
  $$('[data-usar]').forEach(b=>b.addEventListener('click',()=>{PERFILES.cambiar(b.dataset.usar);location.reload()}));
  $$('[data-borrar]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.seguro){PERFILES.borrar(b.dataset.borrar);if(b.dataset.borrar===act)location.reload();else renderPerfiles();return}
    b.dataset.seguro='1';b.textContent='¿Borrar sus datos? Toca otra vez'}))}
$('#btnPerfiles').addEventListener('click',()=>{renderPerfiles();$('#perfilesM').hidden=false});
$('#perfilCrear').addEventListener('click',()=>{const n=$('#perfilNuevo').value.trim();if(!n){P.toast('Escribe un nombre para el perfil');return}PERFILES.crear(n);location.reload()});

/* =========================================================
   Respaldo
   ========================================================= */
const archivo=()=>{const b=P.respaldoBlob();const f=new File([b],P.respaldoNombre(),{type:'application/json'});
  if(navigator.canShare&&navigator.canShare({files:[f]}))return f;const f2=new File([b],P.respaldoNombre(),{type:'text/plain'});return navigator.canShare&&navigator.canShare({files:[f2]})?f2:null};
async function compartir(){const f=archivo();if(!f){$('#bkExport').click();return}
  try{await navigator.share({files:[f],title:'Respaldo Plan Libre de Deudas'});P.marcarRespaldo();P.toast('Respaldo guardado')}catch(e){if(e&&e.name!=='AbortError')$('#bkExport').click()}}
$('#bkShare').hidden=!archivo();$('#bkShare').addEventListener('click',compartir);
$('#bkAvisoBtn').addEventListener('click',()=>{archivo()?compartir():$('#bkExport').click()});
$('#bkImport').setAttribute('accept','.json,.txt,application/json,text/plain');
function renderRespaldo(){const u=leerLS('pld-respaldo:'+K),dias=u?Math.floor((Date.now()-new Date(u+'T00:00'))/864e5):null;
  $('#bkUltimo').textContent=u?`Último respaldo: ${u}${dias>0?` (hace ${dias} ${dias===1?'día':'días'})`:' (hoy)'}.`:'Aún no has guardado un respaldo en este dispositivo.';
  let oculto=false;try{oculto=!!sessionStorage.getItem('pld-bk-oculto')}catch(e){}
  const ver=S.deudas.length>0&&(dias===null?S.pagos.length>=2:dias>30)&&!oculto;
  $('#bkAviso').hidden=!ver;if(ver)$('#bkAvisoTxt').textContent=u?`Tu último respaldo tiene ${dias} días. Si cambias de celular o se borra el navegador, perderías lo registrado desde entonces.`:'Todavía no guardas un respaldo. Si cambias de celular o se borra el navegador, perderías tus datos.'}
document.addEventListener('pld:respaldo',()=>{try{sessionStorage.setItem('pld-bk-oculto','1')}catch(e){}renderRespaldo()});
P.hooks.push(renderRespaldo);

/* Primera pintura con todo registrado, y avisos al abrir. */
P.hooks.push(pintarAvisos);
// Primera vez con datos: las gráficas de la pestaña visible se dibujan, y se revisan los avisos.
let primera=true;P.hooks.push(()=>{if(!primera)return;primera=false;
  requestAnimationFrame(()=>{const v=$('[data-panel]:not([hidden])');if(v){v.dataset.dir='next';v.classList.add('anim');setTimeout(()=>v.classList.remove('anim'),1400)}});
  setTimeout(()=>revisarAvisos(false),1500)});
P.renderAll();
})();
