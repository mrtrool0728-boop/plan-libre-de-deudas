/* Plan Libre de Deudas: instalación como app y funcionamiento sin internet. */
(function(){
const btn=document.getElementById('btnInstalar');
const instalada=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;

// Activa el modo sin internet (solo funciona en https o en localhost, no abriendo el archivo directo).
if('serviceWorker' in navigator&&location.protocol!=='file:'){
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
if(!btn||instalada)return;

// Android y computador (Chrome, Edge): el navegador ofrece la instalación y la usamos en nuestro botón.
let aviso=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();aviso=e;btn.hidden=false});
addEventListener('appinstalled',()=>{aviso=null;btn.hidden=true});

// iPhone y iPad: no hay aviso automático, se explica cómo agregarla a la pantalla de inicio.
const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(ios)btn.hidden=false;

btn.addEventListener('click',async()=>{
  if(aviso){aviso.prompt();const r=await aviso.userChoice;if(r.outcome==='accepted')btn.hidden=true;aviso=null;return}
  const m=document.getElementById('instalarM');if(m)m.hidden=false;
});
})();
