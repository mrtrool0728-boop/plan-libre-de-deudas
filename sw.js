/* Plan Libre de Deudas: service worker (funcionamiento sin internet).
   IMPORTANTE: cada vez que publiques un cambio en cualquier archivo, sube VERSION (ej. 'v3' -> 'v4').
   Así los celulares que ya instalaron la app descargan la versión nueva. */
const VERSION='v6';
const CACHE='pld-'+VERSION;
const RUNTIME='pld-externos';

/* Archivos propios de la app. Si agregas uno nuevo, súmalo aquí. */
const APP=[
  './',
  'index.html',
  'css/estilos.css',
  'js/datos.js',
  'js/calculos.js',
  'js/perfiles.js',
  'js/app.js',
  'js/interfaz.js',
  'js/funciones.js',
  'js/pwa.js',
  'manifest.webmanifest',
  'iconos/icono.svg',
  'iconos/icono-192.png',
  'iconos/icono-512.png',
  'iconos/apple-touch-icon.png'
];

/* Recursos de otros sitios que la app usa (fuente y librería de Excel). */
const EXTERNOS=['fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'];

// Al instalar se piden los archivos al servidor saltando la caché del navegador,
// para no guardar una mezcla de archivos viejos y nuevos.
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));
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

  // Archivos de la app y la página: primero internet (siempre la versión más nueva);
  // sin conexión, la copia guardada.
  if(url.origin===self.location.origin){
    e.respondWith(fetch(req,{cache:'no-cache'}).then(r=>{
      if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'index.html':req,copy))}
      return r;
    }).catch(()=>caches.match(req.mode==='navigate'?'index.html':req,{ignoreSearch:true})));
    return;
  }

  // Fuente y librería de Excel: se guardan la primera vez que cargan.
  if(EXTERNOS.includes(url.hostname)){
    e.respondWith(caches.open(RUNTIME).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok||r.type==='opaque')c.put(req,r.clone());return r}))));
  }
});
