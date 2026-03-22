"use client";

import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import type { ViewState } from "./types";

interface PlansPageLayoutProps {
  viewState: ViewState;
  onBack: () => void;
  children: React.ReactNode;
  submitLoading?: boolean;
}

export function PlansPageLayout({
  viewState,
  onBack,
  children,
  submitLoading = false,
}: PlansPageLayoutProps) {
  const isCheckout = viewState === "checkout";
  const isSuccess = viewState === "success";

  return (
    <div className="min-h-screen w-full bg-[#0b1829]">
      <div className="relative flex min-h-screen w-full flex-col bg-white lg:flex-row">
        {/* ═══ Background patterns ═══ */}
        <div className="pointer-events-none absolute inset-0 z-[5]">
          <motion.div
            animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] left-[45%] h-[500px] w-[500px] rounded-full opacity-[0.04]"
            style={{
              background:
                "radial-gradient(circle, rgba(13,120,236,0.6) 0%, transparent 70%)",
            }}
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[10%] left-[42%] h-[600px] w-[600px] rounded-full opacity-[0.03]"
            style={{
              background:
                "radial-gradient(circle, rgba(14,116,237,0.4) 0%, transparent 70%)",
            }}
          />
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute top-[30%] left-[47%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/[0.05]"
          />
        </div>

        {/* ═══ LEFT — Blue panel ═══ */}
        <motion.div
          animate={{
            width: isSuccess ? "0%" : isCheckout ? "45%" : "33.333%",
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden h-screen shrink-0 flex-col overflow-hidden lg:sticky lg:top-0 lg:flex"
          style={{
            background: "linear-gradient(145deg, #0d78ec 0%, #0a5fc4 40%, #1e3a8a 100%)",
          }}
        >
          {/* Background gradients */}
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(255,255,255,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 70% 80%, rgba(14,74,156,0.5) 0%, transparent 50%)",
              }}
            />
          </div>
          <div className="absolute inset-0 z-[1] bg-blue-950/20" />

          {/* Header */}
          <div
            className={cn(
              "absolute z-90 flex w-full shrink-0 items-center justify-between px-6 py-4 sm:px-8",
              isSuccess && "hidden",
            )}
          >
            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-md border border-white/20 bg-white/[0.12] p-6 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-xl transition hover:bg-white/25 hover:shadow-md"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex items-center justify-center">
              <Image
                src="/logos/logo2.png"
                alt="Health Voice"
                width={200}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>

          {/* Left panel patterns */}
          <div className="pointer-events-none absolute inset-0 z-[3]">
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
            />
            <motion.div
              animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-20 -left-20 h-[28rem] w-[28rem] rounded-full bg-blue-300/[0.15] blur-[100px]"
            />
            <motion.div
              animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-16 bottom-[20%] h-[24rem] w-[24rem] rounded-full bg-indigo-400/[0.12] blur-[100px]"
            />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute top-[10%] right-[10%] h-48 w-48"
            >
              <div className="h-full w-full rounded-full border border-white/[0.08]" />
              <div className="absolute inset-4 rounded-full border border-dashed border-white/[0.06]" />
            </motion.div>
            <motion.div
              animate={{ y: ["-100%", "200%"] }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 4,
              }}
              className="absolute left-0 h-px w-full bg-gradient-to-r from-transparent via-white/[0.10] to-transparent"
            />
          </div>

        </motion.div>

        {/* ═══ RIGHT — Content panel ═══ */}
        <div className="relative flex min-h-screen flex-1 flex-col bg-[#f7f9ff]">
          {/* Right panel patterns */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0">
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(ellipse 80% 50% at 20% 20%, rgba(13,120,236,0.04) 0%, transparent 60%),
                    radial-gradient(ellipse 60% 60% at 80% 80%, rgba(30,64,175,0.03) 0%, transparent 50%)
                  `,
                }}
              />
            </div>
            <motion.div
              animate={{ x: ["-5%", "5%", "-5%"], y: ["-3%", "3%", "-3%"] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-[10%] -left-[5%] h-[60%] w-[120%]"
              style={{
                background:
                  "linear-gradient(135deg, transparent 25%, rgba(13,120,236,0.04) 38%, rgba(13,120,236,0.01) 50%, transparent 60%)",
                filter: "blur(35px)",
              }}
            />
          </div>

          {/* Mobile header */}
          <div className="relative z-10 flex items-center justify-between border-b border-blue-100 bg-white px-5 py-4 lg:hidden">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <Image
              src="/logos/logo-dark.png"
              alt="Health Voice"
              width={140}
              height={40}
              className="h-8 w-auto object-contain"
            />
            <div className="w-16" />
          </div>

          {/* Scrollable content */}
          <div className="relative z-10 flex flex-col">
            <div
              className={cn(
                "mx-auto flex w-full flex-1 flex-col px-6 sm:px-8",
                isCheckout ? "max-w-2xl pb-40" : "max-w-6xl min-h-screen",
              )}
            >
              {children}
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {submitLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-black" />
              <p className="text-sm font-semibold text-gray-700">
                Processando pagamento...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
