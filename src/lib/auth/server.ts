import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';

export type UserRole = 'agriculteur' | 'cooperative' | 'preteur' | 'admin';

export interface ProfileRow {
  id: string;
  role: UserRole;
  wallet_address: string | null;
  is_validated: boolean;
  created_at: string;
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
      const rows = await sql`
        SELECT id, role, wallet_address, is_validated, created_at
        FROM profiles
        WHERE id = ${userId}
      `;
      if (!rows.length) return { data: null, error: 'Profile not found' };
      return { data: rows[0] as ProfileRow, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  },
};

export async function requireAuth(allowedRoles?: UserRole[]) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/login');
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const rows = await sql`SELECT role FROM profiles WHERE id = ${userId}`;
    const profile = rows[0] as { role: UserRole } | undefined;

    if (!profile || !allowedRoles.includes(profile.role)) {
      if (allowedRoles.includes('admin')) {
        redirect('/unauthorized');
      }
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
    const rows = await sql`SELECT role FROM profiles WHERE id = ${userId}`;
    return rows.length ? (rows[0] as { role: UserRole }).role : null;
  } catch {
    return null;
  }
}
