import { useAuthStore } from '@/lib/auth/authStore'
import { MagnifyingGlassIcon, Bars3Icon, MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

type Props = { onToggleSidebar?: () => void }

export default function Topbar({ onToggleSidebar }: Props) {
  const { user, clear } = useAuthStore()
  const navigate = useNavigate()
  function toggleTheme() {
    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('theme', next)
  }
  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur dark:bg-slate-900/80">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button className="md:hidden btn-ghost p-1" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="hidden md:flex items-center gap-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-500" />
            <input className="bg-transparent outline-none text-sm" placeholder="Search..." />
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button className="btn-ghost p-1" aria-label="Toggle theme" onClick={toggleTheme}>
            {document.documentElement.classList.contains('dark') ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
          <span className="text-slate-600 dark:text-slate-300">{user?.email}</span>
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



