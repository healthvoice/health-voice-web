"use client";

import { useCallback } from "react";
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

export type UserActionType =
  | "RECORDING_STARTED"
  | "RECORDING_CANCELLED"
  | "RECORDING_COMPLETED"
  | "TRANSCRIPTION_REQUESTED"
  | "PROMPT_SELECTED"
  | "SUMMARY_EDITED"
  | "PDF_EXPORTED"
  | "SCREEN_VIEWED"
  | "TAB_CLICKED"
  | "CONVERSATION_STARTED"
  | "BUTTON_CLICKED"
  | "LOGIN_COMPLETED"
  | "FORM_FIELD_DEBOUNCED"
  | "MODAL_OPENED"
  | "MODAL_CLOSED"
  | "CLIENT_SELECTED"
  | "CLIENT_CREATED"
  | "CHECKOUT_OPENED"
  | "CHECKOUT_PLAN_SELECTED"
  | "CHECKOUT_BILLING_CYCLE_CHANGED"
  | "CHECKOUT_CONTINUED_TO_PAYMENT"
  | "CHECKOUT_PAYMENT_ATTEMPTED"
  | "CHECKOUT_PAYMENT_SUCCESS"
  | "CHECKOUT_PAYMENT_FAILED"
  | "CHECKOUT_PIX_GENERATED"
  | "CHECKOUT_PIX_COPIED"
  | "CHECKOUT_COUPON_APPLIED"
  | "CHECKOUT_COUPON_FAILED"
  | "CHECKOUT_PAYMENT_TAB_CHANGED"
  | "CHECKOUT_FORM_ABANDONED"
  | "CART_ABANDONMENT_RECOVERY_SENT";

interface TrackActionOptions {
  actionType: UserActionType;
  metadata?: Record<string, unknown>;
  recordingId?: string;
}

/**
 * Hook para rastrear ações customizadas do usuário
 * 
 * @example
 * const trackAction = useActionTracking();
 * 
 * // Rastrear seleção de plano
 * trackAction({
 *   actionType: "CHECKOUT_PLAN_SELECTED",
 *   metadata: { planId: "plan-123", billingCycle: "MONTHLY" }
 * });
 */
export function useActionTracking() {
  const { PostAPI } = useApiContext();
  const { sessionId } = useTrackingContext();

  const trackAction = useCallback(
    async (options: TrackActionOptions) => {
      if (!sessionId) {
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️ [Tracking] Tentativa de rastrear ação sem sessionId");
        }
        return;
      }

      const { actionType, metadata = {}, recordingId } = options;

      if (process.env.NODE_ENV === "development") {
        console.log("📊 [Tracking] Rastreando ação:", {
          actionType,
          metadata,
          timestamp: new Date().toISOString(),
        });
      }

      try {
        const payload: Record<string, unknown> = {
          actionType,
          platform: Platform.WEB,
          metadata,
        };

        if (recordingId) {
          payload.recordingId = recordingId;
        }

        const response = await PostAPI("/analytics/actions", payload, true);

        if (response.status === 200 || response.status === 201) {
          if (process.env.NODE_ENV === "development") {
            console.log("✅ [Tracking] Ação rastreada com sucesso:", actionType);
          }
        } else {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "⚠️ [Tracking] Falha ao rastrear ação:",
              actionType,
              response.status
            );
          }
        }
      } catch (error) {
        // Erro silencioso - não deve quebrar a aplicação
        if (process.env.NODE_ENV === "development") {
          console.error("❌ [Tracking] Erro ao rastrear ação:", error);
        }
      }
    },
    [PostAPI, sessionId]
  );

  return trackAction;
}
