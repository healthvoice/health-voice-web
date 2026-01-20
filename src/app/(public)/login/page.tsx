"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ForgotPassword from "./components/forgot";
import SignIn from "./components/login";
import LoginAnimation from "./components/LoginAnimation";

export default function Login() {
  const [forgot, setForgot] = useState<boolean>(false);

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Lado Esquerdo - Branding / Marketing */}
      <div className="from-primary relative hidden w-1/2 flex-col items-center justify-center bg-gradient-to-br to-blue-700 p-12 lg:flex">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[20%] -left-[10%] h-[30rem] w-[30rem] rounded-full bg-white/10 blur-[120px]" />
          <div className="absolute -right-[10%] bottom-[20%] h-[30rem] w-[30rem] rounded-full bg-blue-900/20 blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-12">
          <LoginAnimation />

          <div className="max-w-md text-center">
            <h2 className="mb-2 text-2xl font-bold text-white">
              Seu Consultório Inteligente
            </h2>
            <p className="text-blue-50">
              Grave suas consultas e deixe nossa IA gerar prontuários perfeitos
              automaticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
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
              {forgot ? "Recuperar senha" : "Acesse sua conta"}
            </h2>
            <p className="mt-2 text-gray-500">
              {forgot
                ? "Digite seu email para receber o código"
                : "Bem-vindo de volta! Por favor, insira seus dados."}
            </p>
          </div>

          <div className="w-full">
            {forgot ? (
              <ForgotPassword onClick={() => setForgot(false)} />
            ) : (
              <SignIn onClick={() => setForgot(true)} />
            )}

            <div className="mt-8 text-center text-sm text-gray-600">
              {!forgot && (
                <p>
                  Não tem uma conta?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-primary hover:text-blue-700 transition-colors"
                  >
                    Cadastre-se
                  </Link>
                </p>
              )}
              {forgot && (
                <button
                  onClick={() => setForgot(false)}
                  className="font-semibold text-primary hover:text-blue-700 transition-colors"
                >
                  Voltar ao login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
