"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Modo apresentação (H4) — o "toggle de dados sensíveis" pedido pelo João em
 * 25/07.
 *
 * Ligado, embaralha na TELA os nomes de pacientes, mantendo iniciais e formato
 * ("Joana Ribeiro" → "J▪▪▪▪ R▪▪▪▪▪▪"). Serve para o João apresentar o sistema
 * contando que são dados reais com informações ocultas por privacidade.
 *
 * ⚠ É uma máscara de EXIBIÇÃO, não de segurança: nada muda no banco nem na
 * API. Como a conta de apresentação usa dados sintéticos, não há informação
 * real de paciente em jogo — o modo existe para a narrativa, não para proteger
 * dado sensível de verdade.
 *
 * A preferência vive no navegador de quem apresenta, não no servidor.
 */

const CHAVE = "healthvoice.modo-apresentacao";

interface ApresentacaoContextValue {
  modoApresentacao: boolean;
  alternar: () => void;
  /** Aplica a máscara quando o modo está ligado; devolve igual quando desligado. */
  ocultar: (texto?: string | null) => string;
}

const ApresentacaoContext = createContext<ApresentacaoContextValue | undefined>(
  undefined,
);

/** Mantém a inicial e o formato do nome, escondendo o resto. */
export function mascararNome(texto: string): string {
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .map((parte) => {
      if (parte.length <= 2) return parte;
      return `${parte[0]}${"▪".repeat(Math.min(parte.length - 1, 6))}`;
    })
    .join(" ");
}

export function ApresentacaoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modoApresentacao, setModo] = useState(false);

  useEffect(() => {
    try {
      setModo(localStorage.getItem(CHAVE) === "1");
    } catch {
      // sem storage: modo desligado
    }
  }, []);

  const alternar = useCallback(() => {
    setModo((atual) => {
      const proximo = !atual;
      try {
        localStorage.setItem(CHAVE, proximo ? "1" : "0");
      } catch {
        // preferência vale só nesta sessão
      }
      return proximo;
    });
  }, []);

  const ocultar = useCallback(
    (texto?: string | null) => {
      const valor = texto ?? "";
      return modoApresentacao && valor ? mascararNome(valor) : valor;
    },
    [modoApresentacao],
  );

  const value = useMemo(
    () => ({ modoApresentacao, alternar, ocultar }),
    [modoApresentacao, alternar, ocultar],
  );

  return (
    <ApresentacaoContext.Provider value={value}>
      {children}
    </ApresentacaoContext.Provider>
  );
}

export function useApresentacao() {
  const ctx = useContext(ApresentacaoContext);
  if (!ctx) {
    throw new Error("useApresentacao precisa estar dentro de ApresentacaoProvider");
  }
  return ctx;
}
