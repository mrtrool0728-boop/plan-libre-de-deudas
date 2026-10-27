# Reglas del proyecto: Plan Libre de Deudas

Este archivo lo leen los agentes que trabajan en el proyecto (Antigravity, Claude Code u otros). Síguelo antes de cambiar cualquier cosa.

## Qué es

Una app web gratuita (PWA instalable) para organizar deudas personales en Colombia y armar un plan de pagos. Se publica con GitHub Pages en `https://mrtrool0728-boop.github.io/plan-libre-de-deudas/`.

- Sin servidor y sin base de datos: los datos de cada persona viven solo en su navegador (`localStorage`, clave `plan-libre-de-deudas-v1`).
- Sin paso de compilación: HTML, CSS y JavaScript tal cual. No agregues npm, bundlers ni frameworks sin que el dueño lo pida.
- Debe seguir funcionando sin internet una vez instalada.

## Dónde está cada cosa

| Archivo | Qué contiene |
|---|---|
| `index.html` | Estructura de las pantallas, íconos SVG (`<symbol>`) y ventanas (asistente, correo, empezar de cero, instalar). |
| `css/estilos.css` | Todo el diseño. Colores en variables de `:root`, con modo oscuro. |
| `js/datos.js` | Datos que se actualizan a mano: tasa de usura (`USURA`), tasas para compra de cartera (`OFERTAS`), gastos del asistente y pasos iniciales. |
| `js/calculos.js` | Cálculos financieros puros: `rm()` (tasa EA a mensual) y `simulate()` (plan mes a mes). |
| `js/perfiles.js` | Perfiles en el mismo dispositivo (`PERFILES`) y tema guardado. Se carga en el `<head>`. |
| `js/app.js` | Pantallas e interacción. Usa lo de `datos.js` y `calculos.js`. Expone `window.PLD` (estado, ayudantes y `PLD.hooks`). |
| `js/interfaz.js` | Experiencia de uso: tema, menú ⋯, barra inferior y "Más" en celular, hojas inferiores, deslizar entre pestañas, vibración, celebración. |
| `js/funciones.js` | Recordatorios (calendario .ics y avisos), simulador "¿y si…?", prima, historial real, logros y racha, perfiles, respaldo. Cada bloque agrega su `render` a `PLD.hooks`. |
| `js/pwa.js` | Registro del service worker y botón "Instalar app". |
| `sw.js` | Service worker: guarda la app para usarla sin internet. |
| `manifest.webmanifest` + `iconos/` | Nombre, colores e íconos de la app instalada. |
| `respaldo/` | Copias anteriores. No se publican como parte de la app; no las edites. |

Los scripts se cargan en este orden y no debe cambiar: `perfiles.js` (en el `<head>`), luego `datos.js`, `calculos.js`, `app.js`, `interfaz.js`, `funciones.js`, `pwa.js`.

Para agregar una función nueva: escríbela en `js/funciones.js` usando `PLD` y registra su render con `PLD.hooks.push(miRender)`. Los eventos `pld:tab`, `pld:celebrar` y `pld:respaldo` conectan las partes.

Datos por perfil: el perfil `principal` usa la clave `plan-libre-de-deudas-v1`; los demás `plan-libre-de-deudas-v1:<id>`. Usa siempre `PERFILES.clave()`, nunca la clave escrita a mano.

Celular (≤760 px): la barra de pestañas va abajo con 4 pestañas y "Más"; las pestañas con clase `extra` aparecen en la hoja "Más". Las ventanas con clase `wiz sheet` suben desde abajo. Las tablas dentro de `.tablebox` se convierten en tarjetas automáticamente.

## Reglas al cambiar código

1. **Sube `VERSION` en `sw.js`** (`v1` → `v2`…) en cada cambio que se vaya a publicar. Si no, quien ya instaló la app sigue viendo la versión vieja.
2. Si creas un archivo nuevo que la app necesita, agrégalo a la lista `APP` de `sw.js`.
3. No cambies la clave de `localStorage` ni la forma de los datos guardados (`deudas`, `pagos`, `historial`, `config/presupuesto`, `config/pasos`): las personas perderían su información. Si hace falta un cambio, agrega campos nuevos sin borrar los viejos.
4. Cambios en `js/calculos.js` cambian los números que ve la persona. Prueba con un caso antes y después y explica la diferencia.
5. Mantén el estilo del código existente: compacto, funciones `renderX()`, ayudantes `$` y `$$`, textos con `esc()` antes de meterlos en HTML.
6. Nada de datos personales en la URL, analítica de terceros ni envíos a servidores.

## Textos

- Español de Colombia, tuteo, frases cortas y claras para alguien sin formación financiera.
- Dinero en pesos con `money()` (formato `es-CO`). Tasas como "28,59% EA".
- Aviso permanente: herramienta educativa, no es asesoría financiera.

## Actualización mensual

- `USURA` en `js/datos.js`: tasa de usura vigente y mes. Fuente: Superintendencia Financiera de Colombia.
- `OFERTAS` en `js/datos.js`: tasas de referencia por entidad, con `corte` y `fuente`.
- Después: subir `VERSION` en `sw.js`.

## Cómo probar

El service worker no funciona abriendo `index.html` con doble clic (`file://`). Hay que servir la carpeta en `http://localhost`. Revisa siempre:

- El asistente de inicio con datos de ejemplo, el resumen y el plan de pagos.
- Vista de celular (375 px de ancho) y de computador, en modo claro y oscuro.
- Que recargue sin internet después de la primera visita.
- La consola del navegador sin errores.
