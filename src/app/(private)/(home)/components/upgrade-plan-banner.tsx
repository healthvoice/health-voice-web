"use client";

import { useSession } from "@/context/auth";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { Crown, Rocket, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpgradePlanBannerProps {
  className?: string;
}

export function UpgradePlanBanner({ className }: UpgradePlanBannerProps) {
  const { isTrial, availableRecording, totalRecording, profile } = useSession();
  const router = useRouter();

  const isExpired =
    !isTrial && availableRecording === 0 && totalRecording === 0;
  const shouldShow = profile && (isTrial || isExpired);

  if (!shouldShow) return null;

  const config = isTrial
    ? {
        icon: Rocket,
        badge: "TRIAL ATIVO",
        badgeColor: "bg-sky-400/25 text-sky-200 border-sky-400/40",
        title: "Desbloqueie todo o potencial",
        titleHighlight: "do Health Voice",
        subtitle:
          "Você está no período de teste. Faça upgrade agora e tenha acesso ilimitado a gravações, prontuários com IA e muito mais.",
        cta: "Fazer Upgrade",
        features: [
          "Gravações ilimitadas",
          "Prontuários com IA",
          "Suporte prioritário",
        ],
      }
    : {
        icon: Crown,
        badge: "PLANO EXPIRADO",
        badgeColor: "bg-red-400/20 text-red-200 border-red-400/30",
        title: "Renove seu plano",
        titleHighlight: "e continue atendendo",
        subtitle:
          "Seu plano expirou e seus recursos estão limitados. Renove agora para recuperar o acesso completo à plataforma.",
        cta: "Renovar Agora",
        features: [
          "Recupere seu acesso",
          "Mantenha seus dados",
          "Continue evoluindo",
        ],
      };

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onClick={() => router.push("/plans")}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border border-white/15 p-6 shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/30 sm:p-8",
        className,
      )}
      style={{
        background:
          "linear-gradient(135deg, #0b1829 0%, #0d2a50 30%, #0d78ec18 60%, #0b1829 100%)",
      }}
    >
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="bg-primary/20 absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="bg-primary/15 absolute -bottom-10 -left-10 h-48 w-48 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="bg-primary/10 absolute top-1/4 right-1/3 h-24 w-24 rounded-full blur-2xl"
        />
      </div>

      {/* Sparkle particles */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0 }}
          className="absolute top-[20%] right-[15%]"
        >
          <Sparkles className="text-primary/50 h-3 w-3" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 0.7, 1] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute bottom-[25%] left-[10%]"
        >
          <Sparkles className="text-primary/40 h-2 w-2" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.1, 0.6, 0.1], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
          className="absolute top-[60%] right-[8%]"
        >
          <Sparkles className="text-primary/30 h-2.5 w-2.5" />
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
        {/* Icon section */}
        <div className="shrink-0">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm sm:h-20 sm:w-20"
          >
            <Icon className="h-8 w-8 text-sky-300 sm:h-10 sm:w-10" />
          </motion.div>
        </div>

        {/* Content section */}
        <div className="flex-1 space-y-3">
          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-widest",
              config.badgeColor,
            )}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            {config.badge}
          </motion.span>

          {/* Title */}
          <h3 className="text-xl leading-tight font-bold text-white sm:text-2xl">
            {config.title}{" "}
            <span className="text-neutral-300">{config.titleHighlight}</span>
          </h3>

          {/* Subtitle */}
          <p className="max-w-xl text-sm leading-relaxed text-gray-300/80 sm:text-base">
            {config.subtitle}
          </p>

          {/* Features */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {config.features.map((feature) => (
              <span
                key={feature}
                className="flex items-center gap-1.5 text-xs text-blue-200/80 sm:text-sm"
              >
                <Zap className="h-3 w-3 text-sky-400" />
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* CTA section */}
        <div className="shrink-0 sm:self-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="bg-primary shadow-primary/30 group-hover:shadow-primary/40 flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-blue-600 group-hover:shadow-xl sm:px-8 sm:py-4 sm:text-base"
          >
            {config.cta}
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
    </motion.div>
  );
}
