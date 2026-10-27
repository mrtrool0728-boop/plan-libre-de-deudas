/* Plan Libre de Deudas: cálculos financieros.
   No toca la pantalla: recibe datos y devuelve resultados. Cualquier cambio aquí cambia los números
   que ve la persona, así que revísalo con un ejemplo antes y después. */

const MESES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

/* Tasa efectiva anual (%) -> tasa mensual equivalente (fracción). */
const rm=ea=>Math.pow(1+(+ea||0)/100,1/12)-1;

/* Simula el pago de las deudas mes a mes (máximo 240 meses).
   extra: abono extra mensual a capital. estr: 'avalancha' (tasa más alta primero) o 'bola' (saldo más pequeño primero).
   rollover: si es true, la cuota de una deuda terminada pasa a la siguiente.
   unicos (opcional): pagos extra de una sola vez, {numeroDeMes: monto}; el mes 1 es el próximo mes. Sin él, el resultado no cambia. */
function simulate(debts,extra,estr,rollover,unicos){
  let ds=debts.filter(d=>(+d.saldo||0)>0).map(d=>({id:d.id,nombre:d.nombre,ref:d,saldo:+d.saldo,r:rm(d.tasaEA),tasa:+d.tasaEA||0,pago:Math.max(0,(+d.cuota||0)-(+d.cargos||0)),cargos:+d.cargos||0,fin:null}));
  const pool=ds.reduce((a,d)=>a+d.pago,0)+(+extra||0);
  const rows=[];let interes=0;const start=new Date();start.setDate(1);
  for(let m=1;m<=240&&ds.some(d=>d.saldo>0.5);m++){
    const date=new Date(start.getFullYear(),start.getMonth()+m,1);
    let pagado=0,cargos=0,destino='',intMes=0;
    ds.forEach(d=>{if(d.saldo<=0.5)return;const i=d.saldo*d.r;interes+=i;intMes+=i;d.saldo+=i;const p=Math.min(d.pago,d.saldo);d.saldo-=p;pagado+=p;cargos+=d.cargos});
    let libre=(rollover?pool-pagado:0)+(unicos&&+unicos[m]||0);
    const orden=ds.filter(d=>d.saldo>0.5).sort((a,b)=>estr==='bola'?a.saldo-b.saldo:b.tasa-a.tasa);
    for(const d of orden){if(libre<=0)break;const p=Math.min(libre,d.saldo);d.saldo-=p;libre-=p;pagado+=p;if(!destino)destino=d.nombre}
    ds.forEach(d=>{if(d.saldo<=0.5&&!d.fin){d.saldo=0;d.fin=date}});
    const bal={};ds.forEach(d=>bal[d.id]=d.saldo);
    rows.push({date,pagado:pagado+cargos,intMes,saldo:ds.reduce((a,d)=>a+d.saldo,0),bal,destino,termina:ds.filter(d=>d.fin===date).map(d=>d.nombre)});
  }
  return{rows,interes,fin:rows.length?rows[rows.length-1].date:null,payoff:ds.map(d=>({nombre:d.nombre,ref:d.ref,fin:d.fin,tasa:d.tasa})),meses:rows.length,ids:ds.map(d=>d.ref)};
}
