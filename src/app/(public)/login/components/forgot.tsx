"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";

import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import Field from "./field";
import { Form, FormField, FormItem, FormMessage } from "./form";

type ForgotPasswordProps = {
  onClick: () => void;
};

const EmailFormSchema = z.object({
  email: z.string().email({ message: "Email Inválido" }),
});

type EmailFormData = z.infer<typeof EmailFormSchema>;

const ForgotPassword = ({ onClick }: ForgotPasswordProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(EmailFormSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  async function handleSendResetEmail(data: EmailFormData) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email.trim() }),
      });

      if (response.ok) {
        setEmailSent(true);
        toast.success("Se o e-mail existir, um link de recuperação será enviado.");
      } else {
        // Mesmo em caso de erro, mostramos mensagem genérica por segurança
        setEmailSent(true);
        toast.success("Se o e-mail existir, um link de recuperação será enviado.");
      }
    } catch (error) {
      console.error("Erro ao solicitar recuperação de senha:", error);
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      form.handleSubmit(handleSendResetEmail)();
    }
  };

  // Tela de confirmação após envio do e-mail
  if (emailSent) {
    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => onClick()}
            data-tracking-id="forgot-password-back-button"
            className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para o login
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              E-mail enviado!
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Se o e-mail <strong>{form.getValues("email")}</strong> estiver
              cadastrado, você receberá um link para redefinir sua senha.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Verifique sua caixa de entrada e também a pasta de spam.
            </p>
          </div>

          <button
            onClick={() => {
              setEmailSent(false);
              form.reset();
            }}
            data-tracking-id="forgot-password-try-another-email-button"
            className="mt-2 text-sm text-primary hover:text-blue-700 hover:underline transition-colors"
          >
            Tentar com outro e-mail
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <button
          onClick={() => onClick()}
          data-tracking-id="forgot-password-back-to-login-button"
          className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para o login
        </button>
      </div>

      <Form {...form}>
        <div className="flex flex-col gap-4" onKeyDown={handleKeyPress}>
          <p className="text-sm text-gray-500">
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </p>

          <FormField
            key="email"
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormItem>
                <Field
                  placeholder="nome@exemplo.com"
                  label="Email"
                  Svg={<Mail size={20} />}
                  value={field.value}
                  onChange={field.onChange}
                  required
                  invalid={!!fieldState.error}
                />
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />
        </div>
        <div className="mt-6 flex w-full items-center justify-center gap-4">
          <button
            onClick={form.handleSubmit(handleSendResetEmail)}
            disabled={isLoading}
            data-tracking-id="forgot-password-submit-button"
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Enviar link de recuperação"
            )}
          </button>
        </div>
      </Form>
    </>
  );
};

export default ForgotPassword;
