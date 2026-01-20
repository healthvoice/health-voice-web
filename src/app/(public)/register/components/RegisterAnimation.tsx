import { motion } from "framer-motion";
import { Bot, Check, Database, Fingerprint, Lock, ShieldCheck, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";

const RegisterAnimation = () => {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 4); // 0, 1, 2, 3 (3 is reset/pause state)
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const steps = [
        {
            icon: Fingerprint,
            title: "Autenticação Segura",
            desc: "Validação Biométrica Digital",
            color: "text-blue-400",
            bg: "bg-blue-500/20"
        },
        {
            icon: Database,
            title: "Sincronização Cloud",
            desc: "Ambiente Protegido HIPAA",
            color: "text-indigo-400",
            bg: "bg-indigo-500/20"
        },
        {
            icon: Bot,
            title: "Ativando I.A.",
            desc: "Personalizando Assistente",
            color: "text-purple-400",
            bg: "bg-purple-500/20"
        }
    ];

    return (
        <div className="relative w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-lg shadow-2xl overflow-hidden">

            {/* Background Glow Effect */}
            <motion.div
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"
            />

            {/* Header */}
            <div className="relative mb-8 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Configuração do Sistema</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <p className="text-xs text-blue-200/70">Online & Criptografado</p>
                    </div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <Lock size={14} className="text-white/60" />
                </div>
            </div>

            {/* List */}
            <div className="relative flex flex-col gap-4">
                {steps.map((step, index) => {
                    const isActive = activeStep === index;
                    const isCompleted = activeStep > index;

                    return (
                        <div key={index} className="relative">
                            {/* Connector Line */}
                            {index !== steps.length - 1 && (
                                <div className="absolute left-6 top-12 h-6 w-0.5 bg-white/10 z-0" />
                            )}

                            <motion.div
                                animate={{
                                    backgroundColor: isActive ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.02)",
                                    borderColor: isActive ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)",
                                    scale: isActive ? 1.02 : 1
                                }}
                                className={`relative z-10 flex items-center gap-4 w-full p-3 rounded-xl border transition-all duration-500`}
                            >
                                <div className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500/20' : step.bg}`}>
                                    {isCompleted ? (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                            <Check size={20} className="text-green-400" />
                                        </motion.div>
                                    ) : (
                                        <step.icon size={20} className={step.color} />
                                    )}

                                    {isActive && (
                                        <motion.div
                                            className="absolute inset-0 rounded-full border border-white/30"
                                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className={`text-sm font-medium transition-colors duration-300 ${isActive || isCompleted ? 'text-white' : 'text-white/60'}`}>
                                            {step.title}
                                        </p>
                                        {isActive && (
                                            <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                PROCESSANDO
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-blue-200/50">{step.desc}</p>

                                    {/* Mini Progress Bar for active step */}
                                    {isActive && (
                                        <motion.div
                                            className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <motion.div
                                                className="h-full bg-blue-400"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 1.5, ease: "linear" }}
                                            />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Status */}
            <motion.div
                className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-2"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <Sparkles size={14} className="text-blue-300" />
                <span className="text-xs font-medium text-blue-200/80">
                    {activeStep === 3 ? "Sistema Pronto para Uso" : "Inicializando Ambiente Seguro..."}
                </span>
            </motion.div>

        </div>
    );
};

export default RegisterAnimation;
