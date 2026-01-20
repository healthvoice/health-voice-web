/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useApiContext } from "@/context/ApiContext";
import { maskCpfCnpj, maskPhone } from "@/utils/masks";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Eye,
    EyeOff,
    Hash,
    Loader2,
    LockIcon,
    Mail,
    Phone,
    User,
} from "lucide-react";
import { useCookies } from "next-client-cookies";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UseFormReturn, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import Field from "../../login/components/field";
import { Form, FormField, FormItem, FormMessage } from "../../login/components/form";

export interface RegisterClientServiceRequest {
    name: string;
    email: string;
    password: string;
    phone: string;
    cpfCnpj: string;
    coupon?: string;
}

const FormSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email({ message: "Email Inválido" }),
    phone: z.string().min(14, "Telefone inválido (mínimo 10 dítigos)"), // (XX) XXXX-XXXX is 14 chars. (XX) X XXXX-XXXX is 16 chars.
    cpfCnpj: z.string().min(14, "CPF/CNPJ inválido"),
    coupon: z.string().optional(),
    password: z
        .object({
            password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
            confirm: z.string(),
        })
        .refine((data) => data.password === data.confirm, {
            message: "Senhas não coincidem",
            path: ["confirm"],
        }),
});

const RegisterForm = () => {
    const { PostAPI } = useApiContext();
    const cookies = useCookies();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showRememberPassword, setShowRememberPassword] = useState(false);

    // Initializing with correct defaults
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        mode: "onChange",
        defaultValues: {
            name: "",
            phone: "",
            email: "",
            cpfCnpj: "",
            coupon: "",
            password: {
                password: "",
                confirm: "",
            },
        },
    });

    const useFormSteps = (form: UseFormReturn<z.infer<typeof FormSchema>>) => {
        // Only one step for now, but keeping structure if needed
        const validateStep = async () => {
            return await form.trigger();
        };
        return { validateStep };
    };

    const { validateStep } = useFormSteps(form);

    const handleNext = async () => {
        const isValid = await validateStep();
        if (!isValid) {
            toast.error("Por favor, corrija os campos destacados em vermelho.");
            return;
        }

        setIsCreating(true);
        try {
            const create = await PostAPI(
                "/client/register",
                {
                    ...form.getValues(),
                    password: form.getValues("password").password,
                },
                false,
            );
            if (create.status === 200) {
                cookies.set(
                    process.env.NEXT_PUBLIC_USER_TOKEN as string,
                    create.body.accessToken,
                );
                toast.success("Conta criada com sucesso!");
                router.push("/plans"); // Taking user to plans or dashboard
            } else {
                toast.error("Erro ao criar conta. Email ou CPF já cadastrado?");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro desconhecido ao criar conta.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleNext();
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <Field
                                    placeholder="(XX) 9 9999-9999"
                                    label="Telefone (WhatsApp)"
                                    name="tel"
                                    autoComplete="tel"
                                    inputMode="tel"
                                    Svg={<Phone className="text-blue-400" size={20} />}
                                    value={maskPhone(field.value)}
                                    onChange={(e: any) => field.onChange(e.target.value)}
                                    required
                                    maxLength={16}
                                    invalid={!!fieldState.error}
                                />
                                <FormMessage className="text-xs text-red-500 font-medium ml-1" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cpfCnpj"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <Field
                                    placeholder="000.000.000-00"
                                    label="CPF ou CNPJ"
                                    name="cpf"
                                    inputMode="numeric"
                                    Svg={<Hash className="text-blue-400" size={20} />}
                                    value={field.value}
                                    onChange={(e: any) =>
                                        field.onChange(maskCpfCnpj(e.target.value))
                                    }
                                    required
                                    maxLength={18}
                                    invalid={!!fieldState.error}
                                />
                                <FormMessage className="text-xs text-red-500 font-medium ml-1" />
                            </FormItem>
                        )}
                    />
                </div>

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
                    onClick={handleNext}
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
