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
  console.log(client);

  return (
    <TableRow
      onClick={handleNavigation}
      key={client.id}
      className="group h-20 cursor-pointer border-b border-gray-50 transition-all duration-200 hover:bg-sky-50/30"
    >
      <TableCell className="py-4 pl-4 text-start">
        <div className="flex items-center gap-4">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/20 transition-transform group-hover:scale-105">
            <span className="text-sm font-bold">
              {client.name?.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="group-hover:text-primary font-semibold text-gray-900 transition-colors">
              {client.name || "N/A"}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell className="py-4 text-start">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            {(client.birthDate !== "" &&
              moment(client.birthDate).format("DD/MM/YYYY")) ||
              "N/A"}
          </span>
        </div>
      </TableCell>

      <TableCell className="max-w-[300px] py-4 text-start">
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
              <p className="w-full truncate text-sm text-gray-600">
                {client.description || "Sem descrição"}
              </p>
            </TooltipTrigger>
            <TooltipContent
              className={cn(
                "border-sky-100 bg-white text-gray-700 shadow-xl",
                client.description === "" && "hidden",
              )}
              side="top"
              align="start"
            >
              <span className="block max-w-[300px] p-2 text-sm">
                {client.description}
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      <TableCell className="py-4 pr-4">
        <div className="flex items-center justify-end">
          <button
            onClick={handleNavigation}
            className="hover:bg-primary hover:shadow-primary/20 group-hover:text-primary group-hover:bg-primary/5 flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all duration-300 group-hover:bg-white hover:text-white hover:shadow-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
