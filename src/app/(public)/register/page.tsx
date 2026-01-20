"use client";
import Image from "next/image";
import Link from "next/link";
import RegisterAnimation from "./components/RegisterAnimation";
import RegisterForm from "./components/register-form";

export default function Register() {
    return (
        <div className="flex min-h-screen w-full bg-white">
            {/* Esquerda - Branding / Marketing */}
            <div className="from-primary relative hidden w-1/2 flex-col items-center justify-center bg-gradient-to-br to-blue-700 p-12 lg:flex">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-[20%] -left-[10%] h-[30rem] w-[30rem] rounded-full bg-white/10 blur-[120px]" />
                    <div className="absolute -right-[10%] bottom-[20%] h-[30rem] w-[30rem] rounded-full bg-blue-900/20 blur-[120px]" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-12">
                    <RegisterAnimation />

                    <div className="max-w-md text-center">
                        <h2 className="mb-2 text-2xl font-bold text-white">
                            Evolua seu Atendimento
                        </h2>
                        <p className="text-blue-50">
                            Cadastre-se para acessar a tecnologia que transforma suas consultas em registros perfeitos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Direita - Formulário */}
            <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-12">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center lg:text-left">
                        <div className="mb-6 flex justify-center lg:justify-start">
                            <Image
                                src="/logos/logo-dark.png"
                                alt="Health Voice"
                                width={200}
                                height={60}
                                className="h-10 w-auto object-contain"
                            />
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900">
                            Crie sua conta
                        </h2>
                        <p className="mt-2 text-gray-500">
                            Preencha seus dados para começar gratuitamente.
                        </p>
                    </div>

                    <div className="w-full">
                        <RegisterForm />

                        <div className="mt-8 text-center text-sm text-gray-600">
                            <p>
                                Já tem uma conta?{" "}
                                <Link
                                    href="/login"
                                    className="font-semibold text-primary hover:text-blue-700 transition-colors"
                                >
                                    Faça login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
