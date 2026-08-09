import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Language = 'es' | 'en' | 'fr'

interface LanguageState {
  language: Language
}

interface LanguageActions {
  setLanguage: (language: Language) => void
}

type LanguageStore = LanguageState & LanguageActions

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'es',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'mercado-rd-language',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
