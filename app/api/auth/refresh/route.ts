import { NextRequest, NextResponse } from 'next/server';
import { getRefreshToken } from '@/lib/auth/cookies';
import { refreshSession } from '@/lib/auth/session';
import { setAuthCookies, clearAuthCookies } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    const refreshed = await refreshSession(refreshToken);

    if (!refreshed) {
      const response = NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
      return clearAuthCookies(response);
    }

    const response = NextResponse.json({ success: true });
    return setAuthCookies(response, refreshed.accessToken, refreshed.newRefreshToken);
  } catch (error) {
    console.error('Refresh error:', error);
    const response = NextResponse.json(
      { error: 'Error refreshing token' },
      { status: 500 }
    );
    return clearAuthCookies(response);
  }
}
