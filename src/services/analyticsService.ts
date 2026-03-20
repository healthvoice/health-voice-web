import type { GeolocationData } from '@/hooks/useGeolocation';

export enum Platform {
  WEB = 'WEB',
  MOBILE_IOS = 'MOBILE_IOS',
  MOBILE_ANDROID = 'MOBILE_ANDROID',
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
}

interface PostAPIFunction {
  (
    url: string,
    data: unknown,
    auth: boolean,
  ): Promise<{ status: number; body: any }>;
}

export async function startSession(
  PostAPI: PostAPIFunction,
  locationData?: GeolocationData | null
): Promise<string | null> {
  try {
    const deviceInfo: DeviceInfo = {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      platform: typeof navigator !== 'undefined' ? navigator.platform : '',
    };

    const payload: Record<string, any> = {
      platform: Platform.WEB,
      deviceInfo,
    };

    // Adicionar dados de localização se disponíveis
    if (locationData) {
      payload.latitude = locationData.latitude;
      payload.longitude = locationData.longitude;
      payload.accuracy = locationData.accuracy;
      payload.altitude = locationData.altitude;
      payload.altitudeAccuracy = locationData.altitudeAccuracy;
      payload.heading = locationData.heading;
      payload.speed = locationData.speed;
      payload.locationTimestamp = new Date(locationData.timestamp).toISOString();
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 [Tracking] Iniciando sessão de analytics...');
    }

    const response = await PostAPI(
      '/analytics/session/start',
      payload,
      true,
    );

    if (response.status === 200 && response.body?.session?.id) {
      const sessionId = response.body.session.id;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [Tracking] Sessão iniciada com sucesso:', { sessionId });
      }
      
      return sessionId;
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [Tracking] Erro ao iniciar sessão de analytics:', response.status);
      }
      return null;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ [Tracking] Erro ao iniciar sessão de analytics:', error);
    }
    return null;
  }
}

/**
 * Envia um ping de sessão ativa
 * Armazena o ping no backend para processamento pelo cronjob
 */
export async function pingSession(
  PostAPI: PostAPIFunction,
  sessionId: string
): Promise<boolean> {
  try {
    if (!sessionId) {
      return false;
    }

    const response = await PostAPI(
      '/analytics/session/ping',
      { sessionId },
      true,
    );

    if (response.status === 200 || response.status === 201) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 [Tracking] Ping enviado com sucesso');
      }
      return true;
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [Tracking] Erro ao enviar ping:', response.status);
      }
      return false;
    }
  } catch (error) {
    // Erros de tracking devem ser silenciosos
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ [Tracking] Erro ao enviar ping:', error);
    }
    return false;
  }
}

/**
 * Finaliza uma sessão
 */
export async function endSession(
  PostAPI: PostAPIFunction,
  sessionId: string
): Promise<boolean> {
  try {
    if (!sessionId) {
      return false;
    }

    const response = await PostAPI(
      '/analytics/session/end',
      {
        sessionId,
        endedAt: new Date().toISOString(),
      },
      true,
    );

    if (response.status === 200 || response.status === 201) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔚 [Tracking] Sessão finalizada com sucesso');
      }
      return true;
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [Tracking] Erro ao finalizar sessão:', response.status);
      }
      return false;
    }
  } catch (error) {
    // Erros de tracking devem ser silenciosos
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ [Tracking] Erro ao finalizar sessão:', error);
    }
    return false;
  }
}
