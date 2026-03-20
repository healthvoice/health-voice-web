"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/blocks/dialog";
import { useApiContext } from "@/context/ApiContext";
import { User, useSession } from "@/context/auth";
import { useTrackingContext } from "@/context/TrackingContext";
import { trackAction, UserActionType } from "@/services/actionTrackingService";
import { cn } from "@/utils/cn";
import {
  AlertCircle,
  CheckCircle2,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  User as UserIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface FormData {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone: string;
  address: string;
  addressNumber: string;
  postalCode: string;
}

// Funções de máscara
const maskCPFCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 11) {
    // CPF: 000.000.000-00
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    // CNPJ: 00.000.000/0000-00
    return numbers
      .substring(0, 14)
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
};

const maskPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length > 11) {
    // Com código do país: +55 (00) 00000-0000
    const limited = numbers.substring(0, 13);
    return limited
      .replace(/(\d{2})(\d)/, "+$1 ($2")
      .replace(/(\d{2})\s\((\d{2})(\d)/, "$1 ($2) $3")
      .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  } else if (numbers.length > 10) {
    // Celular sem código do país: (00) 00000-0000
    return numbers
      .substring(0, 11)
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  } else {
    // Telefone fixo: (00) 0000-0000
    return numbers
      .substring(0, 10)
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
};

const maskPostalCode = (value: string): string => {
  const numbers = value.replace(/\D/g, "").substring(0, 8);
  return numbers.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
};

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ElementType;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  mask?: (value: string) => string;
}

function InputField({
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
  placeholder,
  disabled = false,
  mask,
}: InputFieldProps) {
  return (
    <div className="group relative">
      <label className="mb-1.5 block text-xs font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-4 w-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => {
            const newValue = mask ? mask(e.target.value) : e.target.value;
            onChange(newValue);
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-3 pl-10 text-sm",
            "text-gray-900 placeholder:text-gray-400",
            "transition-all duration-200",
            "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none",
            "hover:border-gray-300",
            disabled && "cursor-not-allowed bg-gray-50 text-gray-500",
          )}
        />
      </div>
    </div>
  );
}

interface ProfileModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ isOpen, onOpenChange }: ProfileModalProps) {
  const { profile, setProfile, handleGetProfile } = useSession();
  const { PutAPI, PostAPI } = useApiContext();
  const { sessionId } = useTrackingContext();
  const pathname = usePathname();

  // Log do sessionId
  useEffect(() => {
    console.log("🔑 [ProfileModal] sessionId:", sessionId);
  }, [sessionId]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    cpfCnpj: "",
    mobilePhone: "",
    address: "",
    addressNumber: "",
    postalCode: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  const hasModalOpenedRef = useRef<boolean>(false);
  const modalSourceRef = useRef<string>("sidebar");

  // Log quando isOpen muda
  useEffect(() => {
    console.log("🔄 [ProfileModal] isOpen mudou:", {
      isOpen,
      pathname,
      hasModalOpenedRef: hasModalOpenedRef.current,
    });
  }, [isOpen, pathname]);

  // Tracking: MODAL_OPENED quando a modal é aberta
  useEffect(() => {
    console.log("🔍 [ProfileModal] useEffect MODAL_OPENED:", {
      isOpen,
      hasModalOpenedRef: hasModalOpenedRef.current,
      pathname,
    });

    if (isOpen && !hasModalOpenedRef.current) {
      // Determinar source da modal baseado no pathname
      let source = "sidebar";
      if (pathname.includes("/home") || pathname === "/") {
        source = "home-page";
      } else if (pathname.includes("/clients")) {
        source = "clients-page";
      } else if (pathname.includes("/reminders")) {
        source = "reminders-page";
      } else if (pathname.includes("/studies")) {
        source = "studies-page";
      } else if (pathname.includes("/others")) {
        source = "others-page";
      } else if (pathname.includes("/dashboard")) {
        source = "dashboard-page";
      } else if (pathname.includes("/recordings")) {
        source = "recordings-page";
      }

      modalSourceRef.current = source;
      hasModalOpenedRef.current = true;

      const metadata: Record<string, unknown> = {
        modalId: "profile-modal",
        source,
      };

      console.log("📤 [ProfileModal] Enviando MODAL_OPENED:", {
        actionType: UserActionType.MODAL_OPENED,
        metadata,
      });

      trackAction(
        {
          actionType: UserActionType.MODAL_OPENED,
          metadata,
        },
        PostAPI,
      )
        .then(() => {
          console.log("✅ [ProfileModal] MODAL_OPENED enviado com sucesso");
        })
        .catch((error) => {
          console.error("❌ [ProfileModal] Erro ao registrar MODAL_OPENED:", error);
        });
    } else {
      console.log("⏭️ [ProfileModal] MODAL_OPENED não enviado:", {
        isOpen,
        hasModalOpenedRef: hasModalOpenedRef.current,
      });
    }
  }, [isOpen, pathname, PostAPI]);

  // Tracking: MODAL_CLOSED quando a modal é fechada
  useEffect(() => {
    console.log("🔍 [ProfileModal] useEffect MODAL_CLOSED:", {
      isOpen,
      hasModalOpenedRef: hasModalOpenedRef.current,
      saveStatus,
    });

    if (!isOpen && hasModalOpenedRef.current) {
      const reason = saveStatus === "success" ? "completed" : "cancelled";
      const metadata = {
        modalId: "profile-modal",
        source: modalSourceRef.current,
        reason,
      };

      console.log("📤 [ProfileModal] Enviando MODAL_CLOSED:", {
        actionType: UserActionType.MODAL_CLOSED,
        metadata,
      });

      trackAction(
        {
          actionType: UserActionType.MODAL_CLOSED,
          metadata,
        },
        PostAPI,
      )
        .then(() => {
          console.log("✅ [ProfileModal] MODAL_CLOSED enviado com sucesso");
        })
        .catch((error) => {
          console.error("❌ [ProfileModal] Erro ao registrar MODAL_CLOSED:", error);
        });

      hasModalOpenedRef.current = false;
    } else {
      console.log("⏭️ [ProfileModal] MODAL_CLOSED não enviado:", {
        isOpen,
        hasModalOpenedRef: hasModalOpenedRef.current,
      });
    }
  }, [isOpen, saveStatus, PostAPI]);

  // Sync form data with profile when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        cpfCnpj: profile.cpfCnpj ? maskCPFCNPJ(profile.cpfCnpj) : "",
        mobilePhone: profile.mobilePhone ? maskPhone(profile.mobilePhone) : "",
        address: profile.address || "",
        addressNumber: profile.addressNumber || "",
        postalCode: profile.postalCode
          ? maskPostalCode(profile.postalCode)
          : "",
      });
      setSaveStatus("idle");
      setErrorMessage("");
    }
  }, [isOpen, profile]);

  // Verificar se o botão tem data-tracking-id quando a modal está aberta
  useEffect(() => {
    if (isOpen) {
      // Aguardar um pouco para o DOM estar pronto
      const timer = setTimeout(() => {
        const saveButton = document.querySelector('[data-tracking-id="profile-modal-save"]');
        console.log("🔍 [ProfileModal] Verificando botão de salvar:", {
          buttonFound: !!saveButton,
          buttonElement: saveButton,
          buttonId: saveButton?.getAttribute("data-tracking-id"),
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🖱️ [ProfileModal] Botão de salvar clicado");
    
    setIsLoading(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      console.log("📤 [ProfileModal] Enviando dados do formulário:", formData);
      const response = await PutAPI("/user", formData, true);
      console.log("📥 [ProfileModal] Resposta da API:", response.status);

      if (response.status === 200) {
        console.log("✅ [ProfileModal] Perfil salvo com sucesso");
        setSaveStatus("success");
        // Update local profile state
        setProfile((prev: User | null) =>
          prev ? { ...prev, ...formData } : null,
        );
        // Refresh profile from API in background
        handleGetProfile(true);

        // Close modal after short delay on success
        setTimeout(() => {
          console.log("🔒 [ProfileModal] Fechando modal após sucesso");
          onOpenChange(false);
        }, 1500);
      } else {
        console.error("❌ [ProfileModal] Erro ao salvar:", response.body);
        setSaveStatus("error");
        setErrorMessage(response.body?.message || "Erro ao salvar alterações");
      }
    } catch (error) {
      console.error("❌ [ProfileModal] Erro ao conectar com o servidor:", error);
      setSaveStatus("error");
      setErrorMessage("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  console.log("🎨 [ProfileModal] Renderizando componente:", {
    isOpen,
    isLoading,
    saveStatus,
    hasModalOpenedRef: hasModalOpenedRef.current,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 sm:rounded-3xl">
        {/* Decorative Header */}
        <div className="relative h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          <DialogHeader className="absolute right-0 -bottom-12 left-0 z-10 flex flex-col items-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-indigo-500 shadow-xl">
                <UserIcon className="h-10 w-10 text-white" strokeWidth={1.5} />
              </div>
            </div>
            <DialogTitle className="sr-only">Editar Perfil</DialogTitle>
          </DialogHeader>
        </div>

        <div className="mt-14 px-8 pb-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-900">
              {formData.name || "Usuário"}
            </h2>
            <p className="text-sm text-gray-500">{formData.email}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="col-span-full">
                <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span>Informações Pessoais</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </h3>
              </div>

              <InputField
                label="Nome completo"
                value={formData.name}
                onChange={(value) => handleInputChange("name", value)}
                icon={UserIcon}
                placeholder="Seu nome"
              />

              <InputField
                label="E-mail"
                value={formData.email}
                onChange={(value) => handleInputChange("email", value)}
                icon={Mail}
                type="email"
                placeholder="seu@email.com"
                disabled
              />

              <InputField
                label="CPF/CNPJ"
                value={formData.cpfCnpj}
                onChange={(value) => handleInputChange("cpfCnpj", value)}
                icon={Hash}
                placeholder="000.000.000-00"
                mask={maskCPFCNPJ}
              />

              <InputField
                label="Telefone"
                value={formData.mobilePhone}
                onChange={(value) => handleInputChange("mobilePhone", value)}
                icon={Phone}
                placeholder="(00) 00000-0000"
                mask={maskPhone}
              />

              <div className="col-span-full mt-2">
                <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span>Endereço</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </h3>
              </div>

              <div className="col-span-full">
                <InputField
                  label="Endereço"
                  value={formData.address}
                  onChange={(value) => handleInputChange("address", value)}
                  icon={MapPin}
                  placeholder="Rua, Avenida..."
                />
              </div>

              <InputField
                label="Número"
                value={formData.addressNumber}
                onChange={(value) => handleInputChange("addressNumber", value)}
                icon={Hash}
                placeholder="123"
              />

              <InputField
                label="CEP"
                value={formData.postalCode}
                onChange={(value) => handleInputChange("postalCode", value)}
                icon={MapPin}
                placeholder="00000-000"
                mask={maskPostalCode}
              />
            </div>

            {/* Status Message */}
            {saveStatus !== "idle" && (
              <div
                className={cn(
                  "mt-6 flex items-center gap-2 rounded-xl p-3 text-sm",
                  saveStatus === "success" && "bg-green-50 text-green-700",
                  saveStatus === "error" && "bg-red-50 text-red-700",
                )}
              >
                {saveStatus === "success" ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Salvo com sucesso! Fechando...</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5" />
                    <span>{errorMessage}</span>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  console.log("🖱️ [ProfileModal] Botão cancelar clicado");
                  onOpenChange(false);
                }}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                data-tracking-id="profile-modal-save"
                onClick={(e) => {
                  console.log("🖱️ [ProfileModal] Botão salvar clicado (onClick handler)");
                  console.log("🔍 [ProfileModal] Elemento do botão:", {
                    element: e.currentTarget,
                    trackingId: e.currentTarget.getAttribute("data-tracking-id"),
                    disabled: e.currentTarget.disabled,
                  });
                }}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white",
                  "bg-gradient-to-r from-blue-500 to-indigo-600",
                  "shadow-lg shadow-blue-500/25",
                  "transition-all duration-200",
                  "hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30",
                  "focus:ring-4 focus:ring-blue-500/20 focus:outline-none",
                  "disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100",
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
