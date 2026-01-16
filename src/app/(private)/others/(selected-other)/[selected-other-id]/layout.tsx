"use client";

import { useGeneralContext } from "@/context/GeneralContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { selectedRecording } = useGeneralContext();
  const useRouterHook = useRouter();

  useEffect(() => {
    if (!selectedRecording) {
      useRouterHook.push("/others");
    }
  }, [selectedRecording]);

  return <>{children}</>;
}
