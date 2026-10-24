# ECN Group — Espace Formation

Espace Formation officiel d'ECN Group, propulsé par LE CUBE Formations (162 formations, 12 catégories), sur son propre domaine (ecn-group-formation.com) avec **la même base Supabase** que ecn-group.com.

## Accès : uniquement via un compte ECN Group lié

Aucune page, feuille de style ni donnée n'est servie sans session (le Worker `src/worker.js` passe avant chaque fichier).

1. Le membre, connecté sur ecn-group.com (session validée par code e-mail), clique **Accéder au Portail de Formation**.
2. ecn-group.com (`/api/auth`, action `formation-ticket`) vérifie l'adhésion et crée un **ticket à usage unique, valable 2 minutes**. Seule son empreinte est stockée dans `formation_tickets`.
3. Le membre arrive sur `/auth/callback?t=…`. Le Worker consomme le ticket dans la base, enregistre `users.formation_linked_at` (compte lié) et ouvre une session par cookie signé (`HttpOnly`, `Secure`, 7 jours).
4. À chaque chargement de page, le pack est **relu dans la base** : une adhésion suspendue ou expirée coupe l'accès aussitôt.

**Première entrée** : tant que le membre n'a pas associé son compte formation, un écran l'invite à créer ce compte via le lien d'inscription partenaire, puis à saisir l'e-mail utilisé. Le Worker l'enregistre dans `users.formation_lecube_email` (`POST /api/lecube-email`), et cet e-mail s'affiche dans le profil, en haut à droite. Il est modifiable depuis le profil.

Sans session, le visiteur voit `/connexion`. Le bouton « Se connecter avec ECN Group » le ramène ici après sa connexion sur ecn-group.com.

| `users.pack` (actif) | Formations LE CUBE (162) | Formations ECN Membre | Thème |
|---|---|---|---|
| `initie` | Toutes | Aperçu verrouillé | Argent |
| `golden` | Toutes | Accès | Or 24K |
| `fondateur` | Toutes | Accès | Champagne |
| `porteur`, `none`, inactif, suspendu | Pas d'accès à l'espace | — | — |

Les administrateurs ECN ont l'accès Fondateur.

## Contenus

- **Formations LE CUBE** (`public/data.js`, `ECN_COURSES`) : snapshot du catalogue de l'espace membre lecube.biz. Chaque carte ouvre la formation sur lecube.biz (nouvel onglet). Le membre s'y connecte avec ses identifiants LE CUBE, qui gère la progression et les attestations.
- **Formations ECN Membre** (`public/data.js`, `ECN_MEMBRE_FORMATIONS`) : section « En construction » tant que la liste est vide. Pour ajouter une formation :

```js
window.ECN_MEMBRE_FORMATIONS = [
  { t: 'Titre', c: 'Thème', d: '2h', l: 'Débutant', img: 'assets/ecn/visuel.webp', u: 'https://lien-de-la-formation' }
];
```

Sans `u`, la carte affiche « bientôt disponible ». Les Initiés voient ces formations verrouillées, et un clic leur propose de passer Membre.

## ECN Formation Kids

Espace à part (`public/kids.html`, `kids.css`, `kids.js`), réservé aux enfants des membres et accessible avec la session du parent (même contrôle d'accès que l'accueil). Quatre mondes par âge : dès 8, 10, 12 et 16 ans. On y arrive depuis le menu « ECN Kids », la carte de l'accueil ou le profil. Depuis ecn-group.com, il suffit d'ajouter `&next=kids` au lien d'entrée.

Formations dans `public/kids-data.js`. Un monde sans formation affiche « bientôt ».

```js
window.ECN_KIDS_FORMATIONS = [
  { age: 8, t: 'Titre', d: '30 min', img: 'assets/kids/visuel.webp', u: 'https://lien-de-la-formation', desc: 'Résumé court' }
];
```

## Mise en production

1. **Supabase** : exécuter une fois `supabase_formation_2026_10_23.sql`, puis `supabase_formation_compte_2026_10_23.sql` (dans le repo ecn-groups). Sans le second fichier, le site reste accessible, mais l'e-mail du compte formation ne peut pas être enregistré.
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
Les favoris et l'historique « Récemment consultées » sont enregistrés dans le navigateur, séparément pour chaque membre.

Visuels du catalogue © LE CUBE Formations.
