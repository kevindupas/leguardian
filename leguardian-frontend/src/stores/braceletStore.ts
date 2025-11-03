import { create } from 'zustand'
import type { Bracelet, BraceletEvent } from '../types'
import { braceletService } from '../services/braceletService'

interface BraceletState {
  bracelets: Bracelet[]
  availableBracelets: Bracelet[]
  selectedBracelet: Bracelet | null
  events: BraceletEvent[]
  recentEvents: BraceletEvent[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchBracelets: () => Promise<void>
  fetchAvailableBracelets: () => Promise<void>
  selectBracelet: (bracelet: Bracelet) => void
  fetchBraceletEvents: (braceletId: number, type?: string) => Promise<void>
  fetchRecentEvents: (limit?: number) => Promise<void>
  registerBracelet: (code: string, alias?: string) => Promise<Bracelet>
  vibrateBracelet: (id: number, pattern: 'short' | 'medium' | 'sos') => Promise<void>
  resolveEmergency: (id: number) => Promise<void>
  updateBracelet: (id: number, data: { alias: string }) => Promise<void>
  setError: (error: string | null) => void
  clearError: () => void
}

export const useBraceletStore = create<BraceletState>((set, get) => ({
  bracelets: [],
  availableBracelets: [],
  selectedBracelet: null,
  events: [],
  recentEvents: [],
  isLoading: false,
  error: null,

  fetchBracelets: async () => {
    set({ isLoading: true, error: null })
    try {
      const bracelets = await braceletService.getBracelets()
      set({ bracelets, isLoading: false })

      // Also fetch recent events for these bracelets
      const fetchRecentEventsFunc = get().fetchRecentEvents
      fetchRecentEventsFunc()
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch bracelets',
        isLoading: false,
      })
    }
  },

  fetchAvailableBracelets: async () => {
    set({ isLoading: true, error: null })
    try {
      const availableBracelets = await braceletService.getAvailableBracelets()
      set({ availableBracelets, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch available bracelets',
        isLoading: false,
      })
    }
  },

  selectBracelet: (bracelet) => set({ selectedBracelet: bracelet }),

  fetchBraceletEvents: async (braceletId, type) => {
    set({ isLoading: true, error: null })
    try {
      const response = await braceletService.getBraceletEvents(
        braceletId,
        1,
        type
      )
      set({ events: response.data, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch events',
        isLoading: false,
      })
    }
  },

  fetchRecentEvents: async (limit = 10) => {
    try {
      const bracelets = get().bracelets
      const allEvents: BraceletEvent[] = []

      // Fetch events from all bracelets
      for (const bracelet of bracelets) {
        try {
          const response = await braceletService.getBraceletEvents(bracelet.id)
          allEvents.push(...response.data)
        } catch (error) {
          console.error(
            `Failed to fetch events for bracelet ${bracelet.id}:`,
            error
          )
        }
      }

      // Sort by most recent and limit
      const sorted = allEvents
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, limit)

      set({ recentEvents: sorted })
    } catch (error) {
      console.error('Failed to fetch recent events:', error)
    }
  },

  registerBracelet: async (code, alias) => {
    set({ isLoading: true, error: null })
    try {
      const bracelet = await braceletService.registerBracelet(code, alias)
      set((state) => ({
        bracelets: [...state.bracelets, bracelet],
        isLoading: false,
      }))
      return bracelet
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to register bracelet',
        isLoading: false,
      })
      throw error
    }
  },

  vibrateBracelet: async (id, pattern) => {
    set({ isLoading: true, error: null })
    try {
      await braceletService.vibrateBracelet(id, pattern)
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to vibrate bracelet',
        isLoading: false,
      })
      throw error
    }
  },

  resolveEmergency: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await braceletService.resolveEmergency(id)
      const bracelets = get().bracelets.map((b) =>
        b.id === id ? { ...b, status: 'active' as const } : b
      )
      set({
        bracelets,
        selectedBracelet:
          get().selectedBracelet?.id === id
            ? { ...get().selectedBracelet!, status: 'active' }
            : get().selectedBracelet,
        isLoading: false,
      })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to resolve emergency',
        isLoading: false,
      })
    }
  },

  updateBracelet: async (id, data: { alias: string }) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await braceletService.updateBracelet(id, data)
      const bracelets = get().bracelets.map((b) =>
        b.id === id ? updated : b
      )
      set({
        bracelets,
        selectedBracelet:
          get().selectedBracelet?.id === id
            ? updated
            : get().selectedBracelet,
        isLoading: false,
      })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update bracelet',
        isLoading: false,
      })
    }
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
