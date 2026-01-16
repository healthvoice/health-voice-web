"use client";

import { cn } from "@/utils/cn";
import { Pause, Play, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface WaveformAudioPlayerProps {
  audioUrl: string;
  className?: string;
  videoDuration: string;
}

export function WaveformAudioPlayer({
  audioUrl,
  className,
  videoDuration,
}: WaveformAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate a stable set of random heights for the waveform
  const [bars] = useState(() =>
    Array.from({ length: 45 }, () => Math.floor(Math.random() * 60) + 20),
  );

  const audio = audioRef.current;
  useEffect(() => {
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (index: number) => {
    if (audioRef.current && duration) {
      const newTime = (index / bars.length) * duration;
      audioRef.current.currentTime = newTime;
    }
  };
  const sanitizeVideoDuration = (duration: string) => {
    const h = duration.match(/(\d+)h/)?.[1] || "0";
    const m = duration.match(/(\d+)m/)?.[1] || "0";
    const s = duration.match(/(\d+)s/)?.[1] || "0";

    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
  };
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-full border border-gray-200 bg-white px-6 py-3 shadow-sm",
        className,
      )}
    >
      <audio ref={audioRef} src={audioUrl} className="hidden" />

      <span className="min-w-[70px] shrink-0 font-mono text-sm font-medium text-gray-700">
        {formatTime(currentTime)}
      </span>

      <div className="flex h-8 flex-1 items-center gap-[2px] overflow-hidden">
        {bars.map((height, index) => {
          const progress = (currentTime / duration) * bars.length;
          const isActive = index < progress;

          return (
            <div
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleSeek(index);
              }}
              className={cn(
                "w-1 cursor-pointer rounded-full transition-colors duration-100",
                isActive ? "bg-primary" : "bg-primary/60",
              )}
              style={{
                height: `${height}%`,
              }}
            />
          );
        })}
      </div>
      <span className="min-w-[70px] shrink-0 text-right font-mono text-sm font-medium text-gray-700">
        {sanitizeVideoDuration(videoDuration)}
      </span>
      <div className="flex flex-row gap-2">
        {currentTime > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none"
          >
            <RefreshCw size={20} className="text-gray-600" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none"
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
