"use client";

import { AuthGuard } from "@/components/auth-guard";
import MobileAppBlocker from "@/components/mobile";
import { MobileTopBar } from "@/components/ui/mobile-top-bar";
import { Sidebar } from "@/components/ui/sidebar";
import { GeneralContextProvider } from "@/context/GeneralContext";
import { RecordingTourProvider } from "@/context/RecordingTourContext";
import { ChatPageProvider } from "@/context/chatContext";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isFullscreen = pathname === "/plans" || pathname.startsWith("/plans/");

  useEffect(() => {
    // Não inicializa Lenis nas páginas de chat ou checkout
    if (pathname.includes("/chat") || isFullscreen) {
      return;
    }

    const lenis = new Lenis();

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Cleanup para destruir a instância do Lenis
    return () => {
      lenis.destroy();
    };
  }, [pathname]);

  if (isFullscreen) {
    return (
      <AuthGuard>
        <GeneralContextProvider>
          <ChatPageProvider>
            <div className="min-h-screen w-full bg-[#0d0d0d]">{children}</div>
            <MobileAppBlocker />
          </ChatPageProvider>
        </GeneralContextProvider>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <GeneralContextProvider>
        <RecordingTourProvider>
          <ChatPageProvider>
            <div
              className={cn(
                "relative flex min-h-screen w-full",
                pathname.includes("/chat") && "pb-0",
              )}
            >
              <Sidebar />
              <MobileTopBar />
              <MobileAppBlocker />

              <motion.main
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "relative z-10 flex min-h-screen w-full flex-1 flex-col overflow-hidden pt-14 md:pt-0",
                )}
              >
                <div
                  className={cn(
                    "flex min-h-screen w-full flex-1 flex-col gap-0 overflow-hidden bg-gray-50",
                    pathname.includes("/chat") && "min-h-[70vh]",
                  )}
                >
                  {/* <ContentSubheader /> */}
                  <div className="flex-1 px-4 py-4 lg:px-6 lg:py-5">
                    {children}
                  </div>
                </div>
              </motion.main>
            </div>
          </ChatPageProvider>
        </RecordingTourProvider>
      </GeneralContextProvider>
    </AuthGuard>
  );
}
