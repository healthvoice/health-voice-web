import Image from "next/image";

/**
 * Componente MobileAppBlocker
 * * Este componente detecta via CSS (Tailwind) se o usuário está em uma tela pequena.
 * Se estiver, ele sobrepõe todo o sistema com uma tela de bloqueio forçando
 * o download do aplicativo.
 */
const MobileAppBlocker = () => {
  return (
    // A classe 'md:hidden' garante que isso só apareça em telas menores que o breakpoint 'md' do Tailwind (tablets/celulares)
    // 'fixed inset-0 z-[9999]' garante que fique por cima de tudo e o usuário não consiga sair.
    <div className="fixed inset-0 z-[9999] flex touch-none flex-col items-center justify-center overscroll-none bg-[#0070f3] p-6 text-center select-none md:hidden">
      {/* Background Decorativo (Círculos sutis para dar textura similar ao header) */}
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden opacity-10">
        <div className="absolute top-[-10%] left-[-10%] h-64 w-64 rounded-full bg-white mix-blend-overlay blur-3xl"></div>
        <div className="absolute right-[-10%] bottom-[-10%] h-80 w-80 rounded-full bg-white mix-blend-overlay blur-3xl"></div>
      </div>

      {/* Conteúdo Principal */}
      <div className="animate-fade-in relative z-10 flex w-full max-w-sm flex-col items-center">
        {/* Logo / Branding */}
        <div className="mb-8 flex items-center gap-2">
          <div className="rounded-full border border-white/30 bg-white/20 p-3 backdrop-blur-sm">
            {/* Ícone de Microfone simulando o logo HealthVoice */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-white"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            HEALTH<span className="font-light">VOICE</span>
          </h1>
        </div>

        {/* Mensagem de Bloqueio */}
        <div className="mb-6 w-full rounded-2xl bg-white p-6 shadow-2xl">
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Acesso Restrito ao App
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            Para garantir a melhor experiência e compatibilidade com o
            microfone, o sistema HealthVoice não pode ser acessado pelo
            navegador do celular.
            <br />
            <br />
            <span className="font-medium text-[#0070f3]">
              Baixe nosso aplicativo para continuar.
            </span>
          </p>

          {/* Botões das Lojas */}
          <div className="flex w-full flex-col gap-3">
            {/* Botão Apple Store */}
            <a
              href="https://apps.apple.com/us/app/health-voice/id6754345791"
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-black px-4 py-3 text-white shadow-lg transition-all hover:bg-gray-900 active:scale-95"
            >
              <Image
                src="/icons/apple-login.png"
                alt="Logo da Apple"
                width={24} // Tamanho explícito
                height={24}
                className="h-6 w-6 object-contain" // Ajustado para w-6
              />
              <div className="flex flex-col items-center leading-none">
                <span className="text-[10px] font-medium text-gray-300 uppercase">
                  Baixar na
                </span>
                <span className="text-lg font-bold">App Store</span>
              </div>
            </a>

            {/* Botão Google Play Store */}
            <a
              href="https://play.google.com/store/apps/details?id=com.executivos.healthvoice"
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-black px-4 py-3 text-white shadow-lg transition-all hover:bg-gray-900 active:scale-95"
            >
              {/* Ícone Google Play SVG Manual */}
              <Image
                src="/icons/google-login.png"
                alt="Logo do Google"
                width={24} // Tamanho explícito é melhor
                height={24}
                className="h-6 w-6 object-contain" // Ajustado para w-6
              />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-medium text-gray-300 uppercase">
                  Baixar
                </span>
                <span className="text-lg font-bold">Google Play</span>
              </div>
            </a>
          </div>
        </div>

        <p className="mt-4 text-xs text-white/60">
          Versão 2.1.0 • HealthVoice Inc.
        </p>
      </div>
    </div>
  );
};

export default MobileAppBlocker;
