"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, Loader2, LockIcon, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import { usePageView } from "@/hooks/usePageView";
import { useButtonTracking } from "@/hooks/useButtonTracking";
import Field from "../login/components/field";
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from "../login/components/form";

const PasswordFormSchema = z
  .object({
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Senhas não coincidem",
    path: ["confirm"],
  });

type PasswordFormData = z.infer<typeof PasswordFormSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(PasswordFormSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirm: "",
    },
  });

  async function handleResetPassword(data: PasswordFormData) {
    if (!token) {
      toast.error("Token de recuperação não encontrado.");
      return;
    }

    setIsLoading(true);
    setResetError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        toast.success("Senha redefinida com sucesso!");
      } else {
        const message = result.message || "Erro ao redefinir senha.";
        setResetError(message);
        toast.error(message);
      }
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      toast.error("Erro de conexão. Verifique sua internet.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      form.handleSubmit(handleResetPassword)();
    }
  };

  // Token inválido ou ausente
  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Link inválido
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Este link de recuperação de senha é inválido ou já expirou.
          </p>
        </div>
        <Link
          href="/login"
          data-tracking-id="reset-password-back-to-login-link"
          data-tracking-destination="/login"
          className="mt-2 text-sm text-primary font-semibold hover:text-blue-700 hover:underline transition-colors"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  // Sucesso
  if (resetSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Senha redefinida!
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Sua senha foi alterada com sucesso. Agora você pode fazer login com
            a nova senha.
          </p>
        </div>
        <Link
          href="/login"
          data-tracking-id="reset-password-success-login-link"
          data-tracking-destination="/login"
          className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-blue-600"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      {resetError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {resetError}
        </div>
      )}

      <Form {...form}>
        <div className="flex flex-col gap-4" onKeyDown={handleKeyPress}>
          <p className="text-sm text-gray-500">
            Defina sua nova senha abaixo.
          </p>

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <div className="relative">
                  <Field
                    placeholder="Nova senha"
                    label="Nova Senha"
                    Svg={<LockIcon size={20} />}
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
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm"
            render={({ field, fieldState }) => (
              <FormItem>
                <div className="relative">
                  <Field
                    placeholder="Confirme a nova senha"
                    label="Confirmar Senha"
                    Svg={<LockIcon size={20} />}
                    type={showConfirm ? "text" : "password"}
                    value={field.value}
                    onChange={field.onChange}
                    required
                    invalid={!!fieldState.error}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6 flex w-full items-center justify-center gap-4">
          <button
            onClick={form.handleSubmit(handleResetPassword)}
            disabled={isLoading}
            data-tracking-id="reset-password-submit-button"
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Redefinir senha"
            )}
          </button>
        </div>
      </Form>

      <div className="mt-4 text-center">
        <Link
          href="/login"
          data-tracking-id="reset-password-bottom-back-link"
          data-tracking-destination="/login"
          className="text-sm text-gray-500 hover:text-primary hover:underline transition-colors"
        >
          Voltar para o login
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  // Tracking de visualização de tela
  usePageView();
  // Tracking de botões
  useButtonTracking();
  
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logos/logo-dark.png"
              alt="Health Voice"
              width={200}
              height={60}
              className="h-10 w-auto object-contain"
            />
          </div>

          <h2 className="text-3xl font-bold text-gray-900">
            Redefinir senha
          </h2>
          <p className="mt-2 text-gray-500">
            Crie uma nova senha para sua conta
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
