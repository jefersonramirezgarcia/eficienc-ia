# El recibo

Termine **siempre** con este bloque, exacto. Llénelo leyendo el código y `git diff`, no de memoria:

```text
CLAVE: intacta / cambiada
SOLO_LEEN: [lista como quedó]
MANOS QUE ACTÚAN (piden firma): [lista]
TELEGRAM: intacto / cambiado
CLASE Y NOMBRE DEL WORKER: intactos / cambiados
npm run check: pasa / falla · npm run build: pasa / falla
```

## Cómo comprobar cada línea

- **CLAVE:** `git diff` no toca la función `fetch` del final de `src/server.ts` ni `firmar`, `iguales`, `cookieDeSesion`,
  `COOKIE` o `CLAVE_MINIMA`.
- **SOLO_LEEN:** copie la lista tal como está en el código. Si quitó nombres de manos que borró, dígalo al lado.
- **MANOS QUE ACTÚAN:** todas las de `manos()` que no están en `SOLO_LEEN`.
- **TELEGRAM:** `git diff` no toca las funciones de la regla 3 de `CLAUDE.md`.
- **CLASE Y NOMBRE DEL WORKER:** `ChatAgent`, `name` y `migrations` de `wrangler.jsonc` siguen igual.
- **npm run check · npm run build:** escriba lo que de verdad salió la última vez que los corrió.

Si algo quedó «cambiada» o «cambiados», explíquele al dueño qué cambió y por qué, y dígale que no haga merge sin revisarlo
con Branex.
