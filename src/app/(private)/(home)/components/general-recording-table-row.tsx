"use client";
import { ClientProps, RecordingDetailsProps } from "@/@types/general-client";
import { TableCell, TableRow } from "@/components/ui/blocks/table";
import { useGeneralContext } from "@/context/GeneralContext";
import { ChevronRight } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";

interface Props {
  recording: RecordingDetailsProps;
}

export function GeneralRecordingTableItem({ recording }: Props) {
  const {
    setSelectedRecording,
    setSelectedClient,
    recordingsFilters,
    setRecordingsFilters,
  } = useGeneralContext();
  const router = useRouter();

  const handleNavigation = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (recording.type === "CLIENT") {
      setSelectedClient(recording.client as ClientProps);
      setSelectedRecording(recording);
      setRecordingsFilters({
        ...recordingsFilters,
        clientId: recording.client?.id as string,
      });
      router.push(`/clients/${recording.client?.id}/${recording.id}`);
    } else if (recording.type === "STUDY") {
      setSelectedRecording(recording);
      setRecordingsFilters({
        ...recordingsFilters,
        clientId: undefined,
        type: "STUDY",
      });
      router.push(`/studies/${recording.id}`);
    } else if (recording.type === "OTHER") {
      setSelectedRecording(recording);
      setRecordingsFilters({
        ...recordingsFilters,
        clientId: undefined,
        type: "OTHER",
      });
      router.push(`/others/${recording.id}`);
    } else if (recording.type === "REMINDER") {
      setSelectedRecording(recording);
      setRecordingsFilters({
        ...recordingsFilters,
        clientId: undefined,
        type: "REMINDER",
      });
      router.push(`/reminders/${recording.id}`);
    }
  };

  return (
    <TableRow
      onClick={handleNavigation}
      key={recording.id}
      className="hover:bg-primary/5 h-14 cursor-pointer py-8 text-center transition duration-300"
    >
      <TableCell className="py-0.5 text-start text-sm font-medium whitespace-nowrap">
        {recording.name || "N/A"}
      </TableCell>
      <TableCell className="py-0.5 text-start text-sm font-medium whitespace-nowrap">
        {moment(recording.createdAt).format("DD/MM/YYYY HH:mm") || "N/A"}
      </TableCell>
      <TableCell className="py-0.5 text-start text-sm font-medium whitespace-nowrap">
        {recording.duration || "N/A"}
      </TableCell>
      <TableCell className="py-0.5 text-start text-sm font-medium whitespace-nowrap">
        {recording.type === "CLIENT"
          ? "Consulta"
          : recording.type === "STUDY"
            ? "Estudos"
            : recording.type === "REMINDER"
              ? "Lembrete"
              : recording.type === "OTHER"
                ? "Outro"
                : "N/A"}
      </TableCell>
      <TableCell className="py-2 text-xs font-medium whitespace-nowrap text-zinc-400">
        <div className="flex items-center justify-end">
          <button
            onClick={handleNavigation}
            className="group flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
          >
            <span>Acessar</span>
            <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
