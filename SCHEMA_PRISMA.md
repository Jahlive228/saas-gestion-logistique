# 🗄️ SCHÉMA PRISMA - PLATEFORME SAAS LOGISTIQUE

## Modèle de données complet

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTHENTIFICATION & UTILISATEURS
// ============================================

enum Role {
  OWNER              // Owner SaaS (Super Admin)
  COMPANY_ADMIN      // Responsable logistique entreprise
  WAREHOUSE_AGENT    // Agent entrepôt
  DRIVER             // Livreur
}

enum DeliveryStatus {
  CREATED            // Créée
  PREPARING          // En préparation
  PREPARED           // Préparée
  ASSIGNED           // Assignée à un livreur
  IN_TRANSIT         // En cours de livraison
  DELIVERED          // Livrée
  FAILED             // Échouée
  CANCELLED          // Annulée
}

enum StockMovementType {
  IN                 // Entrée stock
  OUT                // Sortie stock
  ADJUSTMENT         // Ajustement
  RETURN             // Retour
}

// Owner de la plateforme SaaS
model PlatformOwner {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Hash bcrypt
  name      String
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("platform_owners")
}

// Entreprise cliente
model Company {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  address     String?
  phone       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users       User[]
  warehouses  Warehouse[]
  deliveries  Delivery[]
  drivers     Driver[]

  @@map("companies")
}

// Utilisateur (peut appartenir à une entreprise)
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String   // Hash bcrypt
  firstName   String
  lastName    String
  phone       String?
  role        Role
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String?
  company     Company? @relation(fields: [companyId], references: [id], onDelete: Cascade)
  deliveries  Delivery[] // Livraisons créées par cet utilisateur
  stockMovements StockMovement[] // Mouvements créés par cet utilisateur

  @@index([companyId])
  @@index([email])
  @@map("users")
}

// Livreur (spécialisation de User)
model Driver {
  id          String   @id @default(cuid())
  licenseNumber String @unique
  vehicleType   String // "car", "truck", "motorcycle"
  vehiclePlate  String?
  isAvailable   Boolean @default(true)
  currentZone   String? // Zone géographique actuelle
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  deliveries  Delivery[]

  @@index([companyId])
  @@index([isAvailable])
  @@map("drivers")
}

// ============================================
// ENTREPÔTS & STOCK
// ============================================

// Entrepôt
model Warehouse {
  id          String   @id @default(cuid())
  name        String
  address     String
  city        String
  postalCode  String
  latitude    Float?
  longitude   Float?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  products    Product[]
  deliveries  Delivery[]
  stockMovements StockMovement[]

  @@index([companyId])
  @@map("warehouses")
}

// Produit
model Product {
  id          String   @id @default(cuid())
  sku         String   // Stock Keeping Unit
  name        String
  description String?
  unitPrice   Decimal  @default(0)
  weight      Float?   // Poids en kg
  dimensions  String?  // "LxWxH"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  warehouseId String
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  stock       Stock?
  deliveryItems DeliveryItem[]

  @@unique([warehouseId, sku])
  @@index([warehouseId])
  @@map("products")
}

// Stock d'un produit dans un entrepôt
model Stock {
  id          String   @id @default(cuid())
  quantity    Int      @default(0)
  reserved    Int      @default(0) // Quantité réservée pour livraisons en préparation
  minLevel    Int      @default(0) // Niveau minimum d'alerte
  updatedAt   DateTime @updatedAt

  // Relations
  productId   String   @unique
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("stocks")
}

// Mouvement de stock
model StockMovement {
  id          String   @id @default(cuid())
  type        StockMovementType
  quantity    Int
  reason      String?  // Raison du mouvement
  reference   String?  // Référence externe (ex: deliveryId)
  createdAt   DateTime @default(now())

  // Relations
  warehouseId String
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([warehouseId])
  @@index([productId])
  @@index([createdAt])
  @@map("stock_movements")
}

// ============================================
// LIVRAISONS
// ============================================

// Livraison
model Delivery {
  id          String   @id @default(cuid())
  reference   String   @unique // Référence unique (ex: DEL-2024-001)
  status      DeliveryStatus @default(CREATED)
  deliveryAddress String
  deliveryCity    String
  deliveryPostalCode String
  deliveryLatitude  Float?
  deliveryLongitude Float?
  estimatedDeliveryDate DateTime?
  actualDeliveryDate    DateTime?
  notes       String?
  totalCost   Decimal  @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  warehouseId String
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Restrict)
  driverId    String?
  driver      Driver?  @relation(fields: [driverId], references: [id], onDelete: SetNull)
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id], onDelete: Restrict)
  items       DeliveryItem[]
  statusHistory DeliveryStatusHistory[]

  @@index([companyId])
  @@index([warehouseId])
  @@index([driverId])
  @@index([status])
  @@index([createdAt])
  @@map("deliveries")
}

// Historique des statuts de livraison
model DeliveryStatusHistory {
  id          String   @id @default(cuid())
  status      DeliveryStatus
  notes       String?
  createdAt   DateTime @default(now())

  // Relations
  deliveryId  String
  delivery    Delivery @relation(fields: [deliveryId], references: [id], onDelete: Cascade)

  @@index([deliveryId])
  @@index([createdAt])
  @@map("delivery_status_history")
}

// Item d'une livraison
model DeliveryItem {
  id          String   @id @default(cuid())
  quantity    Int
  unitPrice   Decimal
  totalPrice  Decimal
  createdAt   DateTime @default(now())

  // Relations
  deliveryId  String
  delivery    Delivery @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@index([deliveryId])
  @@index([productId])
  @@map("delivery_items")
}

// ============================================
// SESSIONS & TOKENS (Optionnel - peut utiliser Redis)
// ============================================

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}
```

## Index recommandés pour performance

```sql
-- Index supplémentaires à ajouter manuellement si nécessaire
CREATE INDEX idx_deliveries_company_status ON deliveries(company_id, status);
CREATE INDEX idx_deliveries_warehouse_status ON deliveries(warehouse_id, status);
CREATE INDEX idx_deliveries_driver_status ON deliveries(driver_id, status) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_stock_warehouse_product ON stocks(product_id) INCLUDE (quantity, reserved);
```

## Relations clés

1. **Company** → **User** (1:N) - Une entreprise a plusieurs utilisateurs
2. **Company** → **Warehouse** (1:N) - Une entreprise a plusieurs entrepôts
3. **Company** → **Delivery** (1:N) - Une entreprise a plusieurs livraisons
4. **Warehouse** → **Product** (1:N) - Un entrepôt a plusieurs produits
5. **Product** → **Stock** (1:1) - Un produit a un stock
6. **Delivery** → **DeliveryItem** (1:N) - Une livraison a plusieurs items
7. **Delivery** → **Driver** (N:1) - Plusieurs livraisons peuvent être assignées à un livreur
8. **StockMovement** - Trace tous les mouvements de stock

## Contraintes importantes

- **Isolation des données** : Toutes les requêtes doivent filtrer par `companyId`
- **Unicité** : `reference` dans Delivery doit être unique
- **Cascade** : Suppression d'une Company supprime ses Users, Warehouses, Deliveries
- **Restrict** : Impossible de supprimer un Warehouse s'il a des Deliveries
