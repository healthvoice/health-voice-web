import { useApiContext } from "@/context/ApiContext";
import { useCallback } from "react";

export function useRecordingUpload() {
  const { PostAPI } = useApiContext();

  const uploadMedia = useCallback(
    async (blob: Blob, mediaType: "audio" | "video"): Promise<string> => {
      try {
        // Determine extension and mimeType from the blob
        const mimeType =
          blob.type || (mediaType === "audio" ? "audio/webm" : "video/webm");

        let extension = mediaType === "audio" ? "mp3" : "webm";
        if (mimeType.includes("webm")) extension = "webm";
        else if (mimeType.includes("mp4")) extension = "mp4";
        else if (mimeType.includes("mpeg")) extension = "mp3";
        else if (mimeType.includes("wav")) extension = "wav";
        else if (mimeType.includes("ogg")) extension = "ogg";

        // Step 1: Request presigned URL
        const presignedResponse = await PostAPI(
          "/upload/presigned-url",
          {
            fileName: `recording-${Date.now()}.${extension}`, // e.g., "recording-1234567890.mp3"
            contentType: mimeType, // "audio/mpeg" for audio, "video/webm" for video
          },
          true, // Requires authentication
        );
        console.log("presignedResponse", presignedResponse);

        if (!presignedResponse || presignedResponse.status >= 400) {
          throw new Error(`Falha ao obter URL de upload para ${mediaType}.`);
        }

        const presignedData = presignedResponse.body;
        const uploadUrl = presignedData.uploadUrl || presignedData.url;
        const finalUrl = presignedData.finalUrl || presignedData.url;

        if (!uploadUrl) {
          throw new Error(`Presigned URL não retornou URL de upload.`);
        }

        // Step 2: Direct upload to presigned URL
        console.log("--- [useRecordingUpload] Starting Upload ---");
        console.log("Upload URL:", uploadUrl);
        console.log("Headers:", {
          "Content-Type": mimeType,
        });
        console.log("Blob size:", blob.size);
        console.log("Blob type:", blob.type);

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT", // Presigned URLs use PUT method
          body: blob, // The recorded media blob
          headers: {
            "Content-Type": mimeType, // Must match the exact MIME type
          },
        });
        console.log("Upload Response Status:", uploadResponse.status);
        console.log("Upload Response Text:", await uploadResponse.text()); // Caution: reading body might consume it if not cloned, but for error debugging it's useful

        if (!uploadResponse.ok) {
          console.error("Upload failed with status:", uploadResponse.status);
          throw new Error(
            `Falha no upload de ${mediaType}. Status: ${uploadResponse.status}`,
          );
        }

        if (!finalUrl) {
          throw new Error(`Upload não retornou URL final do ${mediaType}.`);
        }

        return finalUrl;
      } catch (error) {
        console.error(`Erro no upload de ${mediaType}:`, error);

        if (error instanceof TypeError && error.message.includes("fetch")) {
          console.error("Fetch error details:", {
            message: error.message,
            stack: error.stack,
            cause: (error as any).cause,
          });
          // Re-throw or handle as before, but now we have logs.
          // Likely CORS if status is 0 or undefined in network tab, but here we only see 'Failed to fetch'
        }

        // Network errors
        if (error instanceof TypeError && error.message.includes("fetch")) {
          throw new Error(
            "Erro de conexão. Verifique se o CORS do bucket R2 está configurado ou sua internet.",
          );
        }
        throw error;
      }
    },
    [PostAPI],
  );

  const formatDurationForAPI = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }, []);

  return {
    uploadMedia,
    formatDurationForAPI,
  };
}
