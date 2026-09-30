# Agente de planta · Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/BRANEX-IA/agente-de-planta)

Agente de IA para el taller del profe Jefferson. Conversa en español, consulta el cierre de una planta de confección con
**datos SIMULADOS** y **pide firma** antes de hacer cualquier cosa que no sea leer. Vive en Cloudflare Workers y se usa
desde el navegador o el celular.

> Basado en la plantilla oficial [`cloudflare/agents-starter`](https://github.com/cloudflare/agents-starter) (licencia MIT,
> ver `LICENSE`), tomada el 2026-09-14 (commit `4ea6a72`). Branex le entrega al profe la guía paso a paso por aparte.

## Qué cambió frente a la plantilla oficial

| Pieza              | Plantilla oficial                                 | Este agente                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cerebro            | `@cf/moonshotai/kimi-k2.7-code` (solo plan pago)  | `@cf/zai-org/glm-4.7-flash` (plan gratis, sabe usar herramientas)                                                                                                                                                                       |
| Manos              | Clima al azar, calculadora, zona horaria          | `cierreDePlanta`, `novedadesDelTurno` y `verTareasProgramadas` solo leen. Todo lo demás (`avisarAlJefeDePlanta`, `enviarCorreo`, `programarTarea`, `cancelarTareaProgramada`) pide firma, porque `conSupervisor` lo aplica en el código |
| Tareas con horario | Aviso que solo se ve si la pestaña está abierta   | El resultado queda **escrito en el chat**. Los horarios cron van en UTC (Colombia es UTC-5)                                                                                                                                             |
| Servidores MCP     | Cualquiera con la dirección podía conectar uno    | Quitados                                                                                                                                                                                                                                |
| Acceso             | Abierto                                           | **Cerrado por defecto:** pantalla de entrada con clave y una cookie `HttpOnly` que guarda la firma HMAC de la clave, no la clave                                                                                                        |
| Pantalla           | Inglés, con adjuntos, depuración y cambio de tema | Español, solo texto, nombres legibles de las manos y encabezado que cabe en el celular                                                                                                                                                  |
| Telegram           | No trae                                           | Opcional. Con el secreto `TELEGRAM_BOT_TOKEN` responde en Telegram a los celulares vinculados; las manos que actúan mandan botones **Aprobar** y **Rechazar** y solo se ejecutan cuando firma el dueño                                  |
| Correo             | No trae                                           | Opcional. `enviarCorreo` manda dos formatos fijos (`src/correo.ts`: mensaje e informe de cierre) por un Gmail que es solo del agente. Sin sus secretos queda SIMULADO. Pide firma y tiene un tope de 20 al día                          |

Las fórmulas y los datos simulados son los mismos del regalo 01 del taller de n8n. Dan 76,9 % de eficiencia, módulos 4 y 7
caídos, y no cumplen los módulos 3, 4, 6 y 7.

## Publicarlo sin terminal (sirve en Windows 10)

1. Botón **Deploy to Cloudflare** de arriba.
2. En la misma página se pide `CLAVE_DE_ACCESO` (sale de `.dev.vars.example`): una clave de **20 caracteres o más**. Si no la
   pide, se crea en **Workers & Pages** → el agente → **Settings** → **Variables and Secrets** → **Add**, tipo **Secret**.
3. Abrir `https://<nombre>.<subdominio>.workers.dev`, escribir la clave y dar clic en **Entrar**.

Los cambios se hacen con Claude Code en la web: rama nueva → **Create PR** → **Merge** en GitHub. Workers Builds publica
solo al actualizar `main`.

## Construirlo con Claude Code: `/construir-agente`

El repositorio trae una skill de proyecto en `.claude/skills/construir-agente/` y las reglas duras en `CLAUDE.md`. En
Claude Code (web o terminal) basta con escribir `/construir-agente`: pregunta una cosa a la vez, propone un plan en palabras
y sigue la guía que toque:

| Guía                     | Para                                                                             |
| ------------------------ | -------------------------------------------------------------------------------- |
| `1-mi-agente.md`         | Convertir el agente de planta en el agente propio (la ficha del taller)          |
| `2-mano-que-lee.md`      | Una herramienta que consulta, con datos SIMULADOS primero                        |
| `3-mano-que-actua.md`    | Una herramienta que actúa, con firma y tope diario                               |
| `4-tarea-con-horario.md` | Un resumen programado que solo lee                                               |
| `5-sus-datos.md`         | Conectar datos propios según el semáforo: Google Sheets, D1 o AI Search          |
| `6-formato-de-correo.md` | Un formato nuevo en `src/correo.ts`                                              |
| `recibo.md`              | El chequeo final: clave, `SOLO_LEEN`, manos que actúan, Telegram, nombre y build |

## Telegram (opcional)

1. En Telegram, `/newbot` a **@BotFather**. El token que entrega va como Secret `TELEGRAM_BOT_TOKEN` en Cloudflare, nunca en
   el código ni en un chat.
2. Con la sesión abierta en el navegador, abrir `https://<nombre>.<subdominio>.workers.dev/telegram/conectar`. Registra el
   webhook con una contraseña derivada del token (`X-Telegram-Bot-Api-Secret-Token`), muestra el botón para vincular y la
   lista de celulares vinculados con **Desvincular todos**.
3. Tocar **Abrir en Telegram** → **Iniciar** (manda `/start <número>`). El número de 6 cifras queda escondido en «¿Telegram
   está en otro aparato?»: sirve 15 minutos, una vez, 3 intentos por chat y 15 en total. Al vincularse un celular nuevo,
   los que ya estaban reciben aviso. `/salir` desvincula ese celular, y cambiar `CLAVE_DE_ACCESO` los desvincula todos.

`TELEGRAM_CHATS_PERMITIDOS` (opcional, avanzado) fija números de chat sin código. La conversación de Telegram tiene su propio
historial (20 mensajes por chat). Las tareas programadas son las mismas y su resultado también llega a los celulares
vinculados. Si el token se filtra: `/revoke` en @BotFather, token nuevo en Cloudflare y
abrir otra vez `/telegram/conectar`.

## Correo (opcional)

1. Crear un Gmail **solo para el agente** y activarle la verificación en 2 pasos.
2. Sacar una contraseña de aplicación en `myaccount.google.com/apppasswords`.
3. En Cloudflare, dos Secret: `GMAIL_CORREO` y `GMAIL_CLAVE_DE_APLICACION`. Sale por `smtp.gmail.com:465` con
   [`worker-mailer`](https://www.npmjs.com/package/worker-mailer).

Los dos formatos viven en `src/correo.ts`: **mensaje** (asunto y texto dictados) e **informe de cierre** (números de
`cierreDePlanta()` y una nota opcional). La IA solo escoge el formato, el destinatario y el texto: el diseño y los números no
pasan por ella. Para agregar un formato, se agrega en `armarCorreo` y en el `z.enum` de `enviarCorreo`.

## Con terminal (Mac, Windows 11 o Linux)

```bash
npm install
cp .dev.vars.example .dev.vars   # y poner una clave de 20 caracteres o más; .dev.vars no se sube al repositorio
npx wrangler login               # Workers AI no tiene simulador local: pide una cuenta de Cloudflare
npm run dev                      # http://localhost:5173
npm run check && npm run build
npm run deploy
```

## Reglas que no se rompen

- **`SOLO_LEEN` en `src/server.ts` es la lista de manos que no piden firma.** Agregar un nombre ahí es quitarle el
  supervisor: lo decide el dueño del agente, nunca un asistente de código.
- **La función `fetch` del final de `src/server.ts` es la puerta.** Sin clave de 20 caracteres o más responde 503. Sin sesión,
  o si la conexión viene de otro sitio, responde 401.
- **Las tareas programadas solo leen** y le muestran el resultado al dueño, en el chat y en su Telegram; nunca le avisan a
  nadie más.
- **En Telegram ninguna mano que actúa se ejecuta sin firma.** `manosConFirmaDeTelegram` la deja pendiente y
  `firmarDesdeTelegram` solo la ejecuta si toca **Aprobar** el dueño en su chat privado, una sola vez y antes de 24 horas.
  El Worker descarta grupos, canales y botones ajenos (`esDeChatPrivado`); el agente no le guarda ni le contesta nada a un
  chat que no se ha vinculado. Cada celular vinculado conversa y firma.
- **Las tareas con horario corren como mucho una vez al día** (minuto y hora fijos en el cron).
- **Nada de llaves ni datos personales en el código.** Los secretos van en Cloudflare con tipo **Secret** y se leen de
  `this.env`.
- **La clave no es un inicio de sesión con usuarios.** Para datos reales hace falta más protección: Cloudflare Access con
  dominio propio u otra opción. Antes, pasar por el semáforo y tener la autorización de la empresa.

## Deuda conocida

- La plantilla fija versiones anteriores a las últimas: `agents` 0.17.4 frente a 0.23.0, `ai` 6 frente a 7 y
  `workers-ai-provider` 3 frente a 4. Subirlas es un cambio mayor que hay que probar aparte.
- Probado con el modelo real en una cuenta de Cloudflare el 2026-09-14 (pantalla web). Telegram: falta la prueba con un bot
  real.
