"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/blocks/dialog";
import { useApiContext } from "@/context/ApiContext";
import { User, useSession } from "@/context/auth";
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
import { useEffect, useState } from "react";

interface FormData {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone: string;
  address: string;
  addressNumber: string;
  postalCode: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ isOpen, onOpenChange }: ProfileModalProps) {
  const { profile, setProfile, handleGetProfile } = useSession();
  const { PutAPI } = useApiContext();

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

  // Sync form data with profile when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        cpfCnpj: profile.cpfCnpj || "",
        mobilePhone: profile.mobilePhone || "",
        address: profile.address || "",
        addressNumber: profile.addressNumber || "",
        postalCode: profile.postalCode || "",
      });
      setSaveStatus("idle");
      setErrorMessage("");
    }
  }, [isOpen, profile]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      const response = await PutAPI("/user", formData, true);

      if (response.status === 200) {
        setSaveStatus("success");
        // Update local profile state
        setProfile((prev: User | null) =>
          prev ? { ...prev, ...formData } : null,
        );
        // Refresh profile from API in background
        handleGetProfile(true);

        // Close modal after short delay on success
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        setSaveStatus("error");
        setErrorMessage(response.body?.message || "Erro ao salvar alterações");
      }
    } catch {
      setSaveStatus("error");
      setErrorMessage("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({
    label,
    field,
    icon: Icon,
    type = "text",
    placeholder,
    disabled = false,
  }: {
    label: string;
    field: keyof FormData;
    icon: React.ElementType;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
  }) => (
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
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
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
                field="name"
                icon={UserIcon}
                placeholder="Seu nome"
              />

              <InputField
                label="E-mail"
                field="email"
                icon={Mail}
                type="email"
                placeholder="seu@email.com"
                disabled
              />

              <InputField
                label="CPF/CNPJ"
                field="cpfCnpj"
                icon={Hash}
                placeholder="000.000.000-00"
              />

              <InputField
                label="Telefone"
                field="mobilePhone"
                icon={Phone}
                placeholder="(00) 00000-0000"
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
                  field="address"
                  icon={MapPin}
                  placeholder="Rua, Avenida..."
                />
              </div>

              <InputField
                label="Número"
                field="addressNumber"
                icon={Hash}
                placeholder="123"
              />

              <InputField
                label="CEP"
                field="postalCode"
                icon={MapPin}
                placeholder="00000-000"
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
                onClick={() => onOpenChange(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
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
