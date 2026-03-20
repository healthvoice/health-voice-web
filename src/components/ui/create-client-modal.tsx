"use client";

import { ClientProps } from "@/@types/general-client";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { trackAction, UserActionType } from "@/services/actionTrackingService";
import { cn } from "@/utils/cn";
import { handleApiError } from "@/utils/error-handler";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import { Dialog, DialogContent } from "./blocks/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./blocks/form";
import { Input } from "./blocks/input";
import { Textarea } from "./blocks/textarea";

const FormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
});

interface CreateClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado após criar o paciente com sucesso */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClientCreated?: (client: any) => void;
  /** ID da modal pai (se esta modal foi aberta de dentro de outra modal) */
  parentModalId?: string;
  /** Source da modal (se não fornecido, será detectado automaticamente) */
  source?: string;
}

export function CreateClientModal({
  open,
  onOpenChange,
  onClientCreated,
  parentModalId,
  source: sourceProp,
}: CreateClientModalProps) {
  const { PostAPI } = useApiContext();
  const { GetClients, setClients } = useGeneralContext();
  const [isLoading, setIsLoading] = useState(false);

  const modalSourceRef = useRef<string>("clients-page");
  const hasModalOpenedRef = useRef<boolean>(false);

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
      // Determinar source da modal
      let source = sourceProp || "clients-page";
      if (!sourceProp) {
        const pathname = window.location.pathname;
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
        }
      }
      
      modalSourceRef.current = source;
      hasModalOpenedRef.current = true;

      const metadata: Record<string, unknown> = {
        modalId: "create-client-modal",
        source,
      };

      if (parentModalId) {
        metadata.parentModalId = parentModalId;
      }

      trackAction(
        {
          actionType: UserActionType.MODAL_OPENED,
          metadata,
        },
        PostAPI,
      ).catch((error) => {
        console.warn("Erro ao registrar MODAL_OPENED:", error);
      });
    }
  }, [open, sourceProp, parentModalId, PostAPI]);

  // Tracking: MODAL_CLOSED quando a modal é fechada
  useEffect(() => {
    if (!open && hasModalOpenedRef.current) {
      trackAction(
        {
          actionType: UserActionType.MODAL_CLOSED,
          metadata: {
            modalId: "create-client-modal",
            source: modalSourceRef.current,
            reason: "cancelled",
          },
        },
        PostAPI,
      ).catch((error) => {
        console.warn("Erro ao registrar MODAL_CLOSED:", error);
      });
      hasModalOpenedRef.current = false;
    }
  }, [open, PostAPI]);

  useEffect(() => {
    if (!open) {
      form.reset({ name: "", description: "", birthDate: "" });
      hasModalOpenedRef.current = false;
    }
  }, [open, form]);

  const validateStep = async (step: number) => {
    const stepFields = { 0: ["name", "description", "birthDate"] as const };
    const fields = stepFields[step as keyof typeof stepFields];
    if (!fields) return true;
    return await form.trigger(fields);
  };

  const handleSubmit = async (
    formInstance: UseFormReturn<z.infer<typeof FormSchema>>,
  ) => {
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
    const data = await PostAPI("/client", payload, true);
    if (data.status === 200) {
      toast.success("Paciente cadastrado com sucesso!");
      const rawClient = (data.body?.client ?? data.body) as Record<string, unknown>;
      const newClient: ClientProps = {
        ...rawClient,
        id: String(rawClient.id ?? rawClient._id ?? ""),
        name: String(rawClient.name ?? values.name),
        userId: String(rawClient.userId ?? ""),
        description: rawClient.description != null ? String(rawClient.description) : null,
        birthDate: rawClient.birthDate != null ? String(rawClient.birthDate) : null,
        createdAt: rawClient.createdAt != null ? new Date(rawClient.createdAt as string) : new Date(),
      };
      
      // Tracking: CLIENT_CREATED quando cliente é criado com sucesso
      const clientId = newClient.id;
      const metadata: Record<string, unknown> = {
        clientId,
        modalId: "create-client-modal",
        source: modalSourceRef.current,
      };

      if (parentModalId) {
        metadata.parentModalId = parentModalId;
      }

      trackAction(
        {
          actionType: UserActionType.CLIENT_CREATED,
          metadata,
        },
        PostAPI,
      ).catch((error) => {
        console.warn("Erro ao registrar CLIENT_CREATED:", error);
      });

      setClients((prev) => [newClient, ...prev]);
      await GetClients();
      const finalClient = {
        ...newClient,
        name: formInstance.getValues().name,
      };
      onClientCreated?.(finalClient);
      setIsLoading(false);
      onOpenChange(false);
      return;
    }
    const errorMessage = handleApiError(
      data,
      "Falha ao cadastrar paciente. Tente novamente.",
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
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Novo Paciente
                </h2>
                <p className="text-xs text-gray-400">
                  Cadastre um novo paciente na plataforma
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
              data-tracking-id="create-client-close-button"
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
                    Preencha os dados do paciente. Nome é obrigatório; descrição e data de nascimento são opcionais.
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
                          data-tour="create-client-name"
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
              className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              data-tracking-id="create-client-cancel-button"
            >
              Cancelar
            </button>
            <button
              data-tour="create-client-submit-btn"
              type="button"
              onClick={() => handleSubmit(form)}
              disabled={isLoading}
              className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-70"
              data-tracking-id="create-client-submit-button"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Criar Paciente"
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
