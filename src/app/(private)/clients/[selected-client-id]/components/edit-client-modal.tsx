"use client";

import { ClientProps } from "@/@types/general-client";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { handleApiError } from "@/utils/error-handler";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import { trackAction, UserActionType } from "@/services/actionTrackingService";
import { Dialog, DialogContent } from "@/components/ui/blocks/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/blocks/form";
import { Input } from "@/components/ui/blocks/input";
import { Textarea } from "@/components/ui/blocks/textarea";

const FormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
});

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientProps | null;
}

export function EditClientModal({
  open,
  onOpenChange,
  client,
}: EditClientModalProps) {
  const { PutAPI, PostAPI } = useApiContext();
  const { setSelectedClient, GetClients, setClients } = useGeneralContext();
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const hasModalOpenedRef = useRef(false);
  const modalSourceRef = useRef<string>("");

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      birthDate: "",
    },
  });

  // Tracking: MODAL_OPENED quando a modal é aberta
  useEffect(() => {
    if (open && !hasModalOpenedRef.current) {
      // Identificar origem da modal
      let source = "unknown";
      if (pathname.includes("/clients/")) {
        source = "clients-page";
      } else if (pathname.includes("/dashboard")) {
        source = "dashboard-page";
      }

      modalSourceRef.current = source;
      hasModalOpenedRef.current = true;

      const metadata: Record<string, unknown> = {
        modalId: "edit-client-modal",
        source,
        clientId: client?.id,
      };

      if (process.env.NODE_ENV === "development") {
        console.log("📤 [EditClientModal] Enviando MODAL_OPENED:", {
          actionType: UserActionType.MODAL_OPENED,
          metadata,
        });
      }

      trackAction(
        {
          actionType: UserActionType.MODAL_OPENED,
          metadata,
        },
        PostAPI,
      )
        .then(() => {
          if (process.env.NODE_ENV === "development") {
            console.log("✅ [EditClientModal] MODAL_OPENED enviado com sucesso");
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === "development") {
            console.error("❌ [EditClientModal] Erro ao registrar MODAL_OPENED:", error);
          }
        });
    }
  }, [open, pathname, client?.id, PostAPI]);

  // Tracking: MODAL_CLOSED quando a modal é fechada
  useEffect(() => {
    if (!open && hasModalOpenedRef.current) {
      const metadata = {
        modalId: "edit-client-modal",
        source: modalSourceRef.current,
        clientId: client?.id,
      };

      if (process.env.NODE_ENV === "development") {
        console.log("📤 [EditClientModal] Enviando MODAL_CLOSED:", {
          actionType: UserActionType.MODAL_CLOSED,
          metadata,
        });
      }

      trackAction(
        {
          actionType: UserActionType.MODAL_CLOSED,
          metadata,
        },
        PostAPI,
      )
        .then(() => {
          if (process.env.NODE_ENV === "development") {
            console.log("✅ [EditClientModal] MODAL_CLOSED enviado com sucesso");
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === "development") {
            console.error("❌ [EditClientModal] Erro ao registrar MODAL_CLOSED:", error);
          }
        });

      hasModalOpenedRef.current = false;
    }
  }, [open, client?.id, PostAPI]);

  useEffect(() => {
    if (!open || !client) return;
    const raw = client.birthDate;
    let birthDateValue = "";
    if (raw && typeof raw === "string" && raw.trim()) {
      const trimmed = raw.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        birthDateValue = trimmed;
      } else {
        const date = new Date(trimmed);
        if (!Number.isNaN(date.getTime())) {
          birthDateValue = date.toISOString().split("T")[0];
        }
      }
    }
    form.reset({
      name: client.name ?? "",
      description: client.description ?? "",
      birthDate: birthDateValue,
    });
  }, [open, client, form]);

  const validateStep = async (step: number) => {
    const stepFields = { 0: ["name", "description", "birthDate"] as const };
    const fields = stepFields[step as keyof typeof stepFields];
    if (!fields) return true;
    return await form.trigger(fields);
  };

  const handleSubmit = async (
    formInstance: UseFormReturn<z.infer<typeof FormSchema>>,
  ) => {
    if (!client?.id) {
      toast.error("Paciente não encontrado.");
      return;
    }

    const isValid = await validateStep(0);
    if (!isValid) {
      const errors = formInstance.formState.errors;
      const fieldLabels: Record<keyof z.infer<typeof FormSchema>, string> = {
        name: "Nome",
        description: "Descrição",
        birthDate: "Data de nascimento",
      };
      const firstErrorField = Object.keys(
        errors,
      )[0] as keyof typeof fieldLabels;
      const firstError = errors[firstErrorField];
      if (firstError?.message && firstErrorField in fieldLabels) {
        const fieldLabel = fieldLabels[firstErrorField];
        return toast.error(`${fieldLabel}: ${firstError.message}`);
      }
      return toast.error("Por favor, corrija os erros no formulário.");
    }

    setIsLoading(true);
    const values = formInstance.getValues();
    const payload = {
      name: values.name,
      description: values.description?.trim() || null,
      birthDate: values.birthDate?.trim() || null,
    };

    const data = await PutAPI(`/client/${client.id}`, payload, true);

    if (data.status === 200) {
      toast.success("Paciente atualizado com sucesso!");
      const rawClient = (data.body?.client ?? data.body) as Record<string, unknown>;
      const updatedClient: ClientProps = {
        ...client,
        name: String(rawClient.name ?? values.name),
        description: rawClient.description != null ? String(rawClient.description) : null,
        birthDate: rawClient.birthDate != null ? String(rawClient.birthDate) : null,
      };
      setSelectedClient(updatedClient);
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? updatedClient : c)),
      );
      await GetClients();

      // Tracking: CLIENT_UPDATED quando cliente é atualizado com sucesso
      const metadata: Record<string, unknown> = {
        clientId: client.id,
        fieldsUpdated: {
          name: values.name !== client.name,
          description: values.description !== (client.description ?? ""),
          birthDate: values.birthDate !== (client.birthDate ?? ""),
        },
      };

      if (process.env.NODE_ENV === "development") {
        console.log("📤 [EditClientModal] Enviando CLIENT_UPDATED:", {
          actionType: UserActionType.CLIENT_UPDATED,
          metadata,
        });
      }

      trackAction(
        {
          actionType: UserActionType.CLIENT_UPDATED,
          metadata,
        },
        PostAPI,
      )
        .then(() => {
          if (process.env.NODE_ENV === "development") {
            console.log("✅ [EditClientModal] CLIENT_UPDATED enviado com sucesso");
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === "development") {
            console.error("❌ [EditClientModal] Erro ao registrar CLIENT_UPDATED:", error);
          }
        });

      setIsLoading(false);
      onOpenChange(false);
      return;
    }

    const errorMessage = handleApiError(
      data,
      "Falha ao atualizar paciente. Tente novamente.",
    );
    toast.error(errorMessage);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-0 p-0 shadow-2xl sm:rounded-3xl">
        <div className="flex flex-col overflow-hidden rounded-3xl bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/20">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Editar Paciente
                </h2>
                <p className="text-xs text-gray-400">
                  Atualize os dados do paciente
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              data-tracking-id="edit-client-modal-close"
              className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto px-6 py-5"
            style={{ maxHeight: "70vh" }}
          >
            <Form {...form}>
              <form className="space-y-5">
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <p className="text-sm text-gray-700">
                    Altere nome, descrição ou data de nascimento. Nome é obrigatório.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-600">
                        Nome do Paciente
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o nome..."
                          type="text"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className={cn(
                            "rounded-xl border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                            form.formState.errors.name && "border-red-500 focus:border-red-500 focus:ring-red-500"
                          )}
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-600">
                        Descrição{" "}
                        <span className="font-normal text-gray-400">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Digite uma descrição..."
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-24 resize-none rounded-xl border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          autoComplete="off"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-600">
                        Data de nascimento{" "}
                        <span className="font-normal text-gray-400">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="rounded-xl border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          max={new Date().toISOString().split("T")[0]}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              data-tracking-id="edit-client-modal-cancel"
              className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(form)}
              disabled={isLoading}
              data-tracking-id="edit-client-modal-save"
              className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
