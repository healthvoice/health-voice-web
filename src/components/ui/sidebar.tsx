"use client";

import { useGeneralContext } from "@/context/GeneralContext";
import { useSession } from "@/context/auth";
import { useSidebar } from "@/store";
import { cn } from "@/utils/cn";
import { ChevronDown, ChevronRight, Crown, Rocket, Zap } from "lucide-react";
import moment from "moment";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AudioRecorder } from "../audio-recorder/audio-recorder";
import { ProfileModal } from "../profile/profile-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./blocks/dropdown-menu";
import {
  AnalyticsIcon,
  ChatBusinessIcon,
  ContactsIcon,
  HomeIcon,
  LastRecordIcon,
  LogoutIcon,
  NotesIcon,
  OtherIcon,
  SettingsIcon,
  SmartphoneIcon,
  StudyIcon,
  SupportIcon,
} from "./custom-icons";
import { NotificationDropdown } from "./notification-dropdown";

const primaryNav = [
  { href: "/", label: "Início", icon: HomeIcon },
  { href: "/dashboard", label: "Dashboard", icon: AnalyticsIcon },
  { href: "/recordings", label: "Gravações", icon: LastRecordIcon },
  {
    href: "/clients",
    label: "Pacientes",
    icon: ContactsIcon,
    expandable: true,
  },
  { href: "/reminders", label: "Lembretes", icon: NotesIcon },
  { href: "/studies", label: "Estudos", icon: StudyIcon },
  { href: "/others", label: "Outros", icon: OtherIcon },
  { href: "/chat-business", label: "AI Health", icon: ChatBusinessIcon },
];

function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod|Mac|Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent) &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !(window as any).MSStream
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}) {
  // Criar ID de tracking baseado no href
  const trackingId = `sidebar-nav-${href === "/" ? "home" : href.replace("/", "").replace(/\//g, "-")}`;

  return (
    <button
      type="button"
      onClick={onClick}
      data-tracking-id={trackingId}
      data-tracking-destination={href}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-medium transition-all duration-200",
        isActive
          ? "text-primary bg-white shadow-sm shadow-black/5"
          : "hover:text-primary/90 text-white hover:bg-white/[0.8]",
      )}
    >
      <Icon
        className={cn(
          "h-[24px] w-[24px] shrink-0 transition-colors duration-200",
          isActive
            ? "text-primary"
            : "group-hover:text-primary/90 text-white/80",
        )}
      />
      <span className="truncate">{label}</span>
      {isActive && (
        <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-white" />
      )}
    </button>
  );
}

function SidebarUpgradeBanner({
  router,
}: {
  router: ReturnType<typeof useRouter>;
}) {
  const { isTrial, availableRecording, totalRecording, profile } = useSession();

  const isExpired =
    !isTrial && availableRecording === 0 && totalRecording === 0;
  const shouldShow = profile && (isTrial || isExpired);

  if (!shouldShow) return null;

  const isTr = isTrial;
  const Icon = isTr ? Rocket : Crown;
  const badge = isTr ? "TRIAL ATIVO" : "PLANO EXPIRADO";
  const badgeBg = isTr
    ? "bg-sky-400/20 text-sky-200 border-sky-400/30"
    : "bg-red-400/20 text-red-200 border-red-400/30";
  const title = isTr ? "Desbloqueie todo o potencial" : "Renove seu plano";
  const cta = isTr ? "Fazer Upgrade" : "Renovar Agora";

  const used = Math.max(0, totalRecording - availableRecording);
  const total = totalRecording || 1;
  const percentUsed = Math.min(100, Math.round((used / total) * 100));

  return (
    <div className="mt-auto px-1">
      <button
        type="button"
        onClick={() => router.push("/plans")}
        data-tracking-id="sidebar-upgrade-banner"
        data-tracking-destination="/plans"
        className="group relative w-full overflow-hidden rounded-xl border border-white/10 p-3 text-left transition-all duration-300 hover:border-white/20"
        style={{
          background:
            "linear-gradient(135deg, #0b1829 0%, #0d2a50 50%, #0b1829 100%)",
        }}
      >
        {/* Subtle animated glow */}
        <div className="pointer-events-none absolute -top-6 -right-6 h-16 w-16 rounded-full bg-sky-500/10 blur-2xl transition-all duration-500 group-hover:bg-sky-500/20" />

        {/* Badge */}
        <span
          className={cn(
            "mb-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-widest",
            badgeBg,
          )}
        >
          <span className="relative flex h-1 w-1">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
            <span className="relative inline-flex h-1 w-1 rounded-full bg-current" />
          </span>
          {badge}
        </span>

        {/* Barra de progresso do limite diário */}
        {totalRecording > 0 && (
          <div className="mb-2.5">
            <div className="mb-1 flex items-center justify-between gap-1 text-[10px] text-white/60">
              <span>Uso do limite diário</span>
              <span className="font-medium text-white/80">
                {used} / {totalRecording}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  percentUsed >= 100
                    ? "bg-red-400/90"
                    : percentUsed >= 80
                      ? "bg-amber-400/90"
                      : "bg-sky-400/90",
                )}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>
        )}

        {/* Content row */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10">
            <Icon className="h-4 w-4 text-sky-300" />
          </div>
          <p className="flex-1 text-[12px] leading-tight font-medium text-white/80">
            {title}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-white/10 py-2 text-[11px] font-semibold text-white transition-all duration-200 group-hover:bg-white/15">
          <Zap className="h-3 w-3 text-sky-300" />
          {cta}
        </div>

        {/* Bottom gradient line */}
        <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />
      </button>
    </div>
  );
}

export function Sidebar() {
  const { mobileMenu, setMobileMenu } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { clearSession, profile } = useSession();
  const { selectedClient, selectedRecording } = useGeneralContext();
  const [appUrl, setAppUrl] = useState<string>("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [clientsExpanded, setClientsExpanded] = useState(false);

  const isOnClientsFlow =
    pathname === "/clients" || pathname.startsWith("/clients/");
  const hasClientsSteps = Boolean(selectedClient?.id);

  useEffect(() => {
    if (isOnClientsFlow && hasClientsSteps) setClientsExpanded(true);
  }, [isOnClientsFlow, hasClientsSteps]);

  useEffect(() => {
    if (isIOSDevice()) {
      setAppUrl("https://apps.apple.com/br/app/health-voice/id6754345791");
    } else {
      setAppUrl(
        "https://play.google.com/store/apps/details?id=com.executivos.healthvoice",
      );
    }
  }, []);

  const handleNavClick = (href: string) => {
    router.push(href);
    setMobileMenu(false);
  };

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <ProfileModal
        isOpen={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
      <aside
        className={cn(
          "sticky top-0 left-0 z-[9999] flex h-screen min-h-screen w-[260px] shrink-0 flex-col bg-gradient-to-tl from-sky-500 to-blue-600 text-white transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          mobileMenu ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex shrink-0 items-center pt-4 pb-2">
          <button
            type="button"
            onClick={() => handleNavClick("/")}
            data-tracking-id="sidebar-logo-home"
            data-tracking-destination="/"
            className="focus:outline-none"
          >
            <Image
              src="/logos/logo2.png"
              alt="Health Voice"
              width={140}
              height={40}
              className="h-14 w-auto object-contain"
            />
          </button>
        </div>

        {/* CTA */}
        <div className="px-4 pb-1">
          <AudioRecorder
            forceType="CLIENT"
            customLabel="Nova consulta"
            buttonClassName="w-full justify-center flex flex-row gap-2 items-center justify-center py-1 gap-2 bg-white text-primary font-bold text-lg rounded-xl shadow-lg shadow-black/10 hover:bg-white/95 transition-all duration-200"
          />
        </div>

        {/* Navigation */}
        <div className="scrollbar-hide flex flex-1 flex-col overflow-y-auto px-3 pt-4 pb-3">
          {/* Primary */}
          <nav className="flex flex-1 flex-col gap-0.5">
            {primaryNav.map((item) => {
              if (item.href === "/clients" && item.expandable) {
                const active = isActive("/clients");
                const showSubSteps = hasClientsSteps && clientsExpanded;
                return (
                  <div key={item.href} className="flex flex-col">
                    <div
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-medium transition-all duration-200",
                        active
                          ? "text-primary bg-white shadow-sm shadow-black/5"
                          : "hover:text-primary/90 text-white hover:bg-white/[0.8]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleNavClick("/clients")}
                        data-tracking-id="sidebar-nav-clients"
                        data-tracking-destination="/clients"
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <ContactsIcon
                          className={cn(
                            "h-[24px] w-[24px] shrink-0 transition-colors duration-200",
                            active
                              ? "text-primary"
                              : "group-hover:text-primary/90 text-white/80",
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                      {hasClientsSteps && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClientsExpanded((v) => !v);
                          }}
                          data-tracking-id={`sidebar-clients-${clientsExpanded ? "collapse" : "expand"}`}
                          className="shrink-0 rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                          aria-label={clientsExpanded ? "Recolher" : "Expandir"}
                        >
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 transition-transform duration-200",
                              clientsExpanded && "rotate-180",
                            )}
                          />
                        </button>
                      )}
                      {active && (
                        <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-white" />
                      )}
                    </div>

                    {showSubSteps && selectedClient?.id && (
                      <div className="relative mt-1 mb-1 ml-6 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleNavClick(`/clients/${selectedClient.id}`)
                          }
                          data-tracking-id={`sidebar-clients-subitem-${selectedClient.id}`}
                          data-tracking-destination={`/clients/${selectedClient.id}`}
                          className={cn(
                            "flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-all duration-200",
                            pathname === `/clients/${selectedClient.id}`
                              ? "bg-white/10 text-white"
                              : "text-white/50 hover:text-white/80",
                          )}
                        >
                          <span className="truncate">
                            {selectedClient.name}
                          </span>
                        </button>
                        {selectedRecording?.id &&
                          pathname.startsWith(
                            `/clients/${selectedClient.id}/`,
                          ) &&
                          pathname.split("/").filter(Boolean).length >= 3 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleNavClick(
                                  `/clients/${selectedClient.id}/${selectedRecording.id}`,
                                )
                              }
                              data-tracking-id={`sidebar-clients-recording-${selectedRecording.id}`}
                              data-tracking-destination={`/clients/${selectedClient.id}/${selectedRecording.id}`}
                              className={cn(
                                "flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-all duration-200",
                                pathname.includes(
                                  `/clients/${selectedClient.id}/${selectedRecording.id}`,
                                )
                                  ? "bg-white/10 text-white"
                                  : "text-white/50 hover:text-white/80",
                              )}
                            >
                              <span className="truncate">
                                {selectedRecording.name ||
                                  (selectedRecording.createdAt
                                    ? moment(
                                        selectedRecording.createdAt,
                                      ).format("DD/MM/YYYY")
                                    : "Gravação")}
                              </span>
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive(item.href)}
                  onClick={() => handleNavClick(item.href)}
                />
              );
            })}
          </nav>

          {/* Divider */}
          <div className="mx-3 my-3 h-px bg-white/[0.08]" />

          {/* Secondary */}

          {/* Personal recording */}
          {/* <div className="mt-3">
            <AudioRecorder
              forceType="PERSONAL"
              customLabel="Gravação pessoal"
              customSubtitle="Lembretes, estudos, outros"
              buttonClassName="w-full justify-start gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-white/60 hover:bg-white/[0.07] hover:text-white/90 transition-all duration-200"
            />
          </div> */}

          {/* Upgrade Banner (compact) */}
          <SidebarUpgradeBanner router={router} />

          {/* Footer */}
          <div className="mt-auto pt-4">
            <div className="mx-1 mb-3 h-px bg-white/[0.08]" />

            {/* Profile area */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="group flex flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all duration-200 hover:bg-white/[0.07]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/25 to-white/10 text-xs font-semibold text-white ring-1 ring-white/10">
                      {profile?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13px] leading-tight font-medium text-white/90">
                        {profile?.name?.split(" ")[0] || "Menu"}
                      </span>
                      {/* <span className="truncate text-[11px] leading-tight text-white/40">
                        {profile?.email || ""}
                      </span> */}
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30 transition-colors group-hover:text-white/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="right"
                  sideOffset={8}
                  className="w-64 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-0 shadow-xl"
                >
                  <div className="border-b border-neutral-100 px-4 py-3.5">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {profile?.name || "Usuário"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-neutral-400">
                      {profile?.email || ""}
                    </p>
                  </div>
                  <div className="p-1.5">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setIsProfileModalOpen(true);
                      }}
                      data-tracking-id="sidebar-profile-manage"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 focus:bg-neutral-50"
                    >
                      <SettingsIcon className="h-4 w-4 text-neutral-400" />
                      Gerenciar Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => window.open(appUrl, "_blank")}
                      data-tracking-id="sidebar-profile-download-app"
                      data-tracking-destination={appUrl}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 focus:bg-neutral-50"
                    >
                      <SmartphoneIcon className="h-4 w-4 text-neutral-400" />
                      Baixar Aplicativo
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        window.open("https://wa.me/5541997819114", "_blank")
                      }
                      data-tracking-id="sidebar-profile-support"
                      data-tracking-destination="https://wa.me/5541997819114"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 focus:bg-neutral-50"
                    >
                      <SupportIcon className="h-4 w-4 text-neutral-400" />
                      Falar com Suporte
                    </DropdownMenuItem>
                    <div className="mx-2 my-1 h-px bg-neutral-100" />
                    <DropdownMenuItem
                      onSelect={async () => {
                        await clearSession();
                        router.push("/login");
                      }}
                      data-tracking-id="sidebar-profile-logout"
                      data-tracking-destination="/login"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 focus:bg-red-50"
                    >
                      <LogoutIcon className="h-4 w-4" />
                      Sair da Conta
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <NotificationDropdown />
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {mobileMenu && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileMenu(false)}
          data-tracking-id="sidebar-mobile-close"
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
