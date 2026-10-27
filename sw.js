/* Plan Libre de Deudas: service worker (funcionamiento sin internet).
   IMPORTANTE: cada vez que publiques un cambio en cualquier archivo, sube VERSION (ej. 'v2' -> 'v3').
   Así los celulares que ya instalaron la app descargan la versión nueva. */
const VERSION='v1';
const CACHE='pld-'+VERSION;
const RUNTIME='pld-externos';

/* Archivos propios de la app. Si agregas uno nuevo, súmalo aquí. */
const APP=[
  './',
  'index.html',
  'css/estilos.css',
  'js/datos.js',
  'js/calculos.js',
  'js/app.js',
  'js/pwa.js',
  'manifest.webmanifest',
  'iconos/icono.svg',
  'iconos/icono-192.png',
  'iconos/icono-512.png',
  'iconos/apple-touch-icon.png'
];

/* Recursos de otros sitios que la app usa (fuente y librería de Excel). */
const EXTERNOS=['fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==RUNTIME).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);

  // La página: primero internet (para traer cambios); sin conexión, la copia guardada.
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('index.html',copy));return r})
      .catch(()=>caches.match('index.html',{ignoreSearch:true})));
    return;
  }

  // Archivos de la app: la copia guardada al instante y se actualiza en segundo plano.
  if(url.origin===self.location.origin){
    e.respondWith(caches.open(CACHE).then(c=>c.match(req,{ignoreSearch:true}).then(hit=>{
      const net=fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r}).catch(()=>hit);
      return hit||net;
    })));
    return;
  }

  // Fuente y librería de Excel: se guardan la primera vez que cargan.
  if(EXTERNOS.includes(url.hostname)){
    e.respondWith(caches.open(RUNTIME).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok||r.type==='opaque')c.put(req,r.clone());return r}))));
  }
});
