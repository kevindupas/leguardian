// User types
export interface User {
  id: number
  name: string
  email: string
  phone?: string
  created_at: string
  updated_at: string
}

// Bracelet types
export type BraceletStatus = 'active' | 'inactive' | 'lost' | 'emergency'
export type EventType = 'arrived' | 'lost' | 'danger'

export interface Bracelet {
  id: number
  unique_code: string
  name: string // Identifiant unique du modèle (ex: BR-2025-001)
  alias?: string // Surnom donné par l'utilisateur
  status: BraceletStatus
  battery_level: number
  last_ping_at: string
  last_latitude?: number
  last_longitude?: number
  last_accuracy?: number
  user_id?: number
  firmware_version: string
  created_at: string
  updated_at: string
}

export interface BraceletEvent {
  id: number
  bracelet_id: number
  event_type: EventType
  latitude?: number
  longitude?: number
  accuracy?: number
  battery_level: number
  resolved: boolean
  resolved_at?: string
  created_at: string
}

export interface Location {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface AuthResponse {
  user: User
  token: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}
