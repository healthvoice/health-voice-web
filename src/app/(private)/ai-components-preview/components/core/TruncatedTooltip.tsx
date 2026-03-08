"use client";

import { cn } from "@/utils/cn";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

interface TruncatedTooltipProps {
  /** Conteúdo completo exibido no popup ao passar o mouse */
  content: React.ReactNode;
  /** Elemento que será o gatilho do tooltip (deve ser um único elemento React) */
  children: React.ReactElement;
  /** Lado preferencial de exibição do popup */
  side?: "top" | "right" | "bottom" | "left";
  /** Classes extras para o conteúdo do popup */
  className?: string;
}

/**
 * Envolve qualquer elemento truncado com um tooltip Radix UI.
 * Ao passar o mouse, exibe o conteúdo completo em um popup elegante.
 *
 * Uso:
 * ```tsx
 * <TruncatedTooltip content={title}>
 *   <h3 className="truncate">{title}</h3>
 * </TruncatedTooltip>
 * ```
 */
export function TruncatedTooltip({
  content,
  children,
  side = "top",
  className,
}: TruncatedTooltipProps) {
  if (!content) return <>{children}</>;

  return (
    <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={100}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            avoidCollisions
            collisionPadding={12}
            className={cn(
              // base
              "z-50 max-w-sm rounded-xl bg-gray-900 px-3.5 py-2.5",
              "text-sm font-normal leading-relaxed text-white shadow-xl",
              // entrada
              "animate-in fade-in-0 zoom-in-95",
              // saída
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              // slide por lado
              "data-[side=bottom]:slide-in-from-top-2",
              "data-[side=left]:slide-in-from-right-2",
              "data-[side=right]:slide-in-from-left-2",
              "data-[side=top]:slide-in-from-bottom-2",
              className,
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-gray-900" width={10} height={5} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
