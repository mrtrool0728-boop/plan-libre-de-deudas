/* Plan Libre de Deudas: pantallas e interacción.
   Usa lo que definen js/datos.js (USURA, OFERTAS, DEF_GASTOS, SEED) y js/calculos.js (MESES, rm, simulate),
   que se cargan antes en index.html. */
(function(){
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0});
const money=n=>fmt.format(Math.round(n||0));
const short=n=>{n=Math.round(n||0);const a=Math.abs(n);return a>=1e6?'$'+(n/1e6).toFixed(a>=1e7?1:2).replace('.',',')+' M':a>=1e3?'$'+Math.round(n/1e3)+' mil':'$'+n};
const mlabel=d=>MESES[d.getMonth()]+' '+d.getFullYear();
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SLOT0={'bancolombia-libre-inversion':1,'bancolombia-tc-pesos':2,'bbva-aqua':3,'bancolombia-tc-usd':4,'fondo-crea-actual':5};
const slotOf=d=>d.slot||SLOT0[d.id]||((String(d.id).split('').reduce((a,c)=>a+c.charCodeAt(0),0))%8)+1;
const col=d=>`var(--s${slotOf(d)})`;

const S={deudas:[],pagos:[],pres:null,pasos:null,hist:[],ready:{d:false,c:false}};
let db=null,canWrite=true,editing=null,editingSlot=null;

function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,2600)}

/* ---------- Tooltip ---------- */
const tip=$('#tip');
function showTip(html,e){tip.innerHTML=html;tip.hidden=false;moveTip(e)}
function moveTip(e){const w=tip.offsetWidth,h=tip.offsetHeight;let x=e.clientX+14,y=e.clientY+14;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y+h>innerHeight-8)y=e.clientY-h-14;tip.style.left=Math.max(8,x)+'px';tip.style.top=Math.max(8,y)+'px'}
document.addEventListener('mousemove',e=>{const t=e.target.closest&&e.target.closest('[data-tip]');if(t){showTip(t.dataset.tip,e)}else if(!e.target.closest('#area'))tip.hidden=true});
const tipRow=(c,l,v)=>`<div class="tr"><span><i style="background:${c}"></i>${esc(l)}</span><b>${v}</b></div>`;

/* ---------- Tabs ---------- */
const TABS=['resumen','deudas','plan','cartera','presupuesto','pagos','abonos','logros'];
let tabNow='resumen';
function showTab(name){if(!TABS.includes(name))return;const dir=TABS.indexOf(name)>=TABS.indexOf(tabNow)?'next':'prev';tabNow=name;
  $$('[data-tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===name));
  $$('[data-panel]').forEach(p=>{p.hidden=p.dataset.panel!==name;if(!p.hidden){p.dataset.dir=dir;p.classList.remove('anim');void p.offsetWidth;p.classList.add('anim');clearTimeout(p._a);p._a=setTimeout(()=>p.classList.remove('anim'),1200)}});
  tip.hidden=true;document.dispatchEvent(new CustomEvent('pld:tab',{detail:name}))}
$$('[data-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
$$('[data-open-pago]').forEach(b=>b.addEventListener('click',()=>{$('#pagoM').hidden=false;setTimeout(()=>$('#rMonto').focus(),60)}));
const hh=(location.hash||'').slice(1);if(TABS.includes(hh))showTab(hh);

/* ---------- Derived ---------- */
const activas=()=>S.deudas.filter(d=>(+d.saldo||0)>0);
const totalSaldo=()=>S.deudas.reduce((a,d)=>a+(+d.saldo||0),0);
const totalIni=()=>S.deudas.reduce((a,d)=>a+Math.max(+d.saldoInicial||0,+d.saldo||0),0);
const cuotasMes=()=>activas().reduce((a,d)=>a+(+d.cuota||0),0);
const gastosMes=()=>(S.pres?.gastos||[]).reduce((a,g)=>a+(+g.valor||0),0);
const ingresoMes=()=>(+S.pres?.ingresoQuincenal||0)*2;
const burnOf=d=>(+d.saldo||0)*rm(d.tasaEA)+(+d.saldo>0?(+d.cargos||0):0);
const pagadoTotal=()=>S.pagos.reduce((a,p)=>a+(+p.monto||0),0);

/* simulate() está en js/calculos.js */
let _p=null,_b=null;
const plan=()=>_p||(_p=simulate(S.deudas,+S.pres?.abonoExtra||0,S.pres?.estrategia||'avalancha',true));
const base=()=>_b||(_b=simulate(S.deudas,0,'avalancha',false));
const invalidate=()=>{_p=null;_b=null};

function nextDue(dia){const now=new Date();now.setHours(0,0,0,0);const mk=(y,m)=>new Date(y,m,Math.min(dia,new Date(y,m+1,0).getDate()));let d=mk(now.getFullYear(),now.getMonth());if(d<now)d=mk(now.getFullYear(),now.getMonth()+1);return d}
function dueItems(){const now=new Date();now.setHours(0,0,0,0);
  return activas().filter(d=>d.diaPago).map(d=>{const due=nextDue(+d.diaPago);const desde=new Date(due);desde.setDate(desde.getDate()-28);
    const pagado=S.pagos.some(p=>p.deudaId===d.id&&new Date(p.fecha+'T00:00')>=desde);return{d,due,dias:Math.round((due-now)/864e5),pagado}}).sort((a,b)=>a.due-b.due)}

/* ---------- Portada ---------- */
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function countTo(el,val,f){if(!el)return;const from=+el.dataset.v||0;el.dataset.v=val;if(reduce||from===val){el.textContent=f(val);return}
  const t0=performance.now(),dur=900;cancelAnimationFrame(el._r);const step=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=f(from+(val-from)*e);if(k<1)el._r=requestAnimationFrame(step)};el._r=requestAnimationFrame(step)}
$$('[data-goto]').forEach(b=>b.addEventListener('click',()=>{showTab(b.dataset.goto);document.querySelector('nav.tabs').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})}));
function renderHero(){
  const p=plan(),b=base(),t=totalSaldo(),ah=Math.max(0,b.interes-p.interes);
  const nm=(S.pres?.nombre||'').trim(),d=new Date();$('#heroDate').textContent='Corte: '+MESES[d.getMonth()]+' '+d.getFullYear();
  const ini=totalIni(),av=ini>0?Math.round(Math.max(0,(ini-t)/ini)*100):0;
  countTo($('#kTotal'),t,money);
  $('#heroTitle').textContent=t>0?`${nm?nm+', q':'Q'}uedas libre en ${p.fin?mlabel(p.fin):'—'}`:S.deudas.length?`${nm?nm+', ¡l':'¡L'}o lograste!`:'Agrega tus deudas para ver tu plan';
  $('#heroLead').innerHTML=t>0?`Faltan <b>${p.meses} ${p.meses===1?'mes':'meses'}</b>. Llevas <b>${av}%</b> pagado y te ahorras <b>${money(ah)}</b> en intereses${b.meses>p.meses?` frente a pagar solo los mínimos, terminando ${b.meses-p.meses} meses antes`:''}.`:S.deudas.length?'Ya no tienes deudas. Lo que pagabas en cuotas ahora puede ir a tu ahorro.':'Anota tus deudas en la pestaña Deudas y en un minuto ves en qué mes quedas libre.';
  // etapas
  const by=id=>S.deudas.find(x=>x.id===id);const steps=S.pasos?.items||[];
  const tarjetas=S.deudas.filter(x=>/tarjeta/i.test(x.tipo||''));
  const st=[
    {n:'Diagnóstico',d:'Tus deudas, tasas y cuotas claras',ok:S.deudas.length>0,ic:'#i-check'},
    {n:'Colchón listo',d:'Un ahorro para imprevistos',ok:(+S.pres?.colchonMeta||0)>0&&(+S.pres?.colchonActual||0)>=(+S.pres?.colchonMeta||0),ic:'#i-shield'},
    {n:'Primera deuda pagada',d:'La de tasa más alta, en cero',ok:S.deudas.some(x=>+x.saldo<=0&&+x.saldoInicial>0),ic:'#i-card'},
    {n:'Tarjetas en cero',d:'Sin saldo en tarjetas de crédito',ok:tarjetas.length>0&&tarjetas.every(x=>+x.saldo<=0),ic:'#i-flame'},
    {n:'Libre de deudas',d:p.fin?'Meta: '+mlabel(p.fin):'¡Logrado!',ok:t<=0,ic:'#i-flag'}];
  const nowI=st.findIndex(x=>!x.ok);
  $('#stageNow').textContent=nowI<0?'Programa completo':`Vas en la etapa ${nowI+1} de 5`;
  $('#stages').innerHTML=st.map((x,i)=>`<li class="${x.ok?'done':''} ${i===nowI?'now':''}"><div class="tile ${x.ok?'green':i===nowI?'':'gray'}"><svg class="i" aria-hidden="true"><use href="${x.ok?'#i-tick':x.ic}"/></svg></div><span class="sn">${i+1}. ${x.n}${x.ok?' <span class="st">lista</span>':i===nowI?' <span class="st">en curso</span>':''}</span><span class="sd">${esc(x.d)}</span></li>`).join('');
}

/* ---------- KPIs ---------- */
function renderKpis(){
  const t=totalSaldo(),ini=totalIni(),av=ini>0?Math.max(0,(ini-t)/ini):0;
  
  $('#kTotalS').textContent=`de ${money(ini)} al empezar`;
  $('#kAvance').textContent=Math.round(av*100)+'%';
  $('#kBar').style.width=(av*100).toFixed(1)+'%';
  countTo($('#kCuotas'),cuotasMes(),money);
  const ing=ingresoMes();$('#kCuotasS').textContent=ing?Math.round(cuotasMes()/ing*100)+'% de tu ingreso':'Falta tu ingreso';
  countTo($('#kInt'),activas().reduce((a,d)=>a+burnOf(d),0),money);$('#kIntS').textContent='plata que se pierde';
  const ext=+S.pres?.abonoExtra||0;countTo($('#kExtra'),ext,money);$('#kExtraS').textContent=ext?'cada mes, a capital':'aún no abonas extra';
  const nx=dueItems().find(x=>!x.pagado);
  $('#kNextS').textContent=nx?`Próximo pago · ${nx.dias===0?'hoy':nx.dias===1?'mañana':'en '+nx.dias+' días'}`:'Próximo pago';
  $('#kNext').textContent=nx?nx.d.nombre:'Todo al día';
  $('#kNextV').textContent=nx?money(nx.d.cuota):'';
  $('#kNextD').textContent=nx?`${nx.d.entidad?nx.d.entidad+' · ':''}vence el ${nx.due.getDate()} ${MESES[nx.due.getMonth()]}`:'No tienes cuotas pendientes este mes.';
}

/* ---------- Sueldo ---------- */
function renderSalary(){
  const ing=ingresoMes(),cuo=cuotasMes(),gas=gastosMes(),ext=+S.pres?.abonoExtra||0;
  const libre=Math.max(0,ing-cuo-gas-ext);
  const parts=[{l:'Cuotas de deudas',v:cuo,c:'var(--s2)'},{l:'Gastos fijos',v:gas,c:'var(--s1)'},{l:'Abono extra',v:ext,c:'var(--s7)'},{l:'Te queda libre',v:libre,c:'var(--s3)'}];
  const tot=Math.max(ing,cuo+gas+ext,1);
  $('#salaryBar').innerHTML=parts.filter(x=>x.v>0).map(x=>`<div style="flex-grow:${x.v};background:${x.c}" data-tip="${esc(`<div class='tt'>${x.l}</div>${money(x.v)} · ${Math.round(x.v/tot*100)}% del mes`)}"></div>`).join('');
  $('#salaryKey').innerHTML=parts.map(x=>`<div class="key"><i style="background:${x.c}"></i><div><b>${money(x.v)}</b><small>${x.l} · ${Math.round(x.v/tot*100)}%</small></div></div>`).join('')+
    (gas===0?`<div class="key"><i style="background:var(--warn)"></i><div><b>Faltan gastos</b><small>Llénalos en Presupuesto</small></div></div>`:'');
  const pct=ing?cuo/ing:0;
  $('#salaryPill').innerHTML=!ing?'':pct>0.4?`<span class="pill bad">Deudas: ${Math.round(pct*100)}% del ingreso · muy alto</span>`:pct>0.3?`<span class="pill warn">Deudas: ${Math.round(pct*100)}% del ingreso · alto</span>`:`<span class="pill good">Deudas: ${Math.round(pct*100)}% del ingreso · sano</span>`;
}

/* ---------- Donut ---------- */
function renderDonut(){
  const ds=activas().sort((a,b)=>slotOf(a)-slotOf(b));const tot=totalSaldo();
  if(!ds.length){$('#donut').innerHTML='';$('#donutLeg').innerHTML='<p class="empty">Sin deudas activas.</p>';return}
  const R=80,C=2*Math.PI*R;let acc=0;
  const segs=ds.map(d=>{const f=d.saldo/tot,len=Math.max(0,f*C-3);const s=`<circle class="seg" cx="100" cy="100" r="${R}" stroke="${col(d)}" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-acc*C).toFixed(2)}" data-tip="${esc(`<div class='tt'>${esc(d.nombre)}</div>${money(d.saldo)} · ${Math.round(f*100)}% · ${(+d.tasaEA).toFixed(2)}% EA`)}"/>`;acc+=f;return s});
  $('#donut').innerHTML=`<svg viewBox="0 0 200 200" role="img" aria-label="Reparto de la deuda por entidad">${segs.join('')}</svg><div class="c"><span>Total</span><b>${short(tot)}</b></div>`;
  $('#donutLeg').innerHTML=ds.map(d=>`<div class="it"><i style="background:${col(d)}"></i><span title="${esc(d.nombre)}">${esc(d.nombre)}</span><span class="seg-pct">${Math.round(d.saldo/tot*100)}% · ${short(d.saldo)}</span></div>`).join('');
}

/* ---------- Burn ---------- */
function renderBurn(){
  const ds=activas().map(d=>({d,v:burnOf(d)})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);const mx=Math.max(1,...ds.map(x=>x.v));
  $('#burn').innerHTML=ds.length?ds.map(({d,v})=>`<div class="hb" data-tip="${esc(`<div class='tt'>${esc(d.nombre)}</div>Intereses ${money(d.saldo*rm(d.tasaEA))}${d.cargos?'<br>Seguros/manejo '+money(d.cargos):''}<br>Tasa ${(+d.tasaEA).toFixed(2)}% EA`)}"><span class="nm">${esc(d.nombre)}</span><div class="tr"><i style="width:${(v/mx*100).toFixed(1)}%;background:${col(d)}"></i></div><span class="num">${money(v)}</span></div>`).join(''):'<p class="empty">Sin costos este mes.</p>';
  countTo($('#burnTotal'),ds.reduce((a,x)=>a+x.v,0),money);
}

/* ---------- Area chart ---------- */
function renderArea(){
  const el=$('#area');const p=plan(),b=base();
  if(!p.rows.length){el.innerHTML='<p class="empty">El gráfico aparece cuando hay deudas con saldo.</p>';$('#chartNote').textContent='';$('#areaLeg').innerHTML='';return}
  const ids=p.ids.sort((a,c)=>slotOf(a)-slotOf(c));
  const W=820,H=280,L=58,R=30,T=14,B=30;const n=p.rows.length+1;
  const t0=totalSaldo();const maxY=Math.max(t0,1);
  const x=i=>L+(W-L-R)*i/(n-1),y=v=>T+(H-T-B)*(1-v/maxY);
  const s0=new Date();s0.setDate(1);
  const series=[{date:s0,bal:Object.fromEntries(ids.map(d=>[d.id,+d.saldo])),saldo:t0},...p.rows];
  let g='';
  for(let k=0;k<=4;k++){const v=maxY*k/4;g+=`<line x1="${L}" x2="${W-R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--line)"/><text x="${L-8}" y="${(y(v)+4).toFixed(1)}" text-anchor="end">${(v/1e6).toFixed(1)}M</text>`}
  const step=Math.max(1,Math.ceil((n-1)/8));
  for(let i=0;i<n;i+=step){const d=series[i].date;g+=`<text x="${x(i).toFixed(1)}" y="${H-8}" text-anchor="middle">${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}</text>`}
  // stacked areas
  let lower=series.map(()=>0),areas='';
  ids.forEach(d=>{const upper=series.map((r,i)=>lower[i]+(r.bal[d.id]||0));
    const top=upper.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' L');
    const bot=lower.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).reverse().join(' L');
    areas+=`<path d="M${top} L${bot} Z" fill="${col(d)}" opacity=".85" stroke="var(--bg)" stroke-width="1"/>`;lower=upper});
  // baseline (solo mínimos)
  const bn=Math.min(b.rows.length,n-1);
  const bpath='M'+x(0)+','+y(t0)+b.rows.slice(0,bn).map((r,i)=>` L${x(i+1).toFixed(1)},${y(r.saldo).toFixed(1)}`).join('');
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Saldo de cada deuda mes a mes con el plan">${g}${areas}<path d="${bpath}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 5" opacity=".55"/><line id="xh" x1="0" x2="0" y1="${T}" y2="${H-B}" stroke="var(--ink)" stroke-width="1" opacity="0"/><rect id="hit" x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="transparent"/></svg>`;
  $('#areaLeg').innerHTML=ids.map(d=>`<span><i style="background:${col(d)};height:10px;width:10px;border-radius:3px"></i>${esc(d.nombre)}</span>`).join('')+'<span><i style="background:none;border-top:2px dashed var(--muted);height:0"></i>Solo cuotas mínimas</span>';
  const svg=el.querySelector('svg'),hit=el.querySelector('#hit'),xh=el.querySelector('#xh');
  hit.addEventListener('mousemove',e=>{const r=svg.getBoundingClientRect();const sx=(e.clientX-r.left)/r.width*W;let i=Math.round((sx-L)/(W-L-R)*(n-1));i=Math.max(0,Math.min(n-1,i));
    xh.setAttribute('x1',x(i));xh.setAttribute('x2',x(i));xh.setAttribute('opacity','.35');const row=series[i];
    showTip(`<div class="tt">${mlabel(row.date)}</div>`+ids.filter(d=>(row.bal[d.id]||0)>0).map(d=>tipRow(col(d),d.nombre,short(row.bal[d.id]))).join('')+`<div class="tr" style="margin-top:4px;border-top:1px solid var(--line);padding-top:4px"><span>Total</span><b>${money(row.saldo)}</b></div>`,e)});
  hit.addEventListener('mouseleave',()=>{xh.setAttribute('opacity','0');tip.hidden=true});
  $('#chartNote').textContent=b.rows.length>=240?'Solo con cuotas mínimas no se ve el final en 20 años.':`Con el plan terminas en ${p.meses} meses (${mlabel(p.fin)}). Solo con cuotas mínimas serían ${b.meses} meses.`;
}

/* ---------- Due & steps ---------- */
function renderDue(){
  const el=$('#dueList');const items=dueItems();
  if(!items.length){el.innerHTML='<p class="empty">No hay pagos pendientes.</p>';return}
  el.innerHTML=items.map(({d,due,dias,pagado})=>{
    const pill=pagado?'<span class="pill good">Pagado</span>':dias<=3?`<span class="pill bad">${dias===0?'Hoy':'En '+dias+' días'}</span>`:dias<=7?`<span class="pill warn">En ${dias} días</span>`:`<span class="pill info">En ${dias} días</span>`;
    return `<div class="due"><div class="row" style="gap:12px;min-width:0;flex-wrap:nowrap"><i style="width:10px;height:10px;border-radius:3px;background:${col(d)};flex:none"></i><div style="min-width:0"><div style="font-weight:600">${esc(d.nombre)}</div><div class="small muted">${due.getDate()} ${MESES[due.getMonth()]} · <span class="num">${money(d.cuota)}</span></div></div></div>${pill}</div>`}).join('');
}
function renderSteps(){
  const el=$('#steps');const items=S.pasos?.items||[];const done=items.filter(i=>i.hecho).length;
  $('#stepsCount').textContent=items.length?`${done} de ${items.length}`:'';$('#stepsBar').style.width=(items.length?done/items.length*100:0)+'%';
  if(!items.length){el.innerHTML='<li class="empty">Sin pasos todavía.</li>';return}
  el.innerHTML=items.map((it,i)=>`<li class="${it.hecho?'done':''}"><label><input type="checkbox" id="paso${i}" data-i="${i}" ${it.hecho?'checked':''} ${canWrite?'':'disabled'}><span>${esc(it.texto)}</span></label></li>`).join('');
  el.querySelectorAll('input').forEach(cb=>cb.addEventListener('change',async()=>{const items=(S.pasos?.items||[]).map(x=>({...x}));items[+cb.dataset.i].hecho=cb.checked;try{await db.doc('config/pasos').set({items})}catch(e){toast('No se pudo guardar el paso')}}));
}

/* ---------- Deudas ---------- */
function renderDebts(){
  const el=$('#debtList');
  const ds=[...S.deudas].sort((a,b)=>((+b.saldo>0)-(+a.saldo>0))||(b.tasaEA-a.tasaEA));
  if(!ds.length){el.innerHTML='<p class="empty">Aún no hay deudas. Agrega la primera con "Otra deuda".</p>';return}
  const top=activas().sort((a,b)=>b.tasaEA-a.tasaEA)[0];const p=plan();
  el.innerHTML=ds.map(d=>{const ini=Math.max(+d.saldoInicial||0,+d.saldo||0);const av=ini?(ini-d.saldo)/ini:0;const C=2*Math.PI*26;
    const tag=+d.saldo<=0?'<span class="pill good">Pagada</span>':top&&top.id===d.id?'<span class="pill bad">Atacar primero</span>':+d.tasaEA>=25?'<span class="pill warn">Cara</span>':'<span class="pill info">Barata</span>';
    const fin=p.payoff.find(x=>x.ref.id===d.id)?.fin;
    return `<article class="glass dcard" style="--c:${col(d)}">
      <div class="top"><div class="mini"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--sunk)" stroke-width="7"/><circle cx="32" cy="32" r="26" fill="none" stroke="${col(d)}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${(C*(1-av)).toFixed(2)}"/></svg><div class="c">${Math.round(av*100)}%</div></div>
        <div style="min-width:0;flex:1"><div class="row" style="gap:8px"><b style="font-size:1.02rem">${esc(d.nombre)}</b>${tag}</div><div class="small muted">${esc(d.entidad||'')} · ${esc(d.tipo||'')}${d.diaPago?' · día '+d.diaPago:''}</div></div></div>
      <div class="dstats"><div><div class="label">Saldo</div><div class="v">${short(d.saldo)}</div></div><div><div class="label">Tasa EA</div><div class="v">${(+d.tasaEA||0).toFixed(2)}%</div></div><div><div class="label">Cuota</div><div class="v">${short(d.cuota)}</div></div></div>
      <div class="due" style="padding:8px 0 0;border-top:1px solid var(--line);border-bottom:0"><span class="small muted">${+d.saldo>0?`Te cuesta ${money(burnOf(d))}/mes · termina ${fin?mlabel(fin):'—'}`:'¡Pagada!'}</span><button class="btn ghost" type="button" data-edit="${esc(d.id)}" ${canWrite?'':'disabled'}>Editar</button></div>
      ${d.nota?`<p class="small muted">${esc(d.nota)}</p>`:''}</article>`}).join('');
  el.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openDebt(S.deudas.find(d=>d.id===b.dataset.edit))));
  if(canWrite)el.querySelectorAll('.dcard').forEach(c=>{c.classList.add('tap');c.addEventListener('click',e=>{if(!e.target.closest('button'))c.querySelector('[data-edit]').click()})});
}
function freeSlot(){const used=new Set(S.deudas.map(slotOf));for(let i=1;i<=8;i++)if(!used.has(i))return i;return 8}
function openDebt(d,isNew){
  editing=d&&!isNew?d.id:null;editingSlot=d&&!isNew?slotOf(d):freeSlot();
  $('#debtForm').hidden=false;$('#dConfirmRow').hidden=true;$('#debtFormTitle').textContent=editing?'Editar deuda':'Nueva deuda';
  d=d||{};$('#dNombre').value=d.nombre||'';$('#dEntidad').value=d.entidad||'';$('#dTipo').value=d.tipo||'Otro';
  $('#dSaldo').value=d.saldo??'';$('#dSaldoIni').value=d.saldoInicial??'';$('#dTasa').value=d.tasaEA??'';$('#dCuota').value=d.cuota??'';$('#dCargos').value=d.cargos??0;$('#dDia').value=d.diaPago??'';$('#dNota').value=d.nota||'';
  $('#dBorrar').hidden=!editing;setTimeout(()=>$('#dNombre').focus(),60);
}
$('#btnNueva').addEventListener('click',()=>openDebt(null,true));
void 0&&$('#btnFondo').addEventListener('click',()=>openDebt({nombre:'Préstamo Fondo CREA (nuevo)',entidad:'Fondo CREA',tipo:'Libranza',saldo:3000000,saldoInicial:3000000,tasaEA:22.42,cuota:321218,cargos:0,diaPago:15,nota:'21 cuotas quincenales de $160.609, descontadas por nómina.'},true));
$('#dCancelar').addEventListener('click',()=>{$('#debtForm').hidden=true;editing=null});
$('#dGuardar').addEventListener('click',async()=>{
  const v={nombre:$('#dNombre').value.trim()||'Deuda',entidad:$('#dEntidad').value.trim(),tipo:$('#dTipo').value,saldo:+$('#dSaldo').value||0,tasaEA:+$('#dTasa').value||0,cuota:+$('#dCuota').value||0,cargos:+$('#dCargos').value||0,diaPago:Math.min(31,Math.max(0,+$('#dDia').value||0))||null,nota:$('#dNota').value.trim(),slot:editingSlot};
  v.saldoInicial=+$('#dSaldoIni').value||v.saldo;
  try{if(editing)await db.doc('deudas/'+editing).update(v);else await db.collection('deudas').add({...v,creado:todayISO()});
    $('#debtForm').hidden=true;editing=null;toast('Deuda guardada');saveHist()}catch(e){toast('No se pudo guardar')}
});
$('#dBorrar').addEventListener('click',()=>$('#dConfirmRow').hidden=false);
$('#dBorrarNo').addEventListener('click',()=>$('#dConfirmRow').hidden=true);
$('#dBorrarSi').addEventListener('click',async()=>{if(!editing)return;try{await db.doc('deudas/'+editing).delete();$('#debtForm').hidden=true;editing=null;toast('Deuda eliminada');saveHist()}catch(e){toast('No se pudo eliminar')}});

/* ---------- Plan ---------- */
function renderPlan(){
  const p=plan(),b=base();
  if(document.activeElement!==$('#pExtra'))$('#pExtra').value=S.pres?.abonoExtra??0;$('#pEstr').value=S.pres?.estrategia||'avalancha';
  const sobr=ingresoMes()-gastosMes()-cuotasMes();
  $('#pHint').textContent=gastosMes()>0?`Según tu presupuesto te sobran ${money(sobr)} al mes después de cuotas y gastos fijos. Deja una parte para el colchón y el resto ponlo aquí.`:'Llena tus gastos fijos en Presupuesto para saber cuánto puedes abonar de verdad.';
  const now=new Date();
  const items=p.payoff.filter(d=>d.fin).sort((a,c)=>a.fin-c.fin);
  $('#payoffList').innerHTML=items.length?items.map(d=>{const m=(d.fin.getFullYear()-now.getFullYear())*12+d.fin.getMonth()-now.getMonth();
    return `<li style="--c:${col(d.ref)}"><span class="dot"><svg class="i" aria-hidden="true"><use href="#i-tick"/></svg></span><div class="when">${mlabel(d.fin)} · en ${m} ${m===1?'mes':'meses'}</div><div class="what">${esc(d.nombre)}</div><div class="small muted">Tasa ${d.tasa.toFixed(2)}% EA</div></li>`}).join('')+
    `<li class="final"><span class="dot"><svg class="i" aria-hidden="true"><use href="#i-flag"/></svg></span><div class="when">${mlabel(p.fin)}</div><div class="what">Libre de deudas</div><div class="small muted">Todo lo que pagabas en cuotas queda para ti.</div></li>`:'<li class="empty">No hay deudas activas.</li>';
  const ah=Math.max(0,b.interes-p.interes),mm=Math.max(0,b.meses-p.meses);
  $('#compare').innerHTML=`<div><div class="bigsave">${money(ah)}</div><div class="small muted">menos en intereses ${mm>0?`y terminas ${mm} meses antes`:'frente a pagar solo los mínimos'}</div></div>
    <div class="hbars">
      <div class="hb"><span class="nm">Con el plan</span><div class="tr"><i style="width:${(p.interes/Math.max(b.interes,p.interes,1)*100).toFixed(1)}%;background:var(--s1)"></i></div><span class="num">${short(p.interes)}</span></div>
      <div class="hb"><span class="nm">Solo mínimos</span><div class="tr"><i style="width:${(b.interes/Math.max(b.interes,p.interes,1)*100).toFixed(1)}%;background:var(--s2)"></i></div><span class="num">${short(b.interes)}</span></div>
    </div><p class="small muted">Intereses totales que pagarías. La simulación usa la tasa de cada deuda y supone que no haces compras nuevas con las tarjetas.</p>`;
  $('#planTable').innerHTML='<thead><tr><th>Mes</th><th class="r">Pagas en total</th><th class="r">Intereses</th><th>El dinero libre va a</th><th class="r">Deuda que queda</th><th>Se termina</th></tr></thead><tbody>'+
    p.rows.map(r=>`<tr><td>${mlabel(r.date)}</td><td class="r num">${money(r.pagado)}</td><td class="r num muted">${money(r.intMes)}</td><td>${esc(r.destino||'—')}</td><td class="r num">${money(r.saldo)}</td><td>${r.termina.length?'<span class="pill good">'+esc(r.termina.join(', '))+'</span>':''}</td></tr>`).join('')+'</tbody>';
}
let planT;
function savePlanParams(){clearTimeout(planT);planT=setTimeout(async()=>{try{await db.doc('config/presupuesto').update({abonoExtra:+$('#pExtra').value||0,estrategia:$('#pEstr').value})}catch(e){toast('No se pudo guardar el plan')}},600)}
$('#pExtra').addEventListener('input',()=>{S.pres={...S.pres,abonoExtra:+$('#pExtra').value||0};renderAll();savePlanParams()});
$('#pEstr').addEventListener('change',()=>{S.pres={...S.pres,estrategia:$('#pEstr').value};renderAll();savePlanParams()});

/* ---------- Presupuesto ---------- */
let gastosDraft=null;
function renderBudget(){
  const pr=S.pres||{};
  if(!gastosDraft){gastosDraft=(pr.gastos||[]).map(g=>({...g}));$('#bIngreso').value=pr.ingresoQuincenal??'';$('#cMeta').value=pr.colchonMeta??'';$('#cActual').value=pr.colchonActual??'';
    $('#gastos').innerHTML=gastosDraft.map((g,i)=>`<label class="f">${esc(g.nombre)}<input class="numin money" type="text" inputmode="numeric" autocomplete="off" id="g${i}" data-i="${i}" value="${g.valor||''}" placeholder="0"></label>`).join('');
    $('#gastos').querySelectorAll('input').forEach(inp=>inp.addEventListener('input',()=>{gastosDraft[+inp.dataset.i].valor=+inp.value||0;renderBreak()}));}
  $('#bIngresoNota').textContent=pr.ingresoNota||'';
  renderBreak();
  const meta=+pr.colchonMeta||0,act=+pr.colchonActual||0;$('#cBar').style.width=(meta?Math.min(100,act/meta*100):0)+'%';
}
function renderBreak(){
  const ing=(+$('#bIngreso').value||0)*2,gas=gastosDraft.reduce((a,g)=>a+(+g.valor||0),0),cuo=cuotasMes(),ext=+S.pres?.abonoExtra||0,sob=ing-gas-cuo-ext;
  const row=(t,v,c)=>`<div class="due"><span class="row" style="gap:10px"><i style="width:10px;height:10px;border-radius:3px;background:${c}"></i>${t}</span><span class="num">${money(v)}</span></div>`;
  $('#budgetBreak').innerHTML=`<div class="due"><span>Ingreso del mes</span><span class="num" style="font-weight:600">${money(ing)}</span></div>`+row('Cuotas de deudas',-cuo,'var(--s2)')+row('Gastos fijos',-gas,'var(--s1)')+row('Abono extra del plan',-ext,'var(--s7)')+
    `<div class="due" style="font-weight:700"><span>Te queda libre</span><span class="num" style="color:${sob<0?'var(--bad)':'var(--good)'}">${money(sob)}</span></div>`+
    (gas===0?'<p class="callout warn small">Faltan tus gastos fijos. Sin ellos el plan puede pedirte más de lo que te alcanza.</p>':sob<0?'<p class="callout warn small">No te alcanza: baja el abono extra o revisa gastos antes de comprometerte.</p>':'');
}
$('#bIngreso').addEventListener('input',renderBreak);
$('#gAdd').addEventListener('click',()=>{const n=$('#gNuevo').value.trim();if(!n)return;const keep=gastosDraft.concat([{nombre:n,valor:0}]);gastosDraft=null;S.pres={...S.pres,gastos:keep};renderBudget();$('#gNuevo').value=''});
$('#bGuardar').addEventListener('click',async()=>{try{await db.doc('config/presupuesto').update({ingresoQuincenal:+$('#bIngreso').value||0,gastos:gastosDraft});toast('Presupuesto guardado')}catch(e){toast('No se pudo guardar')}});
$('#cGuardar').addEventListener('click',async()=>{try{await db.doc('config/presupuesto').update({colchonMeta:+$('#cMeta').value||0,colchonActual:+$('#cActual').value||0});toast('Colchón guardado')}catch(e){toast('No se pudo guardar')}});

/* ---------- Pagos ---------- */
function renderPagos(){
  const sel=$('#rDeuda');const cur=sel.value;
  sel.innerHTML=S.deudas.filter(d=>+d.saldo>0||d.id===cur).sort((a,b)=>b.tasaEA-a.tasaEA).map(d=>`<option value="${esc(d.id)}">${esc(d.nombre)}</option>`).join('');
  if(cur)sel.value=cur;if(!$('#rFecha').value)$('#rFecha').value=todayISO();hintPago();
  const ps=[...S.pagos].sort((a,b)=>a.fecha<b.fecha?1:-1);const nm=id=>S.deudas.find(d=>d.id===id);
  $('#pagosTable').innerHTML=ps.length?'<thead><tr><th>Fecha</th><th>Deuda</th><th>Tipo</th><th class="r">Valor</th><th class="r">Saldo después</th><th>Nota</th></tr></thead><tbody>'+
    ps.map(p=>{const d=nm(p.deudaId);return `<tr><td class="num">${esc(p.fecha)}</td><td><span class="row" style="gap:8px;flex-wrap:nowrap">${d?`<i style="width:10px;height:10px;border-radius:3px;background:${col(d)}"></i>`:''}${esc(d?.nombre||'(deuda eliminada)')}</span></td><td>${p.tipo==='capital'?'<span class="pill good">Abono a capital</span>':'<span class="pill info">Cuota</span>'}</td><td class="r num">${money(p.monto)}</td><td class="r num">${money(p.saldoDespues)}</td><td class="muted">${esc(p.nota||'')}</td></tr>`}).join('')+
    `</tbody><tfoot><tr><td colspan="3" style="font-weight:700">Total pagado</td><td class="r num" style="font-weight:700">${money(pagadoTotal())}</td><td colspan="2"></td></tr></tfoot>`
    :'<tbody><tr><td class="empty">Todavía no has registrado pagos. Cada cuota o abono que anotes actualiza el saldo y tu avance.</td></tr></tbody>';
}
function hintPago(){const d=S.deudas.find(x=>x.id===$('#rDeuda').value);if(!d){$('#rHint').textContent='';return}
  $('#rHint').textContent=`Saldo actual ${money(d.saldo)}. De una cuota, unos ${money(d.saldo*rm(d.tasaEA))} son intereses${d.cargos?' y '+money(d.cargos)+' seguros o manejo':''}; el resto baja la deuda. Si tienes el saldo exacto del banco, escríbelo.`}
$('#rDeuda').addEventListener('change',hintPago);
$('#rTipo').addEventListener('change',()=>{if($('#rTipo').value==='cuota'){const d=S.deudas.find(x=>x.id===$('#rDeuda').value);if(d&&!$('#rMonto').value)$('#rMonto').value=d.cuota}});
$('#rGuardar').addEventListener('click',async()=>{
  const d=S.deudas.find(x=>x.id===$('#rDeuda').value);const monto=+$('#rMonto').value||0;
  if(!d){toast('Elige una deuda');return}if(monto<=0){toast('Escribe el valor pagado');return}
  const tipo=$('#rTipo').value;let nuevo=$('#rSaldo').value!==''?+$('#rSaldo').value:null;
  if(nuevo===null)nuevo=tipo==='capital'?d.saldo-monto:d.saldo-Math.max(0,monto-(+d.cargos||0)-d.saldo*rm(d.tasaEA));
  nuevo=Math.max(0,Math.round(nuevo));
  try{await db.collection('pagos').add({fecha:$('#rFecha').value||todayISO(),deudaId:d.id,monto,tipo,saldoDespues:nuevo,nota:$('#rNota').value.trim()});
    await db.doc('deudas/'+d.id).update({saldo:nuevo});
    $('#rMonto').value='';$('#rSaldo').value='';$('#rNota').value='';$('#pagoM').hidden=true;toast(nuevo===0?'¡Deuda pagada!':'Pago guardado');saveHist(d.id,nuevo);
    if(nuevo===0)document.dispatchEvent(new CustomEvent('pld:celebrar',{detail:{titulo:'¡Pagaste '+d.nombre+'!',texto:'Una deuda menos. Su cuota ahora acelera la siguiente.'}}))}catch(e){toast('No se pudo guardar el pago')}
});

function renderAbono(){
  const el=$('#abonoNow');const top=activas().sort((a,b)=>b.tasaEA-a.tasaEA)[0];
  if(!top){el.textContent='No tienes deudas activas. Ahora todo lo que pagabas puede ir al ahorro.';return}
  const pr=S.pres||{};const meta=+pr.colchonMeta||0,act=+pr.colchonActual||0;const sob=ingresoMes()-gastosMes()-cuotasMes();
  let msg=`<b>Este mes, el abono va a: ${esc(top.nombre)}</b> (${(+top.tasaEA).toFixed(2)}% EA, saldo ${money(top.saldo)}).`;
  if(act<meta)msg+=` Primero completa el colchón: te faltan ${money(meta-act)}.`;
  if(gastosMes()>0)msg+=` Con tu presupuesto puedes abonar hasta ${money(Math.max(0,sob))} al mes.`;
  el.innerHTML=msg;
}

/* ---------- Modo archivo: guarda en este navegador cuando la página no está dentro de Claude ---------- */
function localDb(){
  const KEY=PERFILES.clave();let mem=null;
  const load=()=>{if(mem)return mem;try{mem=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}if(!mem)mem=SEED?JSON.parse(JSON.stringify(SEED)):{deudas:{},pagos:{},historial:{},config:{}};return mem};
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(mem))}catch(e){}};
  const subs=[];const emit=()=>subs.forEach(f=>f());
  const coll=c=>{const m=load();m[c]=m[c]||{};return m[c]};
  const snapC=c=>{const o=coll(c);const docs=Object.keys(o).map(id=>({id,exists:true,data:()=>o[id]}));return{docs,size:docs.length,empty:!docs.length}};
  const docRef=path=>{const [c,id]=path.split('/');return{id,
    get:async()=>{const o=coll(c)[id];return{id,exists:!!o,data:()=>o}},
    set:async d=>{coll(c)[id]=JSON.parse(JSON.stringify(d));save();emit()},
    update:async d=>{coll(c)[id]={...(coll(c)[id]||{}),...JSON.parse(JSON.stringify(d))};save();emit()},
    delete:async()=>{delete coll(c)[id];save();emit()},
    onSnapshot:(cb)=>{const f=()=>{const o=coll(c)[id];cb({id,exists:!!o,data:()=>o})};subs.push(f);setTimeout(f,0);return()=>{}}}};
  return{doc:docRef,collection:c=>({doc:id=>docRef(c+'/'+(id||Math.random().toString(36).slice(2,12))),
    add:async d=>{const id=Math.random().toString(36).slice(2,12);coll(c)[id]=JSON.parse(JSON.stringify(d));save();emit();return docRef(c+'/'+id)},
    get:async()=>snapC(c),onSnapshot:cb=>{const f=()=>cb(snapC(c));subs.push(f);setTimeout(f,0);return()=>{}}}),local:true};
}

/* ---------- Versión pública: asistente de inicio, respaldo ---------- */
$('#usuraV').textContent=USURA.ea.toFixed(2).replace('.',',')+'%';$('#usuraM').textContent=USURA.mes;
let wStep=1,wDebts=[];
function openWiz(){wStep=1;wDebts=[];$('#wNombre').value=S.pres?.nombre||'';$('#wIngreso').value=S.pres?.ingresoQuincenal?S.pres.ingresoQuincenal*2:'';
  $('#wGastos').innerHTML=DEF_GASTOS.map((g,i)=>`<label class="f">${g}<input class="numin money" type="text" inputmode="numeric" autocomplete="off" id="wg${i}" placeholder="0"></label>`).join('');
  $('#wdList').innerHTML='';showWiz();$('#wiz').hidden=false;setTimeout(()=>$('#wNombre').focus(),50)}
function showWiz(){$$('.wizpane').forEach(p=>p.hidden=+p.dataset.w!==wStep);$('#wizStep').textContent='0'+wStep+'/03';$('#wizBar').style.width=(wStep/3*100)+'%';
  $('#wBack').style.visibility=wStep>1?'visible':'hidden';$('#wNext').textContent=wStep===3?'Ver mi plan':'Siguiente'}
$('#wdAdd').addEventListener('click',()=>{const n=$('#wdNombre').value.trim(),s=+$('#wdSaldo').value||0,c=+$('#wdCuota').value||0;
  if(!n||s<=0||c<=0){$('#wdMsg').textContent='Escribe nombre, saldo y cuota.';return}
  wDebts.push({nombre:n,entidad:'',tipo:$('#wdTipo').value,saldo:s,saldoInicial:s,tasaEA:+$('#wdTasa').value||0,cuota:c,cargos:0,diaPago:+$('#wdDia').value||null,nota:'',slot:wDebts.length%8+1});
  ['wdNombre','wdSaldo','wdTasa','wdCuota','wdDia'].forEach(i=>$('#'+i).value='');$('#wdMsg').textContent='Agregada. Puedes sumar otra.';
  $('#wdList').innerHTML=wDebts.map(d=>`<li><span>${esc(d.nombre)}</span><span class="num">${money(d.saldo)} · ${d.tasaEA}%</span></li>`).join('');$('#wdNombre').focus()});
$('#wBack').addEventListener('click',()=>{if(wStep>1){wStep--;showWiz()}});
$('#wNext').addEventListener('click',async()=>{
  if(wStep===1){if(!(+$('#wIngreso').value>0)){toast('Escribe lo que te llega al mes');return}wStep=2;showWiz();return}
  if(wStep===2){if(!wDebts.length&&!S.deudas.length){toast('Agrega al menos una deuda');return}wStep=3;showWiz();return}
  const gastos=DEF_GASTOS.map((g,i)=>({nombre:g,valor:+$('#wg'+i).value||0}));
  await db.doc('config/presupuesto').set({...(S.pres||{}),nombre:$('#wNombre').value.trim(),ingresoQuincenal:Math.round((+$('#wIngreso').value||0)/2),gastos,abonoExtra:S.pres?.abonoExtra||0,estrategia:S.pres?.estrategia||'avalancha',colchonMeta:S.pres?.colchonMeta||500000,colchonActual:S.pres?.colchonActual||0,listo:true});
  for(const d of wDebts){await db.collection('deudas').add({...d,creado:todayISO()})}
  gastosDraft=null;saveHist();
  // js/interfaz.js entrega el plan con la transición circular; sin ella, se cierra el asistente sin más.
  if(window.PLD&&PLD.entregarPlan)PLD.entregarPlan();else{$('#wiz').hidden=true;toast('¡Listo! Este es tu plan')}});
/* Primera visita (sin datos): se muestra la portada; el asistente se abre desde su botón. */
function maybeWiz(){if(!(S.ready.d&&S.ready.c))return;document.body.classList.toggle('modo-portada',!S.deudas.length&&!S.pres?.listo)}
/* respaldo */
const marcarRespaldo=()=>{try{localStorage.setItem('pld-respaldo:'+PERFILES.clave(),todayISO())}catch(e){}document.dispatchEvent(new CustomEvent('pld:respaldo'))};
const respaldoBlob=()=>new Blob([localStorage.getItem(PERFILES.clave())||'{}'],{type:'application/json'});
const respaldoNombre=()=>'respaldo_plan_deudas_'+todayISO()+'.json';
$('#bkExport').addEventListener('click',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(respaldoBlob());a.download=respaldoNombre();document.body.appendChild(a);a.click();a.remove();marcarRespaldo();toast('Respaldo descargado')});
$('#bkImport').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const t=await f.text();JSON.parse(t);localStorage.setItem(PERFILES.clave(),t);location.reload()}catch(err){toast('Ese archivo no es un respaldo válido')}});
$('#bkReset').addEventListener('click',()=>$('#bkConfirm').hidden=false);
$('#bkNo').addEventListener('click',()=>$('#bkConfirm').hidden=true);
$('#bkYes').addEventListener('click',()=>{try{localStorage.removeItem(PERFILES.clave())}catch(e){}location.reload()});
$('#btnWiz').addEventListener('click',openWiz);

/* ---------- Compra de cartera ---------- */
/* OFERTAS (tasas de referencia) está en js/datos.js */
function evalOffer(o,n){
  const r=rm(o.t);const cand=activas().filter(d=>(+d.tasaEA||0)>o.t+0.5);
  const monto=cand.reduce((a,d)=>a+(+d.saldo||0),0);if(monto<=0)return{o,monto:0};
  const cuotaN=r>0?monto*r/(1-Math.pow(1+r,-n)):monto/n;const intN=cuotaN*n-monto;
  const sim=simulate(cand,0,'avalancha',false);const cargos=cand.reduce((a,d)=>a+(+d.cargos||0),0);
  const costoAct=sim.interes+cargos*sim.meses;const cuotaA=cand.reduce((a,d)=>a+(+d.cuota||0),0);
  return{o,monto,cand,cuotaN,intN,cuotaA,costoAct,ahorro:costoAct-intN,alivio:cuotaA-cuotaN,mesesA:sim.meses}}
function ofertasTodas(){return OFERTAS.lista.concat((S.pres?.ofertas||[]).map(x=>({e:x.e,t:+x.t,tipo:'Tu oferta',url:'',mia:true})))}
function renderCartera(){
  if(!$('#cvTable'))return;const n=+$('#cvPlazo').value||36,tipo=$('#cvTipo').value;
  $('#cvCorte').textContent='Tasas de referencia · '+OFERTAS.corte;
  const rows=ofertasTodas().filter(o=>tipo==='todos'||o.tipo===tipo).map(o=>evalOffer(o,n)).sort((a,b)=>(b.ahorro||-1e12)-(a.ahorro||-1e12));
  const best=rows.find(x=>x.monto>0&&x.ahorro>0);
  $('#cvBest').innerHTML=!activas().length?'<p class="empty">Agrega tus deudas para comparar.</p>':best?`<div class="savebanner">
     <div style="display:flex;flex-direction:column;gap:8px;min-width:0"><h3 class="best">La más económica para ti: ${esc(best.o.e)} · ${best.o.t.toFixed(2)}% EA</h3>
     <p>Trasladas ${money(best.monto)} (${best.cand.map(d=>esc(d.nombre)).join(', ')}). Tu cuota de esas deudas pasa de <b>${money(best.cuotaA)}</b> a <b>${money(best.cuotaN)}</b> al mes y te ahorras unos <b>${money(best.ahorro)}</b> en intereses y cobros.</p></div>
     ${best.o.url?`<a class="btn big" href="${best.o.url}" target="_blank" rel="noopener">Ver ${esc(best.o.e)}</a>`:''}</div>`
    :'<p class="callout">Con estas tasas ninguna compra de cartera mejora tu situación: tus deudas ya están por debajo de lo que ofrecen las entidades. Sigue con el plan de abonos.</p>';
  $('#cvTable').innerHTML='<thead><tr><th>Entidad</th><th>Tipo</th><th class="r">Tasa EA</th><th class="r">Trasladas</th><th class="r">Cuota nueva</th><th class="r">Alivio al mes</th><th class="r">Ahorro total</th><th></th></tr></thead><tbody>'+
    rows.map((x,i)=>x.monto>0?`<tr><td><b>${esc(x.o.e)}</b>${x===best?' <span class="pill good">Mejor</span>':''}</td><td>${esc(x.o.tipo)}</td><td class="r num">${x.o.t.toFixed(2)}%</td><td class="r num">${money(x.monto)}</td><td class="r num">${money(x.cuotaN)}</td><td class="r num" style="color:${x.alivio>=0?'var(--good)':'var(--bad)'}">${money(x.alivio)}</td><td class="r num" style="font-weight:700;color:${x.ahorro>=0?'var(--good)':'var(--bad)'}">${money(x.ahorro)}</td><td>${x.o.url?`<a class="btn ghost" href="${x.o.url}" target="_blank" rel="noopener">Ver</a>`:''}</td></tr>`
      :`<tr><td><b>${esc(x.o.e)}</b></td><td>${esc(x.o.tipo)}</td><td class="r num">${x.o.t.toFixed(2)}%</td><td colspan="5" class="muted">No mejora: tus deudas tienen tasa igual o más baja.</td></tr>`).join('')+'</tbody>';
  $('#ofList').innerHTML=(S.pres?.ofertas||[]).map((x,i)=>`<li><span>${esc(x.e)} · ${(+x.t).toFixed(2)}% EA</span><button class="btn ghost" type="button" data-delof="${i}">Quitar</button></li>`).join('')||'<li class="muted">Aún no has agregado ofertas.</li>';
  $('#ofList').querySelectorAll('[data-delof]').forEach(b=>b.addEventListener('click',async()=>{const of=(S.pres?.ofertas||[]).filter((_,i)=>i!==+b.dataset.delof);try{await db.doc('config/presupuesto').update({ofertas:of})}catch(e){toast('No se pudo quitar')}}));
}
$('#cvPlazo').addEventListener('change',renderCartera);$('#cvTipo').addEventListener('change',renderCartera);
$('#ofAdd').addEventListener('click',async()=>{const e=$('#ofE').value.trim(),t=+$('#ofT').value;if(!e||!(t>0)){toast('Escribe la entidad y la tasa');return}
  const of=(S.pres?.ofertas||[]).concat([{e,t}]);try{await db.doc('config/presupuesto').update({ofertas:of});$('#ofE').value='';$('#ofT').value='';toast('Oferta agregada')}catch(err){toast('No se pudo guardar')}});

/* ---------- Ventanas: cerrar con su botón o con Escape ---------- */
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).hidden=true));
document.addEventListener('keydown',e=>{if(e.key==='Escape')$$('.wiz').forEach(w=>{if(w.id!=='wiz')w.hidden=true})});

/* ---------- Empezar de cero ---------- */
$('#btnReset').addEventListener('click',()=>$('#resetM').hidden=false);
$('#resetWiz').addEventListener('click',()=>{$('#resetM').hidden=true;openWiz()});
$('#resetYes').addEventListener('click',async()=>{
  const btn=$('#resetYes');btn.disabled=true;
  try{for(const d of S.deudas)await db.doc('deudas/'+d.id).delete();
    for(const p of S.pagos)await db.doc('pagos/'+p.id).delete();
    const hs=await db.collection('historial').get?.();if(hs&&hs.docs)for(const h of hs.docs)await db.doc('historial/'+h.id).delete();
    await db.doc('config/presupuesto').set({gastos:[],abonoExtra:0,estrategia:'avalancha',colchonMeta:500000,colchonActual:0,listo:false,ofertas:[]});
    const items=(S.pasos?.items||[]).map(x=>({...x,hecho:false}));await db.doc('config/pasos').set({items});
    gastosDraft=null;$('#resetM').hidden=true;openWiz();toast('Listo, empecemos de nuevo');
  }catch(e){toast('No se pudo borrar todo. Intenta de nuevo.')}finally{btn.disabled=false}
});

/* ---------- Campos de dinero con puntos de miles ---------- */
const NV=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
const fmtMiles=d=>d?String(d).replace(/\B(?=(\d{3})+(?!\d))/g,'.'):'';
function moneyfy(root){(root||document).querySelectorAll('input.money:not([data-m])').forEach(el=>{
  el.dataset.m='1';
  Object.defineProperty(el,'value',{configurable:true,
    get(){return NV.get.call(el).replace(/\D/g,'')},
    set(v){const d=String(v??'').split(/[.,]/)[0].replace(/\D/g,'');NV.set.call(el,fmtMiles(d))}});
  el.value=NV.get.call(el);
  el.addEventListener('input',()=>{const raw=NV.get.call(el),pos=el.selectionStart||0;const before=raw.slice(0,pos).replace(/\D/g,'').length;
    const d=raw.replace(/\D/g,'');const f=fmtMiles(d);NV.set.call(el,f);let i=0,c=0;while(i<f.length&&c<before){if(/\d/.test(f[i]))c++;i++}try{el.setSelectionRange(i,i)}catch(e){}},true);
})}
moneyfy();new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)moneyfy(n.parentNode||n)}))).observe(document.body,{childList:true,subtree:true});

/* ---------- Excel ---------- */
$('#btnExcel').addEventListener('click',async()=>{
  if(!window.XLSX){toast('No cargó el generador de Excel. Recarga la página.');return}
  const wb=XLSX.utils.book_new();const p=plan();const name=id=>S.deudas.find(d=>d.id===id)?.nombre||'';
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{Concepto:'Deuda total hoy',Valor:Math.round(totalSaldo())},{Concepto:'Deuda al empezar',Valor:Math.round(totalIni())},{Concepto:'Avance %',Valor:totalIni()?Math.round((1-totalSaldo()/totalIni())*1000)/10:0},{Concepto:'Cuotas al mes',Valor:Math.round(cuotasMes())},{Concepto:'Ingreso mensual',Valor:ingresoMes()},{Concepto:'Gastos fijos',Valor:gastosMes()},{Concepto:'Abono extra mensual',Valor:+S.pres?.abonoExtra||0},{Concepto:'Libre de deudas',Valor:p.fin?mlabel(p.fin):''},{Concepto:'Intereses proyectados',Valor:Math.round(p.interes)},{Concepto:'Generado',Valor:todayISO()}]),'Resumen');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(S.deudas.map(d=>({Deuda:d.nombre,Entidad:d.entidad,Tipo:d.tipo,'Saldo actual':Math.round(d.saldo),'Saldo inicial':Math.round(d.saldoInicial||d.saldo),'Tasa EA %':d.tasaEA,'Cuota mensual':d.cuota,'Seguros/manejo':d.cargos||0,'Costo mensual':Math.round(burnOf(d)),'Día de pago':d.diaPago||'',Nota:d.nota||''}))),'Deudas');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(p.rows.map(r=>({Mes:mlabel(r.date),'Pago total':Math.round(r.pagado),Intereses:Math.round(r.intMes),'Dinero libre va a':r.destino,'Deuda restante':Math.round(r.saldo),'Se termina':r.termina.join(', ')}))),'Plan mensual');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(S.pagos.length?[...S.pagos].sort((a,b)=>a.fecha<b.fecha?-1:1).map(x=>({Fecha:x.fecha,Deuda:name(x.deudaId),Tipo:x.tipo==='capital'?'Abono a capital':'Cuota',Valor:x.monto,'Saldo después':x.saldoDespues,Nota:x.nota||''})):[{Fecha:'',Deuda:'Sin pagos registrados'}]),'Pagos');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{Concepto:'Ingreso quincenal',Valor:+S.pres?.ingresoQuincenal||0},...(S.pres?.gastos||[]).map(g=>({Concepto:g.nombre,Valor:+g.valor||0}))]),'Presupuesto');
  const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'});
  const dl=window.claude?await claude.use('downloads'):null;if(!dl){try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));a.download='Plan_libre_de_deudas_'+todayISO()+'.xlsx';document.body.appendChild(a);a.click();a.remove();toast('Excel listo')}catch(e){toast('La descarga no está disponible aquí')}return}
  try{await dl.save({filename:'Plan_libre_de_deudas_'+todayISO()+'.xlsx',data:new Uint8Array(buf)});toast('Excel listo')}catch(e){if(e&&e.code!=='declined')toast('No se pudo descargar el Excel')}
});

async function saveHist(id,nuevo){if(!db)return;let t=totalSaldo();if(id){const d=S.deudas.find(x=>x.id===id);if(d)t=t-(+d.saldo||0)+nuevo}
  try{await db.doc('historial/'+todayISO()).set({fecha:todayISO(),total:Math.round(t)})}catch(e){}}

/* En celular las tablas se ven como tarjetas: cada celda lleva el nombre de su columna. */
function labelTable(t){const hs=[...t.querySelectorAll('thead th')].map(th=>th.textContent);if(!hs.length)return;
  t.classList.add('cards');t.querySelectorAll('tbody tr').forEach(tr=>[...tr.children].forEach((td,i)=>{if(hs[i])td.dataset.label=hs[i]}))}

/* Punto de enlace para js/interfaz.js y js/funciones.js: leen el estado y agregan sus propios render. */
const PLD={S,$,$$,money,short,mlabel,esc,todayISO,col,slotOf,plan,base,activas,totalSaldo,totalIni,cuotasMes,gastosMes,ingresoMes,burnOf,dueItems,toast,showTab,countTo,reduce,
  db:()=>db,canWrite:()=>canWrite,respaldoBlob,respaldoNombre,marcarRespaldo,openWiz:()=>openWiz(),hooks:[],renderAll:()=>renderAll()};
window.PLD=PLD;

function renderAll(){if(!(S.ready.d&&S.ready.c))return;invalidate();
  renderKpis();renderHero();renderSalary();renderDonut();renderBurn();renderArea();renderDue();renderSteps();renderDebts();renderPlan();renderBudget();renderPagos();renderAbono();renderCartera();
  $$('.tablebox table').forEach(labelTable);PLD.hooks.forEach(f=>{try{f()}catch(e){console.error(e)}});maybeWiz()}

(async function boot(){
  db=window.claude?await claude.use('db'):null;
  let local=false;if(!db){db=localDb();local=true}
  try{const user=await claude.use('user');const c=user?await user.can('data.write'):null;if(c===false)canWrite=false}catch(e){}
  const err=e=>{$('#sync').textContent='Sin conexión con tus datos. Recarga la página.'};
  db.collection('deudas').onSnapshot(s=>{S.deudas=s.docs.map(d=>({id:d.id,...d.data()}));S.ready.d=true;renderAll();$('#sync').textContent=local?'Guardado en este dispositivo':canWrite?'Guardado en tu cuenta':'Solo lectura'},err);
  db.collection('pagos').onSnapshot(s=>{S.pagos=s.docs.map(d=>({id:d.id,...d.data()}));renderAll()},err);
  db.collection('historial').onSnapshot(s=>{S.hist=s.docs.map(d=>d.data())},err);
  db.doc('config/presupuesto').onSnapshot(s=>{const first=!S.ready.c;S.pres=s.exists?s.data():{gastos:[]};S.ready.c=true;if(first)gastosDraft=null;renderAll()},err);
  db.doc('config/pasos').onSnapshot(s=>{S.pasos=s.exists?s.data():{items:[]};renderAll()},err);
})();
})();
