import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const MAX_HISTORY = 10

interface SearchHistoryState {
  history: string[] // más reciente primero, sin duplicados
}

interface SearchHistoryActions {
  addSearch: (query: string) => void
  removeSearch: (query: string) => void
  clearHistory: () => void
}

type SearchHistoryStore = SearchHistoryState & SearchHistoryActions

export const useSearchHistoryStore = create<SearchHistoryStore>()(
  persist(
    (set) => ({
      history: [],
      addSearch: (query) => set((state) => {
        const trimmed = query.trim()
        if (!trimmed) return state
        const withoutDupe = state.history.filter(h => h.toLowerCase() !== trimmed.toLowerCase())
        return { history: [trimmed, ...withoutDupe].slice(0, MAX_HISTORY) }
      }),
      removeSearch: (query) => set((state) => ({
        history: state.history.filter(h => h !== query),
      })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'mercadord_search_history',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
