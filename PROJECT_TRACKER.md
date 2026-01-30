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
- **Architecture & Dev Experience** :
    - [x] Correction Typescript (`req.user`) via `express-serve-static-core`.
    - [x] Configuration Database : Passage à PostgreSQL "External URL" pour le dev local (fix `PrismaClientInitializationError`).
    - [x] Prisma : Alignement des versions (Compatibilité Schema Postgres vs Client Sqlite résolue).
    - [x] Scripts : `check-users.ts` créé pour débogage rapide.

**État du projet** :
- Backend : **STABLE** et prêt pour la V1.1.
- Frontend : Connecté et fonctionnel.
- Base de données : Connectée et peuplée (Seed OK).
