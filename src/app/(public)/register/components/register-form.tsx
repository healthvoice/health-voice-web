/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession } from "@/context/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LockIcon, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import Field from "../../login/components/field";
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from "../../login/components/form";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";
import { TermsOfUseModal } from "./TermsOfUseModal";
import { useApiContext } from "@/context/ApiContext";
import { useTrackingContext } from "@/context/TrackingContext";
import { Platform } from "@/services/analyticsService";
const FormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email({ message: "Email Inválido" }),
  password: z
    .object({
      password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
      confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
      message: "Senhas não coincidem",
      path: ["confirm"],
    }),
});

const RegisterForm = () => {
  const { handleGetProfile } = useSession();
  const router = useRouter();
  const { PostAPI } = useApiContext();
  const { sessionId } = useTrackingContext();
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRememberPassword, setShowRememberPassword] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  
  // Debounce timers para tracking de inputs
  const nameDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const emailDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: {
        password: "",
        confirm: "",
      },
    },
  });

  // Tracking de debounce de inputs (não rastrear senhas)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (!sessionId) return;
      
      // Não rastrear senhas
      if (name === "password.password" || name === "password.confirm") {
        return;
      }
      
      // Limpar timer anterior
      if (name === "name" && nameDebounceRef.current) {
        clearTimeout(nameDebounceRef.current);
      }
      if (name === "email" && emailDebounceRef.current) {
        clearTimeout(emailDebounceRef.current);
      }
      
      // Criar novo timer para debounce (500ms conforme guia)
      const debounceTimer = setTimeout(async () => {
        try {
          const fieldValue = name === "name" ? value.name : value.email;
          if (fieldValue && fieldValue.length > 0) {
            await PostAPI(
              "/analytics/actions",
              {
                actionType: "BUTTON_CLICKED", // Usar BUTTON_CLICKED para inputs também
                platform: Platform.WEB,
                metadata: {
                  field: name,
                  hasValue: true,
                  valueLength: fieldValue.length,
                },
              },
              true
            );
            
            if (process.env.NODE_ENV === "development") {
              console.log("📝 [Tracking] Campo com debounce rastreado:", {
                field: name,
                hasValue: true,
              });
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("❌ [Tracking] Erro ao rastrear campo:", error);
          }
        }
      }, 500);
      
      if (name === "name") {
        nameDebounceRef.current = debounceTimer;
      } else if (name === "email") {
        emailDebounceRef.current = debounceTimer;
      }
    });
    
    return () => {
      subscription.unsubscribe();
      if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    };
  }, [form, sessionId, PostAPI]);

  const handleRegister = async (data: z.infer<typeof FormSchema>) => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const { name, email, password } = data;
      const passwordValue = password.password;

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: passwordValue,
          registrationPlatform: "WEB",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Tratar erros específicos
        if (response.status === 400) {
          const message = result.message || "";

          if (
            message.toLowerCase().includes("já existe") ||
            message.toLowerCase().includes("already")
          ) {
            form.setError("email", {
              type: "manual",
              message: "Este e-mail já está cadastrado.",
            });
            toast.error(
              "E-mail já cadastrado. Tente fazer login ou recuperar a senha.",
            );
            return;
          }

          if (
            message.toLowerCase().includes("senha") ||
            message.toLowerCase().includes("password")
          ) {
            form.setError("password.password", {
              type: "manual",
              message: "Senha não atende aos requisitos do sistema.",
            });
            toast.error("Senha inválida. Use pelo menos 8 caracteres.");
            return;
          }

          toast.error(message || "Dados inválidos.");
          return;
        }

        if (response.status === 429) {
          toast.error("Muitas tentativas. Tente novamente em alguns minutos.");
          return;
        }

        toast.error(result.message || "Erro ao criar conta. Tente novamente.");
        return;
      }

      // Registro bem-sucedido — cookies já foram setados pelo Route Handler
      toast.success("Conta criada com sucesso!");
      await handleGetProfile(true);
      router.push("/");
    } catch (err: any) {
      console.error("Erro no registro:", err);
      toast.error("Sem conexão. Verifique sua internet e tente novamente.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      form.handleSubmit(handleRegister)();
    }
  };

  return (
    <Form {...form}>
      <div className="flex flex-col gap-4" onKeyDown={handleKeyPress}>
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <Field
                placeholder="Nome Completo"
                label="Nome"
                name="name"
                autoComplete="name"
                Svg={<User className="text-blue-400" size={20} />}
                value={field.value}
                onChange={field.onChange}
                required
                invalid={!!fieldState.error}
              />
              <FormMessage className="ml-1 text-xs font-medium text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <Field
                placeholder="seu@email.com"
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                Svg={<Mail className="text-blue-400" size={20} />}
                value={field.value}
                onChange={field.onChange}
                required
                invalid={!!fieldState.error}
              />
              <FormMessage className="ml-1 text-xs font-medium text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password.password"
          render={({ field, fieldState }) => (
            <FormItem>
              <div className="relative">
                <Field
                  placeholder="********"
                  label="Senha"
                  name="new-password"
                  autoComplete="new-password"
                  Svg={<LockIcon className="text-blue-400" size={20} />}
                  type={showPassword ? "text" : "password"}
                  value={field.value}
                  onChange={field.onChange}
                  required
                  invalid={!!fieldState.error}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <FormMessage className="ml-1 text-xs font-medium text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password.confirm"
          render={({ field, fieldState }) => (
            <FormItem>
              <div className="relative">
                <Field
                  placeholder="********"
                  label="Confirmar Senha"
                  name="confirm-password"
                  autoComplete="new-password"
                  Svg={<LockIcon className="text-blue-400" size={20} />}
                  type={showRememberPassword ? "text" : "password"}
                  value={field.value}
                  onChange={field.onChange}
                  required
                  invalid={!!fieldState.error}
                />
                <button
                  type="button"
                  onClick={() => setShowRememberPassword(!showRememberPassword)}
                  className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showRememberPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              <FormMessage className="ml-1 text-xs font-medium text-red-500" />
            </FormItem>
          )}
        />
      </div>

      <div className="mt-6 flex w-full flex-col gap-4">
        <button
          onClick={form.handleSubmit(handleRegister)}
          disabled={isCreating}
          data-tracking-id="register-submit-button"
          className="bg-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isCreating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Criando conta...</span>
            </>
          ) : (
            "Criar minha conta"
          )}
        </button>

        <p className="text-center text-xs text-gray-500">
          Ao criar uma conta, você aceita nossos{" "}
          <button
            type="button"
            onClick={() => setTermsModalOpen(true)}
            data-tracking-id="register-terms-link"
            className="text-primary font-medium hover:underline"
          >
            Termos de Serviço
          </button>{" "}
          e{" "}
          <button
            type="button"
            onClick={() => setPrivacyModalOpen(true)}
            data-tracking-id="register-privacy-link"
            className="text-primary font-medium hover:underline"
          >
            Política de Privacidade
          </button>
          .
        </p>
        <TermsOfUseModal
          open={termsModalOpen}
          onOpenChange={setTermsModalOpen}
        />
        <PrivacyPolicyModal
          open={privacyModalOpen}
          onOpenChange={setPrivacyModalOpen}
        />
      </div>
    </Form>
  );
};

export default RegisterForm;
