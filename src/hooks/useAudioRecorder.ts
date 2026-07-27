"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper para escolher o melhor formato suportado pelo navegador
  const getMimeType = () => {
    const types = [
      "audio/mp4;codecs=aac",
      "audio/mp4",
      "audio/webm;codecs=opus",
      "audio/webm",
    ];
    // @ts-ignore
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
  };

  const startRecording = useCallback(async () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      return;
    }

    let stream: MediaStream | null = null;
    try {
      setAudioFile(null); // Limpa gravação anterior
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const activeStream = stream;

      const mimeType = getMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(activeStream, options);
      mediaStreamRef.current = activeStream;

      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        // Cria o arquivo final
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        const ext = mimeType.includes("webm") ? "webm" : "m4a";
        const finalType = ext === "webm" ? "audio/webm" : "audio/mp4";
        const file = new File([blob], `recording.${ext}`, { type: finalType });

        setAudioFile(file);

        // Limpa tracks do stream (desliga luz da câmera/mic)
        activeStream.getTracks().forEach((t) => t.stop());
        if (mediaStreamRef.current === activeStream) {
          mediaStreamRef.current = null;
        }
        if (mediaRecorderRef.current === recorder) {
          mediaRecorderRef.current = null;
        }
      };

      recorder.start(500); // Salva chunks a cada 500ms
      mediaRecorderRef.current = recorder;

      // Inicia UI
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Inicia Timer
      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const seconds = Math.floor(
            (Date.now() - startTimeRef.current) / 1000,
          );
          const mm = Math.floor(seconds / 60)
            .toString()
            .padStart(2, "0");
          const ss = (seconds % 60).toString().padStart(2, "0");
          setElapsedTime(`${mm}:${ss}`);
        }
      }, 1000);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      if (mediaStreamRef.current === stream) {
        mediaStreamRef.current = null;
      }
      console.error("Erro ao iniciar gravação:", error);
      toast.error("Permissão de microfone negada ou indisponível.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    // Limpa estados
    setIsRecording(false);
    startTimeRef.current = null;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setElapsedTime("00:00");
  }, []);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      const recorder = mediaRecorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
        mediaRecorderRef.current = null;
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      chunksRef.current = [];
    };
  }, []);

  const clearAudio = () => setAudioFile(null);

  return {
    isRecording,
    elapsedTime,
    audioFile,
    startRecording,
    stopRecording,
    clearAudio,
  };
}
