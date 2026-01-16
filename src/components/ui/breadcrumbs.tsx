"use client ";

import { useGeneralContext } from "@/context/GeneralContext";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { AudioRecorder } from "../audio-recorder/audio-recorder";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}
export function BreadCrumbs() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedClient, selectedRecording } = useGeneralContext();
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    if (pathname.includes("/clients")) {
      const pathSegments = pathname.split("/").filter(Boolean);

      breadcrumbs.push({
        label: "Pacientes",
        href: "/clients",
        isActive: pathname === "/clients",
      });

      if (pathSegments.length >= 2 && pathSegments[1]) {
        const clientId = pathSegments[1];

        breadcrumbs.push({
          label: selectedClient?.name || "Carregando...",
          href: `/clients/${clientId}`,
          isActive: pathname === `/clients/${clientId}`,
        });

        if (pathSegments.length >= 3 && pathSegments[2]) {
          const recordingId = pathSegments[2];

          breadcrumbs.push({
            label: selectedRecording?.name || "Consulta",
            href: `/clients/${clientId}/${recordingId}`,
            isActive: true,
          });
        }
      }
    } else if (pathname.includes("/reminders")) {
      const pathSegments = pathname.split("/").filter(Boolean);

      breadcrumbs.push({
        label: "Lembretes",
        href: "/reminders",
        isActive: pathname === "/reminders",
      });

      if (pathSegments.length >= 2 && pathSegments[1]) {
        const reminderId = pathSegments[1];

        breadcrumbs.push({
          label: selectedRecording?.name || "Carregando...",
          href: `/${reminderId}`,
          isActive: true,
        });
      }
    } else if (pathname.includes("/studies")) {
      const pathSegments = pathname.split("/").filter(Boolean);

      breadcrumbs.push({
        label: "Estudos",
        href: "/studies",
        isActive: pathname === "/studies",
      });

      if (pathSegments.length >= 2 && pathSegments[1]) {
        const studyId = pathSegments[1];

        breadcrumbs.push({
          label: selectedRecording?.name || "Carregando...",
          href: `/${studyId}`,
          isActive: true,
        });
      }
    } else if (pathname.includes("/others")) {
      const pathSegments = pathname.split("/").filter(Boolean);

      breadcrumbs.push({
        label: "Outros",
        href: "/others",
        isActive: true,
      });

      if (pathSegments.length >= 2 && pathSegments[1]) {
        const studyId = pathSegments[1];

        breadcrumbs.push({
          label: selectedRecording?.name || "Carregando...",
          href: `/${studyId}`,
          isActive: pathname === `/others/${studyId}`,
        });
      }
    } else if (pathname.includes("/recordings")) {
      breadcrumbs.push({
        label: "Gravações",
        href: "/recordings",
        isActive: true,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = useMemo(
    () => generateBreadcrumbs(),
    [pathname, selectedClient?.name, selectedRecording?.name],
  );

  const BreadcrumbItem = ({
    item,
    isLast,
  }: {
    item: BreadcrumbItem;
    isLast: boolean;
  }) => (
    <>
      {item.href && !item.isActive ? (
        <span
          className="cursor-pointer transition-colors hover:text-white/80"
          onClick={() => router.push(item.href!)}
        >
          {item.label}
        </span>
      ) : (
        <span className={item.isActive ? "text-white" : ""}>{item.label}</span>
      )}
      {!isLast && <span className="mx-1">{">"}</span>}
    </>
  );
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-1 text-xs text-white">
        {breadcrumbs.map((breadcrumb, index) => (
          <BreadcrumbItem
            key={`${breadcrumb.label}-${index}`}
            item={breadcrumb}
            isLast={index === breadcrumbs.length - 1}
          />
        ))}
      </div>
      <div className="flex w-full flex-row items-center justify-between">
        <div className="hidden flex-1 items-center justify-end gap-2 self-end md:flex">
          <AudioRecorder buttonClassName="bg-gradient-to-r from-sky-500 to-blue-600 text-white" />
        </div>
      </div>
    </div>
  );
}
