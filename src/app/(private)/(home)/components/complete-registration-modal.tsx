"use client";

import { useSession } from "@/context/auth";
import { useApiContext } from "@/context/ApiContext";
import { cn } from "@/utils/cn";
import { maskCpfCnpj, maskPhone } from "@/utils/masks";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, User, Phone, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/blocks/form";
import Field from "@/app/(public)/login/components/field";
import toast from "react-hot-toast";
import Image from "next/image";

const FormSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    phone: z.string().min(14, "Telefone inválido ou incompleto"),
    cpfCnpj: z.string().min(14, "Documento inválido"),
});

type FormValues = z.infer<typeof FormSchema>;

export function CompleteRegistrationModal() {
    const { profile, handleGetProfile } = useSession();
    const { PutAPI } = useApiContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Image Carousel State
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = [
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1920&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=1920&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=1920&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=1920&auto=format&fit=crop"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 1400);
        return () => clearInterval(timer);
    }, []);

    // Check if user needs to complete registration
    useEffect(() => {
        if (profile) {
            const isMissingData = !profile.cpfCnpj || !profile.mobilePhone;
            if (isMissingData) {
                setIsOpen(true);
            }
        }
    }, [profile]);

    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        mode: "onChange",
        defaultValues: {
            name: profile?.name || "",
            phone: profile?.mobilePhone || "",
            cpfCnpj: profile?.cpfCnpj || "",
        },
    });

    // Update form default values when profile loads
    useEffect(() => {
        if (profile) {
            if (!form.getValues("name")) form.setValue("name", profile.name);
            if (!form.getValues("phone") && profile.mobilePhone) form.setValue("phone", maskPhone(profile.mobilePhone));
            if (!form.getValues("cpfCnpj") && profile.cpfCnpj) form.setValue("cpfCnpj", maskCpfCnpj(profile.cpfCnpj));
        }
    }, [profile, form]);

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);

        try {
            // Remove máscaras antes de enviar para a API
            const cleanPhone = data.phone.replace(/\D/g, ""); // Remove tudo exceto números
            const cleanCpfCnpj = data.cpfCnpj.replace(/\D/g, ""); // Remove tudo exceto números

            // Envia os dados para a API
            const response = await PutAPI(
                "/user",
                {
                    name: data.name,
                    mobilePhone: cleanPhone,
                    cpfCnpj: cleanCpfCnpj,
                },
                true // true = requer autenticação
            );

            if (response.status === 200) {
                toast.success("Cadastro atualizado com sucesso!");
                // Recarrega o perfil da API para garantir dados atualizados
                await handleGetProfile(true);
                setIsOpen(false);
            } else {
                toast.error(response.body?.message || "Erro ao salvar dados. Tente novamente.");
            }
        } catch (error) {
            console.error("Erro ao atualizar cadastro:", error);
            toast.error("Erro ao conectar com o servidor. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-[6px] p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col md:flex-row min-h-[600px] animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">

                {/* Left Side: Image Carousel */}
                <div className="relative hidden w-1/2 md:block overflow-hidden bg-blue-900">
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-blue-900/90 via-blue-900/20 to-transparent" />

                    <div className="absolute top-10 left-10 z-20">
                        <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md border border-white/20">
                            <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                            <span className="text-xs font-semibold text-white tracking-wide">Plataforma Segura</span>
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-10 z-20 text-white max-w-md pr-8">
                        <h3 className="text-3xl font-bold leading-tight tracking-tight">
                            A revolução do <br /> atendimento médico.
                        </h3>
                        <p className="mt-4 text-base text-blue-100 opacity-90 leading-relaxed font-light">
                            Junte-se a milhares de profissionais que transformaram sua rotina clínica com a Health Voice.
                        </p>
                    </div>

                    {images.map((img, index) => (
                        <div
                            key={img}
                            className={cn(
                                "absolute inset-0 h-full w-full bg-cover bg-center transition-all duration-1000 ease-in-out transform",
                                index === currentImageIndex
                                    ? "opacity-100 scale-105"
                                    : "opacity-0 scale-100"
                            )}
                            style={{ backgroundImage: `url(${img})` }}
                        />
                    ))}

                    <div className="absolute bottom-10 right-10 z-20 flex gap-2">
                        {images.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1 rounded-full transition-all duration-300",
                                    i === currentImageIndex ? "w-8 bg-blue-400" : "w-2 bg-white/30"
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-12 relative bg-white">
                    <div className="mx-auto w-full max-w-sm">

                        <div className="mb-8 flex flex-col items-center text-center md:items-start md:text-left">
                            {/* Branding with logo-dark.png */}
                            <div className="mb-6">
                                <Image
                                    src="/logos/logo-dark.png"
                                    alt="Health Voice Logo"
                                    width={180}
                                    height={50}
                                    className="h-auto w-auto max-h-[45px]"
                                />
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                                Complete seu perfil
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Precisamos de alguns detalhes para liberar seu acesso total. É rápido e seguro.
                            </p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

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
                                    name="phone"
                                    render={({ field, fieldState }) => (
                                        <FormItem>
                                            <Field
                                                placeholder="(00) 00000-0000"
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

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={isLoading || !form.formState.isValid}
                                        className={cn(
                                            "group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/20 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2",
                                        )}
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                <span className="animate-pulse">Finalizando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Concluir Cadastro</span>
                                                <CheckCircle2 className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                                            </>
                                        )}
                                    </button>
                                    <p className="mt-6 text-center text-xs text-slate-400 font-medium">
                                        Ao continuar, você aceita nossos <span className="text-blue-600 cursor-pointer hover:underline font-semibold">Termos de Uso</span> e <span className="text-blue-600 cursor-pointer hover:underline font-semibold">Política de Privacidade</span>.
                                    </p>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}
