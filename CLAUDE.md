# Reglas de este agente

Este repositorio es un agente de IA en Cloudflare Workers, hecho a partir de la plantilla de Branex para el taller del profe
Jefferson. Quien lo maneja **no programa**: háblele de usted, con palabras simples, y explíquele los cambios en palabras,
no en código.

Para construir o cambiar el agente, use la skill **`/construir-agente`** (`.claude/skills/construir-agente/`).

## Reglas que no se rompen

1. **La puerta.** No cambie la función `fetch` del final de `src/server.ts` ni la clave: `CLAVE_DE_ACCESO`, `firmar`,
   `iguales`, `cookieDeSesion`, `COOKIE` y `CLAVE_MINIMA`.
2. **La firma.** No agregue nombres a `SOLO_LEEN` ni quite `conSupervisor`. Si una mano nueva solo lee, dígaselo al dueño en
   el resumen: agregarla a `SOLO_LEEN` lo decide él. Sí puede **quitar** de `SOLO_LEEN` los nombres de manos que borró:
   quitar nunca da más permisos.
3. **Telegram.** No cambie `esDeChatPrivado`, `recibirTelegram`, `vincularTelegram`, `atenderTelegram`,
   `manosConFirmaDeTelegram`, `firmarDesdeTelegram` ni `conectarTelegram`.
4. **El nombre.** No cambie la clase `ChatAgent`, ni `name` ni `migrations` de `wrangler.jsonc`.
5. **Datos simulados primero.** Toda mano nueva empieza con datos inventados y marcados como SIMULADOS. Los reales se
   conectan después, con la guía `5-sus-datos.md` de la skill.
6. **Las fórmulas van en el código, no en la IA.** La IA solo lee y explica los números.
7. **Tareas con horario:** solo leen y le muestran el resultado al dueño, en el chat y en su Telegram. Nunca le avisan a
   nadie más. El cron va en hora UTC (Colombia es UTC-5), con minuto y hora fijos: máximo una vez al día.
8. **Llaves y contraseñas:** se leen de `this.env` y van en Cloudflare como **Secret**. Nunca en el código ni pedidas en el
   chat. Dígale al dueño el nombre exacto del Secret que debe crear y dónde.
9. **Semáforo antes de conectar datos:**
   - **verde** (inventado o público): sí;
   - **amarillo** (interno de la empresa, sin personas): solo con autorización del dueño de los datos y en un lugar
     privado;
   - **rojo** (datos de personas: estudiantes, empleados, salarios, salud): **nunca** en este agente. Se hace con Branex.
10. **Antes de terminar:** `npm run check` y `npm run build` pasan, y queda el recibo de
    `.claude/skills/construir-agente/recibo.md`.
