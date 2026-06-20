import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Province } from '@/types/database.types'

interface LocationState {
  province: Province | null
}

interface LocationActions {
  setProvince: (province: Province | null) => void
}

type LocationStore = LocationState & LocationActions

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      province: null,
      setProvince: (province) => set({ province }),
    }),
    {
      name: 'mercado-rd-location',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
