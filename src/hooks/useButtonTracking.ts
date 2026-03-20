"use client";

import { useEffect } from "react";
import { useApiContext } from "@/context/ApiContext";
import { useTrackingContext } from "@/context/TrackingContext";
import { Platform } from "@/services/analyticsService";

interface PostAPIFunction {
  (
    url: string,
    data: unknown,
    auth: boolean,
  ): Promise<{ status: number; body: any }>;
}

export function useButtonTracking() {
  const { PostAPI } = useApiContext();
  const { sessionId } = useTrackingContext();

  useEffect(() => {
    if (!sessionId) return; // Não rastrear se não tiver sessionId

    const handleClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Buscar data-tracking-id no elemento clicado ou em seus pais
      let element: HTMLElement | null = target;
      let buttonId: string | null = null;
      let destination: string | null = null;

      while (element && !buttonId) {
        buttonId = element.getAttribute("data-tracking-id");
        if (!destination) {
          destination = element.getAttribute("data-tracking-destination");
        }
        if (buttonId) break;
        element = element.parentElement;
      }

      if (!buttonId) return; // Não tem tracking-id, ignorar

      if (process.env.NODE_ENV === "development") {
        console.log("🖱️ [Tracking] Botão clicado:", {
          buttonId,
          destination,
          timestamp: new Date().toISOString(),
        });
      }

      try {
        const metadata: Record<string, unknown> = {
          buttonId,
          timestamp: new Date().toISOString(),
        };

        if (destination) {
          metadata.destination = destination;
        }

        const response = await PostAPI(
          "/analytics/actions",
          {
            actionType: "BUTTON_CLICKED",
            platform: Platform.WEB,
            metadata,
          },
          true
        );

        if (response.status === 200 || response.status === 201) {
          if (process.env.NODE_ENV === "development") {
            console.log("✅ [Tracking] Clique em botão rastreado com sucesso");
          }
        } else {
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ [Tracking] Falha ao rastrear clique:", response.status);
          }
        }
      } catch (error) {
        // Erro silencioso - não deve quebrar a aplicação
        if (process.env.NODE_ENV === "development") {
          console.error("❌ [Tracking] Erro ao rastrear clique:", error);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [PostAPI, sessionId]);
}
