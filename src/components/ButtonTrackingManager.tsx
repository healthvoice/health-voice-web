"use client";

import { useButtonTracking } from "@/hooks/useButtonTracking";

/**
 * Componente que gerencia o tracking de botões globalmente
 * Deve ser renderizado no layout principal para estar sempre ativo
 * 
 * Este componente garante que todos os botões com data-tracking-id
 * sejam rastreados automaticamente, mesmo em componentes que não
 * chamam useButtonTracking diretamente.
 */
export function ButtonTrackingManager() {
  useButtonTracking();
  return null; // Componente não renderiza nada
}
