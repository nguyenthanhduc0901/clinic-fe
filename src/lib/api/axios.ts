import axios from 'axios'
import { API_BASE } from '@/lib/utils/constants'
import { useAuthStore } from '@/lib/auth/authStore'
import { toast } from '@/components/ui/Toast'

export const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status as number | undefined
    const data = error?.response?.data as
      | {
          success?: false
          statusCode?: number
          errorCode?: string
          message?: string
          details?: string[]
        }
      | undefined

    const message =
      data?.message ||
      (Array.isArray(data?.details) ? data!.details!.join('; ') : undefined) ||
      error.message ||
      'Unexpected error'

    if (status === 401) {
      useAuthStore.getState().clear()
      toast.error(message || 'Session expired')
      window.location.assign('/login')
      return Promise.reject(error)
    }

    if (status === 403) {
      toast.error(message || 'Forbidden')
      window.location.assign('/forbidden')
      return Promise.reject(error)
    }

    toast.error(message)
    return Promise.reject(error)
  },
)



