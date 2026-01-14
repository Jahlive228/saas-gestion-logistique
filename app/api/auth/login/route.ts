import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { setAuthCookies } from '@/lib/auth/cookies';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Chercher l'utilisateur (User ou PlatformOwner)
    let user: any = null;
    let role: string;
    let companyId: string | null = null;

    // Essayer d'abord dans User
    const foundUser = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (foundUser) {
      if (!foundUser.isActive) {
        return NextResponse.json(
          { error: 'Compte désactivé' },
          { status: 403 }
        );
      }

      // Vérifier le mot de passe
      const isValid = await verifyPassword(password, foundUser.password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Email ou mot de passe incorrect' },
          { status: 401 }
        );
      }

      user = foundUser;
      role = foundUser.role;
      companyId = foundUser.companyId;
    } else {
      // Essayer dans PlatformOwner
      const platformOwner = await prisma.platformOwner.findUnique({
        where: { email },
      });

      if (platformOwner) {
        const isValid = await verifyPassword(password, platformOwner.password);
        if (!isValid) {
          return NextResponse.json(
            { error: 'Email ou mot de passe incorrect' },
            { status: 401 }
          );
        }

        user = platformOwner;
        role = 'OWNER';
      } else {
        return NextResponse.json(
          { error: 'Email ou mot de passe incorrect' },
          { status: 401 }
        );
      }
    }

    // Créer la session
    const { accessToken, refreshToken } = await createSession(
      user.id,
      user.email,
      role as any,
      companyId
    );

    // Créer la réponse avec les cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role,
        companyId,
        firstName: user.firstName || user.name,
        lastName: user.lastName || '',
      },
    });

    return setAuthCookies(response, accessToken, refreshToken);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}
