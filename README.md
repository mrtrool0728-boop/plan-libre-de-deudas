# Plan Libre de Deudas

Herramienta web gratuita para organizar tus deudas y armar un plan de pagos. Muestra en qué mes quedas libre y cuánto te ahorras en intereses. Se puede instalar como app en el celular o el computador y funciona sin internet.

## Qué hace

- Asistente de inicio: nombre, ingreso, deudas (saldo, tasa EA, cuota) y gastos fijos.
- Plan de pagos con estrategia **avalancha** (primero la tasa más alta) o **bola de nieve** (primero el saldo más pequeño).
- Gráficas: a dónde se va el sueldo, reparto de la deuda, costo mensual en intereses y proyección mes a mes.
- Compra de cartera: compara tus deudas con las tasas de referencia de las entidades.
- Registro de pagos y abonos a capital, próximos pagos y etapas del programa.
- Envía el resumen a tu correo, exporta a Excel y permite descargar o cargar un respaldo.

## Instalarla como app

- **Android o computador (Chrome, Edge):** botón **Instalar app** arriba en la página.
- **iPhone o iPad:** en Safari, **Compartir → Agregar a pantalla de inicio**. La página lo explica con el mismo botón.

## Privacidad

No hay servidor ni base de datos. Los datos de cada persona se guardan solo en su navegador (`localStorage`).

## Archivos

```
index.html              estructura de las pantallas
css/estilos.css         diseño y colores
js/datos.js             tasa de usura y tasas de compra de cartera (actualización mensual)
js/calculos.js          cálculos del plan de pagos
js/app.js               pantallas e interacción
js/pwa.js               instalación y modo sin internet
sw.js                   guarda la app para usarla sin internet
manifest.webmanifest    nombre, colores e íconos de la app
iconos/                 íconos de la app
AGENTS.md               reglas para Antigravity, Claude y otros agentes
respaldo/               copias anteriores
```

## Cómo publicarla

1. En GitHub, entra a **Settings → Pages**.
2. En *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. En uno o dos minutos queda en `https://mrtrool0728-boop.github.io/plan-libre-de-deudas/`.

Sube **todas** las carpetas (`css`, `js`, `iconos`) y archivos, no solo `index.html`.

## Cómo editarla

1. Haz tus cambios (en Antigravity, VS Code o pidiéndoselos a Claude).
2. Sube el número de `VERSION` en `sw.js` (por ejemplo `v1` → `v2`). Sin esto, quien ya instaló la app no ve el cambio.
3. Publica en GitHub.

## Datos que conviene actualizar cada mes

En `js/datos.js`:

- **`USURA`**: tasa de usura vigente y su mes. Fuente: Superintendencia Financiera de Colombia.
- **`OFERTAS`**: tasas de referencia por entidad para compra de cartera.

## Probarla en tu computador

El modo sin internet no funciona abriendo `index.html` con doble clic: hay que abrirla desde un servidor local (`http://localhost`). Pídele a Claude o a Antigravity que la sirva.

## Aviso

Herramienta educativa. No es asesoría financiera.
