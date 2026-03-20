"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { trackAction, UserActionType } from "@/services/actionTrackingService";
import { ScrollToTop } from "../components/scroll-to-top";
import { Transcription } from "../components/transcription";

export default function TranscriptionPage() {
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
            screen: "transcription",
            screenName: "Transcrição",
            recordingId: selectedRecording.id,
          },
        },
        PostAPI,
      ).catch((err: { status?: number; body?: unknown }) => {
        console.warn(
          "[Tracking] Falha ao registrar Transcrição:",
          err?.status ?? err,
          err?.body ?? err,
        );
      });
    }
  }, [selectedRecording?.id, PostAPI, pathname]);

  return (
    <div className="flex w-full flex-col gap-4">
      <Transcription />
      <ScrollToTop />
    </div>
  );
}
