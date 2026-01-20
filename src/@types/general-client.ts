// --- 1. DEFINIÇÃO DOS TIPOS ---

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
export interface ReminderProps {
  id: string;
  name: string;
  description: string;
  date: Date;
  time: string;
  userId: string;
  notificationSended: boolean;
  recording: {
    audioUrl: string;
    createdAt: string;
    description: string;
    duration: string;
    id: string;
    name: string;
    reminderId: string;
    summary: string | null;
    transcription: string;
    type: string;
    userId: string;
  };
}

// Tipos para Gravações
export interface RecordingSpeakerSpeechProps {
  speakerId: string;
  transcription: string;
  recordingId: string;
  startTime: number;
  endTime: number;
}
export interface RecordingSpeakerProps {
  id: string;
  name: string;
  recordingId: string;
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
  client?: ClientProps | null;
  reminderId?: string | null;
  reminder?: ReminderProps | null;
  transcriptionId?: string | null;
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
