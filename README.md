# 🕰️ Grimoire du Conteur — Blood on the Clocktower

Assistant web **pour le Conteur / Maître du Jeu (MJ)** afin d'animer des parties
**en présentiel** du jeu de déduction sociale *Blood on the Clocktower*.

Combine un **grimoire numérique** (cercle des joueurs, rôles, jetons de rappel, statuts)
et un **assistant d'animation** (ordre de nuit, aide au setup, suivi des votes).

- 🌍 **Bilingue** français (par défaut) / anglais, bascule à chaud.
- 📱 **PWA installable** et **fonctionne hors-ligne** (tablette, smartphone, laptop).
- 💾 Sauvegarde automatique de la partie dans le navigateur (`localStorage`).
- 🧩 **Import de scripts** au format JSON.
- 🗂️ 100 % statique : hébergeable sur **GitHub Pages** ou un hébergement mutualisé (PlanetHoster…).

> ⚠️ *Blood on the Clocktower* est une création de **The Pandemonium Institute**.
> Ce projet est un outil **non officiel**. Il n'inclut **aucun texte ni illustration officiels** :
> les descriptions de capacités sont **rédigées par ce projet** et les icônes sont maison.

## Fonctionnalités (Phase 1)

| Onglet | Contenu |
|---|---|
| **Grimoire** | Cercle des joueurs, attribution des rôles, vie/mort, vote de fantôme, statuts (empoisonné, ivre, protégé), jetons de rappel, tirage au sort, **glisser-déposer pour réordonner les sièges**. |
| **Nuit** | Ordre de nuit (1ʳᵉ nuit / nuits suivantes), filtré sur les rôles en jeu, cases à cocher, instructions du MJ, **bluffs suggérés pour le Démon** (personnages bons hors jeu). |
| **Jour** | Nominations, décompte des voix, seuil de majorité automatique, exécution, **minuteur de phase de jour** (presets 3/5/10 min + cloche). |
| **Setup** | Répartition Villageois / Étrangers / Sbires / Démon selon le nombre de joueurs. |
| **Personnages** | Référence complète du script (capacités, ordre de nuit). |
| **Scripts** | Choix du script, import JSON. |

Scripts inclus : les **3 scripts officiels** — **Trouble Brewing**, **Sects & Violets**, **Bad Moon Rising** (rôles + Voyageurs).
Autres options : **sons** (cloche synthétisée aux transitions nuit/jour et fin de minuteur, activable via 🔔).
À venir : Fabled, scripts personnalisés enrichis, glisser-déposer des jetons.

## Lancer en local

L'app charge ses données via `fetch()`, il faut donc un petit serveur HTTP
(l'ouverture directe du fichier `index.html` via `file://` ne fonctionnera pas).

```bash
# Python
python -m http.server 8000
# ou Node
npx serve .
```
Puis ouvrez http://localhost:8000

## Déploiement

### Option A — GitHub Pages (gratuit, déploiement auto)
1. Poussez ce dossier sur un dépôt GitHub.
2. *Settings → Pages → Source : Deploy from a branch → `main` / `root`*.
3. L'app est publiée sur `https://<utilisateur>.github.io/<dépôt>/`.

### Option B — PlanetHoster (ou tout hébergement mutualisé)
Copiez simplement tout le contenu du dossier dans le répertoire web
(`public_html/…`) via FTP ou Git. HTTPS requis pour le mode hors-ligne (PWA).

L'application étant **entièrement statique**, on peut passer de l'un à l'autre
sans modifier le code.

## Structure

```
blood-clocktower-mj/
├─ index.html
├─ manifest.webmanifest      # PWA
├─ sw.js                     # service worker (hors-ligne)
├─ css/theme.css             # thème gothique / horloge
├─ js/app.js                 # moteur applicatif
├─ data/
│  ├─ game.json              # équipes, table de setup, étapes de nuit
│  └─ scripts/
│     ├─ trouble-brewing.json
│     ├─ sects-and-violets.json
│     └─ bad-moon-rising.json
└─ assets/icons/             # icônes SVG maison
```

## Format de script (import)

Deux formats acceptés :
- **Format complet du projet** : `{ "meta": {...}, "characters": [{ id, name{fr,en}, team, ability{fr,en}, firstNight, otherNight, setup, reminders[] }] }`
- **Format officiel léger** : tableau d'IDs de rôles, ex. `[{ "id":"_meta", "name":"Mon script" }, "washerwoman", "imp", ...]` (les rôles connus reprennent leurs métadonnées).

## Licence

Code : à définir (MIT suggéré). Contenu de jeu : marques et univers *Blood on the
Clocktower* © The Pandemonium Institute — outil non officiel, sans assets officiels.
