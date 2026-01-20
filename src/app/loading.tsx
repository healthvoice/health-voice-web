"use client";

import { motion } from "framer-motion";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
            <div className="relative flex flex-col items-center gap-6">
                {/* Animated Rings */}
                <div className="relative h-24 w-24">
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-primary/10"
                        style={{ borderTopColor: "#0d78ec" }}
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                    <motion.div
                        className="absolute inset-2 rounded-full border-4 border-primary/5"
                        style={{ borderBottomColor: "#3b82f6" }}
                        animate={{ rotate: -360 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-[#0d78ec] to-[#60a5fa] shadow-[0_0_15px_rgba(13,120,236,0.5)]" />
                    </motion.div>
                </div>

                {/* Text Animation */}
                <div className="flex flex-col items-center gap-1">
                    <motion.h2
                        className="text-xl font-bold tracking-tight text-neutral-800"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Health<span className="text-primary">Voice</span>
                    </motion.h2>
                    <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="h-1 w-1 rounded-full bg-primary"
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 1, 0.3],
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Background Glows */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-blue-400/5 blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-indigo-400/5 blur-[100px]" />
            </div>
        </div>
    );
}
