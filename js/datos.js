/* Plan Libre de Deudas: datos que se actualizan a mano.
   Este es el único archivo que hay que tocar para la actualización mensual.
   Después de cambiarlo, sube la versión en sw.js (const VERSION) para que los celulares reciban el cambio. */

/* Tasa de usura vigente (consumo y ordinario). Cambia cada mes.
   Fuente: Superintendencia Financiera de Colombia. */
const USURA={mes:'octubre 2026',ea:28.59};

/* Tasas de referencia para "Compra de cartera".
   Fuente: Superfinanciera, consulta de tasas por entidad. Actualiza "corte" y "fuente" junto con la lista. */
const OFERTAS={corte:'sep 2026',fuente:'Superfinanciera, corte 25 sep 2026',lista:[
 {e:'Banco Agrario',t:12.92,tipo:'Libranza',url:'https://www.bancoagrario.gov.co'},
 {e:'Coopcentral',t:13.84,tipo:'Libranza',url:'https://www.coopcentral.com.co'},
 {e:'Confiar',t:16.25,tipo:'Libre inversión',url:'https://www.confiar.coop'},
 {e:'Banco Pichincha',t:16.41,tipo:'Libranza',url:'https://www.bancopichincha.com.co'},
 {e:'Coopcentral',t:18.00,tipo:'Libre inversión',url:'https://www.coopcentral.com.co'},
 {e:'Bancolombia',t:18.69,tipo:'Libranza',url:'https://www.bancolombia.com/personas/tarjetas-de-credito/compra-de-cartera'},
 {e:'Cotrafa',t:18.84,tipo:'Libre inversión',url:'https://www.cotrafa.com.co'},
 {e:'Promedio del mercado',t:19.11,tipo:'Libranza',url:''},
 {e:'Davivienda',t:20.45,tipo:'Libranza',url:'https://www.davivienda.com'},
 {e:'Bancoomeva',t:23.65,tipo:'Libre inversión',url:'https://www.bancoomeva.com.co'},
 {e:'Promedio del mercado',t:23.84,tipo:'Libre inversión',url:''}]};

/* Gastos fijos que propone el asistente de inicio. */
const DEF_GASTOS=['Arriendo','Servicios','Mercado','Transporte','Celular e internet','Otros'];

/* Datos con los que arranca una persona nueva: la lista de "Pasos del plan". */
const SEED={deudas:{},pagos:{},historial:{},config:{pasos:{"items": [{"texto": "Anotar todas mis deudas con su saldo, tasa y cuota", "hecho": false}, {"texto": "Llenar mis gastos fijos en Presupuesto", "hecho": false}, {"texto": "Juntar el colchón para emergencias", "hecho": false}, {"texto": "Dejar de usar las tarjetas mientras tengan saldo", "hecho": false}, {"texto": "Preguntar en mi banco o fondo de empleados por compra de cartera a menor tasa", "hecho": false}, {"texto": "Abonar cada mes a la deuda de tasa más alta", "hecho": false}]}}};
