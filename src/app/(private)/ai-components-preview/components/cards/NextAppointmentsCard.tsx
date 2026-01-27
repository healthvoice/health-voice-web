"use client";

import { NextAppointmentsCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface NextAppointmentsCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: NextAppointmentsCardData;
}

const monthNames = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

export function NextAppointmentsCard({
  title,
  variant = "rose",
  data,
}: NextAppointmentsCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("calendar-clock");

  // Calcular quantidade de agendamentos
  const isGenericFormat = data.items && Array.isArray(data.items) && data.items.length > 0;
  const items = isGenericFormat ? (data.items || []) : [];
  const legacyItems = data.appointments && Array.isArray(data.appointments) ? data.appointments : [];
  const appointmentCount = isGenericFormat ? (items?.length || 0) : legacyItems.length;
  
  return (
    <section className={appointmentCount <= 1 ? 'max-w-[500px]' : ''}>
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${styles.gradientFrom} ${styles.gradientTo} text-white shadow-md ${styles.shadow}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Detectar formato: genérico (items[]) ou legado (appointments[]) */}
        {(() => {
          const isGenericFormat = data.items && Array.isArray(data.items) && data.items.length > 0;
          const items = isGenericFormat ? data.items : [];
          
          // Converter formato legado para genérico
          const legacyItems = data.appointments && Array.isArray(data.appointments)
            ? data.appointments.map((appt) => ({
                id: appt.id,
                primary: appt.type || 'Agendamento',
                secondary: appt.doctor,
                metadata: [
                  appt.date && { label: "Data", value: appt.date },
                  appt.time && { label: "Hora", value: appt.time },
                ].filter(Boolean) as Array<{ label: string; value: string }>,
                tags: appt.notes ? [appt.notes] : [],
              }))
            : [];

          const displayItems = isGenericFormat ? items : legacyItems;

          if (!displayItems || displayItems.length === 0) {
            return (
              <div className="col-span-2 text-center py-8 text-sm text-gray-500">
                Nenhum agendamento disponível
              </div>
            );
          }

          return displayItems.map((item, idx) => {
            const dateMeta = item.metadata?.find((m: { label: string; value: string }) => 
              m.label.toLowerCase().includes('data')
            );
            const timeMeta = item.metadata?.find((m: { label: string; value: string }) => 
              m.label.toLowerCase().includes('hora')
            );
            
            const dateStr = dateMeta?.value || '';
            const [day, month] = dateStr ? dateStr.split("/") : ['', ''];
            
            return (
              <div
                key={item.id || idx}
                className={`flex items-start gap-5 rounded-2xl border ${styles.border} bg-gradient-to-r ${styles.bg} to-white p-5 transition-all hover:shadow-md`}
              >
                {dateStr && (
                  <div
                    className={`flex min-w-[70px] flex-col items-center justify-center rounded-xl border ${styles.border} bg-white p-3 shadow-sm`}
                  >
                    <span className={`text-2xl font-bold ${styles.text}`}>
                      {day}
                    </span>
                    {month && (
                      <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                        {monthNames[parseInt(month) - 1] || month}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{item.primary}</p>
                  {(timeMeta || item.secondary) && (
                    <p className={`text-sm font-medium ${styles.text}`}>
                      {timeMeta?.value || ''} {timeMeta && item.secondary ? '•' : ''} {item.secondary || ''}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <p className="mt-2 inline-block rounded border border-gray-100 bg-white/50 px-2 py-1 text-xs text-gray-500">
                      <span className="font-medium">Obs:</span> {item.tags[0]}
                    </p>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </section>
  );
}
