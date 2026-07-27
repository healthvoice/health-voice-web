"use client";

import Image from "next/image";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface PromptIconProps {
  icon?: string;
  className?: string;
  size?: number;
}

/**
 * Renderiza o ícone de um prompt
 * Suporta:
 * - Nome de ícone Lucide (ex: "Camera", "FileText")
 * - Fallback para logo quando não houver ícone
 */
export function PromptIcon({ icon, className = "", size = 20 }: PromptIconProps) {
  // Se não houver ícone, usa a logo como fallback
  if (!icon || icon.trim() === "") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Image
          src="/logos/iconWhite.png"
          alt="Health Voice"
          width={size}
          height={size}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>
    );
  }

  // Se for nome de ícone Lucide, tenta encontrar e renderizar
  const IconComponent = (LucideIcons as any)[icon] as LucideIcon | undefined;

  if (IconComponent) {
    return <IconComponent className={className} size={size} />;
  }

  // Fallback final: logo
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/logos/iconWhite.png"
        alt="Health Voice"
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
