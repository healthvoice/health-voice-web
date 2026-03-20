"use client";

import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { ChevronLeft, Sparkles } from "lucide-react";
import moment from "moment";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChatIcon, GeneralVisionIcon, TranscriptionIcon } from "./custom-icons";

export function ContentSubheader() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedClient, selectedRecording } = useGeneralContext();
  const pathSegments = pathname.split("/").filter(Boolean);

  const isClientsRecording =
    pathname.includes("/clients") && pathSegments.length >= 3;
  const reminderIdFromUrl =
    pathname.includes("/reminders") && pathSegments.length >= 2
      ? pathSegments[1]
      : undefined;
  const isStudiesRecording =
    pathname.includes("/studies") && pathSegments.length >= 2;
  const isOthersRecording =
    pathname.includes("/others") && pathSegments.length >= 2;

  const showSubheader =
    isClientsRecording ||
    (pathname.includes("/reminders") && reminderIdFromUrl) ||
    isStudiesRecording ||
    isOthersRecording;

  if (!showSubheader) return null;

  const tabClass = (active: boolean) =>
    cn(
      "flex h-full shrink-0 cursor-pointer items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition duration-150",
      active
        ? "border-primary text-primary"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
    );

  const MetaInfo = () =>
    selectedRecording ? (
      <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-gray-500 md:gap-4">
        {selectedClient && (
          <div className="flex min-w-0 items-center gap-1">
            <Image
              src="/icons/user.svg"
              alt=""
              width={100}
              height={100}
              className="h-4 w-max shrink-0 object-contain text-gray-400"
            />
            <span className="truncate" title={selectedClient.name ?? undefined}>
              {selectedClient.name}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Image
            src="/icons/calendar.svg"
            alt=""
            width={100}
            height={100}
            className="h-4 w-max object-contain text-gray-400"
          />
          <span>
            {moment(selectedRecording.createdAt).format("DD/MM/YYYY - HH:mm")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Image
            src="/icons/clock.svg"
            alt=""
            width={100}
            height={100}
            className="h-4 w-max object-contain text-gray-400"
          />
          <span>{selectedRecording.duration}</span>
        </div>
      </div>
    ) : null;

  if (isClientsRecording) {
    const clientId = selectedClient?.id ?? pathSegments[1];
    const recordingId = selectedRecording?.id ?? pathSegments[2];
    if (!clientId || !recordingId) return null;
    const base = `/clients/${clientId}/${recordingId}`;
    return (
      <div className="flex w-full flex-col gap-4 border-b border-gray-100 bg-white px-4 pt-4 pb-4 lg:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/clients")}
              className="hidden shrink-0 items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <div className="header-tabs-scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex h-9 w-max flex-shrink-0 flex-nowrap items-center gap-1">
                <button
                  type="button"
                  className={tabClass(
                    !pathname.includes("/chat") &&
                      !pathname.includes("/transcription") &&
                      !pathname.includes("/medical-record") &&
                      !pathname.includes("/overview"),
                  )}
                  onClick={() => router.push(base)}
                >
                  <GeneralVisionIcon className="h-4 w-4" />
                  Resumo
                </button>
                <button
                  type="button"
                  className={tabClass(pathname.includes("/overview"))}
                  onClick={() => router.push(`${base}/overview`)}
                >
                  <Sparkles className="h-4 w-4" />
                  Insights
                </button>
                <button
                  type="button"
                  className={tabClass(pathname.includes("/chat"))}
                  onClick={() => router.push(`${base}/chat`)}
                >
                  <ChatIcon className="h-4 w-4" />
                  Conversar
                </button>
                <button
                  type="button"
                  className={tabClass(pathname.includes("/transcription"))}
                  onClick={() => router.push(`${base}/transcription`)}
                >
                  <TranscriptionIcon className="h-4 w-4" />
                  Transcrição
                </button>
                <button
                  type="button"
                  className={tabClass(pathname.includes("/medical-record"))}
                  onClick={() => router.push(`${base}/medical-record`)}
                >
                  <TranscriptionIcon className="h-4 w-4" />
                  Prontuário Médico1
                </button>
              </div>
            </div>
          </div>
          <MetaInfo />
        </div>
      </div>
    );
  }

  if (pathname.includes("/reminders") && reminderIdFromUrl) {
    return (
      <div className="flex w-full flex-col gap-4 border-b border-gray-100 bg-white px-4 pt-4 pb-4 lg:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/reminders")}
              className="hidden shrink-0 items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <div className="header-tabs-scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex h-9 w-max flex-shrink-0 flex-nowrap items-center gap-1">
                <button
                  type="button"
                  className={tabClass(
                    !pathname.includes("/chat") &&
                      !pathname.includes("/transcription"),
                  )}
                  onClick={() => router.push(`/reminders/${reminderIdFromUrl}`)}
                >
                  <Sparkles className="h-4 w-4" />
                  Insights
                </button>
                <button
                  type="button"
                  className={tabClass(pathname.includes("/chat"))}
                  onClick={() =>
                    router.push(`/reminders/${reminderIdFromUrl}/chat`)
                  }
                >
                  <ChatIcon className="h-4 w-4" />
                  Conversar
                </button>
              </div>
            </div>
          </div>
          <MetaInfo />
        </div>
      </div>
    );
  }

  if (isStudiesRecording) {
    const recordingId = selectedRecording?.id ?? pathSegments[1];
    if (!recordingId) return null;
    const base = `/studies/${recordingId}`;
    return (
      <div className="flex w-full flex-col gap-4 border-b border-gray-100 bg-white px-4 pt-4 pb-4 lg:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/studies")}
              className="hidden shrink-0 items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <div className="header-tabs-scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex h-9 w-max flex-shrink-0 flex-nowrap items-center gap-1">
                <button
                  type="button"
                  className={tabClass(
                    !pathname.includes("/chat") &&
                      !pathname.includes("/transcription") &&
                      !pathname.includes("/overview"),
                  )}
                  onClick={() => router.push(base)}
                >
                  <GeneralVisionIcon className="h-4 w-4" />
                  Resumo
                </button>
                <button
                  type="button"
                  className={tabClass(pathname.includes("/overview"))}
                  onClick={() => router.push(`${base}/overview`)}
                >
                  <Sparkles className="h-4 w-4" />
                  Insights
                </button>
                <button
                  type="button"
                  className={tabClass(pathname.includes("/chat"))}
                  onClick={() => router.push(`${base}/chat`)}
                >
                  <ChatIcon className="h-4 w-4" />
                  Conversar
                </button>
                <button
                  type="button"
                  className={tabClass(pathname.includes("/transcription"))}
                  onClick={() => router.push(`${base}/transcription`)}
                >
                  <TranscriptionIcon className="h-4 w-4" />
                  Transcrição
                </button>
              </div>
            </div>
          </div>
          <MetaInfo />
        </div>
      </div>
    );
  }

  if (isOthersRecording) {
    const recordingId = selectedRecording?.id ?? pathSegments[1];
    if (!recordingId) return null;
    const base = `/others/${recordingId}`;
    return (
      <div className="flex w-full flex-col gap-4 border-b border-gray-100 bg-white px-4 pt-4 pb-4 lg:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/others")}
              className="hidden shrink-0 items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <div className="header-tabs-scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex h-9 w-max flex-shrink-0 flex-nowrap items-center gap-1">
                <button
                  type="button"
                  className={tabClass(
                    !pathname.includes("/chat") &&
                      !pathname.includes("/transcription") &&
                      !pathname.includes("/overview"),
                  )}
                  onClick={() => router.push(base)}
                >
                  <GeneralVisionIcon className="h-4 w-4" />
                  Resumo
                </button>
                <button
                  type="button"
                  className={tabClass(pathname.includes("/overview"))}
                  onClick={() => router.push(`${base}/overview`)}
                >
                  <Sparkles className="h-4 w-4" />
                  Insights
                </button>
                <button
                  type="button"
                  className={tabClass(pathname.includes("/chat"))}
                  onClick={() => router.push(`${base}/chat`)}
                >
                  <ChatIcon className="h-4 w-4" />
                  Conversar
                </button>
                <button
                  type="button"
                  className={tabClass(pathname.includes("/transcription"))}
                  onClick={() => router.push(`${base}/transcription`)}
                >
                  <TranscriptionIcon className="h-4 w-4" />
                  Transcrição
                </button>
              </div>
            </div>
          </div>
          <MetaInfo />
        </div>
      </div>
    );
  }

  return null;
}
