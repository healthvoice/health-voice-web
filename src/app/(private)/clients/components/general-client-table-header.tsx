import { useGeneralContext } from "@/context/GeneralContext";
import debounce from "lodash.debounce";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";

interface Props {
  onOpenNewClient: () => void;
}

export function GeneralClientsTableHeader({ onOpenNewClient }: Props) {
  const { setClientsFilters } = useGeneralContext();
  const [localQuery, setLocalQuery] = useState("");

  const handleStopTyping = (value: string) => {
    setClientsFilters({
      query: value,
      page: 1,
      sortDirection: null,
      sortBy: null,
    });
  };

  const debouncedHandleStopTyping = useCallback(
    debounce(handleStopTyping, 1000),
    [],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
    debouncedHandleStopTyping(e.target.value);
  };

  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-1">
        <div className="relative h-10 w-full sm:w-80">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={localQuery}
            onChange={handleChange}
            className="h-full w-full rounded-lg bg-transparent px-9 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
