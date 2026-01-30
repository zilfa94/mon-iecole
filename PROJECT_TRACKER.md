## 0) Résumé (à jour)
- Statut actuel : **Candidate V1.0 ✅** (Code Frozen)
- Prochaine étape : Démo / Déploiement ou V1.1
- Dernier update : 2026-01-30

## 4) Journal d’avancement

### 2026-01-30 (Fin de Session)
✅ **MVP MESSAGERIE COMPLET**
- Threads, Messages, RBAC, Polling, UI Polish terminés.
- Validation utilisateur reçue.

🔒 **DÉCISION : CODE FREEZE CANDIDATE V1.0**
- Le périmètre MVP est considéré comme terminés.
- Les fonctionnalités suivantes sont reportées en V1.1.

### Roadmap V1.1 (Post-MVP)
- Compteurs de messages non-lus (Badge UI)
- Gestion fine Professeurs -> Classes (Filtrage élèves)
- Upload de fichiers/photos dans les messages
- Notifications Email

### 2026-01-29
✅ Fait :
- Vision produit définie
- Scope MVP verrouillé
- Schéma de navigation validé
- Architecture & modèle de données validés
- ✅ Setup technique stabilisé (TS Config + Seed Idempotent)

➡️ Next :
- Implémenter l'authentification (Login/Register)
- Créer les premiers endpoints API
### 2026-01-29
✅ Fait :
- Runtime validation mise en place (shared.ts : USER_ROLES/POST_TYPES + isUserRole/isPostType)
- Auth strict : JWT cookie HttpOnly + /me + requireAuth avec lookup DB + isActive
- Admin users (DIRECTION only) : POST/GET/PATCH /api/users + validation role (400 si invalide)
- Posts : POST/GET /api/posts + validation type (400 si invalide), parents exclus de la création
- Tests validation : 7/7 OK (dont vérif absence /register)

⚠️ À clarifier :
- API Threads : routes listées uniquement /api/threads/:id et /api/threads/:id/messages ; vérifier si /api/threads (list) et POST /api/threads (create) existent ou sont planifiées.


### 2026-01-30
✅ Fait :
- Frontend : Réparé configuration Tailwind CSS et serveurs de développement
- Backend : Ajouté configuration CORS pour permettre communication avec frontend
- Frontend : Page Login fonctionnelle avec gestion erreurs
- Frontend : Fix bug Toast "undefined" (mise à jour middleware auth backend)
- Frontend : Feed fonctionnel (lecture + création posts)
- Frontend : Permissions respectées (Parent voit mais ne crée pas, Student/Prof/Direction créent)
- Tests : Validation E2E manuelle OK (Login Direction/Student/Parent + Création Post)
- Page "Épinglés" : Backend RESTRICTED PATCH /pin + Frontend Logic
- **Page "Messages"** :
    - [x] Backend : Endpoints Threads/Messages + RBAC strict (Direction -> Parent OK)
    - [x] Frontend : Liste, Détail, Envoi, Création Modal
    - [x] Polling : Mises à jour temps réel (3s/5s) + Smart Scroll
    - [x] UI Polish : Empty states, Skeletons, Previews
- **Décision** : Compteurs non-lus reportés à la V1.1.

➡️ Next :
- Améliorations UI/UX (Responsive, final checks)
- Logique Professeurs -> Classes (actuellement Prof voit tous les élèves)
- Préparation Démo / Déploiement

### 2026-01-30 (Backend Stabilization & Fixes)
✅ **Fait : Mise à niveau Critique du Backend**
- **Auth & Sécurité** :
    - [x] Correction de l'erreur "Invalid Token" (alignement JWT_SECRET env/scripts).
    - [x] Validation RBAC stricte vérifiée par tests automatisés (`test-access-control.ts` all PASS).
    - [x] "User not found" résolu (Database seeding validé).
    - [x] **Fix Logout** : Ajout de la route POST `/api/auth/logout` pour nettoyer le cookie HttpOnly (fix 404 Netlify).
    - [x] **Performance** : Migration Base de données vers Oregon (US West) pour colocalisation avec le serveur (Latence réduite).
- **Architecture & Dev Experience** :
    - [x] Correction Typescript (`req.user`) via `express-serve-static-core`.
    - [x] Configuration Database : Passage à PostgreSQL "External URL" pour le dev local (fix `PrismaClientInitializationError`).
    - [x] Prisma : Alignement des versions (Compatibilité Schema Postgres vs Client Sqlite résolue).
    - [x] Scripts : `check-users.ts` créé pour débogage rapide.

**État du projet** :
- Backend : **STABLE** et prêt pour la V1.1.
- Frontend : Connecté et fonctionnel.
- Base de données : Connectée et peuplée (Seed OK).

### 2026-01-30 (Backend - Unread Badges Logic)
✅ **Fait : Validation Logique Non-lus**
- [x] Script `test-unread.ts` réparé (Import UserRole corrigé).
- [x] Validation logique backend : Le comptage des messages non-lus fonctionne correctement via Prisma.
- [x] Implémentation Frontend : Badges UI déjà présents (Sidebar + Threads).

### 2026-01-30 (Feature - File Uploads)
✅ **Fait : Upload de Fichiers (Cloudinary) - COMPLET**
- [x] **Backend** :
    - Middleware Multer (memoryStorage) + Streamifier pour upload direct vers Cloudinary
    - Configuration Cloudinary avec variables d'environnement (CLOUD_NAME, API_KEY, API_SECRET)
    - Génération automatique de `public_id` unique pour chaque fichier
    - Route `POST /threads/:id/messages` avec support multipart/form-data
    - Création automatique d'enregistrements `Attachment` liés aux messages
- [x] **Frontend** :
    - UI de sélection de fichiers (max 5 fichiers, 5MB chacun)
    - Prévisualisation des fichiers avant envoi
    - Validation côté client (taille, nombre de fichiers)
    - Affichage des pièces jointes dans les messages
- [x] **Déploiement & Debugging** :
    - Fix route manquante `POST /threads` pour création de conversations
    - Fix erreur Cloudinary "Missing required parameter - public_id"
    - Fix erreur TypeScript sur Render (annotation de type explicite)
    - Fix dépendances : Déplacement `@types/multer` et `@types/streamifier` vers `dependencies`
    - Configuration variables d'environnement Cloudinary sur Render
- [x] **Tests** :
    - Script `test-upload.ts` validé (Upload Cloudinary + DB Insert OK)
    - Tests manuels en production réussis
- **Statut** : ✅ Feature complète et déployée en production

### 2026-01-30 (Feature - Posts Feed Enhancements)
✅ **Fait : Améliorations du Fil d'Actualités - COMPLET**
- [x] **Backend** :
    - Modèle `PostAttachment` ajouté au schéma Prisma (url, filename, mimeType, size)
    - Contrôleur `createPost` mis à jour pour gérer les fichiers uploadés
    - Endpoint `POST /posts/:id/comments` pour créer des commentaires
    - Inclusion des attachments et comments dans `listPosts`
    - Réutilisation du middleware upload existant (Multer + Cloudinary)
- [x] **Frontend** :
    - `CreatePostForm` : UI de sélection de fichiers (max 5, 5MB chacun)
    - `useCreatePost` : Conversion vers FormData pour upload multipart
    - `CommentSection` : Nouveau composant pour afficher/ajouter des commentaires
    - `PostCard` : Affichage des pièces jointes (images/PDFs) et intégration des commentaires
    - Types TypeScript mis à jour (Post avec attachments et comments)
- [x] **Polling Temps Réel** :
    - `usePosts` : Ajout de `refetchInterval: 5000` (rafraîchissement toutes les 5 secondes)
    - Mises à jour automatiques du feed sans rechargement manuel
- [x] **Tests** :
    - Validation upload de fichiers dans les posts
    - Test système de commentaires (création, affichage)
    - Vérification polling multi-fenêtres
- **Statut** : ✅ Feature complète et déployée en production (commit cdf85a5)

### 2026-01-30 (Phase 1 Optimizations & Fixes)
✅ **Fait : Optimisations Performance & UX - COMPLET**
- [x] **Lazy Loading** : Images chargés à la demande (`loading="lazy"`).
- [x] **Pagination** :
    - Backend : `listPosts` accepte `page`/`limit`.
    - Frontend : Chargement par lots de 20 posts + bouton "Charger plus".
    - Performance : Chargement initial ultra-rapide.
- [x] **Édition/Suppression** :
    - UI complète (Menu 3 points) pour auteurs et Direction.
    - Endpoints sécurisés `PATCH /posts/:id` et `DELETE /posts/:id`.
- [x] **Optimistic Updates** :
    - Création de post instantanée (Zéro latence perçue).
    - Rollback automatique en cas d'erreur.
- [x] **Bug Fixes Critiques** :
    - Fix `TypeError: is not iterable` (Pagination & Optimistic Updates).
    - Sécurisation des accès aux tableaux (`?.`, `Array.isArray`).
    - Fix Linting (`unused variable`).

- **Statut** : ✅ Phase 1 terminée et stable en production.

---

## 🎉 MVP COMPLET

Toutes les fonctionnalités principales sont implémentées et déployées :
- ✅ **Authentification** : JWT avec cookies HttpOnly, RBAC
- ✅ **Messagerie** : Threads, messages, pièces jointes, badges non-lus
- ✅ **Fil d'Actualités** : Posts, commentaires, uploads, polling temps réel
- ✅ **Gestion Classes** : Filtrage par classe, permissions par rôle

