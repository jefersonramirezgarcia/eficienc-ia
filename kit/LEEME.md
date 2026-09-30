# Kit: construir su agente

`construir-agente.zip` es una **skill** para Claude: un paso a paso que lo lleva de la mano, desde crear las cuentas hasta
Telegram, el correo y sus datos.

1. Descargue [`construir-agente.zip`](./construir-agente.zip). No lo descomprima.
2. En **claude.ai**, vaya a **Customize → Skills**, toque **+**, luego **Create skill** y después **Upload a skill**. Escoja
   el zip. Si no ve Skills, active la ejecución de código en la configuración de Claude.
3. Escríbale a Claude: «Quiero crear mi agente».

La misma skill vive en `.claude/skills/construir-agente/` de este repositorio. En Claude Code se usa escribiendo
`/construir-agente`.

Para volver a armar el zip después de cambiar la skill:

```bash
cp CLAUDE.md .claude/skills/construir-agente/reglas.md
cd .claude/skills && zip -r -X ../../kit/construir-agente.zip construir-agente
```
