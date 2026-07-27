"use client";

/**
 * Avisos que alcançam o usuário FORA da aba: notificação do sistema + título
 * piscando. Usados pelo watchdog de gravação e pelo alerta de reunião
 * começando — nos dois casos o cenário real é o usuário estar em outra
 * aba/janela.
 */

const TITLE_BLINK_MS = 30000;

/** Pede permissão de notificação (chamar num gesto do usuário). */
export function pedirPermissaoDeNotificacao() {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

export function notificarSistema(titulo: string, corpo: string, tag: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(titulo, { body: corpo, tag });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // notificação é melhoria, nunca erro
  }
}

/** Pisca o título da aba até o usuário voltar o foco (ou o tempo esgotar). */
export function piscarTitulo(aviso: string) {
  if (typeof document === "undefined") return;
  const original = document.title;
  let ligado = false;
  const interval = setInterval(() => {
    ligado = !ligado;
    document.title = ligado ? aviso : original;
  }, 1000);
  const parar = () => {
    clearInterval(interval);
    document.title = original;
    window.removeEventListener("focus", parar);
  };
  window.addEventListener("focus", parar);
  setTimeout(parar, TITLE_BLINK_MS);
}
