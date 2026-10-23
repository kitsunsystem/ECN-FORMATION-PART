# ECN Group — Espace Formation (maquette démo)

Maquette interactive de l'espace Formation d'ECN Group, propulsé par LE CUBE Formations (162 formations, 12 catégories).

## Accès par pack

Le sélecteur **Démo** en haut à droite simule le pack du membre :

| Pack | Accès | Thème |
|------|-------|-------|
| **Initié** | 22 formations de base, le reste est visible mais verrouillé, avec une invitation à passer Membre | Argent sobre, objet 3D filaire |
| **Membre** (Golden Card) | Les 162 formations | Or 24K, nœud d'or liquide 3D, bloom |
| **Cercle Fondateur** | Les 162 formations, plus le badge « Avant-première » | Champagne et platine, gemme 3D en orbite |

La liste des formations Initié se règle dans `data.js` (`i: 1`).

## Contenu

- Tableau de bord : hero 3D, carte de pass holographique, statistiques, catégories, reprise des formations en cours
- Catalogue : filtres par catégorie, niveau, durée et tri, recherche, animations Flip
- Fiche formation : ouverture plein écran depuis la carte, onglets À propos / Contenu / Avis, programme réel pour la formation Outlook
- Lecteur : chapitre, progression et validation (la progression est enregistrée dans le navigateur)
- Favoris, Aide & support (FAQ), modale de comparaison des packs

## Lancer en local

Les modules ES exigent un serveur HTTP (un double-clic sur `index.html` ne suffit pas) :

```bash
python -m http.server 5520
```

Puis ouvrir http://localhost:5520.

## Mettre en ligne

Site 100 % statique : GitHub Pages (Settings → Pages → branche `main`, dossier `/`) ou Cloudflare Pages, comme le site principal.

## Stack

Three.js 0.160 (scène 3D + bloom), GSAP 3.12 (ScrollTrigger, Flip), Lenis (défilement fluide), chargés depuis un CDN. Aucune étape de build.
Les animations respectent `prefers-reduced-motion` ; sans WebGL, la page fonctionne sans le fond 3D.

Visuels du catalogue © LE CUBE Formations.
