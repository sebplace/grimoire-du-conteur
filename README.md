# 🕰️ Grimoire du Conteur — Blood on the Clocktower

🇫🇷 **Français** · [🇬🇧 English](README.en.md)

Assistant web (PWA) **pour le Conteur / Maître du Jeu** afin d'animer des parties
**en présentiel** du jeu de déduction sociale *Blood on the Clocktower*.

**➡️ App en ligne : https://sebplace.github.io/grimoire-du-conteur/**
· 📖 **[Mode d'emploi](guide.html)** (bilingue, imprimable)

> ⚠️ Projet **non officiel**. Aucun texte ni illustration officiels : les descriptions de
> capacités sont reformulées et les emblèmes sont générés par l'app.
> *Blood on the Clocktower* © **The Pandemonium Institute**.

## Ce que ça fait

Combine un **grimoire numérique complet** et un **assistant d'animation** : composez le sac,
distribuez les rôles, suivez l'ordre de nuit, gérez les votes — le tout suivi automatiquement.

- 🌍 **Bilingue** FR / EN, bascule à chaud
- 📱 **PWA installable** et **100 % hors-ligne**
- 💾 Sauvegarde automatique + parties nommées + export/import JSON
- 🔒 Aucune donnée en ligne (tout reste sur l'appareil)

## Fonctionnalités

| Onglet | Contenu |
|---|---|
| **Grimoire** | Cercle des joueurs, rôles (emblèmes uniques), vie/mort, vote de fantôme, statuts, jetons de rappel, **glisser-déposer** (sièges & jetons), **appui long** (actions rapides), alignement, **revendications**, **drapeaux de nomination**, zoom, annuler/rétablir. |
| **Nuit** | Ordre de nuit filtré, **cibles interactives** (pose auto des jetons), **calculateur d'infos** (conscient ivre/empoisonné), **bluffs du Démon** verrouillables, réordonnancement manuel. |
| **Jour** | Nominations, **historique de vote** (votants + votes de fantôme), majorité auto, **minuteur**, **barre de vote**, exécution, détection de fin de partie. |
| **Setup** | **Constructeur de sac** + modificateurs auto (Baron, Fang Gu…) + **validation** + distribution. |
| **Personnages** | Référence complète + **interactions (jinx)** + recherche. |
| **Scripts** | 3 scripts officiels + **import de n'importe quel script** clocktower.online (base de 143 rôles). |

**Outils** : 👁 révélation privée des rôles · 🕶️ écran de confidentialité · 📜 journal ·
📸 captures par nuit · 📝 bloc-notes · 📖 glossaire/règles · 🖨 impression · ⚙ réglages
(écran allumé, plein écran, vibrations, volume, ambiance sonore, thème clair, accent).

Scripts inclus : **Trouble Brewing**, **Sects & Violets**, **Bad Moon Rising** + base de
**143 rôles** (FR/EN) pour les scripts personnalisés. Thème gothique/horloge, police Cinzel.

## Lancer en local

L'app charge ses données via `fetch()`, il faut donc un petit serveur HTTP
(ouvrir `index.html` en `file://` ne fonctionne pas).

```bash
python -m http.server 8000   # ou : npx serve .
```
Puis ouvrez http://localhost:8000

## Déploiement

- **GitHub Pages** (gratuit, auto) : *Settings → Pages → branche `main` / racine*.
- **Hébergement mutualisé** (PlanetHoster…) : copiez tout le dossier dans le répertoire web (HTTPS requis pour le hors-ligne).

L'app étant **100 % statique**, on passe de l'un à l'autre sans changer le code.

## Structure

```
blood-clocktower-mj/
├─ index.html            # l'application
├─ guide.html            # mode d'emploi bilingue (imprimable)
├─ manifest.webmanifest  # PWA
├─ sw.js                 # service worker (hors-ligne)
├─ css/theme.css
├─ js/app.js
├─ data/
│  ├─ game.json          # équipes, table de setup, étapes de nuit
│  ├─ all-roles.json     # base de 143 rôles (FR/EN + jinxes)
│  └─ scripts/           # trouble-brewing, sects-and-violets, bad-moon-rising
└─ assets/               # icônes SVG + police Cinzel (OFL)
```

## Crédits & licence

- Code : à définir (MIT suggéré).
- Univers & marque : *Blood on the Clocktower* © The Pandemonium Institute — outil non officiel.
- Traductions FR de référence : [bambipotato/botc-fr-bambi](https://github.com/bambipotato/botc-fr-bambi).
- Métadonnées d'ordre de nuit : projet communautaire bra1n/townsquare.
- Police [Cinzel](https://fonts.google.com/specimen/Cinzel) (SIL Open Font License).
