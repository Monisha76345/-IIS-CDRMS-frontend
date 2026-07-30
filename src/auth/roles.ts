import type { Screen } from '@/src/cdrms/types';

export type RoleUser = {
  name?: string | null;
  userType?: string | null;
  role?: string | null;
  roleName?: string | null;
};

export type AppRole = 'engineer' | 'zc' | 'cao' | 'super_admin' | 'unknown';

export function roleBlob(user: RoleUser | null | undefined): string {
  if (!user) return '';
  return `${user.userType || ''} ${user.role || ''} ${user.roleName || ''}`.toLowerCase();
}

export function resolveAppRole(user: RoleUser | null | undefined): AppRole {
  const r = roleBlob(user);
  if (!r.trim()) return 'unknown';
  if (r.includes('super_admin')) return 'super_admin';
  if (r.includes('zonal_commissioner') || r.includes('zonal') || /\bzc\b/.test(r)) {
    return 'zc';
  }
  if (r.includes('cao')) return 'cao';
  if (r.includes('engineer')) return 'engineer';
  return 'unknown';
}

export function isMobileAllowedRole(user: RoleUser | null | undefined): boolean {
  const role = resolveAppRole(user);
  return role === 'engineer' || role === 'zc' || role === 'cao' || role === 'super_admin';
}

export function homeScreenForRole(user: RoleUser | null | undefined): Screen {
  const role = resolveAppRole(user);
  if (role === 'zc') return 'zc_home';
  if (role === 'cao' || role === 'super_admin') return 'cao_home';
  return 'dashboard';
}

export function displayName(user: RoleUser | null | undefined): string {
  if (!user?.name?.trim()) return 'Officer';
  return user.name.trim();
}
