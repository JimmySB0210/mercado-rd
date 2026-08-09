import type { BusinessType, VendorService } from '@/types/database.types'

export interface ProviderFiltersState {
  businessTypes: BusinessType[]
  categoryIds: number[]
  provinceId: string
  maxMoq: string
  services: VendorService[]
  minVerificationLevel: string
}

export const EMPTY_PROVIDER_FILTERS: ProviderFiltersState = {
  businessTypes: [],
  categoryIds: [],
  provinceId: '',
  maxMoq: '',
  services: [],
  minVerificationLevel: '',
}
