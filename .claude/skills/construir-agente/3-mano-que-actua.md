# Una mano que ACTÚA

Una mano que actúa hace algo afuera: avisar, mandar, crear o borrar. **Siempre pide firma**, y eso ya lo hacen solos
`conSupervisor` en la pantalla y `manosConFirmaDeTelegram` en Telegram: no los toque.

Pregúntele al dueño:

1. ¿Qué debe hacer y a quién le llega?
2. ¿Qué debería ver usted, exacto, antes de firmar?

## Cómo se hace

- **Primero SIMULADA:** `execute` solo devuelve lo que haría (`{ registrado: true, simulado: true, … }`), como
  `avisarAlJefeDePlanta`.
- **La firma muestra todo lo importante**: a quién, qué dice y cuándo. Agregue su caso en `resumenDeFirma`, tanto en
  `src/app.tsx` como en `src/server.ts`. Nunca muestre código ni JSON.
- **En `INSTRUCCIONES`:** «llame de una vez la herramienta, no pida permiso en el chat y diga si quedó SIMULADO o salió de
  verdad».
- **Si va a salir de verdad a otro servicio:** la llave va como Secret (regla 8 de `CLAUDE.md`) y le pone un **tope
  diario**, como `CORREOS_POR_DIA`.
- **Para correos** use `enviarCorreo`, que ya existe. Si necesita un formato nuevo, siga
  [6-formato-de-correo.md](6-formato-de-correo.md).
