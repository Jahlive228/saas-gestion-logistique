# 🚀 Guide de Démarrage - Plateforme SaaS Logistique

## ✅ Ce qui a été configuré

### 1. **Authentification complète avec sessions et cookies**
- ✅ JWT avec tokens d'accès (15 min) et de rafraîchissement (7 jours)
- ✅ Gestion sécurisée des cookies (httpOnly, secure, sameSite)
- ✅ Refresh automatique des tokens
- ✅ Stockage des refresh tokens en base de données
- ✅ Middleware de protection des routes

### 2. **Base de données Prisma**
- ✅ Schéma complet avec tous les modèles
- ✅ Relations et contraintes configurées
- ✅ Isolation des données par entreprise

### 3. **Docker**
- ✅ PostgreSQL 16
- ✅ Redis 7
- ✅ Configuration docker-compose.yml

### 4. **API Routes**
- ✅ `/api/auth/login` - Connexion
- ✅ `/api/auth/register` - Inscription
- ✅ `/api/auth/logout` - Déconnexion
- ✅ `/api/auth/refresh` - Rafraîchissement de token

## 📋 Étapes pour démarrer

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer l'environnement

Copier `env.example` vers `.env` et remplir les variables :

```bash
cp env.example .env
```

Éditer `.env` :
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/logistics?schema=public"
JWT_SECRET="changez-moi-en-production"
JWT_REFRESH_SECRET="changez-moi-aussi-en-production"
REDIS_URL="redis://localhost:6379"
```

### 3. Démarrer Docker

```bash
docker-compose up -d
```

Vérifier que les services sont démarrés :
```bash
docker-compose ps
```

### 4. Initialiser la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Créer les migrations
npm run db:migrate

# (Optionnel) Ouvrir Prisma Studio pour voir la base
npm run db:studio
```

### 5. Seed les données de test

```bash
npm run db:seed
```

Cela créera :
- 1 Platform Owner : `owner@platform.com` / `owner123`
- 2 Entreprises avec admins, agents, entrepôts, produits, livreurs et livraisons

### 6. Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🔐 Gestion des sessions et cookies

### Comment ça fonctionne

1. **Login** : L'utilisateur se connecte via `/api/auth/login`
   - Le serveur génère un **access token** (15 min) et un **refresh token** (7 jours)
   - Les deux sont stockés dans des cookies **httpOnly** (sécurisés)
   - Le refresh token est aussi stocké en base de données

2. **Requêtes suivantes** : Le middleware vérifie automatiquement :
   - Si le token d'accès est valide → requête autorisée
   - Si le token est expiré mais le refresh token est valide → nouveau token généré automatiquement
   - Si les deux sont invalides → redirection vers `/login`

3. **Logout** : L'utilisateur se déconnecte via `/api/auth/logout`
   - Les cookies sont supprimés
   - Le refresh token est supprimé de la base de données

### Cookies créés

- `token` : Token d'accès JWT (httpOnly, 15 min)
- `refreshToken` : Token de rafraîchissement (httpOnly, 7 jours)
- `session` : Indicateur de session active (non httpOnly, pour vérification côté client, 15 min)

### Sécurité

- ✅ Cookies **httpOnly** : Non accessibles depuis JavaScript (protection XSS)
- ✅ Cookies **secure** en production : Envoyés uniquement en HTTPS
- ✅ **SameSite: lax** : Protection CSRF
- ✅ Tokens signés avec secret JWT
- ✅ Refresh tokens stockés en base avec expiration

## 📁 Structure des fichiers créés

```
lib/
├── auth/
│   ├── jwt.ts          # Génération et vérification JWT
│   ├── cookies.ts      # Gestion des cookies
│   ├── session.ts      # Gestion des sessions
│   └── password.ts     # Hash et vérification mots de passe
├── db/
│   └── prisma.ts       # Client Prisma singleton
└── permissions/
    └── check.ts        # Vérification des permissions RBAC

app/
└── api/
    └── auth/
        ├── login/route.ts
        ├── register/route.ts
        ├── logout/route.ts
        └── refresh/route.ts

prisma/
└── schema.prisma       # Schéma de base de données complet

middleware.ts           # Protection des routes et refresh automatique
```

## 🧪 Tester l'authentification

### Avec curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@platform.com","password":"owner123"}' \
  -c cookies.txt

# Le serveur retournera les cookies dans cookies.txt
```

### Avec Postman/Insomnia

1. Faire un POST sur `/api/auth/login` avec email/password
2. Les cookies seront automatiquement stockés
3. Les requêtes suivantes utiliseront automatiquement les cookies

## 🔄 Prochaines étapes

1. **Créer les pages de login/register** (frontend)
2. **Créer les layouts pour chaque espace** (/platform, /company, /driver, /warehouse)
3. **Implémenter les API routes métier** (livraisons, entrepôts, etc.)
4. **Créer les dashboards** par rôle

## 📚 Documentation

- Voir `PLAN_DEVELOPPEMENT.md` pour le plan complet
- Voir `EXEMPLES_CODE.md` pour des exemples d'implémentation
- Voir `SCHEMA_PRISMA.md` pour le schéma de base de données

## ⚠️ Notes importantes

- **JWT_SECRET** et **JWT_REFRESH_SECRET** doivent être changés en production
- Les cookies sont sécurisés automatiquement en production (HTTPS requis)
- Le middleware rafraîchit automatiquement les tokens expirés
- Les refresh tokens expirés sont automatiquement nettoyés

## 🐛 Dépannage

### Erreur "Prisma Client not generated"
```bash
npm run db:generate
```

### Erreur de connexion à la base
Vérifier que Docker est démarré :
```bash
docker-compose ps
docker-compose logs postgres
```

### Erreur "Invalid token"
- Vérifier que JWT_SECRET est défini dans `.env`
- Vérifier que les cookies sont bien envoyés dans les requêtes

---

**Bon développement ! 🚀**
