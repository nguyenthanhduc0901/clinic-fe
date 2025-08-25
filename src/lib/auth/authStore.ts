import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/api/types'

type AuthState = {
  token: string | null
  user: User | null
}

type AuthActions = {
  setAuth: (payload: { token: string; user: User }) => void
  clear: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: ({ token, user }) => set({ token, user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'clinic-auth' },
  ),
)

export const selectIsAuthenticated = (s: AuthState) => Boolean(s.token)



