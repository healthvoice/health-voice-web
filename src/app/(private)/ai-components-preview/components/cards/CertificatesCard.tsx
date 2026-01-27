"use client";

import { FileSignature } from "lucide-react";
import { CertificatesCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface CertificatesCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: CertificatesCardData;
}

export function CertificatesCard({
  title,
  variant = "amber",
  data,
}: CertificatesCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("file-signature");

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
            {data.certificates && Array.isArray(data.certificates) ? data.certificates.length : 0} atestado(s)
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data.certificates && Array.isArray(data.certificates) && data.certificates.length > 0 ? (
          data.certificates.map((cert) => (
          <div
            key={cert.id}
            className={`flex items-start justify-between rounded-xl border ${styles.border} bg-white p-5 shadow-sm transition-all hover:shadow-md`}
          >
            <div>
              <p className="font-semibold text-gray-900">{cert.type}</p>
              <p className="mt-1 text-sm text-gray-500">{cert.description}</p>
              <p className="mt-2 text-xs text-gray-400">
                Período: {cert.period}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`rounded-md border ${styles.border} ${styles.bg} px-2.5 py-1 text-xs font-semibold ${styles.text}`}
              >
                {cert.date}
              </span>
            </div>
          </div>
        ))
        ) : (
          <div className="col-span-2 text-center py-8 text-sm text-gray-500">
            Nenhum atestado disponível
          </div>
        )}
      </div>
    </section>
  );
}
