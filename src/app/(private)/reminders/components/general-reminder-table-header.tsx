"use client";
import { useGeneralContext } from "@/context/GeneralContext";
import debounce from "lodash.debounce";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";

export function GeneralRemindersTableHeader() {
  const { setRecordingsFilters } = useGeneralContext();
  const [localQuery, setLocalQuery] = useState("");

  const handleStopTyping = (value: string) => {
    setRecordingsFilters({
      query: value,
      page: 1,
      type: "REMINDER",
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
    <div className="flex w-full items-center justify-between gap-2">
      <label
        htmlFor="search"
        className="group relative h-8 w-80 rounded-lg border border-neutral-300 transition focus-within:border-neutral-500"
      >
        <Search className="absolute top-1/2 left-2 h-4 -translate-y-1/2 text-neutral-300 transition group-focus-within:text-neutral-500" />
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Buscar..."
          value={localQuery}
          onChange={handleChange}
          className="peer h-full w-full rounded-lg px-8 text-neutral-700 outline-none placeholder:text-neutral-300"
        />
      </label>
    </div>
  );
}
