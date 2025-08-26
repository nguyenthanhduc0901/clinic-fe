export function can(userPerms: string[] = [], required?: string[]): boolean {
  if (!required || required.length === 0) return true
  if (userPerms.includes('permission:manage')) return true
  return required.every((req) => userPerms.includes(req))
}

export function getDefaultRouteForRole(
  roleName: 'admin' | 'doctor' | 'receptionist' | 'patient' | (string & {}),
): string {
  switch (roleName) {
    case 'admin':
      return '/dashboard'
    case 'doctor':
      return '/dashboard'
    case 'receptionist':
      return '/dashboard'
    case 'patient':
      return '/profile'
    default:
      return '/dashboard'
  }
}



