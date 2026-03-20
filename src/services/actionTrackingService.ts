import { getCurrentPlatform } from '@/utils/platform';

export enum UserActionType {
  RECORDING_STARTED = 'RECORDING_STARTED',
  RECORDING_CANCELLED = 'RECORDING_CANCELLED',
  RECORDING_COMPLETED = 'RECORDING_COMPLETED',
  TRANSCRIPTION_REQUESTED = 'TRANSCRIPTION_REQUESTED',
  SUMMARY_EDITED = 'SUMMARY_EDITED',
  PDF_EXPORTED = 'PDF_EXPORTED',
  SCREEN_VIEWED = 'SCREEN_VIEWED',
  TAB_CLICKED = 'TAB_CLICKED',
  CONVERSATION_STARTED = 'CONVERSATION_STARTED',
  // Modal actions
  MODAL_OPENED = 'MODAL_OPENED',
  MODAL_CLOSED = 'MODAL_CLOSED',
  // Client actions
  CLIENT_SELECTED = 'CLIENT_SELECTED',
  CLIENT_CREATED = 'CLIENT_CREATED',
}

interface TrackActionParams {
  actionType: UserActionType;
  recordingId?: string;
  metadata?: Record<string, unknown>;
}

interface PostAPIFunction {
  (
    url: string,
    data: unknown,
    auth: boolean,
  ): Promise<{ status: number; body: any }>;
}

/**
 * Registra uma ação do usuário no sistema de analytics
 * @param params - Parâmetros da ação a ser registrada
 * @param PostAPI - Função para fazer requisições POST
 */
export async function trackAction(
  params: TrackActionParams,
  PostAPI: PostAPIFunction
): Promise<void> {
  try {
    const platform = getCurrentPlatform();

    const result = await PostAPI(
      '/analytics/actions',
      {
        actionType: params.actionType,
        platform,
        recordingId: params.recordingId || undefined,
        metadata: params.metadata || undefined,
      },
      true
    );

    if (result.status < 200 || result.status >= 300) {
      throw { status: result.status, body: result.body };
    }
  } catch (error) {
    // Erro silencioso - não deve quebrar funcionalidades principais
    console.warn('Erro ao registrar ação de tracking:', error);
    throw error;
  }
}
