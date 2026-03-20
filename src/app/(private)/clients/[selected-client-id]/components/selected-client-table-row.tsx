"use client";
import { RecordingDetailsProps } from "@/@types/general-client";
import { TableCell, TableRow } from "@/components/ui/blocks/table";
import { ContactsIcon } from "@/components/ui/custom-icons";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { ChevronRight } from "lucide-react";
import moment from "moment";
import "moment/locale/pt-br";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  recording: RecordingDetailsProps;
}

const transcriptionStatusConfig: Record<
  RecordingDetailsProps["transcriptionStatus"],
  { label: string; className: string }
> = {
  DONE: {
    label: "Transcrita",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  },
  TRANSCRIBING: {
    label: "Transcrevendo",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  },
  PENDING: {
    label: "Pendente",
    className: "bg-gray-50 text-gray-500 ring-1 ring-gray-300/50",
  },
  NOT_REQUESTED: {
    label: "Sem transcrição",
    className: "bg-gray-50 text-gray-400 ring-1 ring-gray-200",
  },
};

export function SelectedPatientTableItem({ recording }: Props) {
  const { setSelectedRecording } = useGeneralContext();
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = () => {
    setSelectedRecording(recording);
    router.push(`${pathname}/${recording.id}`);
  };

  const status =
    transcriptionStatusConfig[recording.transcriptionStatus] ??
    transcriptionStatusConfig["PENDING"];

  return (
    <TableRow
      onClick={handleNavigation}
      key={recording.id}
      className="group h-[72px] cursor-pointer border-b border-gray-50 bg-white transition-all duration-200 hover:bg-sky-50/40 hover:shadow-sm"
    >
      {/* Title + date */}
      <TableCell className="w-[40%] py-3 pl-5 text-start">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-sky-500/30">
            <ContactsIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-sky-700">
              {recording.name || "Sem título"}
            </span>
            <span className="text-xs text-gray-400">
              {moment(recording.createdAt)
                .locale("pt-br")
                .format("DD [de] MMMM [de] YYYY")}
            </span>
          </div>
        </div>
      </TableCell>

      {/* Time */}
      <TableCell className="py-3 text-start text-sm font-medium whitespace-nowrap text-gray-500">
        {moment(recording.createdAt).format("HH:mm")}
      </TableCell>

      {/* Duration pill */}
      <TableCell className="py-3 text-start">
        <span className="inline-flex items-center rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-600/10 group-hover:bg-sky-100">
          {recording.duration || "—"}
        </span>
      </TableCell>

      {/* Transcription status badge */}
      <TableCell className="py-3 text-start">
        <span
          className={cn(
            "inline-flex items-center rounded-lg px-2.5 py-1 text-center text-xs font-medium",
            status.className,
          )}
        >
          {status.label}
        </span>
      </TableCell>

      {/* Action */}
      <TableCell className="py-3 pr-5 text-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNavigation();
          }}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm transition-all duration-200 group-hover:border-sky-200 group-hover:bg-sky-50 group-hover:text-sky-700 hover:shadow-md"
        >
          Acessar
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </TableCell>
    </TableRow>
  );
}
