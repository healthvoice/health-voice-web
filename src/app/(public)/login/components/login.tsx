"use client";

// Importações do React e Next.js
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Importações de bibliotecas
import { zodResolver } from "@hookform/resolvers/zod";
import { Amplify } from "aws-amplify";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import config from "../../../../utils/amplify.json";

// Importações de UI (shadcn/ui e lucide)
import { Eye, EyeOff, Loader2, LockIcon, Mail } from "lucide-react";
import Field from "./field"; // Assumindo que este componente exista
import { Form, FormField, FormItem, FormMessage } from "./form"; // Assumindo que este componente exista

// Importações do AWS Amplify (NOVO)
import { signIn, signInWithRedirect } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

import { useSession } from "@/context/auth"; // ← ADICIONE ISSO

// Props do componente
type SignInProps = {
  onClick: () => void; // Para "Esqueceu a senha?"
};

// Schema de validação do Zod (sem alteração)
const FormSchema = z.object({
  email: z.string().email({ message: "Email Inválido" }),
  password: z.string().min(6, "Senha inválida"),
});

type FormData = z.infer<typeof FormSchema>;

const SignIn = ({ onClick }: SignInProps) => {
  const { handleGetProfile, waitForTokens } = useSession();
  const router = useRouter();
  Amplify.configure(config);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Configuração do react-hook-form (sem alteração)
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Efeito para "ouvir" eventos de autenticação do Amplify
  useEffect(() => {
    const unsubscribe = Hub.listen("auth", async ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          setIsLoggingIn(true);
          try {
            await waitForTokens();
            await handleGetProfile(true);
            await new Promise((resolve) => setTimeout(resolve, 300));

            toast.success("Login efetuado com sucesso!");
            router.push("/");
          } catch (error) {
            console.error("Erro ao carregar perfil após login social:", error);
            toast.error("Erro ao carregar dados do usuário.");
          } finally {
            setIsLoggingIn(false);
          }
          break;

        case "signInWithRedirect_failure":
          console.error("Falha no login social:", payload.data);
          toast.error("Falha ao tentar login com rede social.");
          setIsLoggingIn(false);
          break;

        case "tokenRefresh_failure":
          console.error("Falha ao renovar token:", payload.data);
          toast.error("Sua sessão expirou. Faça login novamente.");
          router.push("/login");
          break;
      }
    });

    return () => unsubscribe();
  }, [router, handleGetProfile, waitForTokens]);

  const handleLogin = async (data: FormData) => {
    setIsLoggingIn(true);
    try {
      const { email, password } = data;
      console.log("entrando com email:",email, "e senha",password)
      const { isSignedIn } = await signIn({
        username: email.trim(),
        password: password.trim(),
        options: {
          authFlowType: "USER_PASSWORD_AUTH",
        },
      });
      console.log("resposta do email ",isSignedIn)
      if (isSignedIn) {
        const tokensReady = await waitForTokens();
        console.log("token ready?", )
        if (!tokensReady) {
          toast.error("Erro ao carregar sessão. Tente novamente.");
          return;
        }

        await handleGetProfile(true);
        await new Promise((resolve) => setTimeout(resolve, 300));

        toast.success("Login efetuado com sucesso!");
        router.push("/");
      } else {
        toast.error("Não foi possível completar o login. Tente novamente.");
      }
    } catch (err: unknown) {
      console.error("Erro no login:", err);
      const error = err as { name?: string };

      let errorMessage = "Erro ao efetuar login, tente novamente.";
      if (error.name === "UserNotFoundException") {
        errorMessage = "Usuário não encontrado.";
      } else if (error.name === "NotAuthorizedException") {
        errorMessage = "E-mail ou senha incorretos.";
      } else if (error.name === "NetworkError") {
        errorMessage = "Erro de rede. Verifique sua conexão.";
      } else if (error.name === "UserAlreadyAuthenticatedException") {
        errorMessage = "Você já está logado.";
        router.push("/");
        return;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithRedirect({
        provider: "Google",
      });
    } catch (error) {
      console.error("Erro ao iniciar Google SignIn:", error);
      toast.error("Não foi possível iniciar o login com Google.");
      setIsLoggingIn(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithRedirect({
        provider: "Apple",
      });
    } catch (error) {
      console.error("Erro ao iniciar Apple SignIn:", error);
      toast.error("Não foi possível iniciar o login com Apple.");
      setIsLoggingIn(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      form.handleSubmit(handleLogin)();
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleLogin)}
        className="flex flex-col gap-4"
        onKeyDown={handleKeyPress}
        noValidate
      >
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
                {...field}
                required
                invalid={!!fieldState.error}
              />
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          key="password"
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <FormItem>
              <div className="relative">
                <Field
                  placeholder="*********"
                  label="Senha"
                  Svg={<LockIcon size={20} />}
                  type={showPassword ? "text" : "password"}
                  {...field}
                  required
                  invalid={!!fieldState.error}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute bottom-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <span
            className="cursor-pointer text-sm text-gray-500 transition hover:text-primary hover:underline"
            onClick={onClick}
          >
            Esqueceu a senha?
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Entrando...</span>
            </>
          ) : (
            "Entrar na conta"
          )}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">ou entre com</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50"
          >
            <Image
              src="/icons/google-login.png"
              alt="Google"
              width={20}
              height={20}
              className="h-5 w-5"
            />
            Google
          </button>
          <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={isLoggingIn}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gradient-to-br from-gray-800 to-gray-950 font-medium text-white transition hover:from-gray-700 hover:to-gray-900 disabled:opacity-50"
          >
            <Image
              src="/icons/apple-login.png"
              alt="Apple"
              width={20}
              height={20}
              className="h-max object-contain w-4.5 brightness-0 invert"
            />
            Apple
          </button>
        </div>
      </form>
    </Form>
  );
};

export default SignIn;
