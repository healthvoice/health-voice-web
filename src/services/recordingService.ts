"use client";
/**
 * Serviço de gravação: funções puras para upload e criação de gravações.
 * Permite usar o mesmo fluxo para qualquer tipo: CLIENT, REMINDER, OTHER, STUDY,
 * com ou sem clientId/reminderId, presencial ou não, sem depender do AudioRecorder.
 *
 * Uso:
 * - Só lembrete: buildPayload({ type: "REMINDER", ... })
 * - Só outros/notas: buildPayload({ type: "OTHER", clientId: "...", ... })
 * - Só estudos: buildPayload({ type: "STUDY", ... })
 * - Consulta cliente: buildPayload({ type: "CLIENT", clientId: "...", ... })
 */

import { useCallback } from "react";
import { useApiContext } from "@/context/ApiContext";
import moment from "moment";

// ---------------------------------------------------------------------------
// Tipos (alinhados ao backend: CreateRecordingDto)
// ---------------------------------------------------------------------------

export type RecordingType = "CLIENT" | "REMINDER" | "OTHER" | "STUDY";

export type ConsultationType = "IN_PERSON" | "ONLINE";

export interface CreateRecordingPayload {
  name: string;
  description: string;
  duration: string;
  seconds: number;
  audioUrl: string;
  type: RecordingType;
  clientId?: string | null;
  reminderId?: string | null;
}

export interface BuildPayloadOptions {
  /** Tipo da gravação (obrigatório) */
  type: RecordingType;
  /** Duração em segundos (obrigatório) */
  seconds: number;
  /** URL do áudio após upload (obrigatório) */
  audioUrl: string;
  /** Nome; se vazio, usa título derivado do tipo */
  name?: string;
  /** Descrição; se vazia, usa descrição derivada */
  description?: string;
  /** ID do paciente (opcional; para CLIENT ou OTHER vinculado ao paciente) */
  clientId?: string | null;
  /** ID do lembrete (opcional; para REMINDER) */
  reminderId?: string | null;
  /** Apenas para tipo CLIENT: presencial ou online */
  consultationType?: ConsultationType | null;
}

/** Opções para upload de mídia (presigned + PUT) */
export type PostApiFn = (
  url: string,
  data: unknown,
  auth: boolean,
) => Promise<{ status: number; body: Record<string, unknown> }>;

// ---------------------------------------------------------------------------
// Helpers puros
// ---------------------------------------------------------------------------

/**
 * Formata duração em segundos para o formato esperado pela API (ex: "1m 30s", "45s").
 */
export function formatDurationForAPI(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

/**
 * Retorna um título padrão quando o usuário não informa nome, conforme o tipo.
 */
export function getDefaultTitle(options: {
  type: RecordingType;
}): string {
  const { type } = options;
  if (type === "CLIENT") return "Gravação do Paciente";
  const labels: Record<Exclude<RecordingType, "CLIENT">, string> = {
    REMINDER: "Lembrete",
    STUDY: "Estudo",
    OTHER: "Gravação",
  };
  return labels[type] ?? "Gravação Pessoal";
}

/**
 * Retorna uma descrição padrão quando o usuário não informa descrição.
 */
export function getDefaultDescription(options: {
  type: RecordingType;
  consultationType?: ConsultationType | null;
  date?: Date;
}): string {
  const { type, consultationType, date = new Date() } = options;
  const dateStr = moment(date).format("DD/MM/YYYY HH:mm:ss");
  if (type === "CLIENT") {
    const tipo = consultationType === "ONLINE" ? "online" : "presencial";
    return `Consulta ${tipo} realizada em ${dateStr}`;
  }
  const labels: Record<Exclude<RecordingType, "CLIENT">, string> = {
    REMINDER: "Gravação de lembrete",
    STUDY: "Gravação de estudo",
    OTHER: "Gravação pessoal",
  };
  return `${labels[type] ?? "Gravação"} em ${dateStr}`;
}

/**
 * Monta o payload para POST /recording a partir das opções.
 * Útil para qualquer fluxo: só lembrete, só outros, só estudos, com clientId ou não.
 */
export function buildRecordingPayload(
  options: BuildPayloadOptions,
): CreateRecordingPayload {
  const {
    type,
    seconds,
    audioUrl,
    name,
    description,
    clientId,
    reminderId,
    consultationType,
  } = options;

  const payload: CreateRecordingPayload = {
    name: name?.trim() || getDefaultTitle({ type }),
    description:
      description?.trim() || getDefaultDescription({ type, consultationType }),
    duration: formatDurationForAPI(seconds),
    seconds,
    audioUrl,
    type,
  };

  if (clientId != null && clientId !== "") {
    payload.clientId = clientId;
  }
  if (type === "REMINDER" && reminderId != null && reminderId !== "") {
    payload.reminderId = reminderId;
  }

  return payload;
}

// ---------------------------------------------------------------------------
// Upload de mídia (presigned URL + PUT)
// ---------------------------------------------------------------------------

/**
 * Faz upload do blob para o storage via presigned URL e retorna a URL final.
 * @param blob - Blob de áudio ou vídeo
 * @param mediaType - "audio" ou "video"
 * @param postApi - Função PostAPI do contexto (para /upload/presigned-url)
 * @returns URL final do arquivo no storage
 */
export async function uploadMedia(
  blob: Blob,
  mediaType: "audio" | "video",
  postApi: PostApiFn,
): Promise<string> {
  const mimeType =
    blob.type || (mediaType === "audio" ? "audio/webm" : "video/webm");

  let extension = mediaType === "audio" ? "mp3" : "webm";
  if (mimeType.includes("webm")) extension = "webm";
  else if (mimeType.includes("mp4")) extension = "mp4";
  else if (mimeType.includes("mpeg")) extension = "mp3";
  else if (mimeType.includes("wav")) extension = "wav";
  else if (mimeType.includes("ogg")) extension = "ogg";

  const presignedResponse = await postApi(
    "/upload/presigned-url",
    {
      fileName: `recording-${Date.now()}.${extension}`,
      contentType: mimeType,
    },
    true,
  );

  if (!presignedResponse || presignedResponse.status >= 400) {
    throw new Error(`Falha ao obter URL de upload para ${mediaType}.`);
  }

  const presignedData = presignedResponse.body as Record<string, string>;
  const uploadUrl = presignedData.uploadUrl || presignedData.url;
  const finalUrl = presignedData.finalUrl || presignedData.url;

  if (!uploadUrl) {
    throw new Error("Presigned URL não retornou URL de upload.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": mimeType },
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Falha no upload de ${mediaType}. Status: ${uploadResponse.status}`,
    );
  }

  if (!finalUrl) {
    throw new Error(`Upload não retornou URL final do ${mediaType}.`);
  }

  return finalUrl;
}

// ---------------------------------------------------------------------------
// Criação da gravação (POST /recording)
// ---------------------------------------------------------------------------

/**
 * Cria a gravação no backend (POST /recording).
 * @param payload - Objeto retornado por buildRecordingPayload ou montado manualmente
 * @param postApi - Função PostAPI do contexto
 * @returns Resposta da API { status, body }
 */
export async function createRecording(
  payload: CreateRecordingPayload,
  postApi: PostApiFn,
): Promise<{ status: number; body: Record<string, unknown> }> {
  return postApi("/recording", payload, true) as Promise<{
    status: number;
    body: Record<string, unknown>;
  }>;
}

// ---------------------------------------------------------------------------
// Fluxo completo: upload + criar gravação
// ---------------------------------------------------------------------------

export interface UploadAndCreateOptions {
  blob: Blob;
  mediaType: "audio" | "video";
  type: RecordingType;
  seconds: number;
  audioUrl?: never;
  name?: string;
  description?: string;
  clientId?: string | null;
  reminderId?: string | null;
  consultationType?: ConsultationType | null;
  postApi: PostApiFn;
}

export interface UploadAndCreateResult {
  success: boolean;
  response?: { status: number; body: Record<string, unknown> };
  audioUrl?: string;
  error?: string;
}

/**
 * Fluxo completo: upload do blob e criação da gravação.
 * Use para qualquer cenário: só lembrete, só outros, só estudos, com clientId ou não.
 *
 * @example
 * // Só nota (OTHER) para um paciente
 * const result = await uploadAndCreateRecording({
 *   blob, mediaType: "audio", type: "OTHER", seconds: 120,
 *   clientId: selectedClient.id, name: "Observação", postApi: PostAPI,
 * });
 *
 * @example
 * // Só lembrete
 * const result = await uploadAndCreateRecording({
 *   blob, mediaType: "audio", type: "REMINDER", seconds: 60,
 *   reminderId: reminder?.id, postApi: PostAPI,
 * });
 */
export async function uploadAndCreateRecording(
  options: UploadAndCreateOptions,
): Promise<UploadAndCreateResult> {
  const { blob, mediaType, type, seconds, postApi } = options;
  try {
    const audioUrl = await uploadMedia(blob, mediaType, postApi);
    const payload = buildRecordingPayload({
      type,
      seconds,
      audioUrl,
      name: options.name,
      description: options.description,
      clientId: options.clientId,
      reminderId: options.reminderId,
      consultationType: options.consultationType,
    });
    const response = await createRecording(payload, postApi);

    if (response.status >= 400) {
      return {
        success: false,
        audioUrl,
        error:
          (response.body?.message as string) ||
          "Erro ao salvar gravação. Tente novamente.",
      };
    }

    return {
      success: true,
      response: { status: response.status, body: response.body },
      audioUrl,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao processar gravação.";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Hook: funções já ligadas ao PostAPI do contexto
// ---------------------------------------------------------------------------

/**
 * Hook que expõe as funções de gravação já com PostAPI do contexto.
 * Use em qualquer tela/modal: só lembrete, só outros, só estudos, com clientId ou não.
 *
 * @example
 * const { uploadAndCreateRecording, buildRecordingPayload } = useRecordingActions();
 * // Gravação só de nota (OTHER) para o paciente
 * const result = await uploadAndCreateRecording({ blob, mediaType: "audio", type: "OTHER", seconds, clientId, postApi });
 */
export function useRecordingActions() {
  const { PostAPI } = useApiContext();

  const uploadMediaWithApi = useCallback(
    (blob: Blob, mediaType: "audio" | "video") =>
      uploadMedia(blob, mediaType, PostAPI as PostApiFn),
    [PostAPI],
  );

  const createRecordingWithApi = useCallback(
    (payload: CreateRecordingPayload) =>
      createRecording(payload, PostAPI as PostApiFn),
    [PostAPI],
  );

  const uploadAndCreateWithApi = useCallback(
    (options: Omit<UploadAndCreateOptions, "postApi">) =>
      uploadAndCreateRecording({ ...options, postApi: PostAPI as PostApiFn }),
    [PostAPI],
  );

  return {
    formatDurationForAPI,
    getDefaultTitle,
    getDefaultDescription,
    buildRecordingPayload,
    uploadMedia: uploadMediaWithApi,
    createRecording: createRecordingWithApi,
    uploadAndCreateRecording: uploadAndCreateWithApi,
  };
}
