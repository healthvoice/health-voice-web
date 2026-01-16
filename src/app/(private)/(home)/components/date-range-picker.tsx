"use client";

import { cn } from "@/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateRange = () => {
    if (!dateRange?.from) {
      return "Selecione um período";
    }

    if (!dateRange.to) {
      return format(dateRange.from, "dd MMM, yyyy", { locale: ptBR });
    }

    return `${format(dateRange.from, "dd MMM", { locale: ptBR })} - ${format(
      dateRange.to,
      "dd MMM, yyyy",
      { locale: ptBR },
    )}`;
  };

  // Quick select options
  const quickSelects = [
    {
      label: "Últimos 7 dias",
      action: () => {
        const today = new Date();
        const from = new Date(today);
        from.setDate(today.getDate() - 7);
        onDateRangeChange({ from, to: today });
      },
    },
    {
      label: "Últimos 30 dias",
      action: () => {
        const today = new Date();
        const from = new Date(today);
        from.setDate(today.getDate() - 30);
        onDateRangeChange({ from, to: today });
      },
    },
    {
      label: "Este mês",
      action: () => {
        const today = new Date();
        const from = new Date(today.getFullYear(), today.getMonth(), 1);
        onDateRangeChange({ from, to: today });
      },
    },
    {
      label: "Mês passado",
      action: () => {
        const today = new Date();
        const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const to = new Date(today.getFullYear(), today.getMonth(), 0);
        onDateRangeChange({ from, to });
      },
    },
  ];

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "hover:border-primary flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50/50 hover:shadow-md active:scale-95",
          isOpen && "border-primary ring-primary/10 bg-gray-50 ring-4",
        )}
      >
        <CalendarDays className="text-primary h-4 w-4" />
        <span className="capitalize">{formatDateRange()}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180 text-sky-500",
          )}
        />
      </button>

      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-2 flex overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl ring-1 ring-gray-900/5 duration-200">
          {/* Quick select sidebar */}
          <div className="flex min-w-[140px] flex-col border-r border-gray-100 bg-gray-50/80 p-3">
            <span className="mb-2 px-3 text-xs font-bold tracking-wider text-gray-400/80 uppercase">
              Atalhos
            </span>
            {quickSelects.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  option.action();
                  setIsOpen(false);
                }}
                className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-600 transition-all hover:bg-white hover:text-sky-600 hover:shadow-sm"
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-4">
            <DayPicker
              mode="range"
              locale={ptBR}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              showOutsideDays
              classNames={{
                months: "flex gap-6",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-sm font-bold text-gray-800 capitalize",
                nav: "space-x-1 flex items-center",
                nav_button:
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "flex mb-1",
                head_cell:
                  "text-gray-400 rounded-md w-9 font-semibold text-[0.7rem] uppercase tracking-wide",
                row: "flex w-full mt-1",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-sky-50/50 first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-medium text-sm text-gray-700 aria-selected:opacity-100 hover:bg-gray-100/80 hover:text-gray-900 rounded-lg transition-all duration-200",
                day_selected:
                  "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20 hover:from-sky-600 hover:to-blue-700 hover:shadow-lg hover:shadow-sky-500/30",
                day_today:
                  "bg-gray-100 text-gray-900 font-bold ring-1 ring-gray-200",
                day_outside: "text-gray-300 opacity-50",
                day_disabled: "text-gray-300",
                day_range_middle:
                  "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20 hover:from-sky-600 hover:to-blue-700 hover:shadow-lg hover:shadow-sky-500/30",
                day_range_start: "rounded-l-lg",
                day_range_end: "rounded-r-lg",
                day_hidden: "invisible",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
