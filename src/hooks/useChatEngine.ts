"use client";

import { useApiContext } from "@/context/ApiContext";
import { handleApiError } from "@/utils/error-handler";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Message } from "@/components/chatPopup/types";
import { useAudioRecorder } from "./useAudioRecorder";
import { useFileHandler } from "./useFileHandler";

// Extend Message type to include id and createdAt
type ExtendedMessage = Message & {
  id?: string;
  createdAt?: string;
};

// --- HELPERS ---
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface UseChatEngineProps {
  chatId?: string;
  promptId?: string; // Opcional, para prompts de chat
  promptContent?: string; // Conteúdo do prompt para enviar à IA
  model?: string;
  skipPersistence?: boolean; // Se true, não salva no backend (chat independente)
}

export function useChatEngine({
  chatId: initialChatId,
  promptId,
  promptContent,
  model = "google/gemini-2.5-flash",
  skipPersistence = false,
}: UseChatEngineProps = {}) {
  // --- STATES ---
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(
    initialChatId,
  );

  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const audioRecorder = useAudioRecorder();
  const fileHandler = useFileHandler();

  // API Context para salvar no banco
  const { PostAPI, PutAPI, GetAPI } = useApiContext();

  const abortControllerRef = useRef<AbortController | null>(null);

  // --- 1. FUNÇÕES DE PERSISTÊNCIA (BACKEND) ---

  const createChatOnBackend = async (firstMessageText: string) => {
    try {
      // Usa as primeiras 5 palavras como nome provisório
      const tempName =
        firstMessageText.split(" ").slice(0, 5).join(" ") || "Novo Chat";

      const { getCurrentPlatform } = await import("@/utils/platform");
      const res = await PostAPI(
        "/chat",
        {
          name: tempName,
          promptId: promptId || undefined,
          platform: getCurrentPlatform(),
        },
        true,
      );

      if (res.status === 200 || res.status === 201) {
        const newId = res.body?.id || res.body?.chat?.id;
        setCurrentChatId(newId);
        return newId;
      } else {
        const errorMessage = handleApiError(
          res,
          "Erro ao criar chat. Tente novamente.",
        );
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Erro ao criar chat no backend:", error);
      toast.error("Erro ao criar chat. Tente novamente.");
    }
    return null;
  };

  const loadChat = async (idToLoad: string) => {
    try {
      setLoading(true);
      setMessages([]); // Limpa a tela
      setCurrentChatId(idToLoad); // Atualiza o ID atual

      const res = await GetAPI(`/message/${idToLoad}`, true);

      const dataBackend = Array.isArray(res.body)
        ? res.body
        : res.body?.messages || [];

      // MAPEAMENTO (Backend -> Frontend)
      const mappedMessages: ExtendedMessage[] = dataBackend.map((msg: any) => {
        const validFile =
          msg.fileUrl &&
          !msg.fileUrl.endsWith("/null") &&
          !msg.fileUrl.endsWith("/undefined");

        return {
          id: msg.id,
          role: msg.entity === "USER" ? "user" : "ai",
          content: msg.text || "",
          createdAt: msg.createdAt,
          file: validFile ? msg.fileUrl : undefined,
          type: msg.mimeType,
          name: "Arquivo",
        };
      });

      setMessages(mappedMessages);
    } catch (error) {
      console.error("Erro ao carregar chat:", error);
      toast.error("Erro ao carregar chat. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const saveMessageOnBackend = async (
    chatId: string,
    text: string,
    entity: "USER" | "MODEL",
    mimeType: string = "text",
  ) => {
    try {
      const { getCurrentPlatform } = await import("@/utils/platform");
      await PostAPI(
        `/message/${chatId}`,
        {
          text,
          entity,
          mimeType,
          platform: getCurrentPlatform(),
        },
        true,
      );
    } catch (error) {
      console.error("Erro ao salvar mensagem:", error);
      // Não mostra toast para erros de persistência silenciosa
    }
  };

  const uploadFileOnBackend = async (chatId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      // Rota para upload isolado
      const response = await PostAPI(`/message/${chatId}/file`, formData, true);
      if (response.status >= 400) {
        const errorMessage = handleApiError(
          response,
          "Erro ao fazer upload do arquivo. Tente novamente.",
        );
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
      toast.error("Erro ao fazer upload do arquivo. Tente novamente.");
    }
  };

  const updateTitleOnBackend = async (chatId: string, newTitle: string) => {
    try {
      const response = await PutAPI(`/chat/${chatId}`, { name: newTitle }, true);
      if (response.status >= 400) {
        // Não mostra toast para erros de atualização de título (não crítico)
        console.error("Erro ao atualizar título:", response);
      }
    } catch (error) {
      console.error("Erro ao atualizar título:", error);
      // Não mostra toast para erros de atualização de título (não crítico)
    }
  };

  // --- 2. TÍTULO INTELIGENTE ---
  const generateSmartTitle = useCallback(
    async (currentMessages: ExtendedMessage[], activeChatId: string) => {
      try {
        const mappedMessages = currentMessages.map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.content,
        }));

        const res = await fetch("/api/chat/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: mappedMessages }),
        });

        const data = await res.json();

        if (data.title && activeChatId) {
          await updateTitleOnBackend(activeChatId, data.title);
        }
      } catch (e) {
        console.error("Falha ao gerar título:", e);
      }
    },
    [],
  );

  // --- 3. ENVIO DE MENSAGEM (PRINCIPAL) ---
  const sendMessage = async (textInput: string) => {
    const text = textInput.trim();
    const hasAudio = !!audioRecorder.audioFile;
    const hasFiles = fileHandler.files.length > 0;

    if (!text && !hasAudio && !hasFiles) return;

    setLoading(true);
    setStreamingContent("");

    // --- A. PREPARAÇÃO VISUAL (OTIMISTA) ---
    // Cria um array temporário para atualizar a UI instantaneamente
    const tempMessages: ExtendedMessage[] = [];
    const timestamp = new Date().toISOString();

    // 1. Adiciona bolhas para cada arquivo
    fileHandler.files.forEach((f, idx) => {
      tempMessages.push({
        id: `temp-file-${idx}-${Date.now()}`,
        role: "user",
        content: "", // Arquivo visualmente não precisa de texto no balão se tiver preview
        createdAt: timestamp,
        attachments: [
          {
            url: f.preview,
            type: f.type === "pdf" ? "application/pdf" : f.file.type,
            name: f.file.name,
          },
        ],
      });
    });

    // 2. Adiciona bolha para áudio (se houver)
    let audioBase64: string | null = null;
    if (hasAudio && audioRecorder.audioFile) {
      const audioUrl = URL.createObjectURL(audioRecorder.audioFile);
      tempMessages.push({
        id: `temp-audio-${Date.now()}`,
        role: "user",
        content: "Mensagem de Áudio",
        createdAt: timestamp,
        attachments: [
          {
            url: audioUrl,
            type: audioRecorder.audioFile.type,
            name: "Áudio",
          },
        ],
      });
      // Prepara Base64 para IA
      audioBase64 = await blobToBase64(audioRecorder.audioFile);
    }

    // 3. Adiciona bolha de texto (com contexto extraído de DOCX, se houver)
    let finalText = text;
    const docxContents = fileHandler.files
      .filter((f) => f.extractedContent)
      .map(
        (f) => `\n--- Conteúdo de ${f.file.name} ---\n${f.extractedContent}`,
      );

    if (docxContents.length > 0) {
      finalText +=
        "\n\n[CONTEXTO DOS ARQUIVOS ANEXADOS]:" + docxContents.join("\n");
    }

    if (finalText) {
      tempMessages.push({
        id: `temp-text-${Date.now()}`,
        role: "user",
        content: finalText,
        createdAt: timestamp,
      });
    }

    // Atualiza o estado visual (mensagens do usuário)
    const updatedMessages = [...messages, ...tempMessages];
    const aiMsgId = `ai-loading-${Date.now()}`;
    // Balão da IA com "..." animado aparece imediatamente ao enviar
    setMessages([
      ...updatedMessages,
      {
        id: aiMsgId,
        role: "ai",
        content: "...",
        createdAt: new Date().toISOString(),
      },
    ]);

    // --- B. PREPARAÇÃO DE DADOS PARA A IA E BACKEND ---

    // 1. Processa arquivos para IA (Base64)
    // Se não tiver arquivos, retorna array vazio
    const processedFilesForAI =
      fileHandler.files.length > 0 ? await fileHandler.getFilesAsBase64() : [];

    // Adiciona o áudio na lista de arquivos da IA, se existir
    if (hasAudio && audioBase64 && audioRecorder.audioFile) {
      processedFilesForAI.push({
        name: "audio_gravado.webm",
        type: audioRecorder.audioFile.type,
        base64: audioBase64,
      });
    }

    // 2. Guarda referências dos arquivos originais para salvar no Backend
    // (Precisamos clonar o array antes de limpar o handler)
    const originalFilesForBackend = [...fileHandler.files];
    const audioFileForBackend = audioRecorder.audioFile;

    // --- C. EXECUÇÃO (PERSISTÊNCIA + IA) ---
    try {
      abortControllerRef.current = new AbortController();

      // 1. Garante que existe um Chat ID (apenas se não estiver pulando persistência)
      let activeChatId = currentChatId;
      if (!skipPersistence) {
        if (!activeChatId) {
          // Tenta usar o texto ou nome do primeiro arquivo como título inicial
          const titleCandidate =
            text || originalFilesForBackend[0]?.file.name || "Novo Chat";

          const newId = await createChatOnBackend(titleCandidate);
          if (newId) activeChatId = newId;
        }

        // 2. Salva no Backend (Um por um, como sua API exige)
        if (activeChatId) {
          // Salva arquivos visuais/documentos
          for (const fileItem of originalFilesForBackend) {
            await uploadFileOnBackend(activeChatId, fileItem.file);
          }

          // Salva áudio (se houver - assumindo que sua API aceita via rota de arquivo)
          if (audioFileForBackend) {
            await uploadFileOnBackend(activeChatId, audioFileForBackend);
          }

          // Salva a mensagem de texto (se houver)
          if (finalText) {
            await saveMessageOnBackend(activeChatId, finalText, "USER", "text");
          }
        }
      }

      // Limpa inputs agora que já processamos e iniciamos o salvamento
      fileHandler.clearFiles();
      audioRecorder.clearAudio();

      // 3. Chamada para a IA (Rota Unificada Multimodal)
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      // Usa prompt padrão genérico se nenhum prompt específico foi fornecido
      const finalSystemPrompt =
        promptContent ||
        `Você é um assistente de IA especializado em saúde e medicina. Seu objetivo é ajudar profissionais de saúde e pacientes com informações precisas, análises de exames, suporte para diagnósticos e respostas a perguntas relacionadas à área médica.

Sempre responda de forma clara, objetiva e em português do Brasil. Seja profissional, empático e cuidadoso ao fornecer informações médicas, lembrando sempre que suas respostas são complementares e não substituem a consulta médica presencial.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          files: processedFilesForAI, // Envia o array de arquivos
          model: model,
          systemPrompt: finalSystemPrompt, // Envia o prompt do sistema (ou padrão)
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Erro API IA");
      if (!response.body) throw new Error("Sem stream");

      // 4. Leitura do Stream (bolha "..." já foi adicionada ao enviar)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullResponse = "";
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        buffer += decoder.decode(value, { stream: !done });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.startsWith("data:")) continue;
          const jsonString = part.substring(5).trim();
          if (jsonString === "[DONE]") {
            done = true;
            break;
          }
          try {
            const data = JSON.parse(jsonString);
            const content = data.choices?.[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              setStreamingContent((prev) => prev + content);
              setMessages((prev) => {
                const newArr = [...prev];
                const lastMsg = newArr[newArr.length - 1];
                // Verifica se a última mensagem é a da IA que estamos preenchendo
                if (lastMsg.role === "ai" && lastMsg.id === aiMsgId) {
                  lastMsg.content = fullResponse;
                }
                return newArr;
              });
            }
          } catch (e) {
            // Ignora erros de parse no stream
          }
        }
      }

      // 5. Salva Resposta da IA no Backend (apenas se não estiver pulando persistência)
      if (!skipPersistence && activeChatId && fullResponse) {
        await saveMessageOnBackend(activeChatId, fullResponse, "MODEL", "text");
      }

      // 6. Gera título inteligente (apenas se for chat novo e não estiver pulando persistência)
      if (!skipPersistence && !currentChatId && activeChatId) {
        generateSmartTitle(
          [
            // Manda um contexto reduzido para gerar título
            {
              role: "user",
              content: finalText || "Análise de arquivo",
            } as ExtendedMessage,
            { role: "ai", content: fullResponse } as ExtendedMessage,
          ],
          activeChatId,
        );
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Erro Chat:", error);
        /**
         * A falha tem de aparecer NA CONVERSA, não só no console.
         *
         * Antes só havia o `console.error`: a bolha da resposta ficava vazia e
         * a pessoa via um "..." para sempre, sem saber se estava pensando, se
         * travou ou se o pedido chegou. Uma usuária passou semanas assim e
         * reportou como "a aba Conversar não funciona" — sem nada que
         * apontasse a causa, porque a tela não dizia nada.
         */
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content:
                    "Não consegui responder agora. O assistente está indisponível — tente de novo em alguns instantes. Se continuar, avise o suporte.",
                }
              : m,
          ),
        );
        toast.error("O assistente de IA está indisponível.");
      }
    } finally {
      setLoading(false);
      setStreamingContent("");
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentChatId(undefined); // Reseta ID para criar um novo na próxima msg
    fileHandler.clearFiles();
    audioRecorder.clearAudio();
  };

  return {
    messages,
    setMessages, // Expõe setMessages para permitir manipulação externa
    loading,
    streamingContent,
    sendMessage,
    stopGeneration,
    clearChat,
    audioRecorder,
    fileHandler,
    chatId: currentChatId,
    loadChat,
  };
}
