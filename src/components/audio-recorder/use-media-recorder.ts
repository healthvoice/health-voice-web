import { useCallback, useEffect, useRef, useState } from "react";

type MediaType = "audio" | "video";

interface RecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  mediaBlob: Blob | null;
  mediaUrl: string;
  mediaType: MediaType;
}

interface RecorderOptions {
  mediaType: MediaType;
  onComplete?: (blob: Blob, duration: number) => void;
  onError?: (error: Error) => void;
}

export function useMediaRecorder(options: RecorderOptions) {
  const { mediaType, onComplete, onError } = options;

  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    mediaBlob: null,
    mediaUrl: "",
    mediaType,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Timer preciso usando timestamps
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((track) => track.stop());
      displayStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  // Atualiza duração usando requestAnimationFrame para precisão
  const updateDuration = useCallback(() => {
    if (startTimeRef.current && !state.isPaused) {
      const elapsed = Math.floor(
        (Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000,
      );
      setState((prev) => ({ ...prev, duration: elapsed }));
      animationFrameRef.current = requestAnimationFrame(updateDuration);
    }
  }, [state.isPaused]);

  const startAudioRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Usa o melhor codec disponível
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Calcula duração final precisa
        const finalDuration = Math.floor(
          (Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000,
        );

        const mediaBlob = new Blob(chunksRef.current, { type: mimeType });
        const mediaUrl = URL.createObjectURL(mediaBlob);

        setState((prev) => ({
          ...prev,
          mediaBlob,
          mediaUrl,
          duration: finalDuration,
          isRecording: false,
          isPaused: false,
        }));

        cleanup();

        // Callback com blob e duração corretos
        if (onComplete) {
          onComplete(mediaBlob, finalDuration);
        }
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error("MediaRecorder error:", event);
        const error = new Error("Erro durante a gravação");
        cleanup();
        if (onError) onError(error);
      };

      // Captura dados frequentemente para evitar perda
      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;

      // Inicia timer preciso
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      pauseStartRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(updateDuration);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        mediaBlob: null,
        mediaUrl: "",
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Erro ao iniciar gravação de áudio:", error);
      cleanup();
      if (onError) onError(error);
      throw error;
    }
  }, [updateDuration, onComplete, onError, cleanup]);

  const startVideoRecording = useCallback(async () => {
    try {
      // Captura tela com áudio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser" as DisplayCaptureSurfaceType,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } as MediaStreamConstraints,
        preferCurrentTab: false,
        selfBrowserSurface: "exclude",
        systemAudio: "include",
      } as MediaStreamConstraints);

      displayStreamRef.current = displayStream;

      // Verifica se tem áudio da aba
      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error(
          'Áudio não detectado. Selecione uma ABA e marque "Compartilhar áudio da aba"',
        );
      }

      // Tenta capturar microfone (opcional)
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = micStream;
      } catch (micError) {
        console.warn("Microfone não disponível:", micError);
      }

      // Mixar áudios
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const destination = audioContext.createMediaStreamDestination();

      const tabAudioSource =
        audioContext.createMediaStreamSource(displayStream);
      tabAudioSource.connect(destination);

      if (micStream) {
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(destination);
      }

      // Stream final com vídeo e áudio mixado
      const finalStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);

      const mimeType = MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp9,opus",
      )
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm";

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: 1000000, // 1 Mbps (reduced from 2.5 Mbps)
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalDuration = Math.floor(
          (Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000,
        );

        const mediaBlob = new Blob(chunksRef.current, { type: mimeType });
        const mediaUrl = URL.createObjectURL(mediaBlob);

        setState((prev) => ({
          ...prev,
          mediaBlob,
          mediaUrl,
          duration: finalDuration,
          isRecording: false,
          isPaused: false,
        }));

        cleanup();
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error("MediaRecorder error:", event);
        const error = new Error("Erro durante a gravação");
        cleanup();
        if (onError) onError(error);
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;

      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      pauseStartRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(updateDuration);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        mediaBlob: null,
        mediaUrl: "",
      }));

      // Para quando usuário fechar compartilhamento
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Erro ao iniciar gravação de vídeo:", error);
      cleanup();
      if (onError) onError(error);
      throw error;
    }
  }, [updateDuration, onComplete, onError, cleanup]);

  const startRecording = useCallback(async () => {
    if (mediaType === "audio") {
      return startAudioRecording();
    } else {
      return startVideoRecording();
    }
  }, [mediaType, startAudioRecording, startVideoRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      pauseStartRef.current = Date.now();

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isPaused) {
      mediaRecorderRef.current.resume();
      pausedTimeRef.current += Date.now() - pauseStartRef.current;
      animationFrameRef.current = requestAnimationFrame(updateDuration);

      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, [state.isPaused, updateDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (state.isRecording || state.isPaused)) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording, state.isPaused]);

  const resetRecording = useCallback(() => {
    if (state.mediaUrl) {
      URL.revokeObjectURL(state.mediaUrl);
    }

    chunksRef.current = [];
    pausedTimeRef.current = 0;
    pauseStartRef.current = 0;
    startTimeRef.current = 0;

    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      mediaBlob: null,
      mediaUrl: "",
      mediaType,
    });
  }, [state.mediaUrl, mediaType]);

  /** Stream ativo — o watchdog observa o áudio para detectar silêncio (H3). */
  const getStream = useCallback(() => streamRef.current, []);

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    getStream,
  };
}
