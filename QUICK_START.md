# 🚀 GUIDE DE DÉMARRAGE RAPIDE

## Vue d'ensemble

Ce guide vous permet de démarrer rapidement le développement de la plateforme SaaS de gestion logistique.

## 📚 Documents de référence

1. **PLAN_DEVELOPPEMENT.md** - Plan complet avec toutes les phases
2. **SCHEMA_PRISMA.md** - Schéma de base de données Prisma
3. **EXEMPLES_CODE.md** - Exemples de code pour l'implémentation
4. **SCRIPT_SEED.md** - Script de seed pour données de test

## 🎯 Ordre d'implémentation recommandé

### Étape 1 : Préparation (30 min)
```bash
# 1. Mettre à jour Next.js et dépendances
npm install next@latest react@latest react-dom@latest

# 2. Installer Prisma
npm install @prisma/client prisma
npm install -D @types/node

# 3. Installer dépendances backend
npm install bcryptjs jsonwebtoken zod
npm install -D @types/bcryptjs @types/jsonwebtoken

# 4. Installer dépendances frontend
npm install @tanstack/react-query zustand
npm install react-hook-form @hookform/resolvers

# 5. Installer Tailwind (si pas déjà présent)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Étape 2 : Base de données (1h)
```bash
# 1. Créer le schéma Prisma
# Copier le contenu de SCHEMA_PRISMA.md dans prisma/schema.prisma

# 2. Configurer .env
DATABASE_URL="postgresql://user:password@localhost:5432/logistics"
JWT_SECRET="your-secret-key-here"
REDIS_URL="redis://localhost:6379"

# 3. Créer la base de données
npx prisma migrate dev --name init

# 4. Générer le client Prisma
npx prisma generate
```

### Étape 3 : Docker (30 min)
```bash
# 1. Créer docker-compose.yml (voir EXEMPLES_CODE.md)

# 2. Démarrer les services
docker-compose up -d

# 3. Vérifier que tout fonctionne
docker-compose ps
```

### Étape 4 : Authentification (2h)
```bash
# 1. Créer la structure d'authentification
mkdir -p lib/auth
mkdir -p app/(auth)/login
mkdir -p app/(auth)/register

# 2. Implémenter JWT (voir EXEMPLES_CODE.md section 1)

# 3. Créer middleware.ts (voir EXEMPLES_CODE.md section 1)

# 4. Créer les pages de login/register
```

### Étape 5 : Architecture multi-espaces (2h)
```bash
# 1. Restructurer en App Router
mkdir -p app/(platform)
mkdir -p app/(company)
mkdir -p app/(driver)
mkdir -p app/(warehouse)

# 2. Créer les layouts pour chaque espace
# 3. Adapter la sidebar (voir PLAN_DEVELOPPEMENT.md phase 3)
```

### Étape 6 : API Routes (3h)
```bash
# 1. Créer les endpoints API
mkdir -p app/api/auth
mkdir -p app/api/company
mkdir -p app/api/platform
mkdir -p app/api/warehouse
mkdir -p app/api/driver

# 2. Implémenter les endpoints (voir EXEMPLES_CODE.md section 2)
# 3. Ajouter RBAC et isolation des données
```

### Étape 7 : Dashboards (4h)
```bash
# 1. Dashboard Platform Owner
# 2. Dashboard Company Admin
# 3. Dashboard Driver
# 4. Dashboard Warehouse
```

### Étape 8 : Fonctionnalités avancées (4h)
- Gestion temps réel (WebSocket ou polling)
- Formulaires complexes
- Transactions stock
- Statistiques

## 🔑 Points critiques à ne pas oublier

### ✅ Isolation des données
**TOUJOURS** filtrer par `companyId` dans chaque requête :
```typescript
const deliveries = await prisma.delivery.findMany({
  where: {
    companyId: userCompanyId, // CRITIQUE
  },
});
```

### ✅ Transactions atomiques
Utiliser `prisma.$transaction()` pour opérations critiques :
```typescript
await prisma.$transaction(async (tx) => {
  // Opérations atomiques
});
```

### ✅ Validation
Valider toutes les entrées avec Zod :
```typescript
const schema = z.object({ ... });
const data = schema.parse(requestBody);
```

### ✅ Permissions
Vérifier les permissions dans chaque endpoint :
```typescript
if (!canAccessCompany(role, companyId)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## 📝 Checklist par phase

### Phase 1 : Fondations
- [ ] Next.js 14+ installé
- [ ] Prisma configuré
- [ ] Docker fonctionne
- [ ] Base de données créée

### Phase 2 : Authentification
- [ ] JWT fonctionne
- [ ] Login/Register opérationnels
- [ ] Middleware protège les routes
- [ ] 2FA implémenté (optionnel MVP)

### Phase 3 : Multi-espaces
- [ ] Layouts créés pour chaque espace
- [ ] Navigation dynamique par rôle
- [ ] Guards d'accès fonctionnent

### Phase 4 : Backend
- [ ] API routes créées
- [ ] RBAC implémenté
- [ ] Isolation des données vérifiée
- [ ] Transactions fonctionnent

### Phase 5 : Frontend
- [ ] Dashboards créés
- [ ] Formulaires fonctionnent
- [ ] Temps réel opérationnel
- [ ] UX optimisée

## 🐛 Dépannage courant

### Erreur Prisma
```bash
# Régénérer le client
npx prisma generate

# Réinitialiser la base
npx prisma migrate reset
```

### Erreur Docker
```bash
# Redémarrer les services
docker-compose down
docker-compose up -d
```

### Erreur TypeScript
```bash
# Vérifier tsconfig.json
# Redémarrer le serveur de dev
```

## 📊 Métriques de progression

- **0-20%** : Fondations (Docker, Prisma, Auth)
- **20-40%** : Architecture (Multi-espaces, API)
- **40-60%** : Fonctionnalités (Dashboards, CRUD)
- **60-80%** : Avancé (Temps réel, Transactions)
- **80-100%** : Finalisation (Tests, Docs, Optimisations)

## 🎓 Ressources utiles

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Prisma Docs](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zod Validation](https://zod.dev/)

## 💡 Conseils

1. **Commencer simple** : Implémenter d'abord le MVP, puis ajouter les fonctionnalités avancées
2. **Tester régulièrement** : Vérifier que l'isolation des données fonctionne à chaque étape
3. **Documenter au fur et à mesure** : Noter les décisions techniques importantes
4. **Itérer rapidement** : Ne pas chercher la perfection dès le début

## 🚨 Points d'attention

- ⚠️ **Sécurité** : Ne jamais exposer les secrets dans le code
- ⚠️ **Performance** : Indexer les colonnes fréquemment queryées
- ⚠️ **Isolation** : Tester que les entreprises ne voient pas les données des autres
- ⚠️ **Transactions** : Toujours gérer les rollbacks en cas d'erreur

---

**Bon développement ! 🚀**

Pour toute question, référez-vous aux documents détaillés :
- `PLAN_DEVELOPPEMENT.md` pour la stratégie globale
- `EXEMPLES_CODE.md` pour les implémentations spécifiques
- `SCHEMA_PRISMA.md` pour la structure de données
