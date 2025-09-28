export interface CropPrice {
  id: string
  crop_type: 'manioc' | 'cafe'
  price: number
  currency: string
  source: 'manual' | 'chainlink' | 'external_api'
  source_reference?: string
  updated_by?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PriceHistory {
  id: string
  crop_type: 'manioc' | 'cafe'
  price: number
  currency: string
  source: 'manual' | 'chainlink' | 'external_api'
  source_reference?: string
  recorded_at: string
  created_at: string
}

export interface PriceNotification {
  id: string
  crop_type: 'manioc' | 'cafe'
  old_price?: number
  new_price: number
  price_change_percent?: number
  notification_sent: boolean
  created_at: string
}

export interface PriceTrend {
  crop_type: 'manioc' | 'cafe'
  current_price: number
  previous_price?: number
  change_percent?: number
  trend_direction: 'up' | 'down' | 'stable'
  price_history: PriceHistory[]
}

export interface PriceUpdateRequest {
  crop_type: 'manioc' | 'cafe'
  price: number
  source_reference?: string
}

export interface ChainlinkConfig {
  enabled: boolean
  feed_addresses: {
    manioc?: string
    cafe?: string
  }
  update_frequency: number // in seconds
  price_deviation_threshold: number // percentage
}

export const CROP_DISPLAY_NAMES = {
  manioc: 'Manioc',
  cafe: 'Café'
} as const

export const PRICE_SOURCES = {
  manual: 'Manuel',
  chainlink: 'Chainlink Oracle',
  external_api: 'API Externe'
} as const