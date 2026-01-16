/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import OpenAI from "openai";
import { startTransition, useEffect, useRef, useState } from "react";
import fixWebmDuration from "webm-duration-fix";
import { Message, Prompt } from "./types";

/* ================= OpenRouter via OpenAI SDK ================= */
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY!,
  dangerouslyAllowBrowser: true, // em prod, prefira proxy/rota server-side
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost",
    "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "Chat Widget",
  },
});

/** Modelo-alvo: tente um Gemini com ÁUDIO habilitado na página de modelos.
 * Se este ID específico não aceitar audio, o fallback (Whisper) entra. */
const MODEL =
  process.env.NEXT_PUBLIC_OPENROUTER_MODEL || "google/gemini-2.5-flash";

/** Fallback de transcrição (OpenRouter) */
const WHISPER_MODEL = "openai/whisper-large-v3";

/* ================= Types do payload ================= */
type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type AudioPart = {
  type: "input_audio";
  input_audio: { data: string; format: string };
};

type ChatMessage =
  | { role: "system"; content: string }
  | {
      role: "user" | "assistant";
      content: string | Array<TextPart | ImagePart | AudioPart>;
    };

interface UseSectionChatParams {
  selectedPrompt?: Prompt;
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
/** Retorna apenas o base64 (sem "data:...;base64,") */
async function fileToBase64NoPrefix(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  return dataUrl.split(",")[1] ?? "";
}
function audioFormatFromMime(mime: string) {
  const m = (mime || "").toLowerCase();
  if (!m.startsWith("audio/")) return "wav";
  const ext = m.split("/")[1] || "wav";
  if (ext === "mpeg" || ext === "mpga") return "mp3";
  return ext;
}

/** Heurística: o texto da primeira resposta acusa que não suporta áudio? */
function looksLikeNoAudioSupport(text: string) {
  const t = text.toLowerCase();
  return (
    t.includes("não consigo processar arquivos de áudio") ||
    t.includes("não consigo processar audio") ||
    t.includes("cannot process audio") ||
    t.includes("audio not supported") ||
    t.includes("i can’t process audio")
  );
}

/* ================= Hook ================= */
export function useSectionChat({ selectedPrompt }: UseSectionChatParams) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // gravação
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const chunksRef = useRef<Blob[]>([]);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [recordStartTime, setRecordStartTime] = useState<number | null>(null);

  // streaming
  const placeholderIndexRef = useRef<number>(-1);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef<string>("");

  /* ===== Gravação ===== */
  const startRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (e) =>
      e.data.size > 0 && chunksRef.current.push(e.data);
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const fixed = await fixWebmDuration(blob);
      const audioFile = new File([fixed], "gravacao.webm", {
        type: "audio/webm",
      });
      setFile(audioFile);
      stream.getTracks().forEach((t) => t.stop());
    };
    rec.start();
    setMediaRecorder(rec);
    setRecordStartTime(Date.now());
  };
  const stopRecording = () => {
    mediaRecorder?.stop();
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
  function buildHistoryForAPI(): ChatMessage[] {
    const out: ChatMessage[] = [];
    const sys = (selectedPrompt?.prompt ?? "").trim();
    if (sys) out.push({ role: "system", content: sys });

    for (const m of messages) {
      if (!m.content || m.content === "...") continue;
      out.push({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      });
    }
    return out;
  }

  /* ===== Fallback: transcrever com Whisper ===== */
  async function transcribeWithWhisper(audio: File): Promise<string> {
    const resp = await openai.audio.transcriptions.create({
      model: WHISPER_MODEL,
      file: audio,
      response_format: "text",
    } as any);
    return typeof resp === "string" ? resp : ((resp as any)?.text ?? "");
  }

  /* ===== Enviar ===== */
  async function handleSendMessage(overrideContent?: string) {
    const textToSend = overrideContent || inputMessage;

    if (loading || (!textToSend.trim() && !file)) return;

    setLoading(true);

    // eco do usuário + placeholder
    const outgoing: Message[] = [];
    if (file) {
      outgoing.push({
        role: "user",
        content: "",
        file: URL.createObjectURL(file),
        type: file.type,
        name: file.name,
      });
    }
    if (textToSend.trim()) outgoing.push({ role: "user", content: textToSend });

    setMessages((prev) => {
      const list = [...prev, ...outgoing, { role: "ai", content: "..." }];
      placeholderIndexRef.current = list.length - 1;
      return list as Message[];
    });

    /* monta parts (texto + imagem + áudio base64) */
    const parts: Array<TextPart | ImagePart | AudioPart> = [];
    let attemptedAudio = false;

    if (file) {
      const mime = file.type || "";
      if (mime.startsWith("image/")) {
        const dataUrl = await fileToDataUrl(file);
        parts.push({
          type: "text",
          text: textToSend.trim()
            ? textToSend
            : "Descreva/responda considerando a imagem:",
        });
        parts.push({ type: "image_url", image_url: { url: dataUrl } });
      } else if (mime.startsWith("audio/")) {
        const base64 = await fileToBase64NoPrefix(file);
        const format = audioFormatFromMime(mime);
        parts.push({
          type: "text",
          text: textToSend.trim()
            ? textToSend
            : "Please transcribe this audio file, then answer the question.",
        });
        parts.push({
          type: "input_audio",
          input_audio: { data: base64, format },
        });
        attemptedAudio = true;
      } else {
        parts.push({
          type: "text",
          text: `Arquivo ${mime} anexado (não suportado diretamente). ${textToSend}`.trim(),
        });
      }
    } else if (textToSend.trim()) {
      parts.push({ type: "text", text: textToSend });
    }

    // limpa UI
    setInputMessage("");
    setFile(null);

    // histórico + rodada atual
    const base = buildHistoryForAPI();
    const lastUser: ChatMessage =
      parts.length === 1 && parts[0].type === "text"
        ? { role: "user", content: (parts[0] as TextPart).text }
        : { role: "user", content: parts };

    const messagesForAPI: ChatMessage[] = [...base, lastUser];

    /* streaming (com fallback) */
    const runOnce = async (msgs: ChatMessage[]) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      streamBufferRef.current = "";

      const completion = await openai.chat.completions.create(
        { model: MODEL, stream: true, messages: msgs as any },
        { signal: controller.signal },
      );

      for await (const chunk of completion as any) {
        const delta = chunk?.choices?.[0]?.delta?.content;
        if (!delta) continue;

        if (typeof delta === "string") {
          streamBufferRef.current += delta;
        } else if (Array.isArray(delta)) {
          for (const d of delta) {
            if (typeof d === "string") streamBufferRef.current += d;
            else if (typeof d?.text === "string")
              streamBufferRef.current += d.text;
          }
        }
        flushToUI();
      }
      flushToUI();
      return streamBufferRef.current;
    };

    try {
      const firstText = await runOnce(messagesForAPI);

      // Se tentamos áudio e a resposta parece que "não suporta áudio", fazemos fallback:
      if (attemptedAudio && looksLikeNoAudioSupport(firstText)) {
        const lastAudioMessage = outgoing.find((m) =>
          m.type?.startsWith("audio"),
        );
        if (lastAudioMessage && file) {
          const transcript = await transcribeWithWhisper(file);
          const base2 = buildHistoryForAPI();
          const prompt =
            (inputMessage || "").trim().length > 0
              ? `${inputMessage}\n\nTranscrição (ASR):\n${transcript}`
              : `Transcreva e responda ao áudio:\n${transcript}`;

          await runOnce([...base2, { role: "user", content: prompt }]);
        }
      }
    } catch (err) {
      console.error("OpenRouter stream error:", err);
      setMessages((prev) =>
        prev.map((m, i) =>
          i === placeholderIndexRef.current
            ? { ...m, content: "Erro ao responder. Tente novamente." }
            : m,
        ),
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

  return {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    file,
    setFile,
    loading,
    isRecording,
    elapsedTime,
    startRecording,
    stopRecording,
    handleSendMessage,
    handleAbortStream,
  } as const;
}
