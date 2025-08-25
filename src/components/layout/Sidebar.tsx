import { NavLink, useLocation } from 'react-router-dom'
import { NAV_ITEMS } from './nav.config'
import { can } from '@/lib/auth/ability'
import { useAuthStore } from '@/lib/auth/authStore'

export default function Sidebar() {
  const { user } = useAuthStore()
  const perms = user?.role?.permissions?.map((p) => p.name) ?? []
  const { pathname } = useLocation()

  return (
    <aside className="hidden md:block border-r bg-white dark:bg-slate-900">
      <div className="p-4 text-lg font-semibold">Clinic Admin</div>
      <nav className="px-2 space-y-1">
        {NAV_ITEMS.filter((i) => can(perms, i.requiredPermissions)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${
                isActive || pathname.startsWith(item.to) ? 'bg-slate-100 dark:bg-slate-800 font-medium' : ''
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}



