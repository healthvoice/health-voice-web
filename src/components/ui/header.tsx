"use client";
import { useSession } from "@/context/auth";
import { useGeneralContext } from "@/context/GeneralContext";
import { useSidebar } from "@/store";
import { cn } from "@/utils/cn";
import { Bell, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import moment from "moment";
import { useCookies } from "next-client-cookies";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AudioRecorder } from "../audio-recorder/audio-recorder";
import { ProfileModal } from "../profile/profile-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./blocks/dropdown-menu";
import {
  ContactsIcon,
  HomeIcon,
  LogoutIcon,
  NotesIcon,
  OtherIcon,
  SettingsIcon,
  SmartphoneIcon,
  StudyIcon,
  SupportIcon,
  TranscriptionIcon,
} from "./custom-icons";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export function Header() {
  const { selectedClient, selectedRecording } = useGeneralContext();
  const { mobileMenu, setMobileMenu } = useSidebar();
  const { clearSession, profile } = useSession();
  const pathname = usePathname();
  const cookies = useCookies();
  const router = useRouter();

  const [appUrl, setAppUrl] = useState<string>("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    if (pathname.includes("/clients")) {
      const pathSegments = pathname.split("/").filter(Boolean);

      breadcrumbs.push({
        label: "Pacientes",
        href: "/clients",
        isActive: pathname === "/clients",
      });

      if (pathSegments.length >= 2 && pathSegments[1]) {
        const clientId = pathSegments[1];

        breadcrumbs.push({
          label: selectedClient?.name || "Carregando...",
          href: `/clients/${clientId}`,
          isActive: pathname === `/clients/${clientId}`,
        });

        if (pathSegments.length >= 3 && pathSegments[2]) {
          const recordingId = pathSegments[2];

          breadcrumbs.push({
            label: selectedRecording?.name || "Consulta",
            href: `/clients/${clientId}/${recordingId}`,
            isActive: true,
          });
        }
      }
    } else if (pathname.includes("/reminders")) {
      const pathSegments = pathname.split("/").filter(Boolean);

      breadcrumbs.push({
        label: "Lembretes",
        href: "/reminders",
        isActive: pathname === "/reminders",
      });

      if (pathSegments.length >= 2 && pathSegments[1]) {
        const reminderId = pathSegments[1];

        breadcrumbs.push({
          label: selectedRecording?.name || "Carregando...",
          href: `/${reminderId}`,
          isActive: true,
        });
      }
    } else if (pathname.includes("/studies")) {
      const pathSegments = pathname.split("/").filter(Boolean);

      breadcrumbs.push({
        label: "Estudos",
        href: "/studies",
        isActive: pathname === "/studies",
      });

      if (pathSegments.length >= 2 && pathSegments[1]) {
        const studyId = pathSegments[1];

        breadcrumbs.push({
          label: selectedRecording?.name || "Carregando...",
          href: `/${studyId}`,
          isActive: true,
        });
      }
    } else if (pathname.includes("/others")) {
      const pathSegments = pathname.split("/").filter(Boolean);

      breadcrumbs.push({
        label: "Outros",
        href: "/others",
        isActive: true,
      });

      if (pathSegments.length >= 2 && pathSegments[1]) {
        const studyId = pathSegments[1];

        breadcrumbs.push({
          label: selectedRecording?.name || "Carregando...",
          href: `/${studyId}`,
          isActive: pathname === `/others/${studyId}`,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = useMemo(
    () => generateBreadcrumbs(),
    [pathname, selectedClient?.name, selectedRecording?.name],
  );

  const BreadcrumbItem = ({
    item,
    isLast,
  }: {
    item: BreadcrumbItem;
    isLast: boolean;
  }) => (
    <>
      {item.href && !item.isActive ? (
        <span
          className="cursor-pointer transition-colors hover:text-white"
          onClick={() => router.push(item.href!)}
        >
          {item.label}
        </span>
      ) : (
        <span className={item.isActive ? "text-white" : ""}>{item.label}</span>
      )}
      {!isLast && <span className="mx-1">{">"}</span>}
    </>
  );

  function isIOSDevice(): boolean {
    if (typeof window === "undefined") return false;

    const userAgent = window.navigator.userAgent;

    return (
      /iPad|iPhone|iPod|Mac|Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent) &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !(window as any).MSStream
    );
  }

  useEffect(() => {
    if (isIOSDevice()) {
      setAppUrl("https://apps.apple.com/br/app/health-voice/id6754345791");
    } else {
      setAppUrl(
        "https://play.google.com/store/apps/details?id=com.executivos.healthvoice",
      );
    }
  }, []);

  return (
    <header className="bg-primary z-10 flex w-full flex-col gap-4 px-4 pb-20 text-white">
      <ProfileModal
        isOpen={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
      <div className="mx-auto flex w-[90%] items-center justify-between py-6">
        <Image
          src="/logos/logo2.png"
          alt=""
          quality={100}
          width={1250}
          height={500}
          className="h-8 w-max cursor-pointer object-contain"
          onClick={() => router.push("/")}
        />

        <div className="flex h-max items-center gap-2">
          <div className="hidden items-center gap-2 xl:flex">
            <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
              <Bell className="h-4" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="group flex h-10 cursor-pointer items-center gap-2 rounded-full bg-white/10 px-1 pr-3 text-white transition-all duration-200 hover:bg-white/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-sm font-semibold text-white shadow-inner">
                    {profile?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span className="max-w-[120px] truncate text-sm font-medium">
                    {profile?.name?.split(" ")[0] || "Menu"}
                  </span>
                  <ChevronRight className="h-4 w-4 rotate-90 opacity-60 transition-transform group-data-[state=open]:rotate-[270deg]" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 overflow-hidden rounded-2xl border-none bg-white p-0 shadow-2xl shadow-gray-300/50"
              >
                {/* User Info Header */}
                <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white backdrop-blur-sm">
                      {profile?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">
                        {profile?.name || "Usuário"}
                      </p>
                      <p className="truncate text-xs text-white/70">
                        {profile?.email || ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setIsProfileModalOpen(true);
                    }}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-blue-50 focus:bg-blue-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white transition-colors group-hover:bg-blue-500 group-hover:text-white">
                      <SettingsIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">
                        Gerenciar Perfil
                      </span>
                      <span className="text-xs text-gray-400">
                        Edite suas informações
                      </span>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() => window.open(appUrl, "_blank")}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-green-50 focus:bg-green-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white transition-colors group-hover:bg-green-500 group-hover:text-white">
                      <SmartphoneIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">
                        Acessar Aplicativo
                      </span>
                      <span className="text-xs text-gray-400">
                        Baixe o app mobile
                      </span>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() =>
                      window.open("https://wa.me/5541997819114", "_blank")
                    }
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-emerald-50 focus:bg-emerald-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                      <SupportIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">
                        Falar com Suporte
                      </span>
                      <span className="text-xs text-gray-400">
                        WhatsApp disponível
                      </span>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                  </DropdownMenuItem>

                  {/* Separator */}
                  <div className="my-2 h-px bg-gray-100" />

                  <DropdownMenuItem
                    onSelect={() => {
                      cookies.remove(
                        process.env.NEXT_PUBLIC_USER_TOKEN as string,
                      );
                      clearSession();
                      router.push("/login");
                    }}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-red-50 focus:bg-red-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 transition-colors group-hover:bg-red-500 group-hover:text-white">
                      <LogoutIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">
                        Sair da Conta
                      </span>
                      <span className="text-xs text-gray-400">
                        Encerrar sessão
                      </span>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="hover:bg-primary-100 hover:text-primary relative h-6 w-6 xl:hidden"
          >
            <Menu />
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-[90%] flex-col gap-1 md:gap-4">
        <div className="flex flex-col items-start gap-2 text-xl md:flex-row md:items-center">
          <span>Bem vindo(a),</span>
          <span className="font-semibold">{profile?.name}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-white/50">
          {breadcrumbs.map((breadcrumb, index) => (
            <BreadcrumbItem
              key={`${breadcrumb.label}-${index}`}
              item={breadcrumb}
              isLast={index === breadcrumbs.length - 1}
            />
          ))}
        </div>

        <div className="flex w-full items-center justify-between overflow-x-scroll pb-4 md:overflow-x-hidden">
          {pathname.includes("/clients") &&
          pathname.split("/").filter(Boolean).length >= 3 ? (
            <div className="flex h-8 w-full flex-col items-center gap-4 md:flex-row md:justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/clients")}
                  className="hidden h-8 w-max cursor-pointer items-center gap-2 rounded-md border border-white/10 px-4 text-white/50 transition hover:border-white/50 hover:text-white md:flex"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="font-semibold">Voltar</span>
                </button>
                <div className="flex h-8 items-center">
                  <span
                    className={cn(
                      "h-full w-max cursor-pointer border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                      !pathname.includes("/chat") &&
                        !pathname.includes("/transcription")
                        ? "border-b-white"
                        : "border-b-white/10 text-white/50",
                    )}
                    onClick={() =>
                      router.push(
                        `/clients/${selectedClient?.id}/${selectedRecording?.id}`,
                      )
                    }
                  >
                    Visão Geral
                  </span>
                  <span
                    className={cn(
                      "h-full w-max cursor-pointer border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                      pathname.includes("/chat")
                        ? "border-b-white"
                        : "border-b-white/10 text-white/50",
                    )}
                    onClick={() =>
                      router.push(
                        `/clients/${selectedClient?.id}/${selectedRecording?.id}/chat`,
                      )
                    }
                  >
                    Conversar
                  </span>
                  <span
                    className={cn(
                      "h-full w-max cursor-pointer border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                      pathname.includes("/transcription")
                        ? "border-b-white"
                        : "border-b-white/10 text-white/50",
                    )}
                    onClick={() =>
                      router.push(
                        `/clients/${selectedClient?.id}/${selectedRecording?.id}/transcription`,
                      )
                    }
                  >
                    Transcrição
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <div className="flex items-center gap-1">
                  <Image
                    src="/icons/user.svg"
                    alt=""
                    width={100}
                    height={100}
                    className="h-4 w-max fill-white object-contain text-white"
                  />
                  <span>{selectedClient?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Image
                    src="/icons/calendar.svg"
                    alt=""
                    width={100}
                    height={100}
                    className="h-4 w-max fill-white object-contain text-white"
                  />
                  <span>
                    {moment(selectedRecording?.createdAt).format(
                      "DD/MM/YYYY - HH:mm",
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Image
                    src="/icons/clock.svg"
                    alt=""
                    width={100}
                    height={100}
                    className="h-4 w-max fill-white object-contain text-white"
                  />
                  <span>{selectedRecording?.duration}</span>
                </div>
              </div>
            </div>
          ) : pathname.includes("/reminders") &&
            pathname.split("/").filter(Boolean).length >= 2 ? (
            <div className="flex h-8 w-full flex-col items-center gap-4 md:flex-row md:justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/reminders")}
                  className="hidden h-8 w-max cursor-pointer items-center gap-2 rounded-md border border-white/10 px-4 text-white/50 transition hover:border-white/50 hover:text-white md:flex"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="font-semibold">Voltar</span>
                </button>
                <div className="flex h-8 items-center">
                  <span
                    className={cn(
                      "h-full w-max cursor-pointer border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                      !pathname.includes("/chat") &&
                        !pathname.includes("/transcription")
                        ? "border-b-white"
                        : "border-b-white/10 text-white/50",
                    )}
                    onClick={() =>
                      router.push(`/reminders/${selectedRecording?.id}`)
                    }
                  >
                    Visão Geral
                  </span>
                  <span
                    className={cn(
                      "h-full w-max cursor-pointer border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                      pathname.includes("/chat")
                        ? "border-b-white"
                        : "border-b-white/10 text-white/50",
                    )}
                    onClick={() =>
                      router.push(`/reminders/${selectedRecording?.id}/chat`)
                    }
                  >
                    Conversar
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <div className="flex items-center gap-1">
                  <Image
                    src="/icons/calendar.svg"
                    alt=""
                    width={100}
                    height={100}
                    className="h-4 w-max fill-white object-contain text-white"
                  />
                  <span>
                    {moment(selectedRecording?.createdAt).format(
                      "DD/MM/YYYY - HH:mm",
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Image
                    src="/icons/clock.svg"
                    alt=""
                    width={100}
                    height={100}
                    className="h-4 w-max fill-white object-contain text-white"
                  />
                  <span>{selectedRecording?.duration}</span>
                </div>
              </div>
            </div>
          ) : pathname.includes("/studies") &&
            pathname.split("/").filter(Boolean).length >= 2 ? (
            <div className="flex h-8 w-full flex-col items-center gap-4 md:flex-row md:justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/studies")}
                  className="hidden h-8 w-max cursor-pointer items-center gap-2 rounded-md border border-white/10 px-4 text-white/50 transition hover:border-white/50 hover:text-white md:flex"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="font-semibold">Voltar</span>
                </button>
                <div className="flex h-8 items-center">
                  <span
                    className={cn(
                      "h-full w-max cursor-pointer border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                      !pathname.includes("/chat") &&
                        !pathname.includes("/transcription")
                        ? "border-b-white"
                        : "border-b-white/10 text-white/50",
                    )}
                    onClick={() =>
                      router.push(`/studies/${selectedRecording?.id}`)
                    }
                  >
                    Visão Geral
                  </span>
                  <span
                    className={cn(
                      "h-full w-max cursor-pointer border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                      pathname.includes("/chat")
                        ? "border-b-white"
                        : "border-b-white/10 text-white/50",
                    )}
                    onClick={() =>
                      router.push(`/studies/${selectedRecording?.id}/chat`)
                    }
                  >
                    Conversar
                  </span>
                  <span
                    className={cn(
                      "h-full w-max cursor-pointer border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                      pathname.includes("/transcription")
                        ? "border-b-white"
                        : "border-b-white/10 text-white/50",
                    )}
                    onClick={() =>
                      router.push(
                        `/studies/${selectedRecording?.id}/transcription`,
                      )
                    }
                  >
                    Transcrição
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <div className="flex items-center gap-1">
                  <Image
                    src="/icons/calendar.svg"
                    alt=""
                    width={100}
                    height={100}
                    className="h-4 w-max fill-white object-contain text-white"
                  />
                  <span>
                    {moment(selectedRecording?.createdAt).format(
                      "DD/MM/YYYY - HH:mm",
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Image
                    src="/icons/clock.svg"
                    alt=""
                    width={100}
                    height={100}
                    className="h-4 w-max fill-white object-contain text-white"
                  />
                  <span>{selectedRecording?.duration}</span>
                </div>
              </div>
            </div>
          ) : pathname.includes("/others") &&
            pathname.split("/").filter(Boolean).length >= 2 ? (
            <div className="flex h-8 w-full flex-col items-center gap-4 md:flex-row md:justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/others")}
                  className="hidden h-8 w-max cursor-pointer items-center gap-2 rounded-md border border-white/10 px-4 text-white/50 transition hover:border-white/50 hover:text-white md:flex"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="font-semibold">Voltar</span>
                </button>
                <div className="flex h-8 items-center">
                  <span
                    className={cn(
                      "h-full w-max cursor-pointer border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                      !pathname.includes("/chat") &&
                        !pathname.includes("/transcription")
                        ? "border-b-white"
                        : "border-b-white/10 text-white/50",
                    )}
                    onClick={() =>
                      router.push(`/others/${selectedRecording?.id}`)
                    }
                  >
                    Visão Geral
                  </span>
                  <span
                    className={cn(
                      "h-full w-max cursor-pointer border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                      pathname.includes("/chat")
                        ? "border-b-white"
                        : "border-b-white/10 text-white/50",
                    )}
                    onClick={() =>
                      router.push(`/others/${selectedRecording?.id}/chat`)
                    }
                  >
                    Conversar
                  </span>
                  <span
                    className={cn(
                      "h-full w-max cursor-pointer border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                      pathname.includes("/transcription")
                        ? "border-b-white"
                        : "border-b-white/10 text-white/50",
                    )}
                    onClick={() =>
                      router.push(
                        `/others/${selectedRecording?.id}/transcription`,
                      )
                    }
                  >
                    Transcrição
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <div className="flex items-center gap-1">
                  <Image
                    src="/icons/calendar.svg"
                    alt=""
                    width={100}
                    height={100}
                    className="h-4 w-max fill-white object-contain text-white"
                  />
                  <span>
                    {moment(selectedRecording?.createdAt).format(
                      "DD/MM/YYYY - HH:mm",
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Image
                    src="/icons/clock.svg"
                    alt=""
                    width={100}
                    height={100}
                    className="h-4 w-max fill-white object-contain text-white"
                  />
                  <span>{selectedRecording?.duration}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-row items-start justify-between md:items-center">
              <div className="flex h-8 items-center gap-4">
                <span
                  className={cn(
                    "flex h-full w-max cursor-pointer items-center gap-2 border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                    pathname === "/"
                      ? "border-b-white"
                      : "border-b-white/10 text-white/50",
                  )}
                  onClick={() => router.push("/")}
                >
                  <HomeIcon />
                  Início
                </span>
                <span
                  className={cn(
                    "flex h-full w-max cursor-pointer items-center gap-2 border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                    pathname === "/recordings"
                      ? "border-b-white"
                      : "border-b-white/10 text-white/50",
                  )}
                  onClick={() => router.push("/recordings")}
                >
                  <TranscriptionIcon />
                  Ultimas Gravações
                </span>
                <span
                  className={cn(
                    "flex h-full cursor-pointer items-center gap-2 border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                    pathname === "/reminders"
                      ? "border-b-white"
                      : "border-b-white/10 text-white/50",
                  )}
                  onClick={() => router.push("/reminders")}
                >
                  <NotesIcon />
                  Lembretes
                </span>
                <span
                  className={cn(
                    "flex h-full cursor-pointer items-center gap-2 border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                    pathname.startsWith("/clients")
                      ? "border-b-white"
                      : "border-b-white/10 text-white/50",
                  )}
                  onClick={() => router.push("/clients")}
                >
                  <ContactsIcon />
                  Pacientes
                </span>
                <span
                  className={cn(
                    "flex h-full cursor-pointer items-center gap-2 border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                    pathname === "/studies"
                      ? "border-b-white"
                      : "border-b-white/10 text-white/50",
                  )}
                  onClick={() => router.push("/studies")}
                >
                  <StudyIcon />
                  Estudos
                </span>
                <span
                  className={cn(
                    "flex h-full cursor-pointer items-center gap-2 border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                    pathname === "/others"
                      ? "border-b-white"
                      : "border-b-white/10 text-white/50",
                  )}
                  onClick={() => router.push("/others")}
                >
                  <OtherIcon />
                  Outros
                </span>
                <span
                  className={cn(
                    "flex h-full cursor-pointer items-center gap-2 border-b px-4 transition duration-150 hover:border-b-white hover:text-white",
                    pathname === "/chat-business"
                      ? "border-b-white"
                      : "border-b-white/10 text-white/50",
                  )}
                  onClick={() => router.push("/chat-business")}
                >
                  <OtherIcon />
                  Chat Business
                </span>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <AudioRecorder buttonClassName="bg-white/10 hover:bg-white/20" />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 md:hidden">
          <AudioRecorder buttonClassName="bg-white/50 hover:bg-white/20" />
        </div>
      </div>
    </header>
  );
}
