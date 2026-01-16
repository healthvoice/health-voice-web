import { fakerPT_BR } from "@faker-js/faker";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "./blocks/avatar";

export function Hero() {
  return (
    <div className="from-bg-1 to-bg-2 flex min-h-[calc(100vh-128px)] w-full flex-col bg-gradient-to-b">
      <div className="mx-auto flex h-full max-w-[1280px] flex-1 flex-col justify-center">
        <div className="flex h-full w-full flex-col gap-4 pt-20 xl:flex-row xl:items-center">
          <div className="flex flex-1 flex-col gap-2 p-4 xl:gap-4 2xl:p-0">
            <div className="text-3xl font-light xl:text-5xl">
              <span className="font-bold">Relatórios Médicos </span>
              <span>Inteligentes, Organizados e </span>
              <span className="font-bold">Prontos em Minutos.</span>
            </div>
            <div className="font-light">
              <span>Deixe a </span>
              <span className="text-primary font-semibold">
                Inteligência Artificial{" "}
              </span>
              <span>documentar e </span>
              <span className="text-primary font-semibold">
                devolver tempo{" "}
              </span>
              <span>para </span>
              <span className="text-primary font-semibold">você focar </span>
              <span>no paciente e na sua verdadeira vocação.</span>
            </div>
            <button className="group relative hidden w-max xl:block">
              <div className="animate-tilt bg-primary absolute -inset-px rounded-lg opacity-70 blur-md transition duration-1000 group-hover:-inset-0.5 group-hover:opacity-100 group-hover:duration-200" />
              <span className="bg-primary text-light relative inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-lg font-bold transition-all duration-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:outline-none">
                Quero Conhecer
                <ChevronRight className="stroke-3" />
              </span>
            </button>
          </div>
          <div className="relative mx-auto flex h-full w-4/5 items-center justify-center px-4 xl:mx-0 xl:w-2/5 2xl:px-0">
            <Image
              src="/static/hero-1.png"
              alt=""
              width={1000}
              height={1000}
              className="h-max w-full object-contain opacity-80"
            />
            <div className="bg-light/5 absolute top-1/2 left-1/2 hidden h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl xl:block" />
          </div>
        </div>
        <div className="flex flex-col gap-2 px-4 xl:flex-row xl:items-center 2xl:px-0">
          <AvatarGroup countClass="w-8 h-8" total={5}>
            {Array.from({ length: 5 }).map((_, i: number) => (
              <Avatar
                key={i}
                className="ring-light ring-offset-light h-8 w-8 ring-1 ring-offset-[2px]"
              >
                <AvatarImage src={fakerPT_BR.image.personPortrait()} />
                <AvatarFallback></AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <div className="font-light">
            <span>Mais de </span>
            <span className="text-primary font-semibold">100 médicos </span>
            <span> escolheram ser </span>
            <span className="font-semibold">Inteligentes e eficientes</span>
          </div>
        </div>
        <button className="group relative mx-auto mt-8 w-max xl:hidden">
          <div className="animate-tilt bg-primary absolute -inset-px rounded-lg opacity-70 blur-md transition duration-1000 group-hover:-inset-0.5 group-hover:opacity-100 group-hover:duration-200" />
          <span className="bg-primary text-light relative inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-lg font-bold transition-all duration-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:outline-none">
            Quero Conhecer
            <ChevronRight className="stroke-3" />
          </span>
        </button>
      </div>
    </div>
  );
}
