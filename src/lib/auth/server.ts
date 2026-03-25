import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export type UserRole = 'agriculteur' | 'cooperative' | 'preteur' | 'admin';

export interface ProfileRow {
  id: string;
  role: UserRole;
  wallet_address: string | null;
  is_validated: boolean;
  created_at: Date;
}

export const serverAuth = {
  async getCurrentUser() {
    const { userId } = await auth();
    if (!userId) return { user: null, error: 'Not authenticated' };
    const user = await currentUser();
    return { user, error: null };
  },

  async getUserProfile(userId: string): Promise<{ data: ProfileRow | null; error: string | null }> {
    try {
      const profile = await prisma.profile.findUnique({ where: { id: userId } });
      if (!profile) return { data: null, error: 'Profile not found' };
      return { data: profile as unknown as ProfileRow, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  },
};

export async function requireAuth(allowedRoles?: UserRole[]) {
  const { userId } = await auth();
  if (!userId) redirect('/auth/login');

  if (allowedRoles && allowedRoles.length > 0) {
    const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { role: true } });
    if (!profile || !allowedRoles.includes(profile.role as UserRole)) {
      if (allowedRoles.includes('admin')) redirect('/unauthorized');
      redirect('/dashboard');
    }
  }

  return userId;
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function getProfileRole(userId: string): Promise<UserRole | null> {
  try {
    const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { role: true } });
    return profile ? (profile.role as UserRole) : null;
  } catch {
    return null;
  }
}
