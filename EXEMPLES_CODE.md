# 💻 EXEMPLES DE CODE - GUIDES D'IMPLÉMENTATION

## 1. MIDDLEWARE D'AUTHENTIFICATION (Next.js 14)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  // Routes publiques
  const publicRoutes = ['/login', '/register'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Vérifier token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyToken(token);
    
    // Vérifier accès selon l'espace
    if (pathname.startsWith('/platform') && payload.role !== 'OWNER') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    if (pathname.startsWith('/company') && !['OWNER', 'COMPANY_ADMIN'].includes(payload.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    if (pathname.startsWith('/warehouse') && !['OWNER', 'COMPANY_ADMIN', 'WAREHOUSE_AGENT'].includes(payload.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    if (pathname.startsWith('/driver') && payload.role !== 'DRIVER') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Ajouter user info dans headers pour les API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-company-id', payload.companyId || '');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## 2. API ROUTE AVEC RBAC ET ISOLATION

```typescript
// app/api/company/deliveries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { canAccessCompany } from '@/lib/permissions/check';
import { z } from 'zod';

const createDeliverySchema = z.object({
  warehouseId: z.string(),
  deliveryAddress: z.string().min(1),
  deliveryCity: z.string().min(1),
  deliveryPostalCode: z.string().min(1),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })),
});

export async function GET(request: NextRequest) {
  try {
    // Vérifier authentification
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    const companyId = request.headers.get('x-company-id');

    // Vérifier permissions
    if (!canAccessCompany(payload.role, companyId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Isolation stricte : filtrer par companyId
    const deliveries = await prisma.delivery.findMany({
      where: {
        companyId: companyId!,
      },
      include: {
        warehouse: true,
        driver: {
          include: {
            user: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ deliveries });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    const companyId = request.headers.get('x-company-id');

    if (!canAccessCompany(payload.role, companyId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = createDeliverySchema.parse(body);

    // Vérifier que le warehouse appartient à l'entreprise
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: data.warehouseId,
        companyId: companyId!,
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found or access denied' },
        { status: 404 }
      );
    }

    // Créer la livraison avec transaction
    const delivery = await prisma.$transaction(async (tx) => {
      // 1. Vérifier stock disponible
      for (const item of data.items) {
        const stock = await tx.stock.findUnique({
          where: { productId: item.productId },
        });

        if (!stock || stock.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
      }

      // 2. Générer référence unique
      const count = await tx.delivery.count({
        where: { companyId: companyId! },
      });
      const reference = `DEL-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

      // 3. Calculer coût total
      let totalCost = 0;
      const deliveryItems = [];
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        const itemTotal = Number(product!.unitPrice) * item.quantity;
        totalCost += itemTotal;
        deliveryItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product!.unitPrice,
          totalPrice: itemTotal,
        });
      }

      // 4. Créer livraison
      const newDelivery = await tx.delivery.create({
        data: {
          reference,
          companyId: companyId!,
          warehouseId: data.warehouseId,
          createdById: payload.userId,
          deliveryAddress: data.deliveryAddress,
          deliveryCity: data.deliveryCity,
          deliveryPostalCode: data.deliveryPostalCode,
          totalCost,
          status: 'CREATED',
          items: {
            create: deliveryItems,
          },
          statusHistory: {
            create: {
              status: 'CREATED',
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return newDelivery;
    });

    return NextResponse.json({ delivery }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating delivery:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 3. PRÉPARATION LIVRAISON AVEC TRANSACTION STOCK

```typescript
// app/api/warehouse/deliveries/[id]/prepare/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    const deliveryId = params.id;

    // Vérifier que l'utilisateur est un agent entrepôt
    if (!['OWNER', 'COMPANY_ADMIN', 'WAREHOUSE_AGENT'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Transaction atomique : préparation + déduction stock
    const result = await prisma.$transaction(async (tx) => {
      // 1. Récupérer la livraison avec items
      const delivery = await tx.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          warehouse: true,
        },
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      // 2. Vérifier que l'entrepôt appartient à l'utilisateur
      if (payload.role === 'WAREHOUSE_AGENT') {
        // TODO: Vérifier que l'utilisateur a accès à cet entrepôt
        // (nécessite une table UserWarehouse ou vérification dans User)
      }

      // 3. Vérifier statut
      if (delivery.status !== 'CREATED') {
        throw new Error(`Cannot prepare delivery with status ${delivery.status}`);
      }

      // 4. Vérifier et déduire stock pour chaque item
      const stockMovements = [];
      for (const item of delivery.items) {
        const stock = await tx.stock.findUnique({
          where: { productId: item.productId },
        });

        if (!stock) {
          throw new Error(`Stock not found for product ${item.productId}`);
        }

        if (stock.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for product ${item.product.name}. Available: ${stock.quantity}, Required: ${item.quantity}`
          );
        }

        // Déduire stock
        await tx.stock.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
            reserved: {
              increment: item.quantity,
            },
          },
        });

        // Créer mouvement de stock
        const movement = await tx.stockMovement.create({
          data: {
            type: 'OUT',
            quantity: item.quantity,
            reason: `Delivery preparation: ${delivery.reference}`,
            reference: deliveryId,
            warehouseId: delivery.warehouseId,
            productId: item.productId,
            userId: payload.userId,
          },
        });

        stockMovements.push(movement);
      }

      // 5. Mettre à jour statut livraison
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'PREPARED',
          statusHistory: {
            create: {
              status: 'PREPARED',
              notes: 'Stock deducted and delivery prepared',
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return { delivery: updatedDelivery, stockMovements };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error preparing delivery:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 4. HOOK REACT POUR TEMPS RÉEL

```typescript
// hooks/useDeliveryUpdates.ts
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';

export function useDeliveryUpdates(deliveryId: string) {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connexion WebSocket
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: {
        token: document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1],
      },
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      newSocket.emit('subscribe', { deliveryId });
    });

    newSocket.on('delivery:status-updated', (data: { deliveryId: string; status: string }) => {
      // Invalider la query pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ['delivery', data.deliveryId] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('unsubscribe', { deliveryId });
      newSocket.disconnect();
    };
  }, [deliveryId, queryClient]);

  // Query pour récupérer la livraison
  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery', deliveryId],
    queryFn: async () => {
      const res = await fetch(`/api/company/deliveries/${deliveryId}`);
      if (!res.ok) throw new Error('Failed to fetch delivery');
      return res.json();
    },
    refetchInterval: 5000, // Fallback polling si WebSocket échoue
  });

  return {
    delivery: data?.delivery,
    isLoading,
    error,
    socket,
  };
}
```

## 5. COMPOSANT TIMELINE LIVRAISON

```typescript
// components/deliveries/timeline.tsx
import { DeliveryStatus } from '@prisma/client';
import { useDeliveryUpdates } from '@/hooks/useDeliveryUpdates';

const statusSteps: { status: DeliveryStatus; label: string; color: string }[] = [
  { status: 'CREATED', label: 'Créée', color: 'gray' },
  { status: 'PREPARING', label: 'En préparation', color: 'yellow' },
  { status: 'PREPARED', label: 'Préparée', color: 'blue' },
  { status: 'ASSIGNED', label: 'Assignée', color: 'purple' },
  { status: 'IN_TRANSIT', label: 'En cours', color: 'orange' },
  { status: 'DELIVERED', label: 'Livrée', color: 'green' },
  { status: 'FAILED', label: 'Échouée', color: 'red' },
];

export function DeliveryTimeline({ deliveryId }: { deliveryId: string }) {
  const { delivery, isLoading } = useDeliveryUpdates(deliveryId);

  if (isLoading || !delivery) {
    return <div>Chargement...</div>;
  }

  const currentStepIndex = statusSteps.findIndex(
    step => step.status === delivery.status
  );

  return (
    <div className="timeline">
      {statusSteps.map((step, index) => {
        const isCompleted = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <div key={step.status} className="timeline-step">
            <div
              className={`timeline-marker ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
              style={{ backgroundColor: isCompleted ? step.color : 'gray' }}
            />
            <div className="timeline-content">
              <h4>{step.label}</h4>
              {delivery.statusHistory
                .filter(h => h.status === step.status)
                .map(history => (
                  <p key={history.id} className="text-sm text-gray-500">
                    {new Date(history.createdAt).toLocaleString()}
                  </p>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

## 6. SYSTÈME DE PERMISSIONS

```typescript
// lib/permissions/check.ts
import { Role } from '@prisma/client';

export function canAccessCompany(role: Role, companyId: string | null): boolean {
  if (role === 'OWNER') {
    return true; // Owner peut accéder à toutes les entreprises
  }
  return !!companyId; // Autres rôles doivent avoir un companyId
}

export function canCreateDelivery(role: Role): boolean {
  return ['OWNER', 'COMPANY_ADMIN'].includes(role);
}

export function canPrepareDelivery(role: Role): boolean {
  return ['OWNER', 'COMPANY_ADMIN', 'WAREHOUSE_AGENT'].includes(role);
}

export function canUpdateDeliveryStatus(role: Role, deliveryDriverId: string | null, userDriverId: string | null): boolean {
  if (role === 'OWNER' || role === 'COMPANY_ADMIN') {
    return true;
  }
  if (role === 'DRIVER') {
    // Un livreur ne peut mettre à jour que ses propres livraisons
    return deliveryDriverId === userDriverId;
  }
  return false;
}

export function canViewStats(role: Role): boolean {
  return ['OWNER', 'COMPANY_ADMIN'].includes(role);
}
```

## 7. RATE LIMITING

```typescript
// lib/rate-limit.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  const remaining = Math.max(0, limit - current);
  const allowed = current <= limit;

  return { allowed, remaining };
}

// Usage dans API route
export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const { allowed, remaining } = await rateLimit(`create-delivery:${ip}`, 10, 60);
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
    );
  }
  
  // ... reste du code
}
```

## 8. DOCKER COMPOSE

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-logistics}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@postgres:5432/${DB_NAME:-logistics}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next

volumes:
  postgres_data:
  redis_data:
```

Ces exemples fournissent une base solide pour l'implémentation. Adaptez-les selon vos besoins spécifiques.
