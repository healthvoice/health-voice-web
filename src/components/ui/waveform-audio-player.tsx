"use client";

import { cn } from "@/utils/cn";
import { Pause, Play, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface WaveformAudioPlayerProps {
  audioUrl: string;
  className?: string;
  videoDuration?: string; // Format like "0h 1m 25s" or "1m 25s" or "00:01:25"
  barCount?: number;
  /**
   * Picos reais da gravação (Recording.waveform, gerados pelo motor). Quando
   * presentes, a onda é a de verdade; sem eles (acervo antigo), cai nas barras
   * sintéticas de sempre.
   */
  peaks?: number[] | null;
}

/** Reamostra os picos para N barras (máximo por balde preserva os picos). */
function resamplePeaks(peaks: number[], alvo: number): number[] {
  if (peaks.length <= alvo) return peaks;
  const out: number[] = [];
  for (let i = 0; i < alvo; i++) {
    const ini = Math.floor((i / alvo) * peaks.length);
    const fim = Math.max(ini + 1, Math.floor(((i + 1) / alvo) * peaks.length));
    out.push(Math.max(...peaks.slice(ini, fim)));
  }
  return out;
}

export function WaveformAudioPlayer({
  audioUrl,
  className,
  videoDuration = "00:00:00",
  barCount = 30, // Reduced default from 45 to fit better in small spaces
  peaks,
}: WaveformAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Onda real quando o motor mandou os picos; barras sintéticas no acervo antigo
  const [bars] = useState(() => {
    if (peaks && peaks.length > 4) {
      const amostra = resamplePeaks(peaks, Math.max(barCount, 90));
      const maximo = Math.max(...amostra, 0.01);
      // 8–100%: piso para silêncio continuar visível/clicável
      return amostra.map((v) => Math.max(8, Math.round((v / maximo) * 100)));
    }
    return Array.from({ length: barCount }, () => Math.floor(Math.random() * 60) + 20);
  });

  // Helper to parse "0h 1m 25s" or "1m 25s" or "00:01:25" etc. into seconds
  const parseDurationToSeconds = useCallback((durStr: string): number => {
    if (!durStr) return 0;

    // Try format with h, m, s (e.g., "0h 1m 25s" or "1m25s")
    const hMatch = durStr.match(/(\d+)\s*h/i);
    const mMatch = durStr.match(/(\d+)\s*m/i);
    const sMatch = durStr.match(/(\d+)\s*s/i);

    if (hMatch || mMatch || sMatch) {
      const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
      const minutes = mMatch ? parseInt(mMatch[1], 10) : 0;
      const seconds = sMatch ? parseInt(sMatch[1], 10) : 0;
      return hours * 3600 + minutes * 60 + seconds;
    }

    // Try colon-separated format (HH:MM:SS or MM:SS)
    if (durStr.includes(":")) {
      const parts = durStr.split(":").map((p) => parseInt(p, 10));
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      } else if (parts.length === 1) {
        return parts[0];
      }
    }

    return 0;
  }, []);

  // Initialize duration from prop
  useEffect(() => {
    const parsed = parseDurationToSeconds(videoDuration);
    if (parsed > 0) {
      setDuration(parsed);
    }
  }, [videoDuration, parseDurationToSeconds]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsReady(true);
    };

    const handleCanPlayThrough = () => {
      setIsReady(true);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("ended", handleEnded);

    // Force load
    audio.load();

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  // Trilha IA (playback clicável): a transcrição dispara "healthvoice:seek" com
  // {time} ao clicar numa palavra — o player pula até lá e toca.
  useEffect(() => {
    const handleSeekEvent = (event: Event) => {
      const audio = audioRef.current;
      const time = (event as CustomEvent<{ time?: number }>).detail?.time;
      if (!audio || typeof time !== "number" || !Number.isFinite(time)) return;
      audio.currentTime = Math.max(0, time);
      setCurrentTime(audio.currentTime);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    };
    window.addEventListener("healthvoice:seek", handleSeekEvent);
    return () => window.removeEventListener("healthvoice:seek", handleSeekEvent);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((e) => {
          console.error("Error playing audio:", e);
        });
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const handleSeek = (barIndex: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Use the parsed duration from prop as primary source
    const totalDuration =
      duration > 0 ? duration : parseDurationToSeconds(videoDuration);

    if (totalDuration <= 0) return;

    // Calculate target time based on bar position
    const targetTime = (barIndex / bars.length) * totalDuration;

    if (
      Number.isFinite(targetTime) &&
      targetTime >= 0 &&
      targetTime <= totalDuration
    ) {
      audio.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00:00";

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Format the display duration from the prop or state
  const formatDisplayDuration = (): string => {
    if (duration > 0) {
      return formatTime(duration);
    }
    const seconds = parseDurationToSeconds(videoDuration);
    return formatTime(seconds);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm",
        className,
      )}
    >
      {/* Audio Element with auto preload for seeking to work */}
      <audio ref={audioRef} src={audioUrl} className="hidden" preload="auto" />

      {/* Left: Current Time */}
      <span className="min-w-[70px] shrink-0 font-mono text-sm font-medium text-gray-700">
        {formatTime(currentTime)}
      </span>

      {/* Center: Waveform Bars */}
      <div className="flex h-8 flex-1 items-center justify-between gap-[2px] overflow-hidden">
        {bars.map((height, index) => {
          // Calculate if this bar should be "active" (played past)
          const totalDur = duration > 0 ? duration : 1;
          const progressRatio = currentTime / totalDur;
          const barRatio = index / bars.length;
          const isActive = barRatio <= progressRatio;

          return (
            <div
              key={index}
              onClick={() => handleSeek(index)}
              className={cn(
                // flex-1 + teto de largura: as barras se repartem pela largura
                // disponível (antes, w-1 fixo virava uma faixa curta à esquerda)
                // sem engordar a ponto de virarem "bolinhas" em tela larga.
                "min-w-[2px] max-w-[5px] flex-1 cursor-pointer rounded-full transition-all duration-100",
                isActive ? "bg-gray-600" : "bg-gray-200 hover:bg-gray-400",
              )}
              style={{
                height: `${height}%`,
              }}
            />
          );
        })}
      </div>

      {/* Right: Total Duration */}
      <span className="min-w-[70px] shrink-0 text-right font-mono text-sm font-medium text-gray-700">
        {formatDisplayDuration()}
      </span>

      {/* Controls */}
      <div className="flex flex-row gap-2">
        {/* Restart Button */}
        <button
          onClick={handleRestart}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700 transition-all hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:outline-none",
            currentTime > 0.5 ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <RefreshCw size={20} className="text-gray-600" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:outline-none"
        >
          {isPlaying ? (
            <Pause size={20} fill="currentColor" className="text-gray-600" />
          ) : (
            <Play
              size={20}
              fill="currentColor"
              className="ml-1 text-gray-600"
            />
          )}
        </button>
      </div>
    </div>
  );
}
