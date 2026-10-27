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
  const oscuro=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);if(metaTema)metaTema.content=oscuro?'#0B2A1E':'#0F4D36'}
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
  const cols=['#0F4D36','#5FBF8F','#C2410C','#2563A8','#D9A33A'];
  const ps=Array.from({length:120},()=>({x:innerWidth/2+(Math.random()-.5)*120,y:innerHeight*.42,vx:(Math.random()-.5)*11,vy:-Math.random()*13-4,s:4+Math.random()*6,r:Math.random()*6,vr:(Math.random()-.5)*.3,c:cols[Math.random()*cols.length|0]}));
  const t0=performance.now();(function f(t){const k=(t-t0)/1000;ctx.clearRect(0,0,innerWidth,innerHeight);
    ps.forEach(p=>{p.vy+=.35;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;ctx.save();ctx.globalAlpha=Math.max(0,1-k/2.6);ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);ctx.restore()});
    if(k<2.6&&!cel.hidden)requestAnimationFrame(f);else ctx.clearRect(0,0,innerWidth,innerHeight)})(t0)}
document.addEventListener('pld:celebrar',e=>{const d=e.detail||{};$('#celebraT').textContent=d.titulo||'¡Bien hecho!';$('#celebraP').textContent=d.texto||'';
  cel.hidden=false;vibrar([12,40,12]);confeti();setTimeout(()=>$('#celebraOk').focus(),50)});
$('#celebraOk').addEventListener('click',()=>cel.hidden=true);
cel.addEventListener('click',e=>{if(e.target===cel||e.target===cv)cel.hidden=true});
})();
