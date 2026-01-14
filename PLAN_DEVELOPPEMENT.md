# 📋 PLAN DE DÉVELOPPEMENT - PLATEFORME SAAS GESTION LOGISTIQUE

## 🎯 Vue d'ensemble du projet

Transformation de l'application Next.js actuelle en une plateforme SaaS multi-entreprises complète pour la gestion logistique et les livraisons.

---

## 📊 ÉTAT ACTUEL DU PROJET

### ✅ Ce qui existe déjà
- **Frontend** : Next.js 12 avec NextUI, structure de base avec sidebar et layout
- **UI Components** : Composants de base (sidebar, navbar, table, charts)
- **Styling** : NextUI + Stitches CSS

### ❌ Ce qui manque
- Backend API
- Base de données (PostgreSQL + Prisma)
- Authentification & Autorisation (JWT, 2FA, RBAC)
- Architecture multi-espaces (/platform, /company, /driver, /warehouse)
- Gestion des livraisons en temps réel
- Docker & Infrastructure
- Redis pour cache/sessions
- Tests & Documentation

---

## 🏗️ ARCHITECTURE PROPOSÉE

```
saas-gestion-logistique/
├── app/                          # Next.js 14+ App Router
│   ├── (auth)/                   # Routes d'authentification
│   ├── (platform)/               # Espace Owner SaaS
│   ├── (company)/                # Espace Entreprise
│   ├── (driver)/                 # Espace Livreur
│   ├── (warehouse)/              # Espace Entrepôt
│   └── api/                      # API Routes Next.js
├── server/                       # Backend API (optionnel, ou API Routes)
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   └── utils/
├── prisma/                       # Schéma Prisma
│   ├── schema.prisma
│   └── migrations/
├── lib/                          # Utilitaires partagés
│   ├── auth/
│   ├── db/
│   ├── permissions/
│   └── websocket/
├── components/                   # Composants React
│   ├── auth/
│   ├── deliveries/
│   ├── dashboard/
│   └── shared/
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
└── scripts/
    └── seed.ts
```

---

## 📅 PHASES DE DÉVELOPPEMENT

## PHASE 1 : FONDATIONS & MIGRATION (Semaine 1)

### 1.1 Mise à jour des dépendances
- [ ] Migrer Next.js 12 → **Next.js 14+ (App Router)**
- [ ] Mettre à jour React vers **18.3+**
- [ ] Ajouter Tailwind CSS (si pas déjà présent)
- [ ] Installer Prisma ORM
- [ ] Installer dépendances backend : `@prisma/client`, `bcryptjs`, `jsonwebtoken`, `zod`
- [ ] Installer dépendances frontend : `@tanstack/react-query`, `zustand` (state management), `socket.io-client`
- [ ] Installer dépendances sécurité : `express-rate-limit`, `helmet`, `express-validator`

**Commandes :**
```bash
npm install next@latest react@latest react-dom@latest
npm install @prisma/client prisma
npm install bcryptjs jsonwebtoken zod
npm install @tanstack/react-query zustand socket.io-client
npm install express-rate-limit helmet express-validator
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### 1.2 Configuration Prisma & Base de données
- [ ] Créer `prisma/schema.prisma` avec tous les modèles
- [ ] Configurer PostgreSQL dans `.env`
- [ ] Créer les migrations initiales
- [ ] Générer le client Prisma

**Modèles Prisma à créer :**
```prisma
- PlatformOwner
- Company
- User (avec relation Company)
- Role (enum: OWNER, COMPANY_ADMIN, WAREHOUSE_AGENT, DRIVER)
- Warehouse (avec relation Company)
- Product (avec relation Warehouse)
- Delivery (avec relations: Company, Warehouse, Driver, User)
- DeliveryItem (avec relations: Delivery, Product)
- StockMovement (avec relations: Warehouse, Product)
- TwoFactorAuth (pour 2FA)
```

### 1.3 Configuration Docker
- [ ] Créer `docker-compose.yml` avec :
  - Service Next.js (frontend)
  - Service PostgreSQL
  - Service Redis
- [ ] Créer Dockerfiles pour chaque service
- [ ] Configurer les variables d'environnement
- [ ] Tester le démarrage avec `docker-compose up`

---

## PHASE 2 : AUTHENTIFICATION & SÉCURITÉ (Semaine 1-2)

### 2.1 Système d'authentification
- [ ] Créer middleware Next.js pour la protection des routes
- [ ] Implémenter JWT avec refresh tokens
- [ ] Créer pages de login/register
- [ ] Implémenter 2FA (TOTP) pour OWNER et COMPANY_ADMIN
- [ ] Créer hooks React : `useAuth`, `usePermissions`
- [ ] Gérer les sessions avec Redis

**Fichiers à créer :**
- `lib/auth/jwt.ts` - Gestion JWT
- `lib/auth/2fa.ts` - Gestion 2FA
- `middleware.ts` - Middleware Next.js pour routes protégées
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(auth)/verify-2fa/page.tsx`

### 2.2 RBAC (Role-Based Access Control)
- [ ] Créer système de permissions centralisé
- [ ] Créer middleware d'autorisation pour API
- [ ] Définir les règles de permissions par rôle
- [ ] Créer composants de guard : `ProtectedRoute`, `RoleGuard`

**Fichiers à créer :**
- `lib/permissions/rules.ts` - Définition des règles
- `lib/permissions/check.ts` - Vérification des permissions
- `components/auth/ProtectedRoute.tsx`
- `components/auth/RoleGuard.tsx`

### 2.3 Protection contre les attaques
- [ ] Implémenter rate limiting (API routes)
- [ ] Protection CSRF
- [ ] Validation des entrées (Zod schemas)
- [ ] Sanitization des données

---

## PHASE 3 : ARCHITECTURE MULTI-ESPACES (Semaine 2)

### 3.1 Migration vers App Router
- [ ] Restructurer les pages en App Router
- [ ] Créer les layouts pour chaque espace :
  - `app/(platform)/layout.tsx` - Layout Owner SaaS
  - `app/(company)/layout.tsx` - Layout Entreprise
  - `app/(driver)/layout.tsx` - Layout Livreur
  - `app/(warehouse)/layout.tsx` - Layout Entrepôt

### 3.2 Navigation dynamique par rôle
- [ ] Adapter le composant Sidebar pour afficher les menus selon le rôle
- [ ] Créer des composants de navigation spécifiques par espace
- [ ] Implémenter la redirection automatique selon le rôle après login

**Fichiers à modifier/créer :**
- `components/sidebar/sidebar.tsx` - Adapter pour multi-espaces
- `components/sidebar/platform-sidebar.tsx`
- `components/sidebar/company-sidebar.tsx`
- `components/sidebar/driver-sidebar.tsx`
- `components/sidebar/warehouse-sidebar.tsx`

### 3.3 Guards d'accès
- [ ] Créer middleware pour chaque espace
- [ ] Vérifier l'isolation des données entre entreprises
- [ ] Implémenter la redirection si accès non autorisé

---

## PHASE 4 : BACKEND & API (Semaine 2-3)

### 4.1 API Routes Next.js
Créer les endpoints dans `app/api/` :

**Authentification :**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/verify-2fa`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

**Entreprises (Platform Owner) :**
- `GET /api/platform/companies` - Liste des entreprises
- `POST /api/platform/companies` - Créer entreprise
- `GET /api/platform/stats` - Statistiques globales

**Livraisons (Company) :**
- `GET /api/company/deliveries` - Liste des livraisons
- `POST /api/company/deliveries` - Créer livraison
- `GET /api/company/deliveries/:id` - Détails livraison
- `PUT /api/company/deliveries/:id/status` - Mettre à jour statut

**Entrepôts :**
- `POST /api/warehouse/deliveries/:id/prepare` - Préparer livraison
- `GET /api/warehouse/stock` - Gestion stock

**Livreurs :**
- `GET /api/driver/deliveries` - Mes livraisons
- `PUT /api/driver/deliveries/:id/status` - Mettre à jour statut livraison

**Statistiques :**
- `GET /api/company/stats` - Stats entreprise
- `GET /api/platform/stats` - Stats globales

### 4.2 Services métier
- [ ] `services/delivery.service.ts` - Logique métier livraisons
- [ ] `services/stock.service.ts` - Gestion du stock avec transactions
- [ ] `services/notification.service.ts` - Notifications temps réel
- [ ] `services/stats.service.ts` - Calcul des statistiques

### 4.3 Transactions critiques
- [ ] Implémenter transactions Prisma pour préparation livraison
- [ ] Gérer les rollbacks en cas d'erreur
- [ ] Protection contre double traitement (verrous Redis)

**Exemple transaction :**
```typescript
// Préparation livraison avec déduction stock atomique
await prisma.$transaction(async (tx) => {
  // 1. Vérifier stock disponible
  // 2. Déduire stock
  // 3. Créer mouvements de stock
  // 4. Mettre à jour statut livraison
  // Rollback automatique en cas d'erreur
});
```

---

## PHASE 5 : FRONTEND - DASHBOARDS (Semaine 3-4)

### 5.1 Dashboard Platform Owner
**Page :** `app/(platform)/dashboard/page.tsx`

**Composants à créer :**
- `components/dashboard/platform/stats-cards.tsx` - Cartes statistiques
- `components/dashboard/platform/companies-list.tsx` - Liste entreprises
- `components/dashboard/platform/deliveries-chart.tsx` - Graphique livraisons
- `components/dashboard/platform/zones-map.tsx` - Carte zones couvertes

**Métriques à afficher :**
- Nombre total d'entreprises actives
- Nombre de livraisons par jour (toutes entreprises)
- Graphique évolution livraisons
- Carte des zones couvertes

### 5.2 Dashboard Company Admin
**Page :** `app/(company)/dashboard/page.tsx`

**Composants à créer :**
- `components/dashboard/company/deliveries-status.tsx` - Statut livraisons
- `components/dashboard/company/fleet-management.tsx` - Gestion flotte
- `components/dashboard/company/warehouse-performance.tsx` - Performance entrepôts
- `components/dashboard/company/deliveries-timeline.tsx` - Timeline livraisons

**Métriques à afficher :**
- Livraisons du jour / en retard / livrées
- Liste des livreurs avec statut
- Performance par entrepôt
- Graphiques de tendances

### 5.3 Dashboard Driver
**Page :** `app/(driver)/dashboard/page.tsx`

**Composants :**
- Liste des livraisons assignées
- Carte avec itinéraire
- Formulaire de mise à jour de statut

### 5.4 Dashboard Warehouse
**Page :** `app/(warehouse)/dashboard/page.tsx`

**Composants :**
- Liste des livraisons à préparer
- Gestion du stock
- Interface de préparation

---

## PHASE 6 : GESTION TEMPS RÉEL (Semaine 4)

### 6.1 WebSockets / Server-Sent Events
- [ ] Installer Socket.io ou utiliser Server-Sent Events
- [ ] Créer endpoint WebSocket pour mises à jour livraisons
- [ ] Implémenter hooks React : `useDeliveryUpdates`
- [ ] Mettre à jour les composants en temps réel

**Fichiers à créer :**
- `lib/websocket/client.ts` - Client WebSocket
- `app/api/ws/deliveries/route.ts` - Endpoint WebSocket
- `hooks/useDeliveryUpdates.ts` - Hook React pour updates

### 6.2 Timeline des livraisons
- [ ] Créer composant `DeliveryTimeline` avec états :
  - Créée → Préparée → En cours → Livrée / Échouée
- [ ] Mise à jour automatique via WebSocket
- [ ] Affichage des timestamps et acteurs

**Composant :** `components/deliveries/timeline.tsx`

### 6.3 Alternative : Polling intelligent
Si WebSockets trop complexe, utiliser :
- React Query avec `refetchInterval` adaptatif
- SWR avec `refreshInterval`

---

## PHASE 7 : FORMULAIRES COMPLEXES (Semaine 4-5)

### 7.1 Création de livraison
**Page :** `app/(company)/deliveries/new/page.tsx`

**Fonctionnalités :**
- [ ] Sélection entrepôt
- [ ] Sélection produits avec validation stock disponible
- [ ] Calcul automatique du coût
- [ ] Choix dynamique du livreur disponible (filtrage par zone, disponibilité)
- [ ] Validation complète avec feedback utilisateur

**Composants :**
- `components/deliveries/create-form.tsx`
- `components/deliveries/product-selector.tsx`
- `components/deliveries/driver-selector.tsx`
- `components/deliveries/cost-calculator.tsx`

### 7.2 Gestion des erreurs métier
- [ ] Messages d'erreur clairs et contextuels
- [ ] États de chargement optimisés (skeletons)
- [ ] Validation côté client et serveur
- [ ] Gestion des erreurs réseau

---

## PHASE 8 : STATISTIQUES & PERFORMANCE (Semaine 5)

### 8.1 Endpoints statistiques performants
- [ ] Optimiser les requêtes SQL avec agrégations
- [ ] Implémenter cache Redis pour dashboards
- [ ] Pagination pour grandes listes
- [ ] Indexation base de données

**Endpoints :**
- `GET /api/company/stats/delivery-times` - Délai moyen
- `GET /api/company/stats/failure-rate` - Taux d'échec
- `GET /api/company/stats/product-volume` - Volume produits

### 8.2 Cache & Optimisation
- [ ] Cache Redis pour :
  - Dashboards (TTL 5 minutes)
  - Sessions utilisateurs
  - Verrous légers (anti double traitement)
- [ ] Optimisation images (Next.js Image)
- [ ] Code splitting par route

---

## PHASE 9 : DOCKER & INFRASTRUCTURE (Semaine 5-6)

### 9.1 Dockerisation complète
- [ ] `Dockerfile` pour Next.js
- [ ] `docker-compose.yml` avec :
  ```yaml
  services:
    frontend:    # Next.js
    postgres:    # PostgreSQL
    redis:       # Redis
  ```
- [ ] Configuration des volumes et networks
- [ ] Healthchecks pour chaque service

### 9.2 Scripts de seed
- [ ] Créer `scripts/seed.ts` avec :
  - 1 Owner SaaS
  - 2 entreprises
  - 2 entrepôts par entreprise
  - Produits fictifs
  - Livraisons fictives
- [ ] Intégrer dans `docker-compose.yml` (command après démarrage)

### 9.3 Variables d'environnement
- [ ] Créer `.env.example` avec toutes les variables
- [ ] Documenter chaque variable
- [ ] Configuration pour dev/prod

---

## PHASE 10 : TESTS & DOCUMENTATION (Semaine 6)

### 10.1 Tests
- [ ] Tests unitaires (Jest) pour services critiques
- [ ] Tests d'intégration pour API
- [ ] Tests E2E (Playwright) pour flux principaux

### 10.2 Documentation
- [ ] `README.md` complet avec :
  - Architecture détaillée
  - Schéma RBAC
  - Choix techniques justifiés
  - Procédure de migration Prisma
  - Guide de démarrage
  - Variables d'environnement
- [ ] Documentation API (Swagger/OpenAPI)
- [ ] Commentaires code pour fonctions complexes

---

## 📦 STACK TECHNIQUE FINALE

### Frontend
- **Next.js 14+** (App Router)
- **React 18.3+**
- **TypeScript**
- **Tailwind CSS** + **NextUI**
- **TanStack Query** (data fetching)
- **Zustand** (state management)
- **Socket.io Client** (temps réel)
- **Zod** (validation)
- **React Hook Form** (formulaires)

### Backend
- **Next.js API Routes** (ou Express séparé)
- **Prisma ORM**
- **PostgreSQL**
- **Redis**
- **JWT** (authentification)
- **Bcrypt** (hash passwords)
- **Socket.io** (WebSockets)
- **Express Rate Limit**

### DevOps
- **Docker** + **Docker Compose**
- **Git** (versioning)

### Tests
- **Jest** (unitaires)
- **Playwright** (E2E)

---

## 🔐 RÈGLES DE PERMISSIONS (RBAC)

### OWNER (Platform Owner)
- ✅ Voir toutes les entreprises
- ✅ Créer/supprimer entreprises
- ✅ Voir statistiques globales
- ✅ Gérer les utilisateurs platform

### COMPANY_ADMIN (Responsable Logistique)
- ✅ Voir livraisons de son entreprise
- ✅ Créer/modifier livraisons
- ✅ Gérer livreurs de son entreprise
- ✅ Voir statistiques de son entreprise
- ✅ Gérer entrepôts de son entreprise
- ❌ Voir données autres entreprises

### WAREHOUSE_AGENT (Entrepôt)
- ✅ Voir livraisons de son entrepôt
- ✅ Préparer livraisons (déduction stock)
- ✅ Gérer stock de son entrepôt
- ❌ Voir autres entrepôts

### DRIVER (Livreur)
- ✅ Voir ses livraisons assignées
- ✅ Mettre à jour statut livraison
- ✅ Marquer livraison comme livrée
- ❌ Voir livraisons autres livreurs

---

## 🎯 PRIORISATION DES TÂCHES

### Priorité 1 (MVP)
1. Migration Next.js 14 + App Router
2. Prisma + PostgreSQL + Docker
3. Authentification JWT + RBAC basique
4. Architecture multi-espaces
5. CRUD livraisons basique
6. Dashboard Company Admin

### Priorité 2 (Fonctionnalités clés)
7. Transactions stock (préparation livraison)
8. Dashboard Platform Owner
9. Gestion temps réel (WebSocket ou polling)
10. Formulaires complexes création livraison

### Priorité 3 (Améliorations)
11. 2FA
12. Statistiques avancées
13. Cache Redis
14. Rate limiting
15. Tests & Documentation complète

---

## 📝 NOTES IMPORTANTES

### Isolation des données
- **CRITIQUE** : Chaque requête doit filtrer par `companyId`
- Utiliser Prisma middleware pour injection automatique
- Vérifier dans chaque endpoint API

### Transactions
- Toujours utiliser `prisma.$transaction()` pour opérations critiques
- Gérer les rollbacks proprement
- Logs d'erreurs détaillés

### Performance
- Indexer les colonnes fréquemment queryées (`companyId`, `deliveryId`, `status`)
- Utiliser `select` Prisma pour limiter les champs
- Pagination systématique pour listes

### Sécurité
- Validation Zod sur toutes les entrées
- Rate limiting sur endpoints sensibles
- HTTPS en production
- Secrets dans variables d'environnement

---

## 🚀 COMMANDES DE DÉMARRAGE RAPIDE

```bash
# 1. Installation dépendances
npm install

# 2. Configuration environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Base de données
npx prisma migrate dev
npx prisma generate

# 4. Seed données
npm run seed

# 5. Démarrage Docker
docker-compose up -d

# 6. Développement
npm run dev
```

---

## ✅ CHECKLIST FINALE

Avant livraison, vérifier :
- [ ] Tous les espaces fonctionnent (/platform, /company, /driver, /warehouse)
- [ ] Authentification + 2FA opérationnels
- [ ] Isolation des données entre entreprises
- [ ] Transactions stock fonctionnent
- [ ] Temps réel opérationnel
- [ ] Docker démarre sans erreur
- [ ] Seed script fonctionne
- [ ] README complet et clair
- [ ] Pas d'erreurs de build
- [ ] Tests passent (si implémentés)

---

**Date de création :** $(date)
**Version :** 1.0
**Auteur :** Plan de développement SaaS Logistique
