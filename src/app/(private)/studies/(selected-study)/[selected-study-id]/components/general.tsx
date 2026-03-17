"use client";

import { PendingRecordingEmptyState } from "@/components/pending-recording-empty-state";
import { useGeneralContext } from "@/context/GeneralContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function General() {
  const { selectedRecording } = useGeneralContext();

  if (!selectedRecording) {
    return null;
  }

  if (selectedRecording.summary) {
    return (
      <div className="prose prose-sm prose-p:my-2 prose-strong:font-semibold prose-strong:text-gray-900 w-full max-w-none text-left">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {selectedRecording.summary}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <PendingRecordingEmptyState variant="resumo" className="min-h-[320px]" />
  );
}
