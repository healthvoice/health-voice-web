"use client";

import { RequestTranscription } from "@/components/ui/request-transcription";
import { useGeneralContext } from "@/context/GeneralContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function General() {
  const { selectedRecording } = useGeneralContext();

  return (
    <div className="prose prose-sm prose-h1:text-center prose-h1:text-primary prose-h2:text-primary w-full max-w-none">
      {selectedRecording?.summary ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {selectedRecording?.summary}
        </ReactMarkdown>
      ) : (
        <>
          <h1 className="text-primary m-auto w-full text-center text-3xl font-extrabold md:w-max">
            Transcrição não disponível
          </h1>
          <RequestTranscription />
        </>
      )}
    </div>
  );
}
