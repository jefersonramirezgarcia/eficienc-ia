# Una tarea con horario

El agente ya sabe programar tareas con `programarTarea`. Cuando llega la hora, corre `executeTask`, que **solo lee** y deja
el resultado escrito en el chat y en Telegram.

Pregúntele al dueño: ¿qué quiere ver y a qué hora de Colombia?

## Cómo se hace

- Si es un resumen nuevo, cambie `executeTask` para armarlo **con código, sin IA**, como hoy arma el cierre.
- El horario cron va en **UTC**: la hora de Colombia más 5. Las 6:30 a. m. son `30 11 * * *`. Solo minuto y hora fijos:
  máximo una vez al día.
- Una tarea programada **nunca** le avisa ni le manda correo a otra persona, porque eso necesita firma cada vez.
- Para probarla, pídale al agente: «¿Qué tareas tengo programadas?».
