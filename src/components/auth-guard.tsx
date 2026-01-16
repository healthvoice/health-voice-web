// components/AuthGuard.tsx
"use client";

import { useSession } from "@/context/auth";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; // Opcional: loading customizado
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { profile, loading, checkSession } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false); // ← Evita múltiplos redirecionamentos

  useEffect(() => {
    const validateSession = async () => {
      // ✅ Aguarda loading inicial
      if (loading) return;

      // ✅ Evita redirecionar múltiplas vezes
      if (hasRedirected.current) return;

      // ✅ Verifica sessão
      const isValid = await checkSession();

      if (!isValid || !profile) {
        // ✅ Pequeno delay para dar tempo do login finalizar
        await new Promise((resolve) => setTimeout(resolve, 100));

        // ✅ Revalida após o delay
        const recheckValid = await checkSession();

        if (!recheckValid) {
          hasRedirected.current = true;
          router.push("/login");
        }
      }
    };

    validateSession();
  }, [profile, loading, checkSession, router, pathname]);

  if (loading || !profile) {
    return (
      <AnimatePresence mode="wait">
        <LoadingScreen key="loading" fallback={fallback} />
      </AnimatePresence>
    );
  }

  // Usuário autenticado, mostra conteúdo com animação de entrada
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

const loadingMessages = [
  "Preparando seu ambiente de saúde...",
  "Verificando suas credenciais...",
  "Sincronizando dados...",
  "Quase lá...",
];

function LoadingScreen({ fallback }: { fallback?: React.ReactNode }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  if (fallback) return <>{fallback}</>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100"
    >
      {/* Background Animated Shapes */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -40, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
          className="absolute -bottom-20 left-1/3 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl"
        />
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 flex flex-col items-center gap-10 p-8">
        {/* Logo Section */}
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 blur-xl"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative flex h-32 w-32 items-center justify-center rounded-lg bg-white/40 shadow-2xl ring-1 ring-white/60 backdrop-blur-md sm:h-40 sm:w-40"
          >
            <Image
              src="/logos/icon.png"
              alt="Health Voice Logo"
              width={160}
              height={160}
              className="h-20 w-20 object-contain drop-shadow-md sm:h-24 sm:w-24"
              priority
            />
          </motion.div>
        </div>

        {/* Loading Indicators */}
        <div className="flex flex-col items-center gap-6">
          {/* Progress Bar Container */}
          <div className="relative h-2 w-64 overflow-hidden rounded-full bg-gray-200/50 sm:w-80">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-400 via-[#0d78ec] to-indigo-500"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Dynamic Text with Gradient */}
          <div className="h-8 overflow-hidden text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={messageIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-1"
              >
                <p className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
                  {loadingMessages[messageIndex]}
                </p>
                <p className="text-xs font-medium text-gray-400">
                  Por favor, aguarde...
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 flex flex-col items-center gap-2 text-center"
      >
        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-300 to-indigo-300" />
        <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
          Health Voice Security
        </p>
      </motion.div>
    </motion.div>
  );
}
