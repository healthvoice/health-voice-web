"use client";

// Importações do React e Next.js
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Importações de bibliotecas
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

// Importações de UI (shadcn/ui e lucide)
import { Eye, EyeOff, Loader2, LockIcon, Mail } from "lucide-react";
import Field from "./field";
import { Form, FormField, FormItem, FormMessage } from "./form";

import { useSession } from "@/context/auth";
import { useApiContext } from "@/context/ApiContext";
import { useTrackingContext } from "@/context/TrackingContext";
import { Platform } from "@/services/analyticsService";
// Props do componente
type SignInProps = {
  onClick: () => void; // Para "Esqueceu a senha?"
};

// Schema de validação do Zod
const FormSchema = z.object({
  email: z.string().email({ message: "Email Inválido" }),
  password: z.string().min(6, "Senha inválida"),
});

type FormData = z.infer<typeof FormSchema>;

// Declaração de tipo para a Apple Sign-In JS SDK
declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: {
            id_token: string;
            code: string;
          };
          user?: {
            name?: {
              firstName?: string;
              lastName?: string;
            };
            email?: string;
          };
        }>;
      };
    };
  }
}

const SignIn = ({ onClick }: SignInProps) => {
  const { handleGetProfile } = useSession();
  const router = useRouter();
  const { PostAPI } = useApiContext();
  const { sessionId } = useTrackingContext();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const loginStartTimeRef = useRef<number | null>(null);

  // Configuração do react-hook-form
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Inicializar Google Identity Services e Apple Sign-In SDK
  useEffect(() => {
    // Carrega o Google Identity Services
    const googleScript = document.createElement("script");
    googleScript.src = "https://accounts.google.com/gsi/client";
    googleScript.async = true;
    googleScript.defer = true;
    document.head.appendChild(googleScript);

    // Carrega o Apple Sign-In JS SDK
    const appleScript = document.createElement("script");
    appleScript.src =
      "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    appleScript.async = true;
    appleScript.onload = () => {
      if (window.AppleID) {
        window.AppleID.auth.init({
          clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "",
          scope: "name email",
          redirectURI: window.location.origin,
          usePopup: true,
        });
      }
    };
    document.head.appendChild(appleScript);

    return () => {
      // Cleanup: remove os scripts se o componente desmontar
      if (googleScript.parentNode) {
        googleScript.parentNode.removeChild(googleScript);
      }
      if (appleScript.parentNode) {
        appleScript.parentNode.removeChild(appleScript);
      }
    };
  }, []);


  // Login com email/senha
  const handleLogin = async (data: FormData) => {
    // Marcar início do login para tracking de tempo
    loginStartTimeRef.current = Date.now();
    setIsLoggingIn(true);
    try {
      const { email, password } = data;

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = "Erro ao efetuar login, tente novamente.";

        if (response.status === 401) {
          errorMessage = "E-mail ou senha incorretos.";
        } else if (result.message) {
          errorMessage = result.message;
        }

        toast.error(errorMessage);
        loginStartTimeRef.current = null; // Reset em caso de erro
        return;
      }

      // Login bem-sucedido — cookies já foram setados pelo Route Handler
      await handleGetProfile(true);
      
      // Aguardar um pequeno delay para garantir que sessionId foi atualizado no contexto
      // O handleGetProfile cria a sessão, mas o contexto pode levar um momento para atualizar
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Rastrear tempo de login e enviar LOGIN_COMPLETED
      // Nota: Enviamos mesmo sem sessionId porque o backend usa userId do token JWT
      if (loginStartTimeRef.current) {
        const loginDuration = Date.now() - loginStartTimeRef.current;
        try {
          // Tentar obter sessionId atualizado do contexto
          // Se não estiver disponível ainda, enviamos mesmo assim (backend usa userId do token)
          await PostAPI(
            "/analytics/actions",
            {
              actionType: "LOGIN_COMPLETED",
              platform: Platform.WEB,
              metadata: {
                duration: loginDuration,
                loginMethod: "email",
                hasSessionId: !!sessionId,
              },
            },
            true
          );
          
          if (process.env.NODE_ENV === "development") {
            console.log("✅ [Tracking] Login completado rastreado:", {
              duration: `${loginDuration}ms`,
              loginMethod: "email",
              sessionId: sessionId || "não disponível ainda",
            });
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("❌ [Tracking] Erro ao rastrear login:", error);
          }
        }
      }
      
      toast.success("Login efetuado com sucesso!");
      router.push("/");
    } catch (err) {
      console.error("Erro no login:", err);
      toast.error("Erro de conexão. Verifique sua internet.");
      loginStartTimeRef.current = null; // Reset em caso de erro
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Sign-In usando Google Identity Services diretamente
  const handleGoogleSignIn = async () => {
    // Marcar início do login para tracking de tempo
    loginStartTimeRef.current = Date.now();
    setIsLoggingIn(true);
    try {
      // Verifica se o Google Identity Services está carregado
      if (typeof window === 'undefined' || !(window as any).google) {
        toast.error("Google Sign-In não está disponível no momento. Aguarde alguns segundos e tente novamente.");
        setIsLoggingIn(false);
        return;
      }

      const google = (window as any).google;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      if (!clientId) {
        toast.error("Configuração do Google Sign-In não encontrada.");
        setIsLoggingIn(false);
        return;
      }

      // Inicializa o Google Identity Services
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (!response.credential) {
            toast.error("Não foi possível obter o token do Google.");
            setIsLoggingIn(false);
            return;
          }

          try {
            const apiResponse = await fetch("/api/auth/social/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                idToken: response.credential,
                registrationPlatform: "WEB",
              }),
            });

            const result = await apiResponse.json();

            if (!apiResponse.ok) {
              toast.error(result.message || "Erro no login com Google.");
              return;
            }

            await handleGetProfile(true);
            
            // Aguardar um pequeno delay para garantir que sessionId foi atualizado no contexto
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Rastrear tempo de login e enviar LOGIN_COMPLETED
            // Nota: Enviamos mesmo sem sessionId porque o backend usa userId do token JWT
            if (loginStartTimeRef.current) {
              const loginDuration = Date.now() - loginStartTimeRef.current;
              try {
                await PostAPI(
                  "/analytics/actions",
                  {
                    actionType: "LOGIN_COMPLETED",
                    platform: Platform.WEB,
                    metadata: {
                      duration: loginDuration,
                      loginMethod: "google",
                      hasSessionId: !!sessionId,
                    },
                  },
                  true
                );
                
                if (process.env.NODE_ENV === "development") {
                  console.log("✅ [Tracking] Login completado rastreado:", {
                    duration: `${loginDuration}ms`,
                    loginMethod: "google",
                    sessionId: sessionId || "não disponível ainda",
                  });
                }
              } catch (error) {
                if (process.env.NODE_ENV === "development") {
                  console.error("❌ [Tracking] Erro ao rastrear login:", error);
                }
              }
            }
            
            toast.success("Login efetuado com sucesso!");
            router.push("/");
          } catch (error) {
            console.error("Erro no Google Sign-In:", error);
            toast.error("Erro ao processar login com Google.");
            loginStartTimeRef.current = null; // Reset em caso de erro
          } finally {
            setIsLoggingIn(false);
          }
        },
      });

      // Renderiza um botão invisível e clica nele programaticamente
      if (googleButtonRef.current) {
        google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            theme: "outline",
            size: "large",
            text: "signin_with",
            width: "100%",
            type: "standard",
          }
        );

        // Aguarda a renderização e então clica no botão
        setTimeout(() => {
          const button = googleButtonRef.current?.querySelector('div[role="button"]') as HTMLElement;
          if (button) {
            button.click();
          } else {
            setIsLoggingIn(false);
            toast.error("Não foi possível iniciar o login com Google.");
          }
        }, 200);
      }
    } catch (error) {
      console.error("Erro ao iniciar Google Sign-In:", error);
      toast.error("Erro ao iniciar o login com Google.");
      setIsLoggingIn(false);
    }
  };

  // Apple Sign-In via Apple JS SDK
  const handleAppleSignIn = async () => {
    if (!window.AppleID) {
      toast.error("Apple Sign-In não está disponível no momento.");
      return;
    }

    // Marcar início do login para tracking de tempo
    loginStartTimeRef.current = Date.now();
    setIsLoggingIn(true);
    try {
      const appleResponse = await window.AppleID.auth.signIn();

      const identityToken = appleResponse.authorization.id_token;
      const fullName = appleResponse.user?.name
        ? `${appleResponse.user.name.firstName || ""} ${appleResponse.user.name.lastName || ""}`.trim()
        : undefined;

      const response = await fetch("/api/auth/social/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identityToken,
          fullName: fullName || undefined,
          registrationPlatform: "WEB",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Erro no login com Apple.");
        return;
      }

      await handleGetProfile(true);
      
      // Aguardar um pequeno delay para garantir que sessionId foi atualizado no contexto
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Rastrear tempo de login e enviar LOGIN_COMPLETED
      // Nota: Enviamos mesmo sem sessionId porque o backend usa userId do token JWT
      if (loginStartTimeRef.current) {
        const loginDuration = Date.now() - loginStartTimeRef.current;
        try {
          await PostAPI(
            "/analytics/actions",
            {
              actionType: "LOGIN_COMPLETED",
              platform: Platform.WEB,
              metadata: {
                duration: loginDuration,
                loginMethod: "apple",
                hasSessionId: !!sessionId,
              },
            },
            true
          );
          
          if (process.env.NODE_ENV === "development") {
            console.log("✅ [Tracking] Login completado rastreado:", {
              duration: `${loginDuration}ms`,
              loginMethod: "apple",
              sessionId: sessionId || "não disponível ainda",
            });
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("❌ [Tracking] Erro ao rastrear login:", error);
          }
        }
      }
      
      toast.success("Login efetuado com sucesso!");
      router.push("/");
    } catch (error) {
      console.error("Erro no Apple Sign-In:", error);
      toast.error("Não foi possível completar o login com Apple.");
      loginStartTimeRef.current = null; // Reset em caso de erro
    } finally {
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
            data-tracking-id="login-forgot-password-link"
          >
            Esqueceu a senha?
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          data-tracking-id="login-submit-button"
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
          <div className="relative h-11">
            {/* Botão customizado com estilo original */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              data-tracking-id="login-google-button"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50"
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
            {/* Container oculto para o botão do Google (usado internamente) */}
            <div 
              ref={googleButtonRef}
              className="absolute inset-0 opacity-0 pointer-events-none overflow-hidden"
              style={{ zIndex: -1 }}
            />
          </div>
          <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={isLoggingIn}
            data-tracking-id="login-apple-button"
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
