import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revokeRefreshToken, clearAuthCookies } from '@/lib/auth/jwt';

/**
 * POST /api/auth/logout
 * Logout user and revoke refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    // Revoke refresh token if it exists
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    // Clear cookies
    await clearAuthCookies();

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, clear the cookies
    await clearAuthCookies();
    return NextResponse.json({ message: 'Logged out' });
  }
}
