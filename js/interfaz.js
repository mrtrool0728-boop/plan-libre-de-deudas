/* Plan Libre de Deudas: experiencia de uso (tema, menú, hojas inferiores, gestos, celebración).
   Usa window.PLD, que expone js/app.js. No guarda datos financieros. */
(function(){
const {$,$$,showTab,reduce}=PLD;
const movil=()=>matchMedia('(max-width:760px)').matches;
const vibrar=ms=>{try{if(movil()&&navigator.vibrate&&navigator.userActivation?.hasBeenActive)navigator.vibrate(ms||8)}catch(e){}};

/* ---------- Tema: automático → claro → oscuro ---------- */
const TEMAS=['auto','light','dark'],TXT={auto:'automático',light:'claro',dark:'oscuro'},ICO={auto:'#i-auto',light:'#i-sun',dark:'#i-moon'};
const metaTema=document.querySelector('meta[name="theme-color"]');
function aplicarTema(t){const r=document.documentElement;if(t==='auto')delete r.dataset.theme;else r.dataset.theme=t;
  try{t==='auto'?localStorage.removeItem('pld-tema'):localStorage.setItem('pld-tema',t)}catch(e){}
  const b=$('#btnTema');b.setAttribute('aria-label','Tema: '+TXT[t]);b.title='Tema: '+TXT[t];b.querySelector('use').setAttribute('href',ICO[t]);
  const oscuro=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);if(metaTema)metaTema.content=oscuro?'#10302A':'#1E4D45'}
let tema=document.documentElement.dataset.theme||'auto';aplicarTema(tema);
$('#btnTema').addEventListener('click',()=>{tema=TEMAS[(TEMAS.indexOf(tema)+1)%3];aplicarTema(tema);PLD.toast('Tema '+TXT[tema])});

/* ---------- Hojas inferiores (menú, formularios) ---------- */
const abrir=id=>{const m=$('#'+id);if(m){m.hidden=false;vibrar()}};
const cerrar=m=>{if(m.id==='wiz')return;m.hidden=true;if(m.id==='debtForm')$('#dCancelar').click()};
// Tocar fuera de la tarjeta cierra la hoja (menos el asistente de inicio).
$$('.wiz').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)cerrar(m)}));
// Arrastrar la manija hacia abajo cierra la hoja.
$$('.wiz .grab').forEach(g=>{const card=g.parentElement,m=card.parentElement;let y0=null,dy=0;
  g.addEventListener('pointerdown',e=>{y0=e.clientY;dy=0;g.setPointerCapture(e.pointerId);card.style.transition='none'});
  g.addEventListener('pointermove',e=>{if(y0===null)return;dy=Math.max(0,e.clientY-y0);card.style.transform=`translateY(${dy}px)`});
  const fin=()=>{if(y0===null)return;y0=null;card.style.transition='';card.style.transform='';if(dy>90)cerrar(m)};
  g.addEventListener('pointerup',fin);g.addEventListener('pointercancel',fin)});

$('#btnMenu').addEventListener('click',()=>{$('#perfilNombre').textContent=PERFILES.activo().nombre;abrir('menuM')});
$$('#menuM .mi').forEach(b=>b.addEventListener('click',()=>{$('#menuM').hidden=true}));
$$('[data-goto-menu]').forEach(b=>b.addEventListener('click',()=>{showTab(b.dataset.gotoMenu);arribaDePestanas()}));

/* ---------- "Más" en la barra inferior del celular ---------- */
const extras=$$('nav.tabs [data-tab].extra');
$('#masList').innerHTML=extras.map(b=>`<button class="mi" type="button" data-mas="${b.dataset.tab}">${b.querySelector('svg').outerHTML}<span>${b.querySelector('.t').textContent}</span></button>`).join('');
$$('[data-mas]').forEach(b=>b.addEventListener('click',()=>{$('#masM').hidden=true;showTab(b.dataset.mas);arribaDePestanas()}));
$('#btnMas').addEventListener('click',()=>abrir('masM'));
document.addEventListener('pld:tab',e=>{$('#btnMas').classList.toggle('on',extras.some(b=>b.dataset.tab===e.detail));vibrar()});
function arribaDePestanas(){if(!movil())return;const p=$('[data-panel]:not([hidden])');if(p)p.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})}
$$('nav.tabs [data-tab]').forEach(b=>b.addEventListener('click',arribaDePestanas));

/* ---------- Deslizar a los lados para cambiar de pestaña (celular) ---------- */
const orden=()=>$$('nav.tabs [data-tab]').map(b=>b.dataset.tab);
let tx=null,ty=0,t0=0;
document.addEventListener('touchstart',e=>{const t=e.target;if(!movil()||t.closest('.wiz,input,select,textarea,.tablebox,.chartbox,nav.tabs,.salary'))return tx=null;
  tx=e.touches[0].clientX;ty=e.touches[0].clientY;t0=Date.now()},{passive:true});
document.addEventListener('touchend',e=>{if(tx===null)return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;tx=null;
  if(Math.abs(dx)<70||Math.abs(dy)>Math.abs(dx)*.6||Date.now()-t0>600)return;
  if(!$('[data-panel]:not([hidden])')?.getBoundingClientRect)return;
  const o=orden(),cur=o.indexOf($('nav.tabs [aria-selected="true"]')?.dataset.tab);const nx=o[cur+(dx<0?1:-1)];if(nx)showTab(nx)},{passive:true});

/* ---------- Respuesta al tocar ---------- */
document.addEventListener('click',e=>{if(e.target.closest('button.btn,.mi,nav.tabs button'))vibrar(6)});

/* ---------- Celebración ---------- */
const cel=$('#celebra'),cv=$('#confeti');
function confeti(){if(reduce)return;const ctx=cv.getContext('2d'),dpr=devicePixelRatio||1;cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;ctx.scale(dpr,dpr);
  const cols=['#1E4D45','#5FC4AE','#F2A43A','#E9C46A','#2563A8'];
  const ps=Array.from({length:120},()=>({x:innerWidth/2+(Math.random()-.5)*120,y:innerHeight*.42,vx:(Math.random()-.5)*11,vy:-Math.random()*13-4,s:4+Math.random()*6,r:Math.random()*6,vr:(Math.random()-.5)*.3,c:cols[Math.random()*cols.length|0]}));
  const t0=performance.now();(function f(t){const k=(t-t0)/1000;ctx.clearRect(0,0,innerWidth,innerHeight);
    ps.forEach(p=>{p.vy+=.35;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;ctx.save();ctx.globalAlpha=Math.max(0,1-k/2.6);ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);ctx.restore()});
    if(k<2.6&&!cel.hidden)requestAnimationFrame(f);else ctx.clearRect(0,0,innerWidth,innerHeight)})(t0)}
document.addEventListener('pld:celebrar',e=>{const d=e.detail||{};$('#celebraT').textContent=d.titulo||'¡Bien hecho!';$('#celebraP').textContent=d.texto||'';
  cel.hidden=false;vibrar([12,40,12]);confeti();setTimeout(()=>$('#celebraOk').focus(),50)});
$('#celebraOk').addEventListener('click',()=>cel.hidden=true);
cel.addEventListener('click',e=>{if(e.target===cel||e.target===cv)cel.hidden=true});

/* ---------- Transición circular (portal con acercamiento) ----------
   Un círculo se abre en el centro mostrando la escena siguiente mientras la actual se acerca y se oscurece. */
const ESC='cubic-bezier(.65,0,.35,1)';
function portal(desde,hacia,listo){
  hacia.hidden=false;
  const cierra=()=>{if(desde&&desde.id!=='portada')desde.hidden=true;listo&&listo()};
  if(!hacia.animate)return cierra();
  // Con "reducir movimiento" la escena nueva solo aparece con un fundido, sin zoom.
  if(reduce){hacia.animate([{opacity:0},{opacity:1}],{duration:350,easing:'ease-out'});setTimeout(cierra,350);return}
  const oy=desde&&desde.id==='portada'?(scrollY+innerHeight/2)+'px':'50%';
  hacia.animate([{clipPath:'circle(0% at 50% 50%)',transform:'scale(1.25)'},{clipPath:'circle(7% at 50% 50%)',transform:'scale(1.2)',offset:.25},{clipPath:'circle(150% at 50% 50%)',transform:'scale(1)'}],{duration:1150,easing:ESC});
  let a=null;if(desde){desde.style.transformOrigin='50% '+oy;a=desde.animate([{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.06)',offset:.25},{transform:'scale(1.9)',filter:'brightness(.5)'}],{duration:1150,easing:ESC})}
  setTimeout(()=>{if(a)a.cancel();if(desde&&desde.id!=='portada')desde.hidden=true;listo&&listo()},1150)}

const marcarEntrada=()=>{try{sessionStorage.setItem('pld-entro','1')}catch(e){}};
// Portada → tu plan (si ya hay datos): la app aparece por el círculo mientras la portada se acerca.
function entrarApp(){
  const pt=$('#portada'),app=$('#app'),y=scrollY;marcarEntrada();
  if(reduce||!app.animate){document.body.classList.remove('modo-portada');scrollTo(0,0);PLD.showTab('resumen');return}
  Object.assign(pt.style,{position:'fixed',top:-y+'px',left:'0',right:'0',zIndex:'44'});
  document.body.classList.remove('modo-portada');document.body.classList.add('entrando');scrollTo(0,0);PLD.showTab('resumen');
  const cy=innerHeight/2;app.style.transformOrigin='50% '+cy+'px';pt.style.transformOrigin='50% '+(y+cy)+'px';
  app.animate([{clipPath:`circle(0% at 50% ${cy}px)`,transform:'scale(1.25)'},{clipPath:`circle(7% at 50% ${cy}px)`,transform:'scale(1.2)',offset:.25},{clipPath:`circle(150% at 50% ${cy}px)`,transform:'scale(1)'}],{duration:1150,easing:ESC});
  const a=pt.animate([{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.06)',offset:.25},{transform:'scale(1.9)',filter:'brightness(.5)'}],{duration:1150,easing:ESC});
  a.onfinish=()=>{a.cancel();pt.removeAttribute('style');document.body.classList.remove('entrando')}}
// Portada → asistente (sin datos) o → tu plan (con datos)
$$('[data-armar]').forEach(b=>{b.dataset.txt=b.textContent;b.addEventListener('click',()=>{
  if(document.body.classList.contains('con-datos'))return entrarApp();
  PLD.openWiz();const w=$('#wiz');w.hidden=true;portal($('#portada'),w,()=>setTimeout(()=>$('#wNombre').focus(),30))})});
PLD.hooks.push(()=>{const con=document.body.classList.contains('con-datos');$$('[data-armar]').forEach(b=>{b.textContent=con?'Ver mi plan':b.dataset.txt})});
// Logo de la app → volver a la portada
const irPortada=()=>{document.body.classList.add('modo-portada');scrollTo(0,0)};
$('#irPortada').addEventListener('click',irPortada);
$('#irPortada').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();irPortada()}});

// Asistente → entrega del plan (la llama js/app.js al guardar el asistente)
PLD.entregarPlan=function(){
  const S=PLD.S,p=PLD.plan(),b=PLD.base(),bola=(S.pres?.estrategia||'avalancha')==='bola';
  const nm=(S.pres?.nombre||'').trim();
  $('#entregaT').textContent=p.fin?`${nm?nm+', q':'Q'}uedas libre en ${PLD.mlabel(p.fin)}`:'Tu plan';
  const orden=p.payoff.filter(x=>x.fin).sort((a,c)=>a.fin-c.fin);
  $('#entregaLista').innerHTML=orden.map((x,i)=>{
    const d=x.ref,ult=i===orden.length-1&&orden.length>1;
    const tag=i===0?(bola?'la más pequeña':'la más cara'):ult?(bola?'la más grande, al final':'la más barata, al final'):`recibe la cuota de ${PLD.esc(orden[i-1].nombre)}`;
    const why=i===0?(bola?`Va primero porque es la de menor saldo: la liquidas rápido y ganas impulso.`:`Va primero porque cobra ${x.tasa.toFixed(2).replace('.',',')}% EA: cada peso que abonas aquí ahorra más intereses.`)
      :ult?`${bola?'Tiene el saldo más alto':'Con '+x.tasa.toFixed(2).replace('.',',')+'% EA es la que menos te cuesta'}, por eso se deja de última.`
      :`Cuando ${PLD.esc(orden[i-1].nombre)} llega a cero, su cuota se suma aquí y la terminas más rápido.`;
    return `<li class="ent-fila" style="--i:${i}"><span class="ent-n">${i+1}</span><div class="ent-txt"><div><b>${PLD.esc(x.nombre)}</b><span class="ent-tag">${tag}</span></div><p>${why}</p><div class="ent-barra"><i style="background:${PLD.col(d)}"></i></div></div><div class="ent-fin"><span>pagada en</span><b>${PLD.mlabel(x.fin)}</b></div></li>`}).join('')||'<li class="empty">Agrega deudas para ver el orden de pago.</li>';
  const ah=Math.max(0,b.interes-p.interes),mm=Math.max(0,b.meses-p.meses);
  $('#entregaRes').innerHTML=`<div><span>Te ahorras en intereses</span><b class="pos" id="entAh">$ 0</b></div><div><span>Terminas antes</span><b id="entMm">0 meses</b></div><div><span>Pagas cada mes</span><b>${PLD.money(PLD.cuotasMes()+(+S.pres?.abonoExtra||0))}</b></div>`;
  const ent=$('#entrega');ent.classList.remove('vivo');ent.style.setProperty('--n',Math.max(1,orden.length));
  portal($('#wiz'),ent,()=>{void ent.offsetWidth;ent.classList.add('vivo');
    setTimeout(()=>{PLD.countTo($('#entAh'),ah,PLD.money);PLD.countTo($('#entMm'),mm,v=>Math.round(v)+(Math.round(v)===1?' mes':' meses'))},400+orden.length*600)});
};
$('#entregaOk').addEventListener('click',()=>{const e=$('#entrega');
  const fin=()=>{e.hidden=true;e.classList.remove('vivo');document.body.classList.remove('modo-portada');marcarEntrada();PLD.showTab('resumen');scrollTo(0,0)};
  if(reduce||!e.animate)return fin();e.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1.04)'}],{duration:350,easing:'ease-in'}).onfinish=fin});

/* ---------- Portada: datos reales y animación al bajar ---------- */
if(typeof USURA!=='undefined'){$('#ptUsura').textContent=USURA.ea.toFixed(2).replace('.',',')+'%';$('#ptUsuraM').textContent='tasa de usura, '+USURA.mes}
if(typeof OFERTAS!=='undefined')$('#ptEntidades').textContent=new Set(OFERTAS.lista.filter(o=>!/promedio/i.test(o.e)).map(o=>o.e)).size;
const vistos=$$('#portada .rz,#portada .hc,#pt-pasos');
if('IntersectionObserver' in window&&!reduce){const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('visto');io.unobserve(x.target)}}),{threshold:.35});vistos.forEach(v=>io.observe(v))}
else vistos.forEach(v=>v.classList.add('visto'));

/* ---------- Inicio: a qué deuda abonar este mes ---------- */
PLD.hooks.push(()=>{const S=PLD.S,el=$('#abonaA');const bola=(S.pres?.estrategia||'avalancha')==='bola';
  const top=PLD.activas().sort((a,b)=>bola?a.saldo-b.saldo:b.tasaEA-a.tasaEA)[0];
  el.innerHTML=top?`<p class="ab-nom"><i style="background:${PLD.col(top)}"></i><b>${PLD.esc(top.nombre)}</b> · ${(+top.tasaEA).toFixed(2).replace('.',',')}% EA</p><p class="small muted">${bola?'Es tu deuda de menor saldo: liquidarla te da impulso.':'Es tu deuda más cara.'} Pide "abono a capital con reducción de plazo".</p>`:'<p class="small muted">No tienes deudas activas. Lo que pagabas puede ir a tu ahorro.</p>'});
})();
