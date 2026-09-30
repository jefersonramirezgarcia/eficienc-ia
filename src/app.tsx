import { Suspense, useCallback, useState, useEffect, useRef } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import type { ChatAgent } from "./server";
import {
  Badge,
  Button,
  Empty,
  InputArea,
  Surface,
  Text
} from "@cloudflare/kumo";
import { Toasty, useKumoToastManager } from "@cloudflare/kumo/components/toast";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import {
  PaperPlaneRightIcon,
  StopIcon,
  TrashIcon,
  GearIcon,
  ChatCircleDotsIcon,
  CircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@phosphor-icons/react";

// Nombres que ve el profe en vez de los nombres internos de las herramientas.
const NOMBRE_DE_MANO: Record<string, string> = {
  cierreDePlanta: "Consultó el cierre de la planta",
  novedadesDelTurno: "Leyó las novedades del turno",
  avisarAlJefeDePlanta: "Aviso al jefe de planta",
  enviarCorreo: "Enviar un correo",
  programarTarea: "Programar una tarea",
  verTareasProgramadas: "Revisó las tareas programadas",
  cancelarTareaProgramada: "Cancelar una tarea programada"
};

const nombreDeMano = (nombre: string) => NOMBRE_DE_MANO[nombre] ?? nombre;

// Lo que ve el profe antes de firmar: el texto del aviso, o qué tarea se programa y cuándo. Nunca código.
function resumenDeFirma(entrada: unknown) {
  const e = (entrada ?? {}) as {
    para?: unknown;
    formato?: unknown;
    asunto?: unknown;
    texto?: unknown;
    mensaje?: unknown;
    description?: unknown;
    when?: {
      type?: string;
      cron?: string;
      date?: unknown;
      delayInSeconds?: unknown;
    };
    taskId?: unknown;
  };
  // Un correo: a quién va, con qué formato y el texto completo, antes de que salga.
  if (typeof e.para === "string") {
    const texto = typeof e.texto === "string" ? e.texto.trim() : "";
    return e.formato === "informe"
      ? `Para: ${e.para}\nFormato: informe de cierre de la planta${texto ? `\nNota: ${texto}` : ""}`
      : `Para: ${e.para}\nAsunto: ${typeof e.asunto === "string" && e.asunto ? e.asunto : "Mensaje del agente de planta"}\n\n${texto}`;
  }
  if (typeof e.mensaje === "string") return e.mensaje;
  // La firma muestra el horario real, para que nadie firme a ciegas.
  if (typeof e.description === "string" && e.when?.type === "scheduled")
    return `${e.description} · una vez, el ${new Date(String(e.when.date)).toLocaleString("es-CO", { timeZone: "America/Bogota" })} (hora de Colombia)`;
  if (typeof e.description === "string" && e.when?.type === "delayed") {
    const segundos = Number(e.when.delayInSeconds);
    return `${e.description} · una vez, dentro de ${segundos < 120 ? `${segundos} segundos` : `${Math.round(segundos / 60)} minutos`}`;
  }
  if (typeof e.description === "string") {
    const cron = e.when?.type === "cron" ? (e.when.cron ?? "") : "";
    const partes = cron.trim().split(/\s+/);
    const diario =
      partes.length === 5 &&
      partes.slice(2).join(" ") === "* * *" &&
      /^\d+$/.test(partes[0]) &&
      /^\d+$/.test(partes[1]);
    // El horario se guarda en hora UTC; Colombia es UTC-5.
    const cuando = diario
      ? `todos los días a las ${(Number(partes[1]) + 19) % 24}:${partes[0].padStart(2, "0")} (hora de Colombia)`
      : cron
        ? `horario ${cron} (hora UTC)`
        : "una sola vez";
    return `${e.description} · ${cuando}`;
  }
  if (typeof e.taskId === "string") return `Cancelar la tarea ${e.taskId}`;
  return JSON.stringify(entrada, null, 2);
}

// ── Tool rendering ────────────────────────────────────────────────────

function ToolPartView({
  part,
  addToolApprovalResponse
}: {
  part: UIMessage["parts"][number];
  addToolApprovalResponse: (response: {
    id: string;
    approved: boolean;
  }) => void;
}) {
  if (!isToolUIPart(part)) return null;
  const toolName = nombreDeMano(getToolName(part));

  // Completed
  if (part.state === "output-available") {
    return (
      <div className="flex justify-start">
        <Surface className="max-w-[85%] px-4 py-2.5 rounded-xl ring ring-kumo-line">
          <div className="flex items-center gap-2 mb-1">
            <GearIcon size={14} className="text-kumo-inactive" />
            <Text size="xs" variant="secondary" bold>
              {toolName}
            </Text>
            <Badge variant="secondary">Listo</Badge>
          </div>
        </Surface>
      </div>
    );
  }

  // Needs approval
  if ("approval" in part && part.state === "approval-requested") {
    const approvalId = (part.approval as { id?: string })?.id;
    return (
      <div className="flex justify-start">
        <Surface className="max-w-[85%] px-4 py-3 rounded-xl ring-2 ring-kumo-warning">
          <div className="flex items-center gap-2 mb-2">
            <GearIcon size={14} className="text-kumo-warning" />
            <Text size="sm" bold>
              Necesita su firma: {toolName}
            </Text>
          </div>
          <div className="mb-3">
            <Text size="sm">{resumenDeFirma(part.input)}</Text>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircleIcon size={14} />}
              onClick={() => {
                if (approvalId) {
                  addToolApprovalResponse({ id: approvalId, approved: true });
                }
              }}
            >
              Aprobar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<XCircleIcon size={14} />}
              onClick={() => {
                if (approvalId) {
                  addToolApprovalResponse({ id: approvalId, approved: false });
                }
              }}
            >
              Rechazar
            </Button>
          </div>
        </Surface>
      </div>
    );
  }

  // Rejected / denied
  if (
    part.state === "output-denied" ||
    ("approval" in part &&
      (part.approval as { approved?: boolean })?.approved === false)
  ) {
    return (
      <div className="flex justify-start">
        <Surface className="max-w-[85%] px-4 py-2.5 rounded-xl ring ring-kumo-line">
          <div className="flex items-center gap-2">
            <XCircleIcon size={14} className="text-kumo-danger" />
            <Text size="xs" variant="secondary" bold>
              {toolName}
            </Text>
            <Badge variant="secondary">Rechazado</Badge>
          </div>
        </Surface>
      </div>
    );
  }

  // Errored
  if (part.state === "output-error") {
    const errorText = part.errorText;
    return (
      <div className="flex justify-start">
        <Surface className="max-w-[85%] px-4 py-2.5 rounded-xl ring-2 ring-kumo-danger">
          <div className="flex items-center gap-2 mb-1">
            <XCircleIcon size={14} className="text-kumo-danger" />
            <Text size="xs" variant="secondary" bold>
              {toolName}
            </Text>
            <Badge variant="destructive">Error</Badge>
          </div>
          <div className="font-mono">
            <Text size="xs" variant="secondary">
              {errorText || "La herramienta falló"}
            </Text>
          </div>
        </Surface>
      </div>
    );
  }

  // Executing
  if (part.state === "input-available" || part.state === "input-streaming") {
    return (
      <div className="flex justify-start">
        <Surface className="max-w-[85%] px-4 py-2.5 rounded-xl ring ring-kumo-line">
          <div className="flex items-center gap-2">
            <GearIcon size={14} className="text-kumo-inactive animate-spin" />
            <Text size="xs" variant="secondary">
              Usando {toolName}...
            </Text>
          </div>
        </Surface>
      </div>
    );
  }

  return null;
}

// ── Main chat ─────────────────────────────────────────────────────────

function Chat() {
  const [connected, setConnected] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toasts = useKumoToastManager();
  const agent = useAgent<ChatAgent>({
    agent: "ChatAgent",
    onOpen: useCallback(() => setConnected(true), []),
    onClose: useCallback(() => setConnected(false), []),
    onError: useCallback(
      (error: Event) => console.error("WebSocket error:", error),
      []
    ),
    onMessage: useCallback(
      (message: MessageEvent) => {
        try {
          const data = JSON.parse(String(message.data));
          if (data.type === "scheduled-task") {
            toasts.add({
              title: "Tarea programada",
              description: data.description,
              timeout: 0
            });
          }
        } catch {
          // Not JSON or not our event
        }
      },
      [toasts]
    )
  });

  const {
    messages,
    sendMessage,
    clearHistory,
    addToolApprovalResponse,
    stop,
    status
  } = useAgentChat({
    agent,
    experimental_throttle: 100
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Re-focus the input after streaming ends
  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage({ role: "user", parts: [{ type: "text", text }] });
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [input, isStreaming, sendMessage]);

  return (
    <div className="flex flex-col h-screen bg-kumo-elevated relative">
      {/* Header */}
      <header className="px-5 py-4 bg-kumo-base border-b border-kumo-line">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-kumo-default">
              Agente de planta
            </h1>
            <Badge variant="secondary">
              <ChatCircleDotsIcon size={12} weight="bold" className="mr-1" />
              Datos SIMULADOS
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <CircleIcon
                size={8}
                weight="fill"
                className={connected ? "text-kumo-success" : "text-kumo-danger"}
              />
              <Text size="xs" variant="secondary">
                {connected ? "Conectado" : "Desconectado"}
              </Text>
            </div>
            <Button
              variant="secondary"
              icon={<TrashIcon size={16} />}
              onClick={clearHistory}
              aria-label="Borrar la conversación"
            >
              Borrar
            </Button>
          </div>
        </div>
      </header>

      {!connected && (
        <div className="max-w-3xl mx-auto w-full px-5 pt-4">
          <Surface className="px-4 py-3 rounded-xl ring ring-kumo-warning">
            <Text size="sm">
              Conectando con su agente… Si no conecta, recargue la página.
            </Text>
          </Surface>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
          {messages.length === 0 && (
            <Empty
              icon={<ChatCircleDotsIcon size={32} />}
              title="Pregúntele a su agente"
              contents={
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "¿Cómo cerró la planta ayer?",
                    "¿Qué novedades dejó el turno?",
                    "Avísele al jefe de planta que revise el módulo 4",
                    "Cada día a las 6:30, el cierre de la planta"
                  ].map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="sm"
                      disabled={isStreaming}
                      onClick={() => {
                        sendMessage({
                          role: "user",
                          parts: [{ type: "text", text: prompt }]
                        });
                      }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              }
            />
          )}

          {messages.map((message: UIMessage, index: number) => {
            const isUser = message.role === "user";
            const isLastAssistant =
              message.role === "assistant" && index === messages.length - 1;

            return (
              <div key={message.id} className="space-y-2">
                {/* Render parts in chronological (array) order */}
                {message.parts.map((part, i) => {
                  const key = `${message.id}-${i}`;

                  if (isToolUIPart(part)) {
                    return (
                      <ToolPartView
                        key={key}
                        part={part}
                        addToolApprovalResponse={addToolApprovalResponse}
                      />
                    );
                  }

                  if (part.type === "reasoning") return null;

                  if (
                    part.type === "file" &&
                    part.mediaType.startsWith("image/")
                  ) {
                    return (
                      <div
                        key={key}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <img
                          src={part.url}
                          alt="Imagen"
                          className="max-h-64 rounded-xl border border-kumo-line object-contain"
                        />
                      </div>
                    );
                  }

                  if (part.type === "text") {
                    if (!part.text) return null;

                    if (isUser) {
                      return (
                        <div key={key} className="flex justify-end">
                          <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-kumo-contrast text-kumo-inverse leading-relaxed">
                            {part.text}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-kumo-base text-kumo-default leading-relaxed">
                          <Streamdown
                            className="sd-theme rounded-2xl rounded-bl-md p-3"
                            plugins={{ code }}
                            controls={false}
                            // Sin imágenes en las respuestas: una imagen puesta en el texto por un dato tramposo
                            // podría sacar información hacia afuera.
                            components={{ img: () => null }}
                            isAnimating={isLastAssistant && isStreaming}
                          >
                            {part.text}
                          </Streamdown>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-kumo-line bg-kumo-base">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="max-w-3xl mx-auto px-5 py-4"
        >
          <div className="flex items-end gap-3 rounded-xl border border-kumo-line bg-kumo-base p-3 shadow-sm focus-within:ring-2 focus-within:ring-kumo-ring focus-within:border-transparent transition-shadow">
            <InputArea
              ref={textareaRef}
              value={input}
              onValueChange={setInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              placeholder="Escriba su pregunta..."
              disabled={!connected || isStreaming}
              rows={1}
              className="flex-1 ring-0! focus:ring-0! shadow-none! bg-transparent! outline-none! resize-none max-h-40"
            />
            {isStreaming ? (
              <Button
                type="button"
                variant="secondary"
                shape="square"
                aria-label="Detener"
                icon={<StopIcon size={18} />}
                onClick={stop}
                className="mb-0.5"
              />
            ) : (
              <Button
                type="submit"
                variant="primary"
                shape="square"
                aria-label="Enviar"
                disabled={!input.trim() || !connected}
                icon={<PaperPlaneRightIcon size={18} />}
                className="mb-0.5"
              />
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Entrada con clave ─────────────────────────────────────────────────
// La clave se escribe aquí, nunca en la dirección. El servidor responde con una cookie que JavaScript no puede leer.

function Entrada({ alEntrar }: { alEntrar: () => void }) {
  const [estado, setEstado] = useState<
    "revisando" | "pedir" | "mala" | "sin-clave"
  >("revisando");

  useEffect(() => {
    fetch("/entrar").then(
      (r) =>
        r.status === 204
          ? alEntrar()
          : setEstado(r.status === 503 ? "sin-clave" : "pedir"),
      () => setEstado("pedir")
    );
  }, [alEntrar]);

  if (estado === "revisando") return null;

  return (
    <div className="flex h-screen items-center justify-center bg-kumo-elevated px-5">
      <form
        className="w-full max-w-sm space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await fetch("/entrar", {
            method: "POST",
            body: new FormData(e.currentTarget)
          });
          if (r.status === 204) alEntrar();
          else setEstado(r.status === 503 ? "sin-clave" : "mala");
        }}
      >
        <Text variant="heading3" as="h1">
          Su agente
        </Text>
        {estado === "sin-clave" ? (
          <Text size="sm">
            Su agente todavía no tiene clave, o la clave tiene menos de 20
            caracteres. Créela en Cloudflare, como dice el paso 2 de la guía.
          </Text>
        ) : (
          <>
            <input
              name="clave"
              type="password"
              autoComplete="current-password"
              required
              minLength={20}
              aria-label="Clave de acceso"
              placeholder="Escriba su clave"
              className="w-full rounded-lg border border-kumo-line bg-kumo-base px-3 py-2"
            />
            {estado === "mala" && (
              <Text size="sm">
                Esa clave no coincide con la que guardó en Cloudflare.
              </Text>
            )}
            <Button type="submit" variant="primary">
              Entrar
            </Button>
          </>
        )}
      </form>
    </div>
  );
}

export default function App() {
  const [dentro, setDentro] = useState(false);
  const alEntrar = useCallback(() => setDentro(true), []);
  return (
    <Toasty>
      {dentro ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen text-kumo-inactive">
              Cargando...
            </div>
          }
        >
          <Chat />
        </Suspense>
      ) : (
        <Entrada alEntrar={alEntrar} />
      )}
    </Toasty>
  );
}
