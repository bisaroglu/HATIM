import apiClient from '@/services/api'

export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  reply: string
}

/**
 * POST /api/ai/chat
 * Kullanıcı mesajını Gemini AI asistanına iletir ve yanıtı döndürür.
 */
export async function askAiAssistant(message: string): Promise<string> {
  const { data } = await apiClient.post<ChatResponse>('/ai/chat', {
    message,
  } satisfies ChatRequest)

  return data.reply
}
