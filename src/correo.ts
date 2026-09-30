// Los formatos de correo del agente. La IA solo escoge el formato, a quién va y el texto que dictó el dueño.
// El diseño y los números salen de aquí, siempre iguales: así todos los correos se ven como uno solo.
import type { cierreDePlanta } from "./server";

export type Cierre = ReturnType<typeof cierreDePlanta>;
export type PedidoDeCorreo = {
  para: string;
  formato: "mensaje" | "informe";
  asunto?: string;
  texto?: string;
};
export type Correo = {
  para: string;
  asunto: string;
  texto: string;
  html: string;
};

const PIE =
  "Lo envió el agente de planta después de que su dueño lo aprobó. Datos SIMULADOS de la clase.";

const COLOR_DE_ESTADO: Record<string, string> = {
  "en meta": "#1E7B4F",
  atención: "#B7791F",
  caído: "#B42318"
};

const numero = (n: number, decimales = 0) =>
  n.toLocaleString("es-CO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });

const escapar = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] ?? c
  );

// Un asunto nunca lleva saltos de línea: así nadie mete encabezados escondidos.
const unaLinea = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

const fechaDeHoy = () =>
  new Date().toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

// El marco de todos los correos: franja oscura con la fecha, título, contenido y pie. Estilos en línea
// y tablas, que es lo que Gmail y Outlook respetan.
function marco(titulo: string, contenido: string) {
  return `<!doctype html><html lang="es-CO"><body style="margin:0;background:#F3F4F6;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#111D35">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden">
<tr><td style="background:#111D35;color:#FFFFFF;padding:16px 24px;font-size:12px;letter-spacing:.08em;text-transform:uppercase">Agente de planta · ${escapar(fechaDeHoy())}</td></tr>
<tr><td style="padding:24px"><h1 style="font-size:20px;line-height:1.3;margin:0 0 16px">${escapar(titulo)}</h1>${contenido}</td></tr>
<tr><td style="padding:14px 24px;border-top:1px solid #E5E7EB;color:#6B7280;font-size:12px;line-height:1.4">${PIE}</td></tr>
</table></body></html>`;
}

const parrafos = (texto: string) =>
  texto
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 12px;line-height:1.55">${escapar(p.trim()).replace(/\n/g, "<br>")}</p>`
    )
    .join("");

export function armarCorreo(pedido: PedidoDeCorreo, cierre: Cierre): Correo {
  const para = unaLinea(pedido.para);

  // Formato 1 · Mensaje: el texto que dictó el dueño, con el marco de siempre.
  if (pedido.formato === "mensaje") {
    const asunto = unaLinea(pedido.asunto || "Mensaje del agente de planta");
    const cuerpo = (pedido.texto ?? "").trim();
    return {
      para,
      asunto,
      texto: `${cuerpo}\n\n—\n${PIE}`,
      html: marco(asunto, parrafos(cuerpo))
    };
  }

  // Formato 2 · Informe de cierre: los números salen de las fórmulas, nunca de la IA.
  const planta = cierre.planta;
  const asunto = `Informe de cierre de planta · ${fechaDeHoy()}`;
  const nota = pedido.texto?.trim();
  const noCumplen = cierre.modulos.filter((m) => !m.vaACumplirSuEntrega);
  const faltantes =
    noCumplen
      .map((m) => `${m.modulo} (le faltan ${numero(m.leFaltanPorDia)} por día)`)
      .join(", ") || "ninguno";
  const celda = "padding:8px;border-bottom:1px solid #E5E7EB";
  const filas = cierre.modulos
    .map(
      (m) => `<tr>
<td style="${celda}">${escapar(m.modulo)}<br><span style="color:#6B7280;font-size:12px">${escapar(m.referencia)}</span></td>
<td style="${celda};text-align:right">${numero(m.unidadesHechas)} / ${numero(m.meta)}</td>
<td style="${celda};text-align:right">${numero(m.eficiencia, 1)} %</td>
<td style="${celda};color:${COLOR_DE_ESTADO[m.estado] ?? "#111D35"};font-weight:bold">${escapar(m.estado)}</td>
</tr>`
    )
    .join("");
  const contenido = `<p style="margin:0 0 16px;line-height:1.55">La planta cerró con <b>${numero(planta.eficiencia, 1)} %</b> de eficiencia: ${numero(planta.unidades)} unidades de una meta de ${numero(planta.meta)}.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin:0 0 16px">
<tr style="background:#F3F4F6"><th align="left" style="padding:8px">Módulo</th><th align="right" style="padding:8px">Unidades / meta</th><th align="right" style="padding:8px">Eficiencia</th><th align="left" style="padding:8px">Estado</th></tr>
${filas}
</table>
<p style="margin:0 0 8px;line-height:1.55"><b>Caídos:</b> ${escapar(cierre.modulosCaidos.join(", ") || "ninguno")}</p>
<p style="margin:0 0 16px;line-height:1.55"><b>No cumplen su entrega:</b> ${escapar(faltantes)}</p>
${nota ? `<div style="background:#FEF7E6;border-left:4px solid #E4A62F;padding:10px 12px;line-height:1.55"><b>Nota:</b> ${escapar(nota).replace(/\n/g, "<br>")}</div>` : ""}`;
  const texto = [
    `${asunto} (datos SIMULADOS)`,
    "",
    `Planta: ${numero(planta.eficiencia, 1)} % · ${numero(planta.unidades)} de ${numero(planta.meta)} unidades`,
    "",
    ...cierre.modulos.map(
      (m) =>
        `- ${m.modulo} (${m.referencia}): ${numero(m.unidadesHechas)} / ${numero(m.meta)} · ${numero(m.eficiencia, 1)} % · ${m.estado}`
    ),
    "",
    `Caídos: ${cierre.modulosCaidos.join(", ") || "ninguno"}`,
    `No cumplen su entrega: ${faltantes}`,
    ...(nota ? ["", `Nota: ${nota}`] : []),
    "",
    "—",
    PIE
  ].join("\n");
  return { para, asunto, texto, html: marco(asunto, contenido) };
}
