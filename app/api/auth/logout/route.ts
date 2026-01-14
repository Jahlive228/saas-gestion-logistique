import { NextRequest, NextResponse } from 'next/server';
import { getRefreshToken } from '@/lib/auth/cookies';
import { destroySession } from '@/lib/auth/session';
import { clearAuthCookies } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      await destroySession(refreshToken);
    }

    const response = NextResponse.json({ success: true });
    return clearAuthCookies(response);
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
    return clearAuthCookies(response);
  }
}
