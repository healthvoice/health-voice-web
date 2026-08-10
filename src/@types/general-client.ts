// --- 1. DEFINIÇÃO DOS TIPOS ---

import { AIComponentResponse } from "@/app/(private)/ai-components-preview/types/component-types";

// Tipos para Pacientes (anteriormente Clients)
export interface ClientProps {
  id: string;
  name: string;
  userId: string;
  description?: string | null;
  birthDate?: string | null;
  createdAt: Date;
}

// Tipos para Agendamentos (anteriormente Reminders)
export interface ReminderRecordingProps {
  audioUrl: string;
  createdAt: string;
  description: string;
  duration: string;
  id: string;
  name: string;
  reminderId: string;
  summary: string | null;
  transcription: string;
  transcriptionStatus: string;
  type: string;
  userId: string;
  clientId: string | null;
}

export interface ReminderProps {
  id: string;
  name: string;
  description: string;
  date: Date;
  time: string;
  userId: string;
  notificationSended: boolean;
  recording: ReminderRecordingProps | null;
}

// Tipos para Gravações
/** Palavra com tempo próprio — permite clicar na palavra e voltar o áudio. */
export interface SpeechWord {
  text: string;
  start: number;
  end: number;
}

export interface RecordingSpeakerSpeechProps {
  speakerId: string;
  transcription: string;
  recordingId: string;
  startTime: number;
  endTime: number;
  /** Timestamps por palavra (H3). null nas consultas anteriores. */
  words?: SpeechWord[] | null;
}
export interface RecordingSpeakerProps {
  id: string;
  name: string;
  recordingId: string;
  isProfessional?: boolean;
}

export interface RecordingDetailsProps {
  id: string;
  name: string;
  description: string;
  duration: string;
  audioUrl: string;
  userId: string;
  transcriptionStatus: "PENDING" | "DONE" | "NOT_REQUESTED" | "TRANSCRIBING";
  type: "CLIENT" | "REMINDER" | "OTHER" | "STUDY"; // Nota: O tipo da gravação ainda usa 'CLIENT' e 'REMINDER'
  transcription?: string | null;
  summary?: string | null;
  structuredSummary?: AIComponentResponse | null;
  specificSummary?: AIComponentResponse | null;
  client?: ClientProps | null;
  reminderId?: string | null;
  reminder?: ReminderProps | null;
  transcriptionId?: string | null;
  /** IA usada na última análise — destacada como "atual" na re-análise. */
  promptId?: string | null;
  speeches: RecordingSpeakerSpeechProps[];
  speakers: RecordingSpeakerProps[];
  createdAt: Date;
}

// Tipo para os Query Params de Gravações
export interface FetchRecordingsRequest {
  page: number;
  clientId?: string; // Mantido como clientId conforme especificação da API
  reminderId?: string; // Mantido como reminderId conforme especificação da API
  query?: string;
  sortBy?: "NAME" | "CREATED_AT" | "DURATION" | "TYPE" | null;
  sortDirection?: "ASC" | "DESC" | null;
  type?: "CLIENT" | "REMINDER" | "OTHER" | "STUDY";
}

export interface FetchClientRequest {
  page: number;
  query?: string;
  sortBy?: "NAME" | "BIRTH_DATE" | "DESCRIPTION" | null;
  sortDirection?: "ASC" | "DESC" | null;
}

// Tipo para os Query Params de Reminders
export interface FetchRemindersRequest {
  page: number;
  query?: string;
  sortBy?: "NAME" | "DATE" | "TIME" | null;
  sortDirection?: "ASC" | "DESC" | null;
}

// Tipos para Notificações (centro in-app)
export interface NotificationProps {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  opened: boolean;
  userId: string;
  createdAt: string;
  type?: string;
  route?: string;
  params?: Record<string, any>;
}

export interface FetchNotificationsResponse {
  notifications: NotificationProps[];
  pages: number;
}

// Tipo para estatísticas do dashboard
export interface DashboardStatsRequest {
  startDate: string;
  endDate: string;
}

export interface DashboardStatsResponse {
  totalRecordings: number;
  totalSeconds: number;
  totalClients: number;
  recordingsByDay: Array<{
    date: string;
    count: number;
    totalSeconds: number;
  }>;
  previousPeriod: {
    totalRecordings: number;
    totalSeconds: number;
    totalClients: number;
  };
}
