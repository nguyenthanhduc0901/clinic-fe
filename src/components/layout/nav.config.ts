import { HomeIcon, UsersIcon, ClipboardDocumentListIcon, Cog6ToothIcon, RectangleStackIcon, CurrencyDollarIcon, BeakerIcon, FolderIcon, ShieldCheckIcon, UserGroupIcon, DocumentMagnifyingGlassIcon, UserCircleIcon, QueueListIcon } from '@heroicons/react/24/outline'

export type NavItem = {
  label: string
  to: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  requiredPermissions?: string[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: HomeIcon },
  { label: 'Appointments', to: '/appointments', icon: QueueListIcon, requiredPermissions: ['appointment:read'] },
  { label: 'Patients', to: '/patients', icon: UsersIcon, requiredPermissions: ['patient:read'] },
  { label: 'Medical Records', to: '/medical-records', icon: ClipboardDocumentListIcon, requiredPermissions: ['medical_record:read'] },
  { label: 'Medicines', to: '/medicines', icon: BeakerIcon, requiredPermissions: ['medicine:read'] },
  { label: 'Inventory - Suppliers', to: '/inventory/suppliers', icon: RectangleStackIcon, requiredPermissions: ['permission:manage'] },
  { label: 'Inventory - Imports', to: '/inventory/imports', icon: RectangleStackIcon, requiredPermissions: ['medicine:import'] },
  { label: 'Inventory - Low stock', to: '/inventory/low-stock', icon: RectangleStackIcon, requiredPermissions: ['medicine:read'] },
  { label: 'Invoices', to: '/invoices', icon: CurrencyDollarIcon, requiredPermissions: ['invoice:read'] },
  { label: 'Reports', to: '/reports', icon: DocumentMagnifyingGlassIcon, requiredPermissions: ['report:view'] },
  { label: 'Catalogs', to: '/catalogs', icon: FolderIcon, requiredPermissions: ['permission:manage'] },
  { label: 'Audit Logs', to: '/audit-logs', icon: DocumentMagnifyingGlassIcon, requiredPermissions: ['audit_log:view'] },
  { label: 'Users', to: '/users', icon: UserGroupIcon, requiredPermissions: ['user:read'] },
  { label: 'Staff', to: '/staff', icon: UserGroupIcon, requiredPermissions: ['staff:read'] },
  { label: 'Roles', to: '/roles', icon: ShieldCheckIcon, requiredPermissions: ['permission:manage'] },
  { label: 'Settings', to: '/settings', icon: Cog6ToothIcon, requiredPermissions: ['setting:manage'] },
  { label: 'Profile', to: '/profile', icon: UserCircleIcon },
]



