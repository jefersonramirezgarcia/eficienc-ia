# Modo guía: desde cero

Úselo cuando el dueño todavía no tiene su agente publicado, o cuando está en claude.ai sin un repositorio abierto. Llévelo
**un paso a la vez**: explique el paso en 2 o 3 líneas, dele el enlace y espere a que diga «listo» o le cuente lo que ve.
Solo entonces siga. Si se atasca, pídale que le describa la pantalla o le pegue un pantallazo (sin claves a la vista) y
ayúdele con eso. **Nunca le pida claves, tokens ni contraseñas en el chat.**

Al empezar, cuéntele en 3 líneas lo que van a lograr: un agente que vive en internet, consulta la planta con datos
simulados, pide su firma antes de actuar y, si quiere, le responde por Telegram y manda correos. Luego pregúntele desde qué
paso arranca.

## Los pasos

1. **Cuenta de GitHub** (gratis), el archivador del código de su agente: https://github.com/signup
2. **Cuenta de Cloudflare** (gratis), la casa de su agente en internet: https://dash.cloudflare.com/sign-up. Lo más fácil es
   _Continue with GitHub_.
3. **Publicar el agente de planta:**
   https://deploy.workers.cloudflare.com/?url=https://github.com/BRANEX-IA/agente-de-planta
   - Conecte GitHub cuando lo pida.
   - Póngale `mi-agente` de nombre, al repositorio y al Worker.
   - En `CLAVE_DE_ACCESO` invente una clave de 20 caracteres o más y guárdela en un lugar seguro. No la escriba en este
     chat.
   - Toque crear y publicar. Al final sale su dirección: `https://mi-agente.SU-USUARIO.workers.dev`.
4. **Entrar y probar:** abra su dirección, escriba la clave y pregunte en este orden:
   - «¿Cómo cerró la planta ayer?»: debe decir 76,9 %.
   - «Avísele al jefe de planta que revise el módulo 4»: debe pedir su firma. Toque _Aprobar_.
   - «¿Qué novedades dejó el turno?»: no debe obedecer la orden escondida en una novedad.

   Si el agente dice que no tiene clave, se crea en Cloudflare: _Workers & Pages → mi-agente → Settings → + Add variable_,
   tipo **Secret** y nombre `CLAVE_DE_ACCESO`.

5. **Diseñar su agente en papel:** hágale una a una las preguntas de la ficha y al final muéstresela completa.
   - Nombre.
   - Para qué sirve.
   - Cómo se comporta.
   - Qué consulta.
   - Qué hace.
   - Qué nunca debe hacer.
   - De qué color son sus datos en el semáforo.
6. **Construirlo con Claude Code en la web** (plan Pro o superior): https://claude.ai/code
   - Conecte GitHub y escoja el repositorio `mi-agente`. Si no aparece, toque **Instala la Claude GitHub App** y dele
     acceso.
   - Escriba `/construir-agente` y pegue su ficha. Allá Claude cambia el código y deja el recibo.
   - Revise el recibo, toque **Create PR** y luego **Merge pull request**. Si el recibo dice «cambiada» o hay un nombre
     nuevo en `SOLO_LEEN`, no haga merge y consulte a Branex.
   - Cloudflare lo publica solo en unos minutos.
7. **Telegram, si quiere darle órdenes desde el celular:** la parte de abajo.
8. **Correos, si quiere que mande mensajes e informes:** la parte de abajo.
9. **Sus datos:** explíquele con [5-sus-datos.md](5-sus-datos.md) dónde guardarlos según el semáforo.

## Telegram

1. En Telegram busque **BotFather**, el que tiene el chulo azul. Toque _Iniciar_, envíe `/newbot` y póngale un nombre y un
   usuario terminado en `bot`. Le entrega un **token**: no lo pegue en ningún chat.
2. En Cloudflare, en su agente, vaya a **Settings → + Add variable** y cree un **Secret** llamado `TELEGRAM_BOT_TOKEN` con
   ese token.
3. En el navegador donde entró con su clave, abra `https://mi-agente.SU-USUARIO.workers.dev/telegram/conectar`. Toque el
   botón azul y luego **Iniciar**. El bot le dice que su celular quedó vinculado.

## Correo

1. Cree un Gmail **solo para el agente**, en una ventana de incógnito: https://accounts.google.com/signup
2. Active la verificación en 2 pasos: https://myaccount.google.com/signinoptions/twosv
3. Saque una contraseña de aplicación en https://myaccount.google.com/apppasswords, con el nombre «mi agente». No la pegue
   en el chat.
4. En Cloudflare, en su agente, vaya a **Settings → + Add variable** y cree dos **Secret**: `GMAIL_CORREO` con el correo y
   `GMAIL_CLAVE_DE_APLICACION` con las 16 letras.
5. Pruebe: «Mándele el informe de cierre a [su correo]» y toque _Aprobar_.

## Mientras guía, recuérdele

- Mientras aprende, todo va con datos simulados. Antes de conectar algo real, el semáforo:
  - **verde:** sí;
  - **amarillo:** con autorización y en un lugar privado;
  - **rojo:** nunca.
- La IA no se queda con sus datos: lee, responde y olvida. Pero sí quedan copias en la memoria del agente, en Telegram y en
  los correos, así que nada sensible por Telegram.
- Si algo falla, pídale el mensaje exacto o un pantallazo, sin claves a la vista, y ayúdele paso a paso.
