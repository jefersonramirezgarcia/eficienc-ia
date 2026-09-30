# Un formato de correo nuevo

Los formatos viven en `src/correo.ts`. La IA **solo** escoge el formato, a quién va y el texto del dueño. El diseño y los
números salen del código y quedan siempre iguales.

Pregúntele al dueño: ¿qué tipo de correo es (alerta, resumen o recordatorio), qué debe llevar y quién lo recibe
normalmente?

## Cómo se hace

1. En `armarCorreo`, agregue un bloque para el formato nuevo:
   - use `marco(titulo, contenido)`;
   - pase todo texto por `escapar` y el asunto por `unaLinea`;
   - escriba los números con `numero()`, en formato colombiano.
2. Agregue el nombre al `z.enum` de `formato` en `enviarCorreo` (`src/server.ts`) y explique en su `description` cuándo
   usarlo.
3. Actualice `resumenDeFirma`, en la pantalla y en el servidor, para que la firma muestre el formato y a quién va.
4. Agregue el formato nuevo a la regla del correo en `INSTRUCCIONES`.
5. Pruébelo primero SIMULADO: sin los secretos del Gmail, el correo no sale.

Nunca: datos de personas en el correo, más de un destinatario ni quitar el tope `CORREOS_POR_DIA`.
