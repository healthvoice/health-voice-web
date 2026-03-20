"use client";

import { RecordingDetailsProps } from "@/@types/general-client";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    FileText,
    Loader2,
    Play,
    Search,
    User
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Recording {
    id: string;
    title: string;
    patient: string;
    date: string;
    time: string;
    duration: string;
    type: string;
    tags: string[];
    description?: string;
}

interface ContentPanelProps {
    className?: string;
}

// Helper para formatar data relativa
const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recordingDate = new Date(date);
    const recordingDay = new Date(recordingDate.getFullYear(), recordingDate.getMonth(), recordingDate.getDate());

    if (recordingDay.getTime() === today.getTime()) {
        return "Hoje";
    } else if (recordingDay.getTime() === yesterday.getTime()) {
        return "Ontem";
    } else {
        return recordingDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    }
};

// Helper para formatar tipo
const formatType = (type: string): string => {
    switch (type) {
        case "CLIENT": return "Consulta";
        case "REMINDER": return "Lembrete";
        case "STUDY": return "Estudo";
        case "OTHER": return "Outro";
        default: return type;
    }
};

export function ContentPanel({ className }: ContentPanelProps) {
    const router = useRouter();
    const { recordings: apiRecordings, isGettingRecordings } = useGeneralContext();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);

    // Converter gravações da API para o formato local e pegar os últimos 10
    const recordings: Recording[] = useMemo(() => {
        return apiRecordings
            .slice(0, 10) // Últimas 10 gravações
            .map((rec: RecordingDetailsProps) => {
                const createdAt = new Date(rec.createdAt);
                return {
                    id: rec.id,
                    title: rec.name,
                    patient: rec.client?.name || "—",
                    date: formatRelativeDate(createdAt),
                    time: createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                    duration: rec.duration,
                    type: formatType(rec.type),
                    tags: [formatType(rec.type)],
                    description: rec.description,
                };
            });
    }, [apiRecordings]);

    // Filtra gravações
    const filteredRecordings = recordings.filter(rec =>
        rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.patient.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const CARDS_PER_VIEW = 2;
    const totalPages = Math.max(1, Math.ceil(filteredRecordings.length / CARDS_PER_VIEW));
    const maxIndex = Math.max(0, totalPages - 1);

    const nextSlide = () => {
        if (currentIndex < maxIndex) setCurrentIndex(p => p + 1);
    };

    const prevSlide = () => {
        if (currentIndex > 0) setCurrentIndex(p => p - 1);
    };

    // Reset index quando filtra
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentIndex(0);
    };

    const currentRecordings = filteredRecordings.slice(
        currentIndex * CARDS_PER_VIEW,
        (currentIndex + 1) * CARDS_PER_VIEW
    );

    // Página atual para exibição (1-indexed)
    const currentPage = currentIndex + 1;

    const handleViewAll = () => {
        router.push("/recordings");
    };

    const handleRecordingClick = (recordingId: string, type: string) => {
        // Navegar para a página correta baseado no tipo
        const recording = apiRecordings.find(r => r.id === recordingId);
        if (!recording) return;

        switch (recording.type) {
            case "CLIENT":
                if (recording.client?.id) {
                    router.push(`/clients/${recording.client.id}/appointment/${recordingId}`);
                }
                break;
            case "REMINDER":
                if (recording.reminderId) {
                    router.push(`/reminders/${recording.reminderId}`);
                }
                break;
            case "STUDY":
                router.push(`/studies/${recordingId}`);
                break;
            case "OTHER":
                router.push(`/others/${recordingId}`);
                break;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className={cn(
                "flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:p-5",
                className
            )}
        >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-blue-500/20">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 tracking-tight">
                            Últimas Gravações
                        </h3>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Recentes
                        </p>
                    </div>
                </div>

                <button 
                    onClick={handleViewAll}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:shadow-lg hover:shadow-sky-500/25 active:scale-95"
                >
                    Ver todas
                    <ChevronRight className="h-3 w-3" />
                </button>
            </div>

            {/* Toolbar: Search + Navigation */}
            <div className="mb-4 flex items-center justify-between gap-3">
                {/* Minimal Search Bar */}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full rounded-lg border border-gray-100 bg-gray-50 py-1.5 pl-8 pr-3 text-xs text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-sky-200 focus:bg-white focus:ring-1 focus:ring-sky-200"
                    />
                </div>

                {/* Navigation Buttons with Page Indicator */}
                <div className="flex items-center gap-2">
                    {filteredRecordings.length > 0 && (
                        <span className="text-xs font-medium text-gray-400">
                            {currentPage}/{totalPages}
                        </span>
                    )}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={prevSlide}
                            disabled={currentIndex === 0 || filteredRecordings.length === 0}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-400 transition-all hover:border-sky-200 hover:text-sky-600 disabled:opacity-30 disabled:hover:border-gray-100 disabled:hover:text-gray-400"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={nextSlide}
                            disabled={currentIndex === maxIndex || filteredRecordings.length === 0}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-400 transition-all hover:border-sky-200 hover:text-sky-600 disabled:opacity-30 disabled:hover:border-gray-100 disabled:hover:text-gray-400"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Slider container */}
            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2"
                    >
                        {isGettingRecordings ? (
                            <div className="col-span-2 flex h-full flex-col items-center justify-center text-gray-400">
                                <Loader2 className="mb-2 h-8 w-8 animate-spin text-sky-500" />
                                <p className="text-sm">Carregando gravações...</p>
                            </div>
                        ) : currentRecordings.length === 0 ? (
                            <div className="col-span-2 flex h-full flex-col items-center justify-center text-gray-400">
                                <Search className="mb-2 h-8 w-8 opacity-20" />
                                <p className="text-sm">Nenhuma gravação encontrada</p>
                            </div>
                        ) : (
                            currentRecordings.map((recording) => (
                                <div
                                    key={recording.id}
                                    onClick={() => handleRecordingClick(recording.id, recording.type)}
                                    className="group relative flex cursor-pointer flex-col justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-sm"
                                >
                                    {/* Top Section */}
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sky-500 shadow-sm transition-transform group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white">
                                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                                        </div>
                                        <div className="flex-1 text-right">
                                            <span className="inline-block rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                                                {recording.type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle - Patient & Details */}
                                    <div className="mb-3 space-y-1">
                                        <h4 className="line-clamp-1 text-sm font-bold text-gray-800 group-hover:text-sky-700">
                                            {recording.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <User className="h-3 w-3 text-gray-400" />
                                            <span>{recording.patient}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Calendar className="h-3 w-3" />
                                            <span>{recording.date} • {recording.time} ({recording.duration})</span>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2">
                                        <div className="flex gap-1">
                                            {recording.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="inline-block max-w-[70px] truncate rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-600">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
