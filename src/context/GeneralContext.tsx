"use client";

import {
  ClientProps,
  DashboardStatsRequest,
  DashboardStatsResponse,
  FetchClientRequest,
  FetchRecordingsRequest,
  FetchRemindersRequest,
  RecordingDetailsProps,
  ReminderProps,
} from "@/@types/general-client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useApiContext } from "./ApiContext";
import { useSession } from "./auth"; // Para saber quando buscar dados
import { handleApiError } from "@/utils/error-handler";
import toast from "react-hot-toast";

interface GeneralContextProps {
  // Gravações
  recordings: RecordingDetailsProps[];
  setRecordings: React.Dispatch<React.SetStateAction<RecordingDetailsProps[]>>;
  recordingsFilters: FetchRecordingsRequest;
  setRecordingsFilters: React.Dispatch<
    React.SetStateAction<FetchRecordingsRequest>
  >;
  recordingsTotalPages: number;
  setRecordingsTotalPages: React.Dispatch<React.SetStateAction<number>>;
  isGettingRecordings: boolean;
  setIsGettingRecordings: React.Dispatch<React.SetStateAction<boolean>>;
  GetRecordings: () => Promise<void>;
  selectedRecording: RecordingDetailsProps | null;
  setSelectedRecording: React.Dispatch<
    React.SetStateAction<RecordingDetailsProps | null>
  >;
  // Dashboard Stats
  dashboardStats: DashboardStatsResponse | null;
  isGettingDashboardStats: boolean;
  GetDashboardStats: (params: DashboardStatsRequest) => Promise<void>;
  // Lembretes (Reminders)
  reminders: ReminderProps[];
  setReminders: React.Dispatch<React.SetStateAction<ReminderProps[]>>;
  remindersFilters: FetchRemindersRequest;
  setRemindersFilters: React.Dispatch<
    React.SetStateAction<FetchRemindersRequest>
  >;
  remindersTotalPages: number;
  setRemindersTotalPages: React.Dispatch<React.SetStateAction<number>>;
  isGettingReminders: boolean;
  setIsGettingReminders: React.Dispatch<React.SetStateAction<boolean>>;
  GetReminders: () => Promise<void>;
  selectedReminder: ReminderProps | null;
  setSelectedReminder: React.Dispatch<
    React.SetStateAction<ReminderProps | null>
  >;
  // Pacientes (Clients)
  clients: ClientProps[];
  setClients: React.Dispatch<React.SetStateAction<ClientProps[]>>;
  clientsFilters: FetchClientRequest;
  setClientsFilters: React.Dispatch<React.SetStateAction<FetchClientRequest>>;
  clientsTotalPages: number;
  setClientsTotalPages: React.Dispatch<React.SetStateAction<number>>;
  isGettingClients: boolean;
  setIsGettingClients: React.Dispatch<React.SetStateAction<boolean>>;
  GetClients: () => Promise<void>;
  selectedClient: ClientProps | null;
  setSelectedClient: React.Dispatch<React.SetStateAction<ClientProps | null>>;
  newRecordingRequest: {
    type: "CLIENT" | "PERSONAL";
    subType?: "REMINDER" | "STUDY" | "OTHER";
    /** Abre no mesmo layout da nova gravação com conteúdo só para lembrete (sem nome). */
    simplifiedLembrete?: boolean;
    /** Abre no mesmo layout com seletor só Estudos/Outros + iniciar. */
    simplifiedPersonal?: boolean;
  } | null;
  openNewRecording: (
    type: "CLIENT" | "PERSONAL",
    subType?: "REMINDER" | "STUDY" | "OTHER",
    options?: {
      simplifiedLembrete?: boolean;
      simplifiedPersonal?: boolean;
    },
  ) => void;
  resetNewRecordingRequest: () => void;
}

const GeneralContext = createContext<GeneralContextProps | undefined>(
  undefined,
);

// Hook para consumir o contexto
export function useGeneralContext() {
  const context = useContext(GeneralContext);
  if (!context) {
    throw new Error(
      "useGeneralContext deve ser usado dentro de um GeneralContextProvider",
    );
  }
  return context;
}

// --- 3. COMPONENTE PROVIDER ---

interface ProviderProps {
  children: React.ReactNode;
}

export const GeneralContextProvider = ({ children }: ProviderProps) => {
  const { GetAPI } = useApiContext();
  const { profile } = useSession();

  // --- Estados para Gravações ---
  const [recordings, setRecordings] = useState<RecordingDetailsProps[]>([]);
  const [isGettingRecordings, setIsGettingRecordings] = useState(true);
  const [recordingsFilters, setRecordingsFilters] =
    useState<FetchRecordingsRequest>({ page: 1 });
  const [recordingsTotalPages, setRecordingsTotalPages] = useState(0);
  const [selectedRecording, setSelectedRecording] =
    useState<RecordingDetailsProps | null>(null);

  // --- Estados para Dashboard Stats ---
  const [dashboardStats, setDashboardStats] =
    useState<DashboardStatsResponse | null>(null);
  const [isGettingDashboardStats, setIsGettingDashboardStats] = useState(false);

  // --- Estados para Lembretes (Reminders) ---
  const [reminders, setReminders] = useState<ReminderProps[]>([]);
  const [isGettingReminders, setIsGettingReminders] = useState(true);
  const [remindersFilters, setRemindersFilters] =
    useState<FetchRemindersRequest>({ page: 1 });
  const [remindersTotalPages, setRemindersTotalPages] = useState(0);
  const [selectedReminder, setSelectedReminder] =
    useState<ReminderProps | null>(null);

  // --- Estados para Pacientes (Clients) ---
  const [clients, setClients] = useState<ClientProps[]>([]);
  const [isGettingClients, setIsGettingClients] = useState(true);
  const [clientsFilters, setClientsFilters] = useState<FetchClientRequest>({
    page: 1,
  });
  const [clientsTotalPages, setClientsTotalPages] = useState(0);
  const [selectedClient, setSelectedClient] = useState<ClientProps | null>(
    null,
  );

  // --- Estado para Trigger Global de Nova Gravação ---
  const [newRecordingRequest, setNewRecordingRequest] = useState<{
    type: "CLIENT" | "PERSONAL";
    subType?: "REMINDER" | "STUDY" | "OTHER";
    simplifiedLembrete?: boolean;
    simplifiedPersonal?: boolean;
  } | null>(null);

  const openNewRecording = useCallback(
    (
      type: "CLIENT" | "PERSONAL",
      subType?: "REMINDER" | "STUDY" | "OTHER",
      options?: {
        simplifiedLembrete?: boolean;
        simplifiedPersonal?: boolean;
      },
    ) => {
      setNewRecordingRequest({ type, subType, ...options });
    },
    [],
  );

  const resetNewRecordingRequest = useCallback(() => {
    setNewRecordingRequest(null);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildQueryString = (params: Record<string, any>): string => {
    const query = new URLSearchParams();
    for (const key in params) {
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {
        query.append(key, params[key].toString());
      }
    }
    return query.toString();
  };

  // --- 4. FUNÇÕES DE FETCH (Padrão GeneralContext) ---

  const GetRecordings = useCallback(async () => {
    setIsGettingRecordings(true);
    try {
      const queryString = buildQueryString(recordingsFilters);
      console.log("queryString", queryString);
      const response = await GetAPI(`/recording?${queryString}`, true);
      console.log("response", response);
      if (response.status === 200) {
        setRecordings(response.body.recordings || []);
        setRecordingsTotalPages(response.body.pages || 0);
      } else {
        console.error("Erro ao buscar gravações:", response.status);
        const errorMessage = handleApiError(
          response,
          "Não foi possível carregar as gravações.",
        );
        toast.error(errorMessage);
        setRecordings([]);
        setRecordingsTotalPages(0);
      }
    } catch (error) {
      console.error("Erro no GetRecordings:", error);
      toast.error("Erro ao carregar gravações. Tente novamente.");
      setRecordings([]);
      setRecordingsTotalPages(0);
    } finally {
      setIsGettingRecordings(false);
    }
  }, [GetAPI, recordingsFilters]); // Depende do filtro

  const GetDashboardStats = useCallback(
    async (params: DashboardStatsRequest) => {
      setIsGettingDashboardStats(true);
      try {
        const queryString = buildQueryString(params);
        const response = await GetAPI(`/recording/stats?${queryString}`, true);
        console.log("GetDashboardStats response", response);
        if (response.status === 200) {
          setDashboardStats(response.body);
        } else {
          console.error("Erro ao buscar stats:", response.status);
          // Não mostra toast para stats pois é carregado em background
          setDashboardStats(null);
        }
      } catch (error) {
        console.error("Erro no GetDashboardStats:", error);
        // Não mostra toast para stats pois é carregado em background
        setDashboardStats(null);
      } finally {
        setIsGettingDashboardStats(false);
      }
    },
    [GetAPI],
  );

  const GetClients = useCallback(async () => {
    setIsGettingClients(true);
    try {
      const queryString = buildQueryString(clientsFilters);
      // Endpoint: /client (ou /client, ajuste se necessário)
      const response = await GetAPI(`/client?${queryString}`, true);
      console.log("response", response);
      if (response.status === 200) {
        // A API retorna 'clients', mas salvamos em 'clients'
        setClients(response.body.clients || []);
        setClientsTotalPages(response.body.pages || 0);
      } else {
        console.error("Erro ao buscar pacientes:", response.status);
        const errorMessage = handleApiError(
          response,
          "Não foi possível carregar os pacientes.",
        );
        toast.error(errorMessage);
        setClients([]);
        setClientsTotalPages(0);
      }
    } catch (error) {
      console.error("Erro no GetClients:", error);
      toast.error("Erro ao carregar pacientes. Tente novamente.");
      setClients([]);
      setClientsTotalPages(0);
    } finally {
      setIsGettingClients(false);
    }
  }, [GetAPI, clientsFilters]); // Depende do filtro

  const GetReminders = useCallback(async () => {
    setIsGettingReminders(true);
    try {
      const queryString = buildQueryString(remindersFilters);
      const response = await GetAPI(`/reminder?${queryString}`, true);
      console.log("GetReminders response", response);
      if (response.status === 200) {
        setReminders(response.body.reminders || []);
        setRemindersTotalPages(response.body.pages || 0);
      } else {
        console.error("Erro ao buscar lembretes:", response.status);
        const errorMessage = handleApiError(
          response,
          "Não foi possível carregar os lembretes.",
        );
        toast.error(errorMessage);
        setReminders([]);
        setRemindersTotalPages(0);
      }
    } catch (error) {
      console.error("Erro no GetReminders:", error);
      toast.error("Erro ao carregar lembretes. Tente novamente.");
      setReminders([]);
      setRemindersTotalPages(0);
    } finally {
      setIsGettingReminders(false);
    }
  }, [GetAPI, remindersFilters]); // Depende do filtro

  useEffect(() => {
    if (profile) {
      GetRecordings();
      GetClients();
    } else {
      setRecordings([]);
      setClients([]);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      GetRecordings();
    }
  }, [recordingsFilters, GetRecordings, profile]);

  useEffect(() => {
    if (profile) {
      GetClients();
    }
  }, [clientsFilters, GetClients, profile]);

  useEffect(() => {
    if (profile) {
      GetReminders();
    }
  }, [remindersFilters, GetReminders, profile]);

  return (
    <GeneralContext.Provider
      value={{
        // Gravações
        recordings,
        setRecordings,
        recordingsFilters,
        setRecordingsFilters,
        recordingsTotalPages,
        setRecordingsTotalPages,
        isGettingRecordings,
        setIsGettingRecordings,
        GetRecordings,
        selectedRecording,
        setSelectedRecording,
        // Dashboard Stats
        dashboardStats,
        isGettingDashboardStats,
        GetDashboardStats,
        // Lembretes
        reminders,
        setReminders,
        remindersFilters,
        setRemindersFilters,
        remindersTotalPages,
        setRemindersTotalPages,
        isGettingReminders,
        setIsGettingReminders,
        GetReminders,
        selectedReminder,
        setSelectedReminder,
        // Pacientes
        clients,
        setClients,
        clientsFilters,
        setClientsFilters,
        clientsTotalPages,
        setClientsTotalPages,
        isGettingClients,
        setIsGettingClients,
        GetClients,
        selectedClient,
        setSelectedClient,
        // Trigger de Nova Gravação
        newRecordingRequest,
        openNewRecording,
        resetNewRecordingRequest,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};
