import type { Bracelet, BraceletEvent, PaginatedResponse } from '../types'
import apiClient from './api'

export const braceletService = {
  async getBracelets(): Promise<Bracelet[]> {
    const response = await apiClient.get('/mobile/bracelets')
    return response.data.bracelets
  },

  async getAvailableBracelets(): Promise<Bracelet[]> {
    const response = await apiClient.get('/mobile/bracelets/available')
    return response.data.bracelets
  },

  async getBracelet(id: number): Promise<Bracelet> {
    const response = await apiClient.get(`/mobile/bracelets/${id}`)
    return response.data.bracelet
  },

  async registerBracelet(code: string, alias?: string): Promise<Bracelet> {
    const payload: { unique_code: string; alias?: string } = {
      unique_code: code,
    }
    if (alias) {
      payload.alias = alias
    }
    const response = await apiClient.post('/mobile/bracelets/register', payload)
    return response.data.bracelet
  },

  async updateBracelet(id: number, data: { alias: string }): Promise<Bracelet> {
    const response = await apiClient.put(`/mobile/bracelets/${id}`, data)
    return response.data.bracelet
  },

  async getBraceletEvents(
    id: number,
    page: number = 1,
    type?: string
  ): Promise<PaginatedResponse<BraceletEvent>> {
    const params: Record<string, unknown> = { page, per_page: 20 }
    if (type) params.type = type

    const response = await apiClient.get(`/mobile/bracelets/${id}/events`, {
      params,
    })
    return response.data
  },

  async vibrateBracelet(
    id: number,
    pattern: 'short' | 'medium' | 'sos'
  ): Promise<{ command_id: number }> {
    const response = await apiClient.post(`/mobile/bracelets/${id}/vibrate`, {
      pattern,
    })
    return response.data
  },

  async resolveEmergency(id: number): Promise<{ success: boolean }> {
    const response = await apiClient.post(
      `/mobile/bracelets/${id}/resolve-emergency`
    )
    return response.data
  },
}
