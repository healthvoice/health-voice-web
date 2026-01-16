"use client";

import { cn } from "@/utils/cn";

export function UsageChart() {
  const data = [
    { label: "Jan", value: 40 },
    { label: "Feb", value: 65 },
    { label: "Mar", value: 45 },
    { label: "Apr", value: 80 },
    { label: "May", value: 55 },
    { label: "Jun", value: 95 }, // Highlighted
    { label: "Jul", value: 60 },
    { label: "Aug", value: 75 },
    { label: "Sep", value: 50 },
    { label: "Oct", value: 65 },
    { label: "Nov", value: 45 },
    { label: "Dec", value: 60 },
  ];

  const maxValue = 100;

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-lg bg-gray-50 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Uso da AI por Dia</h3>
          <p className="text-sm text-gray-500">Total de tokens consumidos</p>
        </div>
      </div>

      <div className="flex h-64 items-end justify-between gap-2">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100;
          const isHighlighted = index === 5; // June example

          return (
            <div
              key={index}
              className="group flex h-full w-full flex-col items-center justify-end gap-2"
            >
              <div className="relative w-full max-w-[24px] rounded-t-lg bg-gray-100 group-hover:bg-gray-200">
                <div
                  className={cn(
                    "w-full rounded-t-lg transition-all duration-500",
                    isHighlighted
                      ? "bg-primary"
                      : "bg-primary/30 group-hover:bg-primary/50",
                  )}
                  style={{ height: `${height}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-400">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
