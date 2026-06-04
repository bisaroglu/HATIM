import apiClient from './api'
import type { Hatim, PaginatedResponse } from '@/types'

export interface HatimListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: Hatim['status']
}

export const hatimService = {
  async getAll(params?: HatimListParams): Promise<PaginatedResponse<Hatim>> {
    const res = await apiClient.get<PaginatedResponse<Hatim>>('/hatims', { params })
    return res.data
  },

  async getById(id: string): Promise<Hatim> {
    const res = await apiClient.get<Hatim>(`/hatims/${id}`)
    return res.data
  },

  async create(data: Partial<Hatim>): Promise<Hatim> {
    const res = await apiClient.post<Hatim>('/hatims', data)
    return res.data
  },

  async join(id: string): Promise<void> {
    await apiClient.post(`/hatims/${id}/join`)
  },

  async leave(id: string): Promise<void> {
    await apiClient.delete(`/hatims/${id}/join`)
  },
}
