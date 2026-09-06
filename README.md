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

Un **grimoire numérique** et un **assistant d'animation** : composez le sac, distribuez les
rôles, suivez la nuit et consignez les votes. Le Conteur arbitre les capacités, les morts,
les exceptions et la fin de partie. Ce n'est pas un moteur complet des règles.

- 🌍 **Français par défaut**, anglais disponible à tout moment
- 📱 **PWA**, installation selon le navigateur, hors ligne après confirmation du cache complet
- 💾 Sauvegarde automatique, parties nommées, jusqu'à huit copies de sécurité selon l'espace disponible et export/import JSON
- 🔒 Données de partie locales, sans synchronisation serveur

## Fonctionnalités

| Onglet | Contenu |
|---|---|
| **Grimoire** | Cercle ou **Liste MJ**, tous deux privés. Rôle réel et personnage montré distincts, vie/mort, vote fantôme, alignement, revendications, rappels avec source et durée, annuler/rétablir. |
| **Nuit** | **Tout voir** ou **Guidé** avec étape mémorisée, cibles individuelles ou par paire, suggestions d'information, trois bluffs valides en privé et actions à revoir avant la transition. |
| **Jour** | Nominations par identité de joueur, seuil conservé, votants et votes fantômes suivis, minuteur à échéance, exécution distincte de la mort, exil des Voyageurs, rapport d'aube et suggestion de fin à arbitrer. |
| **Setup** | Constructeur de sac, modificateurs pris en charge, contrôle de composition et **Vérifications de préparation**. Les exceptions restent à examiner. |
| **Personnages** | Référence consultable indépendamment du script actif, capacités reformulées, recherche et jinx. |
| **Scripts** | Trois scripts inclus, bibliothèque personnalisée et import JSON validé. Activer un script est une action séparée, avec confirmation et sauvegarde. |

**Outils** : sur téléphone, un panneau inférieur avec libellés remplace le dock latéral.
Il donne accès notamment au **Carnet d'informations** par joueur et par phase, aux
**Messages privés**, à la **Distribution privée des rôles**, aux **Groupes et sacs**,
aux **Exercices guidés**, aux sauvegardes, au mode Table public, au journal et aux
comparaisons de captures, ainsi qu'au verrou, aux notes, au guide et à l'impression.
La palette de commandes reste accessible avec Ctrl+K. Les réglages de confort dépendent
des capacités du navigateur. Les vues et fenêtres conservent leur focus et leur position
de défilement ; les mises à jour du minuteur et des votes évitent un rechargement complet.

Scripts inclus : **Trouble Brewing**, **Sects & Violets**, **Bad Moon Rising** + base de
**143 rôles** (FR/EN) pour les scripts personnalisés. Thème gothique/horloge, police Cinzel.

## Arbitrage et confidentialité

- **Ivrogne et Lunatique** : le rôle réel (`roleId`) reste distinct du personnage cru
  (`shownRoleId`). « En réalité l'Ivrogne » convertit un Villageois en Marginal et garde
  le Villageois montré. L'Ivrogne n'est pas un simple statut temporaire.
  L'étape de nuit du vrai Lunatique reste distincte de celle du Démon montré ;
  le Conteur gère toujours la transmission de ses choix.
- **Effets** : chaque rappel a une source joueur/personnage, une cible et une durée
  (manuelle, prochaine aube ou prochain crépuscule). Déplacer ou retirer un rappel
  recalcule les statuts sans supprimer les autres sources. Une note libre ne crée aucun
  effet par son vocabulaire. Les statuts manuels sont distincts des effets.
- **Choix de nuit** : la fenêtre propose source, jeton, effet et durée. Vous pouvez
  **Noter le choix sans effet**. Une source ivre ou empoisonnée ne peut pas appliquer
  son effet, mais son choix peut être consigné. Les morts sont confirmées par le MJ :
  une protection n'empêche pas universellement toute cause de mort.
- **Informations** : les calculs sont des suggestions, jamais une vérité garantie.
  Ils prennent en compte l'alignement enregistré ; les paires de candidats restent
  stables pour une même nuit. Un joueur ivre ou empoisonné peut recevoir une information
  correcte **ou** incorrecte. Le Conteur décide et consigne ce qu'il communique.
- **Écran joueur** : nombre, deux personnages, alignement ou texte choisi uniquement,
  avec enregistrement dans le carnet. Les bluffs s'affichent seulement si trois choix
  distincts sont valides. Masquer l'information mène à un écran neutre ; seul
  **Retour au Conteur** réaffiche l'interface privée. Le mode Table utilise aussi ce
  parcours pour ses compteurs et son minuteur publics.
- **Distribution privée des rôles** : le personnage cru est montré à chaque joueur
  après votre confirmation. Le suivi Déjà montré / À montrer est individuel et devient
  caduc si le rôle change. Après l'écran neutre et le retour MJ, sélectionnez et confirmez
  le joueur suivant ; son rôle ne s'affiche jamais automatiquement.
- **Choisir deux cibles** : sélectionnez deux sièges distincts pour Lavandière,
  Archiviste, Détective ou Voyante. La paire de rappels et l'information choisie sont
  enregistrées ensemble, en une action. Seule la paire de cette source est remplacée.
  Les rappels sont descriptifs : ni vérité ni capacité ne sont décidées automatiquement.
- **Capacité** : suivi manuel Disponible / Utilisée / Utilisée sans effet, y compris
  lorsque le joueur est affecté. Changer son rôle réel réinitialise ce suivi.
- **Préparation** : vérifiez attribution, personnage montré à l'Ivrogne, bluffs pour au
  moins sept joueurs hors Voyageurs, Leurre de la Voyante, paire Villageois / Erroné
  de la Lavandière, autres instructions et jinx. Ces contrôles ne certifient pas toutes les règles.
- **Effectifs** : les compteurs vivants/morts et le seuil d'exécution incluent les
  Voyageurs participants, mais excluent les Légendaires et les joueurs exilés.
  La composition de base exclut les Voyageurs, avec jusqu'à 15 joueurs de base ;
  ajoutez les Voyageurs séparément.
- **Nominations** : un vivant nomine une fois par jour ; chaque non-Voyageur peut être
  nominé une fois par jour, même mort. Le seuil est enregistré au début du vote. Seul
  le meilleur total admissible sans égalité désigne le joueur sur le billot.
  Retirer un votant fantôme restitue son vote si cette nomination l'avait consommé.
  Passer au comptage manuel demande confirmation, efface les votants détaillés et
  restitue leurs votes fantômes ; leur suivi devient alors manuel.
- **Exécution et fin** : une exécution quotidienne est suivie même si l'exécuté survit.
  Une exécution exceptionnelle demande un motif explicite. La première nomination
  de la Vierge est suivie pour la partie, pas réarmée chaque jour. Aucune suggestion
  de fin ne déclenche seule une victoire : vérifiez succession du Démon, Femme écarlate,
  Mastermind et conditions alternatives, puis confirmez le vainqueur.
- **Actions à revoir** : avant une transition, examinez les étapes de nuit pertinentes
  non cochées, attaques enregistrées non arbitrées, changements de rôle non annoncés et
  candidat à l'exécution. Résolvez avec un motif, ou continuez malgré les actions avec
  un motif. Cela n'applique aucun effet ni mort ; ce n'est pas un verrou de règles.
- **Minuteur** : une échéance horodatée tient compte du temps passé en arrière-plan
  et après rechargement. Un ancien minuteur sans échéance est repris en pause.
  Importer une partie ou annuler une action met aussi le minuteur en pause.

## Sauvegardes, scripts et hors ligne

Les opérations qui remplacent des données (nouvelle partie, réinitialisation, effacement
ou attribution aléatoire des rôles, distribution, activation/import de script, import ou
chargement de partie) créent une copie préalable. **Outils → Sauvegardes de sécurité**
conserve **jusqu'à huit copies**, dans la limite du budget de stockage. Les anciennes
copies peuvent être supprimées pour respecter le quota. Ces copies préservent l'état de
jeu, le journal et les définitions personnalisées, mais pas les piles Annuler/Rétablir.
Exportez aussi en JSON : les copies locales ne protègent pas contre la suppression des
données du navigateur. Les exports incluent les définitions des scripts personnalisés.

L'historique d'annulation de la partie courante est limité à **50 étapes** et à
**250 000 caractères** ; il peut donc conserver moins de 50 étapes. Cette limite concerne
l'annulation, pas l'état de jeu actuel, le journal ou les définitions personnalisées.

Les **captures** sont des états figés pris avant chaque passage nuit/jour et jour/nuit,
ou manuellement. Elles conservent personnages réels et montrés, alignement, statuts,
rappels avec source, vote fantôme, exil, usage de capacité et nominations.
**Comparer les captures**, privé et en lecture seule, confronte deux captures, ou une
capture et l'état courant figé à l'ouverture. Les sélections suivent l'ordre chronologique.
Les anciennes captures incomplètes sont signalées comme partielles, sans inventer les
champs absents. Conservation limitée à **40 captures et 500 000 caractères**, donc
éventuellement moins de captures ; elles ne remplacent pas un export de sécurité.

Un seul onglet édite la vraie partie. La protection utilise `navigator.locks` quand
disponible, compare la sauvegarde stockée et surveille les changements de stockage.
En cas de conflit, exportez votre état, rechargez ou utilisez l'entraînement isolé.
Une sauvegarde illisible n'est pas écrasée : l'écran de récupération propose son export brut.

Un import de script ajoute à la bibliothèque sans l'activer. Les identifiants inconnus,
doublons et définitions incomplètes sont refusés. Une définition personnalisée complète
doit notamment fournir `name`, `team`, `ability`, `firstNight`, `otherNight` et `reminders`.
L'activation confirmée sauvegarde puis réinitialise la partie en conservant les noms des joueurs.

Attendez **Prêt hors ligne**, après mise en cache de tous les fichiers requis, avant de
couper la connexion. Le bandeau indique la version ; **Mise à jour disponible** ne
l'applique qu'à votre demande, de préférence entre deux parties. Les icônes PNG sont
fournies pour la PWA. L'installation directe dépend du navigateur ; sur iOS, utilisez
Safari → Partager → Sur l'écran d'accueil.

## Réutiliser une préparation

**Outils → Groupes et sacs** sépare deux types de modèles. Un **groupe** ne conserve
que les noms et l'ordre des sièges, jamais rôles, effets ou notes. Le charger confirme
et sauvegarde le remplacement de la partie par des joueurs neufs, en gardant vos
préférences et le script actif. Un **sac** conserve les identifiants de rôles et son script, avec la
définition personnalisée si nécessaire, mais aucune attribution aux joueurs.
Le charger remplace seulement le sac de Setup ; il exige le script correspondant
et ne l'active ni ne distribue les rôles automatiquement. Les modèles utilisés en
entraînement restent séparés de ceux de la vraie partie.
La bibliothèque est limitée à **100 modèles et 4 Mo** ; dépasser une limite affiche
une erreur, sans supprimer automatiquement d'anciens modèles.

## Entraînement sans toucher à la vraie partie

Le bouton de la [section 14 du guide](guide.html#testgame) ouvre un nouvel entraînement
Trouble Brewing à sept joueurs dans le même onglet. Il utilise `sessionStorage`,
survit à un rechargement de cet onglet et laisse la vraie partie en `localStorage` intacte.
Vérifiez le bandeau **Entraînement : vraie partie intacte**, puis utilisez
**Revenir à la vraie partie** pour sortir.

Le parcours exerce révélations, informations, effets, votes fantômes, exécution avec
survie et décision de fin. Convertir le Cuisinier de cette démo en Ivrogne rend sa
répartition invalide : c'est un exercice de manipulation, pas une composition légale
à jouer telle quelle. Réussir ce parcours ne certifie ni toutes les fonctions ni
votre préparation aux règles.

**Outils → Exercices guidés** propose six objectifs isolés : égalité au vote,
vote fantôme d'un mort, Moine ivre, Lunatique, survie à l'exécution et paire de cibles.
Chaque exercice affiche sa consigne, son résultat attendu et une vérification ciblée,
avec possibilité de recommencer. Ces vérifications ne certifient pas toutes les règles
ni l'exactitude d'une information choisie par le Conteur.

## Lancer en local

L'app charge ses données via `fetch()`, il faut donc un petit serveur HTTP
(ouvrir `index.html` en `file://` ne fonctionne pas).

```bash
python -m http.server 8000   # ou : npx serve .
```
Puis ouvrez http://localhost:8000

## Vérifications de développement

Depuis le dossier du projet, le lanceur intégré de Node exécute les tests `*.test.cjs` :

```powershell
node --test
```

Les suites couvrent notamment `game-core`, `session-core`, la persistance, le hors ligne,
l'intégration de l'app, `workflows` et l'expérience v26. Les fichiers
`tests\browser-check.js` et `tests\browser-data-check.js` sont des scénarios pour un outil
Playwright fournissant `page`, pas des commandes Node autonomes. Leurs contrôles
ciblés ne constituent pas une validation exhaustive des règles du jeu.

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
├─ js/game-core.js        # état de jeu et contrôles ciblés
├─ js/session-core.js     # minuteur, effectifs et captures
├─ js/experience.js       # parcours MJ et écrans privés
├─ js/workflows.js        # modèles, exercices et actions à revoir
├─ js/persistence.js      # sauvegardes et protection du stockage
├─ js/offline.js          # état du cache et mises à jour
├─ tests/                 # tests Node et scénarios pour outil Playwright
├─ data/
│  ├─ game.json          # équipes, table de setup, étapes de nuit
│  ├─ all-roles.json     # base de 143 rôles (FR/EN + jinxes)
│  └─ scripts/           # trouble-brewing, sects-and-violets, bad-moon-rising
└─ assets/               # icônes SVG/PNG + police Cinzel (OFL)
```

## Crédits & licence

- Conception & développement : **Sébastien Place** ([@sebplace](https://github.com/sebplace)), avec l'assistance de GitHub Copilot.
- Code & contenu original : © 2026 Sébastien Place — sous licence [**Creative Commons BY-NC-SA 4.0**](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr) (partage et adaptation non commerciale, avec attribution et partage à l'identique). Voir [`LICENSE`](LICENSE).
- Univers & marque : *Blood on the Clocktower* © The Pandemonium Institute — outil non officiel, sans texte ni illustration officiels.
- Traductions FR de référence : [bambipotato/botc-fr-bambi](https://github.com/bambipotato/botc-fr-bambi).
- Métadonnées d'ordre de nuit : projet communautaire bra1n/townsquare.
- Police [Cinzel](https://fonts.google.com/specimen/Cinzel) (SIL Open Font License).
