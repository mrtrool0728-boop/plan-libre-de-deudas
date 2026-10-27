/* Plan Libre de Deudas: funcionamiento sin internet.
   Registra el service worker (solo funciona en https o en localhost, no abriendo el archivo directo).
   El botón "Instalar app" se quitó por ahora; la app se puede seguir agregando desde el menú del navegador. */
(function(){
if(!('serviceWorker' in navigator)||location.protocol==='file:')return;
addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
// Cuando llega una versión nueva del service worker, recarga una vez para no mezclar archivos viejos y nuevos.
// En la primera visita no hay versión anterior: no se recarga (borraría lo que la persona está escribiendo).
const habia=!!navigator.serviceWorker.controller;let recargado=false;
navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!habia||recargado)return;recargado=true;location.reload()});
})();
