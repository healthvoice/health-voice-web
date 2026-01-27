"use client";

import { UserPlus } from "lucide-react";
import { ReferralsCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface ReferralsCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: ReferralsCardData;
}

export function ReferralsCard({
  title,
  variant = "violet",
  data,
}: ReferralsCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("user-plus");

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${styles.gradientFrom} ${styles.gradientTo} text-white shadow-md ${styles.shadow}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400">
            {data.referrals && Array.isArray(data.referrals) ? data.referrals.length : 0} encaminhamento(s)
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {data.referrals && Array.isArray(data.referrals) && data.referrals.length > 0 ? (
          data.referrals.map((ref) => (
          <div
            key={ref.id}
            className={`flex flex-col justify-between gap-4 rounded-xl border ${styles.border} bg-white p-5 transition-all hover:opacity-80 sm:flex-row sm:items-start`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${styles.iconBg} text-sm font-bold ${styles.text}`}
              >
                {ref.specialty.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {ref.specialty}
                </h4>
                <p className="mt-0.5 text-sm text-gray-500">{ref.reason}</p>
                {ref.professional !== "A definir" && (
                  <p className={`mt-2 text-xs font-medium ${styles.text}`}>
                    Profissional: {ref.professional}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${
                  ref.urgency === "Prioritária"
                    ? "bg-red-50 text-red-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {ref.urgency}
              </span>
              <span className="text-xs text-gray-400">{ref.date}</span>
            </div>
          </div>
        ))
        ) : (
          <div className="text-center py-8 text-sm text-gray-500">
            Nenhum encaminhamento disponível
          </div>
        )}
      </div>
    </section>
  );
}
