// "use client";

// import { useApiContext } from "@/context/ApiContext";
// import { useGeneralContext } from "@/context/GeneralContext";
// import { useSession } from "@/context/auth";
// import { TOUR_ENABLED, useRecordingTour } from "@/context/RecordingTourContext";
// import { useGeolocation } from "@/hooks/useGeolocation";
// import { startSession } from "@/services/analyticsService";
// import { motion } from "framer-motion";
// import { usePathname } from "next/navigation";
// import { useCallback, useEffect, useRef, useState } from "react";
// import { CreateClientModal } from "@/components/ui/create-client-modal";
// import { NewReminderModal } from "@/app/(private)/reminders/components/new-reminder-modal";
// import { NewPersonalRecordingModal } from "@/app/(private)/recordings/components/new-personal-recording-modal";
// import { CompleteRegistrationModal } from "./components/complete-registration-modal";
// import { QuickActions } from "./components/quick-actions";
// import { RecentClients } from "./components/recent-clients";
// import { RecentOthersList } from "./components/recent-others-list";
// import { RecentRecordingsList } from "./components/recent-recordings-list";
// import { RecentStudyList } from "./components/recent-study-list";
// import { TodayRemindersCompact } from "./components/today-reminders-compact";
// import { TrialAppModal } from "./components/trial-app-modal";
// import { UpgradePlanBanner } from "./components/upgrade-plan-banner";
// import { WelcomeTourModal } from "./components/welcome-tour-modal";

// function useLiveTime() {
//   const [now, setNow] = useState(new Date());
//   useEffect(() => {
//     const id = setInterval(() => setNow(new Date()), 60_000);
//     return () => clearInterval(id);
//   }, []);
//   return now;
// }

// const WEEKDAYS = [
//   "Domingo",
//   "Segunda-feira",
//   "Terça-feira",
//   "Quarta-feira",
//   "Quinta-feira",
//   "Sexta-feira",
//   "Sábado",
// ];
// const MONTHS = [
//   "jan",
//   "fev",
//   "mar",
//   "abr",
//   "mai",
//   "jun",
//   "jul",
//   "ago",
//   "set",
//   "out",
//   "nov",
//   "dez",
// ];

// export default function HomePage() {
//   const pathname = usePathname();
//   const { profile } = useSession();
//   const { PostAPI } = useApiContext();
//   const { GetReminders, GetRecordings } = useGeneralContext();
//   const { startTour } = useRecordingTour();
//   const now = useLiveTime();

//   const [trialAppModalOpen, setTrialAppModalOpen] = useState<boolean | null>(
//     null,
//   );
//   const [showWelcomeTourModal, setShowWelcomeTourModal] = useState(false);
//   const [createClientModalOpen, setCreateClientModalOpen] = useState(false);
//   const [newReminderModalOpen, setNewReminderModalOpen] = useState(false);
//   const [newPersonalModalOpen, setNewPersonalModalOpen] = useState(false);
//   const prevTrialModalRef = useRef<boolean | null>(null);

//   const { fullData, requestLocation } = useGeolocation();

//   useEffect(() => {
//     requestLocation();
//   }, [requestLocation]);

//   useEffect(() => {
//     if (fullData) {
//       startSession(PostAPI, fullData).catch((err) =>
//         console.warn("Erro ao enviar localização:", err),
//       );
//     }
//   }, [fullData, PostAPI]);

//   useEffect(() => {
//     if (!TOUR_ENABLED) return;
//     if (pathname !== "/") return;
//     if (trialAppModalOpen !== false) return;
//     const prev = prevTrialModalRef.current;
//     if (prev !== true && prev !== null) return;
//     prevTrialModalRef.current = false;
//     const t = setTimeout(() => setShowWelcomeTourModal(true), 600);
//     return () => clearTimeout(t);
//   }, [pathname, trialAppModalOpen]);

//   useEffect(() => {
//     prevTrialModalRef.current = trialAppModalOpen;
//   }, [trialAppModalOpen]);

//   const handleWelcomeTourStart = useCallback(() => {
//     setShowWelcomeTourModal(false);
//     startTour(0);
//   }, [startTour]);

//   const hour = now.getHours();
//   const greeting =
//     hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
//   const firstName = profile?.name?.split(" ")[0] ?? "...";

//   const dayName = WEEKDAYS[now.getDay()];
//   const dateString = `${dayName}, ${now.getDate()} de ${MONTHS[now.getMonth()]}. de ${now.getFullYear()}`;
//   const timeString = now.toLocaleTimeString("pt-BR", {
//     hour: "2-digit",
//     minute: "2-digit",
//   });

//   return (
//     <div className="flex w-full flex-col gap-4">
//       <motion.div
//         initial={{ opacity: 0, y: -10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.35, ease: "easeOut" }}
//         className="relative overflow-hidden"
//       >
//         <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-50/70 via-transparent to-transparent" />
//         <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-blue-100/30 blur-3xl" />

//         <div className="relative z-10 flex items-center justify-between gap-4">
//           <div className="min-w-0">
//             <h1 className="mt-0.5 truncate text-xl font-extrabold tracking-tight text-gray-900">
//               {greeting},{" "}
//               <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
//                 {firstName}
//               </span>{" "}
//               👋
//             </h1>
//             <p className="mt-0.5 text-xs text-gray-400">
//               Seu espaço de gravação e gestão de consultas.
//             </p>
//           </div>

//           {/* Live clock */}
//           <div className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
//             <div className="relative flex h-2 w-2">
//               <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
//               <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
//             </div>
//             <span className="text-base font-bold text-gray-800 tabular-nums">
//               {timeString}
//             </span>
//           </div>
//         </div>
//       </motion.div>

//       <UpgradePlanBanner />
//       <div>
//         <p className="mb-2 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
//           Ações rápidas
//         </p>
//         <QuickActions
//           onNewPatientClick={() => setCreateClientModalOpen(true)}
//           onNewReminderClick={() => setNewReminderModalOpen(true)}
//           onNewPersonalClick={() => setNewPersonalModalOpen(true)}
//         />
//       </div>

//       {/* ── UPGRADE BANNER (conditional) ───────────────── */}

//       {/* ── MAIN 3-COLUMN GRID ─────────────────────────── */}
//       <div>
//         <p className="mb-2 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
//           Visão geral
//         </p>
//         <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
//           <RecentRecordingsList className="min-w-0 lg:col-span-1" />
//           <RecentClients className="min-w-0 lg:col-span-1" />
//           <TodayRemindersCompact className="min-w-0 lg:col-span-1" />
//         </div>
//       </div>

//       {/* ── GRID ESTUDO / OUTROS (2 colunas) ───────────── */}
//       <div>
//         <p className="mb-2 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
//           Estudo e outros
//         </p>
//         <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
//           <RecentStudyList className="min-w-0" />
//           <RecentOthersList className="min-w-0" />
//         </div>
//       </div>

//       {/* ── MODALS ─────────────────────────────────────── */}
//       <CreateClientModal
//         open={createClientModalOpen}
//         onOpenChange={setCreateClientModalOpen}
//       />
//       <NewReminderModal
//         open={newReminderModalOpen}
//         onOpenChange={setNewReminderModalOpen}
//         onSuccess={GetReminders}
//       />
//       <NewPersonalRecordingModal
//         open={newPersonalModalOpen}
//         onOpenChange={setNewPersonalModalOpen}
//         onSuccess={GetRecordings}
//       />
//       <CompleteRegistrationModal />
//       <TrialAppModal onOpenChange={setTrialAppModalOpen} />
//       <WelcomeTourModal
//         isOpen={showWelcomeTourModal}
//         onStart={handleWelcomeTourStart}
//       />
//     </div>
//   );
// }
