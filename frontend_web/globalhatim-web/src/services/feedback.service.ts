import apiClient from './api'

/**
 * POST /api/Feedbacks gövdesi — FeedbacksController.CreateFeedbackRequest ile birebir eşleşir.
 * Backend: CreateFeedbackCommand → Feedback entity → feedbacks tablosu
 * Endpoint [AllowAnonymous] — giriş gerektirmez.
 */
export interface SendFeedbackRequest {
  name: string
  email?: string     // "emailOrPhone" değil, net "email" alanı
  message: string
  userId?: string    // Giriş yapmış kullanıcı için opsiyonel GUID
}

export interface SendFeedbackResult {
  feedbackId: string
}

export const feedbackService = {
  /**
   * POST /api/Feedbacks
   * Backend route: FeedbacksController → [Route("api/[controller]")] → "api/Feedbacks"
   * [AllowAnonymous] — anonim kullanıcılar da gönderebilir.
   */
  async send(data: SendFeedbackRequest): Promise<SendFeedbackResult> {
    const res = await apiClient.post<SendFeedbackResult>('/Feedbacks', data)
    return res.data
  },
}
