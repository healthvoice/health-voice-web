import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { handleApiError } from "@/utils/error-handler";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useForm, UseFormReturn } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
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

interface CreateClientSheetProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  /** Quando true, aplica classe para ficar clicável durante o tour (Driver.js) */
  tourActive?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClientCreated?: (client: any) => void;
}

const FormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional().nullable(),
});

export function CreateClientSheet({
  isOpen,
  onClose,
  className,
  tourActive,
  onClientCreated,
}: CreateClientSheetProps) {
  const { PostAPI } = useApiContext();
  const { GetClients, setClients } = useGeneralContext();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const useFormSteps = (form: UseFormReturn<z.infer<typeof FormSchema>>) => {
    const [activeStep, setActiveStep] = useState(0);

    const stepFields = {
      0: ["name", "description"] as const,
    };

    const validateStep = async (step: number) => {
      const fields = stepFields[step as keyof typeof stepFields];
      if (!fields) return true;
      return await form.trigger(fields);
    };

    return { activeStep, validateStep, setActiveStep };
  };

  const { validateStep } = useFormSteps(form);

  const handleNext = async (
    form: UseFormReturn<z.infer<typeof FormSchema>>,
  ) => {
    const isValid = await validateStep(0);
    if (!isValid) {
      const errors = form.formState.errors;

      const fieldLabels: Record<keyof z.infer<typeof FormSchema>, string> = {
        name: "Nome",
        description: "Descrição",
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
    } else {
      setIsLoading(true);
      const data = await PostAPI("/client", form.getValues(), true);
      if (data.status === 200) {
        toast.success("Formulário enviado com sucesso!");

        // Optimistic update
        // Check if response body has a client property or is the client itself
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawClient = (data.body.client || data.body) as any;
        console.log("DEBUG: Full data object:", JSON.stringify(data, null, 2));
        console.log(
          "DEBUG: Raw client from API:",
          JSON.stringify(rawClient, null, 2),
        );

        const newClient = {
          ...rawClient,
          id: rawClient.id || rawClient._id,
        };
        console.log("DEBUG: Normalized newClient:", newClient);

        setClients((prev) => [newClient, ...prev]);

        // Strategy: Force fetch clients to ensure we get the real ID from DB
        await GetClients();

        // Pass the form values effectively primarily for the name
        const finalClient = {
          ...newClient,
          name: form.getValues().name, // Ensure accurate name from input
        };

        if (onClientCreated) {
          console.log("DEBUG: Calling onClientCreated with:", finalClient);
          onClientCreated(finalClient);
        }

        setIsLoading(false);
        return onClose();
      }
      const errorMessage = handleApiError(
        data,
        "Falha ao enviar o formulário. Tente novamente.",
      );
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className={cn(
        "bg-opacity-50 fixed inset-0 z-[9999999] flex items-end justify-center bg-black/20 backdrop-blur-xs",
        isOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
        tourActive && "tour-create-client-sheet",
        className,
      )}
    >
      <div className="animate-slide-up w-full max-w-2xl rounded-t-3xl bg-white p-6">
        <Form {...form}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-100">
                  Nome do Paciente
                </FormLabel>
                <FormControl>
                  <Input
                    data-tour="create-client-name"
                    placeholder="Digite..."
                    type="text"
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                    className={cn("", {
                      "text-text-100 rounded-md border-red-500 focus:border-red-500":
                        form.formState.errors.name,
                    })}
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage className="font-base inline-flex h-[22px] items-center justify-center rounded-sm px-2 text-xs text-red-500" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-100">
                  Descrição do Paciente
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Digite..."
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                    className="h-32 resize-none"
                    autoComplete="off"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex w-full items-center justify-between">
            <button
              onClick={() => onClose()}
              className="my-4 h-10 w-max rounded-md border border-neutral-300 px-2 text-neutral-500 transition duration-200 hover:bg-transparent"
            >
              Fechar
            </button>
            <button
              data-tour="create-client-submit-btn"
              type="button"
              onClick={() => handleNext(form)}
              disabled={isLoading}
              className={cn(
                "border-primary bg-primary hover:text-primary my-4 flex h-10 min-w-40 items-center justify-center rounded-md border px-2 font-semibold text-white transition duration-200 hover:bg-transparent",
                isLoading && "text-primary bg-white",
              )}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Criar Paciente"
              )}
            </button>
          </div>
        </Form>
      </div>
    </div>,
    document.body,
  );
}
