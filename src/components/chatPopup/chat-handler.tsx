"use client";
import {
  Dispatch,
  SetStateAction,
  startTransition,
  useEffect,
  useRef,
  useState,
} from "react";
import fixWebmDuration from "webm-duration-fix";
import { Attachment, Message, Prompt } from "./types";

/* ================= OpenRouter via rotas server-side =================
 * A chave OpenRouter vive somente no servidor (OPENROUTER_API_KEY).
 * O client usa /api/openrouter/chat e /api/openrouter/transcribe. */

/* ================= Types do payload ================= */
type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type FilePart = {
  type: "file";
  file: { filename: string; file_data: string };
};

type ChatMessage =
  | { role: "system"; content: string }
  | {
      role: "user" | "assistant";
      content: string | Array<TextPart | ImagePart | FilePart>;
    };

const MAX_ATTACHMENTS = 4;
const MAX_API_MESSAGES = 50;
const MAX_AUDIO_FILE_BYTES = 4 * 1024 * 1024;
const MAX_EMBEDDED_TOTAL_BYTES = 2_500_000;
const MAX_CHAT_MESSAGE_CHARS = 32_000;
const MAX_CHAT_TOTAL_TEXT_CHARS = 64_000;
const MAX_SYSTEM_PROMPT_CHARS = 12_000;
const ALLOWED_EMBEDDED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

interface UseSectionChatParams {
  selectedPrompt?: Prompt;
}

export interface UseSectionChatReturn {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  inputMessage: string;
  setInputMessage: Dispatch<SetStateAction<string>>;
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  file: File | null;
  setFile: (f: File | null) => void;
  loading: boolean;
  isRecording: boolean;
  elapsedTime: string;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  handleSendMessage: (overrideContent?: string) => Promise<void>;
  handleAbortStream: () => void;
}

/* ================= Utils ================= */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(r.error);
    r.onload = () => res(r.result as string);
    r.readAsDataURL(file);
  });
}
/* ================= Hook ================= */
export function useSectionChat({
  selectedPrompt,
}: UseSectionChatParams): UseSectionChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // gravação
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [recordStartTime, setRecordStartTime] = useState<number | null>(null);

  // streaming
  const placeholderIndexRef = useRef<number>(-1);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef<string>("");

  /* ===== Gravação ===== */
  const startRecording = async () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    try {
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) =>
        e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const fixed = await fixWebmDuration(blob);
          const audioFile = new File([fixed], "gravacao.webm", {
            type: "audio/webm",
          });
          setFiles((prev) => [...prev, audioFile]);
        } finally {
          stream.getTracks().forEach((track) => track.stop());
          if (recordingStreamRef.current === stream) {
            recordingStreamRef.current = null;
          }
          if (mediaRecorderRef.current === rec) {
            mediaRecorderRef.current = null;
          }
        }
      };
      rec.start();
      setIsRecording(true);
      setRecordStartTime(Date.now());
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      throw error;
    }
  };
  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
    setRecordStartTime(null);
    setElapsedTime("00:00");
  };
  useEffect(() => {
    let timer: number | undefined;
    if (recordStartTime && isRecording) {
      timer = window.setInterval(() => {
        const diff = (Date.now() - recordStartTime) / 1000;
        const mm = String(Math.floor(diff / 60)).padStart(2, "0");
        const ss = String(Math.floor(diff % 60)).padStart(2, "0");
        setElapsedTime(`${mm}:${ss}`);
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
      return undefined;
    };
  }, [recordStartTime, isRecording]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();

      const recorder = mediaRecorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
        mediaRecorderRef.current = null;
      }

      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
      chunksRef.current = [];
    };
  }, []);

  /* ===== UI stream flush ===== */
  function flushToUI() {
    const text = streamBufferRef.current;
    startTransition(() => {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === placeholderIndexRef.current ? { ...m, content: text } : m,
        ),
      );
    });
  }

  /* ===== Histórico -> schema OpenRouter ===== */
  function buildHistoryForAPI(currentMessageChars: number): ChatMessage[] {
    const historyReversed: ChatMessage[] = [];
    const sys = (selectedPrompt?.prompt ?? "").trim();
    let remainingChars =
      MAX_CHAT_TOTAL_TEXT_CHARS - currentMessageChars - sys.length;
    const priorMessageLimit = MAX_API_MESSAGES - 1;
    for (
      let index = messages.length - 1;
      index >= 0 && historyReversed.length < priorMessageLimit;
      index -= 1
    ) {
      const message = messages[index];
      if (!message.content || message.content === "...") continue;
      if (
        message.content.length > MAX_CHAT_MESSAGE_CHARS ||
        message.content.length > remainingChars
      ) {
        break;
      }
      remainingChars -= message.content.length;
      historyReversed.push({
        role: message.role === "ai" ? "assistant" : "user",
        content: message.content,
      });
    }
    const history = historyReversed.reverse();

    if (!sys) return history;

    return [
      { role: "system", content: sys },
      ...history.slice(-(priorMessageLimit - 1)),
    ];
  }

  /* ===== Fallback: transcrever com Whisper (server-side) ===== */
  async function transcribeWithWhisper(audio: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", audio);

    const response = await fetch("/api/openrouter/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcrição falhou (${response.status})`);
    }

    return await response.text();
  }

  /* ===== Enviar ===== */
  async function handleSendMessage(overrideContent?: string) {
    // Captura texto e arquivos no início para enviar os dois juntos (não perder texto ao ter áudio pendente)
    const textToSend = (overrideContent ?? inputMessage).trim();
    const filesToSend = [...files];

    if (loading || (!textToSend && filesToSend.length === 0)) return;
    if (textToSend.length > MAX_CHAT_MESSAGE_CHARS) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "A mensagem excede o limite de texto permitido.",
        },
      ]);
      return;
    }
    if (
      (selectedPrompt?.prompt ?? "").trim().length > MAX_SYSTEM_PROMPT_CHARS
    ) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "O prompt selecionado excede o limite permitido.",
        },
      ]);
      return;
    }

    placeholderIndexRef.current = -1;
    setLoading(true);

    try {
      if (filesToSend.length > MAX_ATTACHMENTS) {
        throw new Error(
          `Envie no máximo ${MAX_ATTACHMENTS} arquivos por mensagem.`,
        );
      }

      const unsupportedFile = filesToSend.find(
        (file) =>
          !file.type.startsWith("audio/") &&
          !ALLOWED_EMBEDDED_TYPES.has(file.type),
      );
      if (unsupportedFile) {
        throw new Error(`O formato de "${unsupportedFile.name}" não é aceito.`);
      }

      const audioFiles = filesToSend.filter((file) =>
        file.type.startsWith("audio/"),
      );
      if (audioFiles.length > 1) {
        throw new Error("Envie apenas um áudio por mensagem.");
      }

      const oversizedAudio = filesToSend.find(
        (file) =>
          file.type.startsWith("audio/") && file.size > MAX_AUDIO_FILE_BYTES,
      );
      if (oversizedAudio) {
        throw new Error(
          `O áudio "${oversizedAudio.name}" excede o limite de 4 MB.`,
        );
      }

      const embeddedFiles = filesToSend.filter(
        (file) => !file.type.startsWith("audio/"),
      );
      const embeddedBytes = embeddedFiles.reduce(
        (total, file) => total + file.size,
        0,
      );
      if (embeddedBytes > MAX_EMBEDDED_TOTAL_BYTES) {
        throw new Error(
          "Imagens e PDFs somados excedem o limite de 2,5 MB por mensagem.",
        );
      }

      // Prepare attachments for UI
      const attachments: Attachment[] = [];
      for (const f of filesToSend) {
        const url = URL.createObjectURL(f);
        attachments.push({
          url,
          type: f.type,
          name: f.name,
        });
      }

      // Quando há áudio/anexos E texto: mostrar duas bolhas (áudio acima, texto abaixo) antes da resposta da IA
      const hasAttachments = attachments.length > 0;
      const messagesToAdd: Message[] = [];

      if (hasAttachments) {
        messagesToAdd.push({
          role: "user",
          content: filesToSend.some((f) => f.type.startsWith("audio/"))
            ? "Mensagem de Áudio"
            : "Mensagem com anexo",
          attachments,
          ...(filesToSend.length === 1 &&
          filesToSend[0].type.startsWith("audio/")
            ? {
                file: attachments[0].url,
                type: filesToSend[0].type,
                name: filesToSend[0].name,
              }
            : {}),
        });
      }
      if (textToSend) {
        messagesToAdd.push({
          role: "user",
          content: textToSend,
        });
      }

      setMessages((prev) => {
        const list = [
          ...prev,
          ...messagesToAdd,
          { role: "ai", content: "..." },
        ];
        placeholderIndexRef.current = list.length - 1;
        return list as Message[];
      });

      /* Construct Payload for API */
      const parts: Array<TextPart | ImagePart | FilePart> = [];

      // Áudios são transcritos antes do chat. Isso evita enviar base64 grande
      // e não depende de o modelo multimodal aceitar áudio como image_url.
      for (const file of filesToSend) {
        const mime = file.type || "";
        if (ALLOWED_EMBEDDED_TYPES.has(mime)) {
          const dataUrl = await fileToDataUrl(file);
          if (mime === "application/pdf") {
            parts.push({
              type: "file",
              file: { filename: file.name, file_data: dataUrl },
            });
          } else {
            parts.push({ type: "image_url", image_url: { url: dataUrl } });
          }
        } else if (mime.startsWith("audio/")) {
          const transcript = await transcribeWithWhisper(file);
          parts.push({
            type: "text",
            text: `[Transcrição do áudio "${file.name}"]\n${transcript}`,
          });
        }
      }

      // Sempre incluir texto quando o usuário digitou; senão, mensagem padrão se só houver arquivos
      if (textToSend) {
        parts.push({ type: "text", text: textToSend });
      } else if (
        filesToSend.length > 0 &&
        !parts.some((p) => p.type === "text")
      ) {
        parts.push({
          type: "text",
          text: "Por favor, analise os arquivos enviados.",
        });
      }

      // Clean UI State
      setInputMessage("");
      setFiles([]);

      // Histórico + Rodada Atual
      const currentMessageChars = parts.reduce(
        (total, part) => total + (part.type === "text" ? part.text.length : 0),
        0,
      );
      if (currentMessageChars > MAX_CHAT_MESSAGE_CHARS) {
        throw new Error("O conteúdo da mensagem excede o limite permitido.");
      }
      const base = buildHistoryForAPI(currentMessageChars);
      const lastUser: ChatMessage = { role: "user", content: parts };

      const messagesForAPI: ChatMessage[] = [...base, lastUser];

      /* Streaming */
      const runOnce = async (msgs: ChatMessage[]) => {
        const controller = new AbortController();
        abortControllerRef.current = controller;
        streamBufferRef.current = "";

        const response = await fetch("/api/openrouter/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: msgs }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Chat falhou (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamBufferRef.current += decoder.decode(value, { stream: true });
          flushToUI();
        }
        flushToUI();
        return streamBufferRef.current;
      };

      await runOnce(messagesForAPI);
    } catch (err) {
      console.error("OpenRouter stream error:", err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Erro ao responder. Tente novamente.";
      setMessages((prev) =>
        placeholderIndexRef.current >= 0
          ? prev.map((m, i) =>
              i === placeholderIndexRef.current
                ? { ...m, content: message }
                : m,
            )
          : [...prev, { role: "ai", content: message }],
      );
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      streamBufferRef.current = "";
    }
  }

  function handleAbortStream() {
    abortControllerRef.current?.abort();
    setLoading(false);
  }

  /* ===== Compatibilidade (Single File) ===== */
  const file = files.length > 0 ? files[0] : null;
  const setFile = (f: File | null) => {
    setFiles(f ? [f] : []);
  };

  return {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    files,
    setFiles,
    loading,
    isRecording,
    elapsedTime,
    startRecording,
    stopRecording,
    handleSendMessage,
    handleAbortStream,
    // compat
    file,
    setFile,
  };
}
