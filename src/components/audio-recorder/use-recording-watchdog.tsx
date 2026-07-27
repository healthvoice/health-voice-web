"use client";

import {
  notificarSistema,
  pedirPermissaoDeNotificacao,
  piscarTitulo,
} from "@/lib/avisos";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

/**
 * Aviso de gravação esquecida na consulta (H3):
 * 1. Lembretes em gravações longas — primeiro em 1h, depois A CADA 30 min,
 *    sem limite ("ainda está gravando?"), com opt-out por gravação.
 * 2. Detecção de silêncio — sem áudio audível por ~5 minutos contínuos,
 *    pergunta se a reunião já encerrou (re-arma a cada janela).
 * Os avisos aparecem como toast E notificação do sistema + título da aba
 * piscando — o cenário real é o usuário ter saído para outra aba/janela.
 * NUNCA para a gravação sozinho (decisão da reunião: avisar, não parar).
 */

// Padrões (em minutos) — sobrescrevíveis por localStorage para teste/ajuste
// sem rebuild, ex.: localStorage.setItem('voice.watchdog.firstReminderMin','5')
const FIRST_REMINDER_MIN_PADRAO = 60;
const REMINDER_EVERY_MIN_PADRAO = 30;
const SILENCE_MIN_PADRAO = 5;
const SILENCE_CHECK_INTERVAL_MS = 5000;
const SILENCE_RMS_THRESHOLD = 0.01; // abaixo disso = silêncio (0..1)

function configMin(chave: string, padrao: number): number {
  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return padrao;
    const n = Number(bruto);
    return Number.isFinite(n) && n > 0 ? n : padrao;
  } catch {
    return padrao;
  }
}

function lerTimings() {
  return {
    firstReminderS:
      configMin("voice.watchdog.firstReminderMin", FIRST_REMINDER_MIN_PADRAO) * 60,
    reminderEveryS:
      configMin("voice.watchdog.reminderEveryMin", REMINDER_EVERY_MIN_PADRAO) * 60,
    silenceWindowMs:
      configMin("voice.watchdog.silenceMin", SILENCE_MIN_PADRAO) * 60 * 1000,
  };
}
function avisar(titulo: string, corpo: string, toastId: string) {
  notificarSistema(titulo, corpo, "voice-watchdog");
  piscarTitulo(`🔴 ${titulo}`);
  return toastId;
}

export function useRecordingWatchdog({
  isRecording,
  isPaused,
  duration,
  getStream,
}: {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // segundos
  getStream: () => MediaStream | null;
}) {
  const optedOutRef = useRef(false);
  const firedMarksRef = useRef<Set<number>>(new Set());
  const lastSoundAtRef = useRef<number>(Date.now());
  const silenceWarnedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timingsRef = useRef(lerTimings());

  // Reset ao começar/terminar uma gravação (+ pedir permissão de notificação
  // no início — estamos dentro do gesto de "iniciar gravação")
  useEffect(() => {
    if (isRecording) {
      optedOutRef.current = false;
      firedMarksRef.current = new Set();
      lastSoundAtRef.current = Date.now();
      silenceWarnedRef.current = false;
      timingsRef.current = lerTimings(); // timings lidos no início da gravação
      pedirPermissaoDeNotificacao();
    }
  }, [isRecording]);

  // 1. Lembretes de gravação longa: 1h, depois a cada 30 min, sem limite
  useEffect(() => {
    if (!isRecording || isPaused || optedOutRef.current) return;
    const { firstReminderS, reminderEveryS } = timingsRef.current;
    if (duration < firstReminderS) return;

    const mark =
      firstReminderS +
      Math.floor((duration - firstReminderS) / reminderEveryS) * reminderEveryS;
    if (firedMarksRef.current.has(mark)) return;
    firedMarksRef.current.add(mark);

    const h = Math.floor(mark / 3600);
    const min = Math.round((mark % 3600) / 60);
    const label =
      h === 0
        ? `${min} min`
        : min
          ? `${h}h${String(min).padStart(2, "0")}`
          : `${h}h`;

    avisar(
      "Consulta ainda em andamento?",
      `Gravando há ${label}. A gravação continua normalmente — pare quando quiser.`,
      `long-rec-${mark}`,
    );
    toast(
      (t) => (
        <span className="text-sm">
          🎙️ Gravando há <strong>{label}</strong> — a consulta ainda está em andamento? A
          gravação continua normalmente.
          <button
            onClick={() => {
              optedOutRef.current = true;
              toast.dismiss(t.id);
            }}
            className="ml-2 font-semibold underline"
          >
            Não avisar de novo
          </button>
        </span>
      ),
      { duration: 15000, id: `long-rec-${mark}` },
    );
  }, [isRecording, isPaused, duration]);

  // 2. Detecção de silêncio prolongado
  useEffect(() => {
    if (!isRecording) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      return;
    }

    const stream = getStream();
    if (!stream) return;

    let analyser: AnalyserNode;
    let data: Uint8Array<ArrayBuffer>;
    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      data = new Uint8Array(new ArrayBuffer(analyser.fftSize));
    } catch {
      return; // sem suporte — watchdog de silêncio desativado silenciosamente
    }

    intervalRef.current = setInterval(() => {
      if (isPaused) {
        lastSoundAtRef.current = Date.now(); // pausa não conta como silêncio
        return;
      }
      analyser.getByteTimeDomainData(data);
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / data.length);

      if (rms >= SILENCE_RMS_THRESHOLD) {
        lastSoundAtRef.current = Date.now();
        silenceWarnedRef.current = false;
        return;
      }

      const silentForMs = Date.now() - lastSoundAtRef.current;
      if (silentForMs >= timingsRef.current.silenceWindowMs && !silenceWarnedRef.current) {
        silenceWarnedRef.current = true;
        const minutos = Math.round(silentForMs / 60000);
        avisar(
          "A consulta terminou?",
          `Não detectamos áudio há ~${minutos} minutos e a gravação continua rodando.`,
          "silence-warn",
        );
        toast(
          `🔇 Não detectamos áudio há ~${minutos} minutos. A consulta terminou? A gravação continua rodando — pare quando quiser.`,
          { duration: 20000, id: "silence-warn" },
        );
        // Re-arma: se continuar em silêncio, avisa de novo daqui a outra janela
        lastSoundAtRef.current = Date.now();
      }
    }, SILENCE_CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [isRecording, isPaused, getStream]);
}
