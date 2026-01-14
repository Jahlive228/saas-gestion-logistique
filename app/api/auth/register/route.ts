import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { setAuthCookies } from '@/lib/auth/cookies';
import { z } from 'zod';
import { Role } from '@prisma/client';

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phone: z.string().optional(),
  role: z.enum(['COMPANY_ADMIN', 'WAREHOUSE_AGENT', 'DRIVER']),
  companyId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(data.password);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role as Role,
        companyId: data.companyId || null,
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    // Créer la session
    const { accessToken, refreshToken } = await createSession(
      user.id,
      user.email,
      user.role,
      user.companyId
    );

    // Créer la réponse avec les cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    }, { status: 201 });

    return setAuthCookies(response, accessToken, refreshToken);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}
