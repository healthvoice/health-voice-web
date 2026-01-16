"use client";

import {
  ClientProps,
  FetchClientRequest,
  FetchRecordingsRequest,
  RecordingDetailsProps,
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
  } | null;
  openNewRecording: (
    type: "CLIENT" | "PERSONAL",
    subType?: "REMINDER" | "STUDY" | "OTHER",
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
  } | null>(null);

  const openNewRecording = useCallback(
    (type: "CLIENT" | "PERSONAL", subType?: "REMINDER" | "STUDY" | "OTHER") => {
      setNewRecordingRequest({ type, subType });
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
        setRecordings([]);
        setRecordingsTotalPages(0);
      }
    } catch (error) {
      console.error("Erro no GetRecordings:", error);
      setRecordings([]);
      setRecordingsTotalPages(0);
    } finally {
      setIsGettingRecordings(false);
    }
  }, [GetAPI, recordingsFilters]); // Depende do filtro

  const GetClients = useCallback(async () => {
    setIsGettingClients(true);
    try {
      const queryString = buildQueryString(clientsFilters);
      // Endpoint: /client (ou /client, ajuste se necessário)
      const response = await GetAPI(`/client?${queryString}`, true);

      if (response.status === 200) {
        // A API retorna 'clients', mas salvamos em 'clients'
        setClients(response.body.clients || []);
        setClientsTotalPages(response.body.pages || 0);
      } else {
        console.error("Erro ao buscar pacientes:", response.status);
        setClients([]);
        setClientsTotalPages(0);
      }
    } catch (error) {
      console.error("Erro no GetClients:", error);
      setClients([]);
      setClientsTotalPages(0);
    } finally {
      setIsGettingClients(false);
    }
  }, [GetAPI, clientsFilters]); // Depende do filtro

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
