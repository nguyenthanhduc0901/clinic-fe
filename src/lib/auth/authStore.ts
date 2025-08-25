import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/api/types'

type AuthState = {
  token: string | null
  user: User | null
  permissions: string[]
}

type AuthActions = {
  setAuth: (payload: { token: string; user: User }) => void
  setPermissions: (perms: string[]) => void
  clear: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      permissions: [],
      setAuth: ({ token, user }) => set({ token, user }),
      setPermissions: (perms) => set({ permissions: perms }),
      clear: () => set({ token: null, user: null, permissions: [] }),
    }),
    { name: 'clinic-auth' },
  ),
)

export const selectIsAuthenticated = (s: AuthState) => Boolean(s.token)



