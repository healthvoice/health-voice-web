"use client";
import { ClientProps } from "@/@types/general-client";
import { TableCell, TableRow } from "@/components/ui/blocks/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/blocks/tooltip";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { ChevronRight } from "lucide-react";
import moment from "moment";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  client: ClientProps;
}

export function GeneralClientTableItem({ client }: Props) {
  const { setSelectedClient, recordingsFilters, setRecordingsFilters } =
    useGeneralContext();
  const router = useRouter();

  const [selectedTooltip, setSelectedTooltip] = useState<string | null>(null);

  const handleNavigation = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedClient(client);
    setRecordingsFilters({
      ...recordingsFilters,
      clientId: client.id,
    });
    router.push(`/clients/${client.id}`);
  };

  return (
    <TableRow
      onClick={handleNavigation}
      key={client.id}
      className="hover:bg-primary/5 h-14 cursor-pointer py-8 text-center transition duration-300"
    >
      <TableCell className="py-0.5 text-start text-sm font-medium whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="bg-primary flex h-10 w-10 max-w-10 min-w-10 items-center justify-center rounded-full">
            <Image
              src="/icons/user.png"
              alt=""
              width={100}
              height={100}
              className="h-4 w-max object-contain"
            />
          </div>
          {client.name || "N/A"}
        </div>
      </TableCell>
      <TableCell className="py-0.5 text-start text-sm font-medium whitespace-nowrap">
        {(client.birthDate !== "" &&
          moment(client.birthDate).format("DD/MM/YYYY")) ||
          "N/A"}
      </TableCell>
      <TableCell className="w-80 max-w-80 truncate py-0.5 text-start text-sm font-medium whitespace-nowrap">
        <TooltipProvider>
          <Tooltip
            open={selectedTooltip === client.id}
            onOpenChange={() =>
              setSelectedTooltip(
                selectedTooltip === client.id ? null : (client.id as string),
              )
            }
          >
            <TooltipTrigger
              asChild
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTooltip(client.id as string);
              }}
            >
              <span className="w-80 max-w-80 truncate">
                {client.description || "N/A"}
              </span>
            </TooltipTrigger>
            <TooltipContent
              className={cn(
                "text-primary flex max-w-80 overflow-auto bg-white text-wrap xl:max-w-[500px]",
                client.description === "" && "hidden",
              )}
              side="top"
              align="start"
            >
              <span>{client.description}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
