import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { NAV_ITEMS } from './nav.config'
import { can } from '@/lib/auth/ability'
import { useAuthStore } from '@/lib/auth/authStore'
import Topbar from './Topbar'
import { useState } from 'react'

export default function AppShell() {
  const { user } = useAuthStore()
  const perms = user?.role?.permissions?.map((p) => p.name) ?? []
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen grid grid-rows-[auto,1fr] md:grid-rows-1 md:grid-cols-[260px,1fr]">
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

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative z-50 h-full w-72 bg-white dark:bg-slate-900 border-r">
            <div className="p-4 text-lg font-semibold">Clinic Admin</div>
            <nav className="px-2 space-y-1">
              {NAV_ITEMS.filter((i) => can(perms, i.requiredPermissions)).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
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
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        <Topbar onToggleSidebar={() => setOpen((v) => !v)} />
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}



