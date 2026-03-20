// context/auth.tsx
"use client";
import React, {
    PropsWithChildren,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { endSession, startSession } from "../services/analyticsService";
import { useApiContext } from "./ApiContext";
import { useTrackingContext } from "./TrackingContext";

const ACCESS_TOKEN_COOKIE = "hv_access_token";

export interface User {
  id: string;
  email: string;
  name: string;
  cpfCnpj?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  postalCode?: string | null;
  mobilePhone?: string | null;
}

interface SessionContextValue {
  profile: User | null;
  setProfile: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  availableRecording: number;
  totalRecording: number;
  isTrial: boolean;
  availabilityLoaded: boolean;
  handleGetProfile: (forceRefresh?: boolean) => Promise<void>;
  handleGetAvailableRecording: () => Promise<void>;
  checkSession: () => boolean;
  clearSession: () => Promise<void>;
  forceSignOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx)
    throw new Error("useSession deve ser usado dentro de <SessionProvider>");
  return ctx;
}

/**
 * Verifica se existe o cookie hv_access_token (client-side).
 */
function hasAccessToken(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(ACCESS_TOKEN_COOKIE + "=");
}

export function SessionProvider({ children }: PropsWithChildren) {
  const { GetAPI, PostAPI } = useApiContext();
  const { sessionId, setSessionId } = useTrackingContext();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<User | null>(null);
  const [availableRecording, setAvailableRecording] = useState(0);
  const [totalRecording, setTotalRecording] = useState(0);
  const [isTrial, setIsTrial] = useState(false);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);

  const isLoadingProfile = useRef(false);

  /**
   * Verifica se a sessão está ativa (cookie existe).
   */
  const checkSession = useCallback((): boolean => {
    return hasAccessToken();
  }, []);

  /**
   * Força o logout completo — chama Route Handler que limpa cookies.
   */
  const forceSignOut = useCallback(async () => {
    try {
      // Finalizar sessão de tracking antes de limpar sessionId
      if (sessionId) {
        try {
          await endSession(PostAPI, sessionId);
        } catch (error) {
          // Erros de tracking devem ser silenciosos
          if (process.env.NODE_ENV === "development") {
            console.error("Erro ao finalizar sessão no logout:", error);
          }
        }
      }

      setProfile(null);
      setAvailableRecording(0);
      setTotalRecording(0);
      setIsTrial(false);
      setAvailabilityLoaded(false);
      setSessionId(null); // Limpar sessionId ao fazer logout

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("❌ Erro ao fazer sign out:", error);
    }
  }, [setSessionId, sessionId, PostAPI]);

  /**
   * Busca o perfil do usuário.
   */
  const handleGetProfile = useCallback(
    async (_forceRefresh = false): Promise<void> => {
      if (isLoadingProfile.current) {
        return;
      }

      isLoadingProfile.current = true;
      setLoading(true);

      try {
        if (!hasAccessToken()) {
          setProfile(null);
          return;
        }

        const response = await GetAPI("/user", true);

        if (response.status === 200) {
          setProfile(response.body.profile);

          // Iniciar tracking de sessão após sucesso na busca do perfil
          // ⚠️ CRÍTICO: Verificar se sessionId já existe antes de criar nova sessão
          // Isso previne criação de sessões duplicadas
          if (!sessionId) {
            try {
              const newSessionId = await startSession(PostAPI);
              if (newSessionId) {
                setSessionId(newSessionId);
              }
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.error("Erro ao iniciar sessão de analytics:", error);
              }
            }
          }
          // Se sessionId já existe, não fazer nada - reutilizar sessão existente
        } else if (response.status === 401) {
          // Token expirado ou inválido — o interceptor já tentou refresh
          // Se chegou aqui com 401, o refresh falhou
          setProfile(null);
          await forceSignOut();
        } else {
          console.error("❌ Erro ao buscar perfil:", response.status);
          setProfile(null);
        }
      } catch (error) {
        console.error("❌ Erro no handleGetProfile:", error);
        setProfile(null);
      } finally {
        setLoading(false);
        isLoadingProfile.current = false;
      }
    },
    [GetAPI, PostAPI, forceSignOut, setSessionId, sessionId],
  );

  /**
   * Busca gravações disponíveis.
   */
  const handleGetAvailableRecording = useCallback(async () => {
    try {
      const response = await GetAPI("/signature/available-recording", true);
      if (response.status === 200) {
        setAvailableRecording(response.body.available);
        setTotalRecording(response.body.total);
        setIsTrial(response.body.isTrial ?? false);
      } else {
        setAvailableRecording(0);
        setTotalRecording(0);
        setIsTrial(false);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar gravações:", error);
      setAvailableRecording(0);
      setTotalRecording(0);
      setIsTrial(false);
    } finally {
      setAvailabilityLoaded(true);
    }
  }, [GetAPI]);

  /**
   * Limpa a sessão local.
   */
  const clearSession = useCallback(async () => {
    await forceSignOut();
  }, [forceSignOut]);

  /**
   * Inicialização do provider.
   */
  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      if (!mounted) return;

      try {
        if (hasAccessToken()) {
          await Promise.all([
            handleGetProfile(),
            handleGetAvailableRecording(),
          ]);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Erro na inicialização:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Pequeno delay para garantir que cookies estejam disponíveis
    const initTimeout = setTimeout(() => {
      initializeSession();
    }, 50);

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{
        handleGetProfile,
        loading,
        profile,
        setProfile,
        availableRecording,
        handleGetAvailableRecording,
        totalRecording,
        isTrial,
        availabilityLoaded,
        checkSession,
        clearSession,
        forceSignOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
