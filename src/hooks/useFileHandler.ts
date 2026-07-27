"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_FILES = 5; // Limite de arquivos simultâneos

export interface AttachedFile {
  id: string; // Para identificar unicamente na UI
  file: File;
  preview: string; // URL blob para preview
  type: "image" | "pdf" | "docx" | "audio" | "other";
  extractedContent?: string; // Texto puro se for DOCX
}

export function useFileHandler() {
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback(
    async (newFiles: FileList | null | undefined) => {
      if (!newFiles) return;

      const filesArray = Array.from(newFiles);

      if (files.length + filesArray.length > MAX_FILES) {
        toast.error(
          `Você só pode enviar no máximo ${MAX_FILES} arquivos por vez.`,
        );
        return;
      }

      setIsProcessing(true);

      const processedFiles: AttachedFile[] = [];

      for (const file of filesArray) {
        if (file.size >= MAX_FILE_SIZE) {
          toast.error(`O arquivo ${file.name} excede o limite de 20MB.`);
          continue;
        }

        const id = Math.random().toString(36).substring(7);
        let type: AttachedFile["type"] = "other";
        let extractedContent: string | undefined = undefined;

        // Identificação de Tipo
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type === "application/pdf") type = "pdf";
        else if (file.type.startsWith("audio/")) type = "audio";
        else if (
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.name.endsWith(".docx")
        ) {
          type = "docx";
        }

        // Processamento Especial (DOCX) - Requer mammoth
        if (type === "docx") {
          try {
            // Tentar importar mammoth dinamicamente
            const mammoth = await import("mammoth");
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            extractedContent = result.value;
          } catch (error) {
            console.warn(
              `Erro ao ler DOCX ${file.name} (mammoth pode não estar instalado):`,
              error,
            );
            // Continua sem extrair conteúdo
          }
        }

        processedFiles.push({
          id,
          file,
          preview: URL.createObjectURL(file), // Cria URL temporária para preview
          type,
          extractedContent,
        });
      }

      setFiles((prev) => [...prev, ...processedFiles]);
      setIsProcessing(false);
    },
    [files],
  );

  const addFile = useCallback(
    async (file: File) => {
      if (files.length >= MAX_FILES) {
        toast.error(
          `Você só pode enviar no máximo ${MAX_FILES} arquivos por vez.`,
        );
        return;
      }

      if (file.size >= MAX_FILE_SIZE) {
        toast.error(`O arquivo ${file.name} excede o limite de 20MB.`);
        return;
      }

      setIsProcessing(true);

      const id = Math.random().toString(36).substring(7);
      let type: AttachedFile["type"] = "other";
      let extractedContent: string | undefined = undefined;

      // Identificação de Tipo
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type === "application/pdf") type = "pdf";
      else if (file.type.startsWith("audio/")) type = "audio";
      else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        type = "docx";
      }

      // Processamento Especial (DOCX) - Requer mammoth
      if (type === "docx") {
        try {
          // Tentar importar mammoth dinamicamente
          const mammoth = await import("mammoth");
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedContent = result.value;
        } catch (error) {
          console.warn(
            `Erro ao ler DOCX ${file.name} (mammoth pode não estar instalado):`,
            error,
          );
          // Continua sem extrair conteúdo
        }
      }

      const processedFile: AttachedFile = {
        id,
        file,
        preview: URL.createObjectURL(file),
        type,
        extractedContent,
      };

      setFiles((prev) => [...prev, processedFile]);
      setIsProcessing(false);
    },
    [files],
  );

  const removeFile = useCallback((idToRemove: string) => {
    setFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== idToRemove);
      // Revogar URL do blob para evitar vazamento de memória (opcional, mas boa prática)
      const removed = prev.find((f) => f.id === idToRemove);
      if (removed) URL.revokeObjectURL(removed.preview);
      return newFiles;
    });
  }, []);

  const clearFiles = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  }, [files]);

  return {
    files, // Agora é um array
    isProcessing,
    handleFileSelect,
    addFile, // Adiciona um único arquivo
    removeFile, // Nova função
    clearFiles,
  };
}
