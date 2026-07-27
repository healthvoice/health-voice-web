"use client";

import { useApiContext } from "@/context/ApiContext";
import { useSession } from "@/context/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Estrutura da clínica do profissional autenticado (H1).
 *
 * Alimenta a navegação e as telas de gestão: quem é diretor, de quais
 * especialidades participa, quais unidades responde.
 *
 * ⚠ Isto é ESTRUTURA, não permissão de conteúdo. Ser diretor ou responsável
 * por unidade dá acesso a administração e indicadores agregados — nunca a
 * paciente, áudio, transcrição ou resumo de outro profissional. Quem decide
 * conteúdo é a API (CorporateScopeService); esconder botão não é controle de
 * acesso.
 */

export interface EspecialidadeDoUsuario {
  id: string;
  name: string;
  role: "MANAGER" | "MEMBER";
  branchId?: string | null;
}

interface EstruturaClinica {
  /** Diretor/administrador da clínica (COMPANY_ADMIN). */
  isController: boolean;
  departments: EspecialidadeDoUsuario[];
  managedBranches: { id: string; name: string }[];
}

interface ClinicContextValue extends EstruturaClinica {
  carregando: boolean;
  /** Pertence a alguma clínica (false = conta B2C legada). */
  temClinica: boolean;
  recarregar: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextValue | undefined>(undefined);

const VAZIO: EstruturaClinica = {
  isController: false,
  departments: [],
  managedBranches: [],
};

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const { GetAPI } = useApiContext();
  const { profile } = useSession();
  const [estrutura, setEstrutura] = useState<EstruturaClinica>(VAZIO);
  const [carregando, setCarregando] = useState(true);

  const temClinica = !!profile?.companyId;

  const recarregar = useCallback(async () => {
    if (!temClinica) {
      setEstrutura(VAZIO);
      setCarregando(false);
      return;
    }
    const response = await GetAPI("/corporate/departments/my-structure", true);
    if (response.status === 200 && response.body) {
      setEstrutura({
        isController: !!response.body.isController,
        departments: response.body.departments ?? [],
        managedBranches: response.body.managedBranches ?? [],
      });
    }
    setCarregando(false);
  }, [GetAPI, temClinica]);

  useEffect(() => {
    if (profile === null) return;
    recarregar();
  }, [profile, recarregar]);

  const value = useMemo(
    () => ({ ...estrutura, carregando, temClinica, recarregar }),
    [estrutura, carregando, temClinica, recarregar],
  );

  return (
    <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic precisa estar dentro de ClinicProvider");
  return ctx;
}
