"use client";

import { useSidebar } from "@/store";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

export function MobileTopBar() {
  const { setMobileMenu } = useSidebar();
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-[9997] flex h-14 items-center justify-between border-b border-white/10 bg-primary px-4 md:hidden">
      <button
        type="button"
        onClick={() => setMobileMenu(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => router.push("/")}
        className="focus:outline-none"
      >
        <Image
          src="/logos/logo2.png"
          alt="Health Voice"
          width={120}
          height={36}
          className="h-7 w-auto object-contain"
        />
      </button>
      <div className="w-10" />
    </header>
  );
}
