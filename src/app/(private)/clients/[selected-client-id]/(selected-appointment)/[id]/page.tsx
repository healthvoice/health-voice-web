"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { trackAction, UserActionType } from "@/services/actionTrackingService";
import { General } from "./components/general";

export default function SelectedAppointment() {
  const pathname = usePathname();
  const { PostAPI } = useApiContext();
  const { selectedRecording } = useGeneralContext();

  useEffect(() => {
    if (selectedRecording?.id) {
      trackAction(
        {
          actionType: UserActionType.SCREEN_VIEWED,
          recordingId: selectedRecording.id,
          metadata: {
            screen: "summary",
            screenName: "Resumo",
            recordingId: selectedRecording.id,
          },
        },
        PostAPI,
      ).catch((err: { status?: number; body?: unknown }) => {
        console.warn("[Tracking] Falha ao registrar Resumo:", err?.status ?? err, err?.body ?? err);
      });
    }
  }, [selectedRecording?.id, PostAPI, pathname]);

  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
      <General />
    </div>
  );
}
