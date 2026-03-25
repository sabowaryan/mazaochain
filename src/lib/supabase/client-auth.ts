// Supabase client-auth removed — auth is now handled by Clerk.
// This stub is kept to avoid breaking unused imports.
// Use @clerk/nextjs useSignIn, useSignUp, useClerk hooks in components instead.

export const clientAuth = {
  async signUp() {
    throw new Error('clientAuth.signUp is removed. Use Clerk useSignUp hook instead.');
  },
  async signIn() {
    throw new Error('clientAuth.signIn is removed. Use Clerk useSignIn hook instead.');
  },
  async signInWithProfile() {
    throw new Error('clientAuth.signInWithProfile is removed. Use Clerk useSignIn hook instead.');
  },
  async signOut() {
    throw new Error('clientAuth.signOut is removed. Use Clerk useClerk().signOut() instead.');
  },
  async getCurrentUser() {
    throw new Error('clientAuth.getCurrentUser is removed. Use Clerk useUser() hook instead.');
  },
  async updateProfile() {
    throw new Error('clientAuth.updateProfile is removed. Use the /api/profile endpoint instead.');
  },
};
