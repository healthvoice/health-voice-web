"use client";
import { AuthGuard } from "@/components/auth-guard";
import { Header } from "@/components/ui/header";
import { Sidebar } from "@/components/ui/sidebar";
import { GeneralContextProvider } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import Lenis from "lenis";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Não inicializa Lenis nas páginas de chat
    if (pathname.includes("/chat")) {
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

  return (
    <AuthGuard>
      <GeneralContextProvider>
        <div
          className={cn(
            "relative flex w-full flex-col pb-20",
            pathname.includes("/chat") && "pb-0",
          )}
        >
          <Header />
          <Sidebar />
          <Image
            src="/pattern.png"
            alt="Background"
            fill
            className="absolute h-full w-full object-cover opacity-[1%]"
          />

          <div
            className={cn(
              "relative z-10 mx-auto -mt-14 flex min-h-[75vh] w-full max-w-[90%] flex-col gap-4 overflow-hidden rounded-3xl bg-white p-6",
              pathname.includes("/chat") && "min-h-[70vh]",
            )}
          >
            {children}
          </div>
        </div>
      </GeneralContextProvider>
    </AuthGuard>
  );
}
