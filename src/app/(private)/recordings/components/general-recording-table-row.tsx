import { ClientProps, RecordingDetailsProps } from "@/@types/general-client";
import { TableCell, TableRow } from "@/components/ui/blocks/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/blocks/tooltip";
import {
  ContactsIcon,
  NotesIcon,
  OtherIcon,
  StudyIcon,
  TranscriptionIcon,
} from "@/components/ui/custom-icons";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
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

  const getTypeStyle = () => {
    switch (recording.type) {
      case "CLIENT":
        return {
          label: "Consulta",
          icon: ContactsIcon,
          className: "text-white",
        };
      case "REMINDER":
        return {
          label: "Lembrete",
          icon: NotesIcon,
          className: "text-green-200 ",
        };
      case "STUDY":
        return {
          label: "Estudo",
          icon: StudyIcon,
          className: "text-yellow-500 ",
        };
      case "OTHER":
        return {
          label: "Outro",
          icon: OtherIcon,
          className: "text-orange-500 ",
        };
      default:
        return {
          label: "Pessoal",
          icon: TranscriptionIcon,
          className: "text-purple-500 ",
        };
    }
  };

  const typeStyle = getTypeStyle();
  const Icon = typeStyle.icon;

  return (
    <TableRow
      onClick={handleNavigation}
      key={recording.id}
      className="group h-16 cursor-pointer border-b border-gray-100 bg-white transition-all duration-200 hover:bg-gray-50"
    >
      <TableCell className="py-2 pl-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex w-max items-center gap-2 rounded-2xl border-2 bg-gradient-to-br from-sky-500 to-blue-600 p-1 text-xs text-white",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center rounded-md p-1",
                  )}
                >
                  <Icon className="h-6 w-6" color="white" />
                </div>
                {/* {typeStyle.label} */}
              </div>
            </TooltipTrigger>
            <TooltipContent
              align="start"
              side="top"
              className={cn(
                "flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-lg bg-gray-50 p-2",
                )}
              >
                <Icon className="h-5 w-5" color="#64748b" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Tipo</p>
                <p className="text-sm font-bold text-gray-800">
                  {typeStyle.label}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="py-2 text-start text-sm font-semibold whitespace-nowrap text-gray-700">
        {recording.name || "Sem título"}
      </TableCell>
      <TableCell className="py-2 text-start text-sm whitespace-nowrap text-gray-500">
        {moment(recording.createdAt).format("DD/MM/YYYY - HH:mm") || "N/A"}
      </TableCell>
      <TableCell className="py-2 text-start text-sm whitespace-nowrap text-gray-500">
        {recording.duration || "00:00"}
      </TableCell>
      <TableCell className="py-2 pr-4 text-xs font-medium whitespace-nowrap text-zinc-400">
        <div className="flex items-center justify-end">
          <button
            onClick={handleNavigation}
            className="group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary hover:!bg-primary hover:shadow-primary/25 flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all duration-300 hover:!text-white"
          >
            <span>Acessar</span>
            <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
