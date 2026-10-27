# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Público general en Colombia: personas con varias deudas de consumo (tarjetas de crédito, libre inversión, libranza, vehículo) que quieren saber cuánto deben, en qué orden pagar y cuándo quedan libres. Llegan por un enlace compartido o lo encuentran; no tienen formación financiera. La usan sobre todo en el celular, a menudo justo después de recibir el extracto o de pagar una cuota.

## Product Purpose

Convertir un montón de deudas sueltas en un plan de pagos concreto: fecha en que quedas libre, cuánto te ahorras en intereses y qué deuda atacar primero. El éxito es que la persona registre sus pagos mes a mes y vea bajar su deuda real.

## Positioning

Gratis, sin registro y sin servidor: los datos nunca salen del dispositivo. Hecha para las reglas de Colombia: tasa efectiva anual, tasa de usura vigente, libranza, prima y cesantías, prepago sin multa (Ley 1555 de 2012), comparación de compra de cartera con tasas de la Superfinanciera.

## Operating Context

- Se abre en el celular para registrar un pago, revisar el próximo vencimiento o decidir cuánto abonar.
- Los datos salen del extracto bancario: saldo, tasa EA, cuota mensual, día de pago.
- Se comparte por enlace. Se publica con GitHub Pages.
- El dueño y Antigravity mantienen el código; ver AGENTS.md.

## Capabilities and Constraints

- Asistente de inicio, plan avalancha o bola de nieve, compra de cartera, presupuesto, registro de pagos, reglas para abonar, simulador "¿y si…?", guía de prima, historial, logros, perfiles, respaldo, Excel, recordatorios por calendario.
- HTML, CSS y JavaScript sin compilación ni frameworks. Funciona sin internet una vez cargada.
- Los datos viven en `localStorage`; no se puede cambiar su clave ni su forma.
- Por ahora no se ofrece botón de instalar ni envío por correo.

## Brand Commitments

- Ninguna identidad heredada es obligatoria: el dueño autorizó cambiar nombre visual, colores, ícono y tipografía. El nombre "Plan Libre de Deudas" sigue siendo el nombre del producto mientras no se decida otro.
- Voz: seria y confiable, como una app de banco; español de Colombia, tuteo, frases cortas y claras.
- Aviso permanente: herramienta educativa, no es asesoría financiera.

## Evidence on Hand

- Tasas de referencia de entidades (Superfinanciera, corte 25 sep 2026) en `js/datos.js`.
- No hay testimonios, usuarios reales, cifras de uso ni alianzas con bancos. No se deben inventar.

## Product Principles

1. Los números primero: cada pantalla responde una pregunta concreta sobre plata.
2. Confianza antes que entusiasmo: claridad y precisión, sin promesas.
3. Privado por diseño: nada sale del dispositivo, y se dice.
4. Pensada para el celular y para alguien sin formación financiera.

## Accessibility & Inclusion

Lectura cómoda en pantallas pequeñas y con luz de día; contraste suficiente para cifras; respeta "reducir movimiento".
