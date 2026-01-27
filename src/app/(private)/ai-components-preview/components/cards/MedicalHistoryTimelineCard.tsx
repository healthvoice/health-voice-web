"use client";

import { FileText, History } from "lucide-react";
import { MedicalHistoryTimelineCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface MedicalHistoryTimelineCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose" | "neutral";
  data: MedicalHistoryTimelineCardData;
}

export function MedicalHistoryTimelineCard({
  title,
  variant = "neutral",
  data,
}: MedicalHistoryTimelineCardProps) {
  const styles = getVariantStyles(variant);
  const HistoryIcon = getIcon("history");
  const FileIcon = getIcon("file-text");

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <HistoryIcon className="h-5 w-5 text-gray-400" />
          {title}
        </h3>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
          Ver histórico completo
        </button>
      </div>

      <div className="relative ml-3 space-y-10 border-l-2 border-gray-100 pb-4">
        {data.history && Array.isArray(data.history) && data.history.length > 0 ? (
          data.history.map((record, index) => (
            <div key={index} className="group relative pl-8">
              {/* Timeline Dot */}
              <div className="absolute top-0 -left-[9px] h-4 w-4 rounded-full border-2 border-white bg-blue-500 ring-4 ring-blue-50 transition-all group-hover:ring-blue-100"></div>

              <div className="mb-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="block text-sm font-bold text-gray-900">
                    {record.type || 'N/A'}
                  </span>
                  {(record.specialty || record.doctor) && (
                    <span className="text-sm text-gray-500">
                      {record.specialty || ''} {record.specialty && record.doctor ? '•' : ''} {record.doctor || ''}
                    </span>
                  )}
                </div>
                {record.date && (
                  <span className="w-max rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                    {record.date}
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5 transition-all hover:border-blue-100 hover:bg-white hover:shadow-md">
                {record.note && (
                  <p className="mb-4 text-sm leading-relaxed text-gray-600">
                    {record.note}
                  </p>
                )}

                {record.attachments && Array.isArray(record.attachments) && record.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-t border-gray-200/50 pt-3">
                    {record.attachments.map((att, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm"
                      >
                        <FileIcon className="h-3 w-3 text-gray-400" />
                        {att}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-sm text-gray-500">
            Nenhum histórico disponível
          </div>
        )}
      </div>
    </div>
  );
}
