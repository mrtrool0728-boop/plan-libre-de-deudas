# Design: Plan Libre de Deudas

Dirección **"Formulario oficial"**: la seriedad de un formulario colombiano (declaración DIAN, consignación, extracto bancario) aplicada a una app de finanzas personales. El mundo del formulario aporta solo tipografía, color, densidad y un gesto propio; la navegación y los controles son los estándar de la web.

Fuente de verdad: `css/estilos.css` (tokens en `:root`). Contrato de dirección: `.impeccable/surfaces/index-html.md`.

## Gesto propio

- **Casillas numeradas.** Las cifras clave viven en casillas con su número (`.cn`: 01, 02…) y su etiqueta, dentro de un marco de filete de 1 px, con un encabezado de folio (`.folio`).
- **Barra de 20 celdas.** El avance de la deuda se llena celda por celda (`.celdas .bar`, máscara de 20 segmentos y transición `steps(20)`).

## Color

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bar` | #0F4D36 | #0B2A1E | Barra superior |
| `--brand` | #0F4D36 | #5FBF8F | Acciones, pestaña activa, números de casilla, enlaces |
| `--bg` | #F3F5F1 | #0E1512 | Fondo |
| `--surface` | #FFFFFF | #16201B | Tarjetas, casillas, hojas |
| `--surface-2` | #F7F9F6 | #1A2620 | Encabezados de tabla, folio |
| `--ink` / `--muted` | #15231C / #4E5E55 | #E6EEE9 / #A3B3AA | Texto |
| `--line` / `--line-strong` | #D5DDD6 / #B4C1B7 | #2A3A32 / #3D5146 | Filetes |
| `--good` `--warn` `--bad` | #0F6B45 · #A64B07 · #B42318 | #5FBF8F · #F5B547 · #F4796D | Solo estados |
| `--s1`…`--s8` | serie de 8 tonos | versión clara | Una por deuda en gráficas |

Estrategia: neutros verdosos + verde institucional que se compromete en la barra y las acciones. Rojo y ámbar solo cuando significan algo.

## Tipografía

- **Public Sans** (Google Fonts, 400–700) en todo. Cifras tabulares siempre (`font-variant-numeric: tabular-nums`).
- `h1` clamp(1.55rem, 3.6vw, 2.2rem) 700 · `h2` 1.04rem 650, sin ícono delante · etiqueta de casilla .78rem 600 · valor de casilla 1.32rem 700 (deuda total hasta 2.15rem).

## Forma

- Esquinas de **4 px** (`--r`); hojas 10 px arriba; marcas de color 2 px.
- **Filetes de 1 px**, sin sombras decorativas (solo una sombra suave en ventanas flotantes).
- Etiquetas de estado (`.pill`) rectangulares de esquina 3 px, sin punto.
- Pestaña activa: texto verde + subrayado de 2 px. En celular, barra inferior con indicador arriba.

## Prohibido en este proyecto

Degradados, brillos u orbes, vidrio o desenfoque decorativo, tarjetas flotantes o inclinadas, todo en píldoras, etiquetas en mayúsculas encima de un título, ícono en recuadro sobre un título, bordes de color de más de 1 px a un lado de tarjetas o avisos, anillos de progreso como relleno.

## Movimiento

Entrada corta al cambiar de pestaña (`entra`, 0.32 s), gráficas que se revelan, la barra de celdas que se llena por pasos. Todo se apaga con "reducir movimiento".
