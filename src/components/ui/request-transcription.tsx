"use client";

import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export function RequestTranscription() {
  const { selectedRecording, setSelectedRecording } = useGeneralContext();
  const { PutAPI } = useApiContext();
  const [isRequesting, setIsRequesting] = useState(false);

  async function HandleRequestTranscription() {
    if (!selectedRecording) {
      return;
    }
    setIsRequesting(true);
    const request = await PutAPI(
      `/recording/${selectedRecording?.id}`,
      {
        status: "PENDING",
      },
      true,
    );
    if (request.status === 200) {
      toast.success("Solicitação enviada com sucesso!");
      setSelectedRecording({
        ...selectedRecording,
        transcriptionStatus: "PENDING",
      });
      return setIsRequesting(false);
    }
    toast.error("Erro ao solicitar transcrição!");
    setIsRequesting(false);
  }

  return (
    <button
      onClick={HandleRequestTranscription}
      disabled={
        selectedRecording?.transcriptionStatus === "PENDING" || isRequesting
      }
      className={cn(
        "bg-primary absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-white",
        selectedRecording?.transcriptionStatus === "PENDING" &&
          "cursor-wait bg-green-400 opacity-50",
        selectedRecording?.transcriptionStatus === "DONE" && "hidden",
      )}
    >
      {isRequesting ? (
        <>
          <Loader2 className="animate-spin" />
          Transcrevendo...
        </>
      ) : selectedRecording?.transcriptionStatus === "PENDING" ? (
        "Transcrição pendente"
      ) : (
        "Solicitar Transcrição"
      )}
    </button>
  );
}
