'use client';

import { useAuthStore, UserRole } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      const hasPermission = user.roles.some(role => allowedRoles.includes(role));
      if (!hasPermission) {
        router.push('/unauthorized');
      }
    }
  }, [user, isAuthenticated, allowedRoles, router]);

  if (!isAuthenticated || !user) return null;

  const hasPermission = user.roles.some(role => allowedRoles.includes(role));
  if (!hasPermission) return null;

  return <>{children}</>;
};
