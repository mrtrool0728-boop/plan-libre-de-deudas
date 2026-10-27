/* Plan Libre de Deudas: perfiles (varias personas en el mismo dispositivo).
   El perfil "principal" usa la clave de siempre (plan-libre-de-deudas-v1), así nadie pierde sus datos.
   Los demás perfiles guardan en plan-libre-de-deudas-v1:<id>. */
const PERFILES=(function(){
  const BASE='plan-libre-de-deudas-v1',REG='pld-perfiles';
  const leer=()=>{let r=null;try{r=JSON.parse(localStorage.getItem(REG)||'null')}catch(e){}
    if(!r||!Array.isArray(r.lista)||!r.lista.length)r={activo:'principal',lista:[{id:'principal',nombre:'Principal'}]};
    if(!r.lista.some(p=>p.id===r.activo))r.activo=r.lista[0].id;return r};
  const guardar=r=>{try{localStorage.setItem(REG,JSON.stringify(r))}catch(e){}};
  const claveDe=id=>id==='principal'?BASE:BASE+':'+id;
  return{
    lista:()=>leer().lista,
    activo:()=>{const r=leer();return r.lista.find(p=>p.id===r.activo)},
    clave:()=>claveDe(leer().activo),
    claveDe,
    cambiar:id=>{const r=leer();if(!r.lista.some(p=>p.id===id))return;r.activo=id;guardar(r)},
    crear:nombre=>{const r=leer();const id=Date.now().toString(36);r.lista.push({id,nombre:nombre||'Perfil '+(r.lista.length+1)});r.activo=id;guardar(r);return id},
    renombrar:(id,nombre)=>{const r=leer();const p=r.lista.find(x=>x.id===id);if(p&&nombre){p.nombre=nombre;guardar(r)}},
    borrar:id=>{if(id==='principal')return;const r=leer();r.lista=r.lista.filter(p=>p.id!==id);if(r.activo===id)r.activo='principal';guardar(r);
      const k=claveDe(id);try{[k,'pld-logros:'+k,'pld-respaldo:'+k,'pld-aviso-dia:'+k].forEach(x=>localStorage.removeItem(x))}catch(e){}}
  };
})();

/* Tema claro u oscuro elegido por la persona. Se aplica antes de pintar para que no parpadee. */
(function(){let t=null;try{t=localStorage.getItem('pld-tema')}catch(e){}if(t==='light'||t==='dark')document.documentElement.dataset.theme=t})();
