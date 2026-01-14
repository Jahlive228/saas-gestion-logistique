import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, decodeToken } from '@/lib/auth/jwt';
import { getAccessToken } from '@/lib/auth/cookies';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = await getAccessToken();

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      const payload = verifyAccessToken(token);
      
      // Récupérer les informations utilisateur depuis la base
      let user: any = null;

      if (payload.role === 'OWNER') {
        user = await prisma.platformOwner.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            name: true,
          },
        });
        if (user) {
          user.role = 'OWNER';
          user.firstName = user.name;
          user.lastName = '';
        }
      } else {
        user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            companyId: true,
          },
        });
      }

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ user });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
