/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession } from "@/context/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Amplify } from "aws-amplify";
import { signIn, signUp } from "aws-amplify/auth";
import {
    Eye,
    EyeOff,
    Loader2,
    LockIcon,
    Mail,
    User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import config from "../../../../utils/amplify.json";
import Field from "../../login/components/field";
import { Form, FormField, FormItem, FormMessage } from "../../login/components/form";

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
    const { handleGetProfile, waitForTokens, forceSignOut, checkSession } = useSession();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showRememberPassword, setShowRememberPassword] = useState(false);

    Amplify.configure(config);

    // Initializing with correct defaults
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

    const authenticateUser = useCallback(
        async (authFunction: () => Promise<void>) => {
            try {
                try {
                    const currentSession = await checkSession();
                    console.log("🔍 Estado da sessão antes de autenticar:", currentSession);

                    if (currentSession) {
                        console.log("⚠️ Já existe uma sessão ativa!");
                        await handleGetProfile(true);
                        return;
                    }
                } catch (diagError) {
                    console.log("✅ Nenhuma sessão ativa (esperado):", diagError);
                }

                console.log("🔐 Iniciando autenticação...");
                await authFunction();
            } catch (error: any) {
                console.error("❌ Erro na autenticação:", error);

                if (error?.name === "UserAlreadyAuthenticatedException") {
                    console.log("🔄 UserAlreadyAuthenticatedException detectado");
                    return;
                }

                if (error?.name === "NotAuthorizedException") {
                    console.log("🔄 Tentando limpar cache e reconectar...");

                    try {
                        await forceSignOut();
                        await new Promise((resolve) => setTimeout(resolve, 500));

                        console.log("🔄 Tentando login novamente...");
                        await authFunction();
                        return;
                    } catch (retryError: any) {
                        console.error("❌ Falha no retry:", retryError);
                        error = retryError;
                    }
                }

                let errorMessage = "Ocorreu um erro. Tente novamente.";

                switch (error?.name) {
                    case "NotAuthorizedException":
                        errorMessage = "E-mail ou senha incorretos.";
                        break;
                    case "UserNotFoundException":
                        errorMessage = "Usuário não encontrado.";
                        break;
                    case "NetworkError":
                        errorMessage = "Erro de conexão. Verifique sua internet.";
                        break;
                    default:
                        errorMessage = error?.message || errorMessage;
                }

                toast.error(errorMessage);
            }
        },
        [checkSession, handleGetProfile, forceSignOut]
    );

    const handleLogin = async ({
        email,
        password,
    }: {
        email: string;
        password: string;
    }) => {
        await authenticateUser(async () => {
            console.log("📧 Fazendo login com email/senha...");

            const { isSignedIn } = await signIn({
                username: email.trim(),
                password: password.trim(),
                options: { authFlowType: "USER_PASSWORD_AUTH" },
            });
            console.log("isSignedIn", isSignedIn);
            if (isSignedIn) {
                console.log("✅ SignIn bem-sucedido, aguardando tokens...");

                const tokensReady = await waitForTokens();

                if (tokensReady) {
                    console.log("✅ Tokens prontos, carregando perfil...");
                    await handleGetProfile(true);
                } else {
                    throw new Error("Timeout ao aguardar tokens do Amplify");
                }
            } else {
                throw new Error("Falha na autenticação");
            }
        });
    };

    const handleRegister = async (data: z.infer<typeof FormSchema>) => {
        if (isCreating) return;
        setIsCreating(true);

        try {
            const { name, email, password } = data;
            const passwordValue = password.password;

            const { isSignUpComplete, nextStep } = await signUp({
                username: email.trim(),
                password: passwordValue,
                options: {
                    userAttributes: {
                        name,
                        email: email.trim(),
                    },
                },
            });

            console.log("nextStep", nextStep);
            console.log("isSignUpComplete", isSignUpComplete);

            if (isSignUpComplete) {
                toast.success("Conta criada com sucesso!");
                await handleLogin({
                    email: email.trim(),
                    password: passwordValue,
                });
                router.push("/");
            } else if (nextStep?.signUpStep === "CONFIRM_SIGN_UP") {
                toast.success("Conta criada! Verifique seu e-mail para confirmar.");
                // Neste caso, sem verificação, vamos tentar fazer login mesmo assim
                await handleLogin({
                    email: email.trim(),
                    password: passwordValue,
                });
                router.push("/");
            }
        } catch (err: any) {
            console.error(err);

            switch (err?.name) {
                case "UsernameExistsException":
                    form.setError("email", {
                        type: "manual",
                        message: "Este e-mail já está cadastrado.",
                    });
                    toast.error("E-mail já cadastrado. Tente fazer login ou recuperar a senha.");
                    break;

                case "InvalidPasswordException":
                    form.setError("password.password", {
                        type: "manual",
                        message: "Senha não atende aos requisitos do sistema.",
                    });
                    toast.error("Senha inválida. Use pelo menos 8 caracteres.");
                    break;

                case "InvalidParameterException":
                    toast.error("Dados inválidos. " + (err.message || ""));
                    break;

                case "TooManyRequestsException":
                case "LimitExceededException":
                    toast.error("Muitas tentativas. Tente novamente em alguns minutos.");
                    break;

                case "NetworkError":
                case "ServiceUnavailableException":
                    toast.error("Sem conexão. Verifique sua internet e tente novamente.");
                    break;

                default:
                    toast.error("Erro ao criar conta. " + (err?.message || "Tente novamente."));
                    break;
            }
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
                            <FormMessage className="text-xs text-red-500 font-medium ml-1" />
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
                            <FormMessage className="text-xs text-red-500 font-medium ml-1" />
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
                                    className="absolute bottom-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <FormMessage className="text-xs text-red-500 font-medium ml-1" />
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
                                    onClick={() =>
                                        setShowRememberPassword(!showRememberPassword)
                                    }
                                    className="absolute bottom-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showRememberPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>
                            <FormMessage className="text-xs text-red-500 font-medium ml-1" />
                        </FormItem>
                    )}
                />
            </div>

            <div className="mt-6 flex w-full flex-col gap-4">
                <button
                    onClick={form.handleSubmit(handleRegister)}
                    disabled={isCreating}
                    className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                <p className="text-xs text-center text-gray-500">
                    Ao criar uma conta, você aceita nossos{" "}
                    <a href="#" className="text-primary hover:underline">Termos de Serviço</a> e{" "}
                    <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
                </p>
            </div>
        </Form>
    );
};

export default RegisterForm;
