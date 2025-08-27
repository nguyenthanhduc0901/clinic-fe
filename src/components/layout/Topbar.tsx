import { useAuthStore } from '@/lib/auth/authStore'
import { MagnifyingGlassIcon, Bars3Icon, MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMyProfile } from '@/lib/api/auth'
import { getStaffAvatarBlob } from '@/lib/api/staff'
import { useEffect, useState } from 'react'
import { can } from '@/lib/auth/ability'

type Props = { onToggleSidebar?: () => void }

export default function Topbar({ onToggleSidebar }: Props) {
  const { user, clear, permissions } = useAuthStore()
  const navigate = useNavigate()
  const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any) => p.name) ?? []
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const my = useQuery({ queryKey: ['my-profile'], queryFn: () => getMyProfile(), staleTime: 5 * 60 * 1000 })
  const staffId = my.data?.staff?.id as number | undefined
  const staffHasAvatar = Boolean(my.data?.staff?.avatarUrl)
  const canReadOwnAvatar = can(perms, ['staff:read_own'])

  useQuery({
    queryKey: ['my-avatar-topbar', staffId],
    enabled: Boolean(staffId && staffHasAvatar && canReadOwnAvatar),
    queryFn: async () => {
      try {
        const blob = await getStaffAvatarBlob(staffId!)
        const url = URL.createObjectURL(blob)
        setAvatarUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url })
        return true
      } catch {
        setAvatarUrl(null)
        return false
      }
    },
  })

  useEffect(() => () => { if (avatarUrl) URL.revokeObjectURL(avatarUrl) }, [avatarUrl])
  function toggleTheme() {
    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('theme', next)
  }
  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur dark:bg-slate-900/80">
      <div className="flex h-24 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button className="md:hidden btn-ghost p-1" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <a href="/" className="hidden md:flex items-center gap-2 select-none" aria-label="Trang chủ">
            <img src="/logo.png" alt="Logo phòng khám" className="h-24 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-2 ml-4">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-500" />
            <input className="bg-transparent outline-none text-sm" placeholder="Search..." />
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button className="btn-ghost p-1" aria-label="Toggle theme" onClick={toggleTheme}>
            {document.documentElement.classList.contains('dark') ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
          <span className="text-slate-600 dark:text-slate-300">{user?.email}</span>
          <a href="/profile" className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-slate-200 overflow-hidden" aria-label="Hồ sơ">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" onError={() => setAvatarUrl(null)} />
            ) : (
              <span className="text-slate-700 font-medium select-none">
                {(user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </a>
          <button
            className="btn-ghost"
            onClick={() => {
              clear()
              navigate('/login', { replace: true })
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}



