"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

interface TrackingContextValue {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
}

const TrackingContext = createContext<TrackingContextValue | undefined>(undefined);

export function useTrackingContext() {
  const ctx = useContext(TrackingContext);
  if (!ctx) {
    throw new Error("useTrackingContext deve ser usado dentro de <TrackingProvider>");
  }
  return ctx;
}

export function TrackingProvider({ children }: PropsWithChildren) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Persistir sessionId no localStorage para sobreviver a refresh
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tracking_session_id");
      if (stored) {
        setSessionId(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (sessionId && typeof window !== "undefined") {
      localStorage.setItem("tracking_session_id", sessionId);
    } else if (sessionId === null && typeof window !== "undefined") {
      localStorage.removeItem("tracking_session_id");
    }
  }, [sessionId]);

  return (
    <TrackingContext.Provider value={{ sessionId, setSessionId }}>
      {children}
    </TrackingContext.Provider>
  );
}
