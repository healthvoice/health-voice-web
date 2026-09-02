"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { usePageView } from "@/hooks/usePageView";
import ForgotPassword from "./forgot";
import SignIn from "./login";
import LoginAnimation from "./LoginAnimation";

/**
 * A tela de login. Separada da `page.tsx` porque a página virou Server
 * Component: quem decide se existe link de cadastro é o servidor, perguntando à
 * API se a ponte com o Hub está ligada — e não uma `NEXT_PUBLIC_*`, que é
 * resolvida em build time e exigiria um build por ambiente.
 */
export default function LoginScreen({ hubEnabled }: { hubEnabled: boolean }) {
  const [forgot, setForgot] = useState<boolean>(false);

  // Tracking de visualização de tela
  usePageView();

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

            {forgot && (
              <div className="mt-8 text-center text-sm text-gray-600">
                <button
                  onClick={() => setForgot(false)}
                  data-tracking-id="login-back-to-login-button"
                  className="text-primary font-semibold transition-colors hover:text-blue-700"
                >
                  Voltar ao login
                </button>
              </div>
            )}

            {/* O convite ao cadastro só aparece onde ele de fato funciona:
                sem a ponte com o Hub não há para onde a conta nascer, e um link
                que leva a um redirect de volta é pior do que link nenhum. */}
            {!forgot && hubEnabled && (
              <div className="mt-8 text-center text-sm text-gray-600">
                <p>
                  Ainda não tem conta?{" "}
                  <Link
                    href="/register"
                    data-tracking-id="login-register-link"
                    data-tracking-destination="/register"
                    className="text-primary font-semibold transition-colors hover:text-blue-700"
                  >
                    Criar conta
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
