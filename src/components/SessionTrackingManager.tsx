"use client";

import { useSessionTracking } from "@/hooks/useSessionTracking";

/**
 * Componente que gerencia o tracking de sessão
 * Deve ser renderizado no layout principal para estar sempre ativo
 */
export function SessionTrackingManager() {
  useSessionTracking();
  return null; // Componente não renderiza nada
}
