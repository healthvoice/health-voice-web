"use client";
import { useSession } from "@/context/auth";
import { useSidebar } from "@/store";
import { cn } from "@/utils/cn";
import { Bell, User } from "lucide-react";
import { useCookies } from "next-client-cookies";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./blocks/dropdown-menu";

export function Sidebar() {
  const { mobileMenu, setMobileMenu } = useSidebar();
  const router = useRouter();
  const cookies = useCookies();
  const { clearSession } = useSession();

  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 z-[9999] h-screen w-[248px] -translate-x-full border-r border-r-neutral-300 transition duration-300 ease-in xl:w-[calc(100%-450px)]",
          !mobileMenu && "transparent pointer-events-none",
          mobileMenu && "bg-primary translate-x-0 backdrop-blur",
        )}
      >
        <div className="px-4 py-4">
          <div className="flex items-center">
            <div className="flex flex-1 items-center justify-center gap-x-3">
              <Image
                src="/logos/logo.png"
                alt=""
                width={1250}
                height={500}
                className="h-min w-full object-contain"
              />
            </div>
          </div>
        </div>
        <div className="sidebar-menu flex h-[calc(100%-80px)] flex-col justify-between overflow-y-scroll p-4">
          <div className="flex flex-col gap-4">
            <button
              onClick={() =>
                window.open(
                  "https://play.google.com/store/apps/details?id=com.executivos.healthvoice",
                  "_blank",
                )
              }
              className="border-light text-light flex h-10 items-center gap-2 rounded-lg border px-4 font-semibold text-white"
            >
              <Image
                src="/icons/google-login.png"
                alt=""
                width={100}
                height={100}
                className="h-6 w-max object-contain"
              />
              Baixar Play Store
            </button>
            <button
              onClick={() =>
                window.open(
                  "https://apps.apple.com/br/app/health-voice/id6754345791",
                  "_blank",
                )
              }
              className="text-light flex h-10 items-center gap-2 rounded-lg border border-white px-4 font-semibold text-white"
            >
              <Image
                src="/icons/apple-login.png"
                alt=""
                width={100}
                height={100}
                className="h-6 w-max object-contain"
              />
              Baixar App Store
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
              <Bell className="h-4" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
                  <User className="h-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-[9999] border-none bg-white text-black"
              >
                <DropdownMenuItem
                  onSelect={() =>
                    window.open("https://wa.me/5541997819114", "_blank")
                  }
                >
                  Falar com Suporte
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    cookies.remove(
                      process.env.NEXT_PUBLIC_USER_TOKEN as string,
                    );
                    clearSession();
                    router.push("/login");
                  }}
                >
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {mobileMenu && (
        <div
          onClick={() => setMobileMenu(false)}
          className="overlay fixed inset-0 z-[999] bg-black/60 opacity-100 backdrop-blur-sm backdrop-filter"
        />
      )}
    </>
  );
}
