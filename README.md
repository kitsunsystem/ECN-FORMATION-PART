# ECN Group — Espace Formation

Espace Formation officiel d'ECN Group, propulsé par LE CUBE Formations (162 formations, 12 catégories), sur son propre domaine (ecn-group-formation.com) avec **la même base Supabase** que ecn-group.com.

## Accès : uniquement via un compte ECN Group lié

Aucune page, feuille de style ni donnée n'est servie sans session (le Worker `src/worker.js` passe avant chaque fichier).

1. Le membre, connecté sur ecn-group.com (session validée par code e-mail), clique **Accéder au Portail de Formation**.
2. ecn-group.com (`/api/auth`, action `formation-ticket`) vérifie l'adhésion et crée un **ticket à usage unique, valable 2 minutes**. Seule son empreinte est stockée dans `formation_tickets`.
3. Le membre arrive sur `/auth/callback?t=…`. Le Worker consomme le ticket dans la base, enregistre `users.formation_linked_at` (compte lié) et ouvre une session par cookie signé (`HttpOnly`, `Secure`, 7 jours).
4. À chaque chargement de page, le pack est **relu dans la base** : une adhésion suspendue ou expirée coupe l'accès aussitôt.

Sans session, le visiteur voit `/connexion`. Le bouton « Se connecter avec ECN Group » le ramène ici après sa connexion sur ecn-group.com.

| `users.pack` (actif) | Accès Formation | Thème |
|---|---|---|
| `initie` | 22 formations de base, le reste verrouillé | Argent |
| `golden` | Les 162 formations | Or 24K |
| `fondateur` | Les 162 formations + « Avant-première » | Champagne |
| `porteur`, `none`, inactif, suspendu | Pas d'accès | — |

Les administrateurs ECN ont l'accès Fondateur. La liste des formations Initié se règle dans `public/data.js` (`i: 1`).

## Mise en production

1. **Supabase** : exécuter une fois `supabase_formation_2026_10_23.sql` (dans le repo ecn-groups).
2. **Cloudflare, Worker `ecn-formation-part`** → Settings → Variables and Secrets :
   - `SUPABASE_SERVICE_ROLE_KEY` (secret) : la même clé service que ecn-group.com
   - `SESSION_SECRET` (secret) : 32 caractères aléatoires ou plus, par exemple le résultat de `openssl rand -base64 48`
   - `SUPABASE_URL` (facultatif) : par défaut, le projet ECN actuel
3. **Domaine** : brancher ecn-group-formation.com sur le Worker (Settings → Domains & Routes).
4. **ecn-group.com (Pages)** : `FORMATION_URL` est facultatif (par défaut `https://ecn-group-formation.com`). À renseigner seulement si l'espace change de domaine.

Tant que les deux secrets manquent, l'espace reste fermé (page de connexion avec « en cours de configuration »).

## Développement local

Aperçu du design en mode démo (sans compte, sélecteur de pack visible) :

```bash
python -m http.server 5520 --directory public
```

Avec le Worker et la porte d'accès : créer un fichier `.dev.vars` (ignoré par git) avec les trois variables ci-dessus, puis lancer :

```bash
npx wrangler dev
```

## Stack

Cloudflare Worker + assets statiques (`public/`). Three.js 0.160, GSAP 3.12 (ScrollTrigger, Flip) et Lenis sont chargés depuis un CDN. Aucune étape de build.
La progression et les favoris sont enregistrés dans le navigateur, séparément pour chaque membre.

Visuels du catalogue © LE CUBE Formations.
