# Mon Ecole - Plateforme de Communication Scolaire

Application monorepo (Client + Server) pour la gestion de communication entre l'école, les parents et les élèves.

## Structure du Projet

- **client/** : Frontend React (Vite + Tailwind + Shadcn/UI).
- **server/** : Backend Node.js (Express + Prisma + PostgreSQL).

## Pré-requis

- Node.js (v18+)
- PostgreSQL (via Render ou local)

## Installation Rapide

1.  **Installer les dépendances** (à la racine) :
    ```bash
    npm install
    ```
    *Cela installe automatiquement les dépendances du client et du serveur.*

2.  **Configuration Backend (.env)** :
    Créer un fichier `server/.env` avec les clés suivantes :
    ```env
    PORT=3000
    NODE_ENV=development
    # URL Externe Render (pour dev local)
    DATABASE_URL="postgres://..."
    JWT_SECRET="votre_secret_securise"
    CLIENT_URL="http://localhost:5173"
    ```

3.  **Lancer le projet (Dev)** :
    À la racine du projet :
    ```bash
    npm run dev
    ```
    *Lance simultanément le frontend (port 5173) et le backend (port 3000).*

## Gestion de la Base de Données

- **Mettre à jour le client Prisma** (après modif schéma) :
    ```bash
    cd server
    npm run build
    ```
- **Peupler la base de données** (Seed) :
    ```bash
    cd server
    npx prisma db seed
    ```

## Tests & Vérification

- **Vérifier les utilisateurs en base** :
    ```bash
    npx ts-node server/scripts/check-users.ts
    ```
- **Tester les accès (RBAC)** :
    ```bash
    npx ts-node server/scripts/test-access-control.ts
    ```
