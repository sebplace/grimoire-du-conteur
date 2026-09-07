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
| **Jour** | Nominations par identité de joueur, seuil conservé, tour de vote guidé, votes fantômes suivis, minuteur à échéance, exécution distincte de la mort, exil des Voyageurs et suggestion de fin à arbitrer. |
| **Setup** | Constructeur de sac, modificateurs pris en charge, contrôle de composition et **Vérifications de préparation**. Les exceptions restent à examiner. |
| **Personnages** | Référence consultable indépendamment du script actif, capacités reformulées, recherche et jinx. |
| **Scripts** | Trois scripts inclus, bibliothèque personnalisée et import JSON validé. Activer un script est une action séparée, avec confirmation et sauvegarde. |

**Navigation compacte (v29)** : jusqu'à **700 px de largeur**, cinq accès restent en
bas en **Complet comme en Essentiel** : Grimoire, Nuit, Jour, Messages et Outils
(**Plus d'outils** en Essentiel). Setup, Personnages et Scripts restent accessibles
dans la boîte à outils. Sur grand écran, Complet conserve ses onglets avancés.
Le bouton **Complet / Essentiel ▾ → Affichage et langue** propose **Français**,
**English**, **Plein écran** et **Sons : activés / désactivés**. Ces commandes sont
retirées de l'en-tête seulement jusqu'à 700 px ; le plein écran dépend du navigateur.

**Essentiel / Complet** : **Complet** reste le choix par défaut. Passer à Essentiel
depuis le contrôle global ou Réglages choisit la nuit guidée, mais **Tout voir**
reste sélectionnable. Aucun état ni outil n'est supprimé ; vos favoris sont conservés.

**Grimoire et fiches** : Annuler, Cercle/Liste MJ et la recherche restent directement
accessibles. **Plus ▾** regroupe ajout, attribution, préparation, placement, zoom,
rétablir et nouvelle partie. La fiche commence par les identités réelle/montrée et
les actions Révéler, Message privé et Carnet d'informations ; attribution, état avancé et rappels/effets
se déplient à la demande. Ces vues contiennent des secrets et restent réservées au MJ.
La recherche de joueur (Grimoire ou Ctrl+K) accepte le nom et les personnages
réel/montré en FR/EN, sans tenir compte des accents ; les résultats proposent
**Fiche / Note / Message / Effets**. Note ouvre le carnet du joueur ; Effets ouvre
sa fiche directement sur les rappels.

**Partie / Placement** : par défaut, **Partie : sièges verrouillés** empêche le
réordonnancement et le mélange des sièges (`seatPlacement: false`). Activez
**Plus → Placement : déplacer les sièges** dans le grimoire pour organiser la table.
Les changements d'ordre sont annulables. Revenez en Partie ensuite : toucher,
appui long, fiches et déplacement des rappels restent disponibles, sans déplacer les sièges.

**Outils** : la boîte à outils classe le catalogue complet par intention :
**Préparer / Animer / Consulter / Sauvegarder**. **Tous les outils** affiche aussi les
fonctions avancées. La recherche accepte les noms et des synonymes FR/EN, avec ou sans
accents, et parcourt toujours tout le catalogue, même en Essentiel ou après un filtre.
Par exemple, cherchez « réveil », « imprimer » ou « backup ». Sur téléphone, elle
s'ouvre dans un panneau inférieur avec libellés ; sur grand écran, le dock propose
les quatre intentions et **Tous les outils**, plutôt qu'une longue liste d'icônes.
Ouvrir un outil en dialogue conserve le catalogue, la recherche et le défilement
pour le retour ; ouvrir une vue quitte le catalogue. Le guide s'ouvre dans un autre onglet.
Le catalogue donne accès notamment au **Carnet d'informations** par joueur et par phase, aux
**Messages privés**, à la **Distribution privée des rôles**, aux **Groupes et sacs**,
aux **Exercices guidés**, aux sauvegardes, au mode Table public, au journal et aux
comparaisons de captures, ainsi qu'au verrou, aux notes, au guide et à l'impression.
La palette de commandes reste accessible avec Ctrl+K. Les réglages de confort dépendent
des capacités du navigateur. Les vues et fenêtres conservent leur focus et leur position
de défilement ; les mises à jour du minuteur et des votes évitent un rechargement complet.

**Retour et brouillons** : **Retour** revient au dialogue précédent ; **Tout fermer**
retrouve la vue de travail. Le retour du navigateur suit le contexte de l'app.
Sans dialogue ni vue précédente, il reste dans l'app ; il ne déverrouille pas l'écran.
Retour, Échap et un toucher hors du dialogue préservent les saisies en mémoire ;
**Abandonner le brouillon** dans la barre du dialogue demande confirmation.
Les brouillons de message privé, de carnet et de préparation de réveil non enregistrée
sont conservés **en mémoire limitée pour chaque joueur et partie**, avec entraînement
séparé, pas après rechargement ou remplacement de partie. Utilisez leur action
**Abandonner le brouillon** pour les effacer, ou enregistrez explicitement la note.
Dans le carnet, **Annuler** revient à la liste sans effacer le brouillon.
La revendication de la fiche conserve son enregistrement automatique au changement
du champ ; ce n'est pas une note de carnet en attente.
Reprendre un brouillon ne montre rien au joueur. Depuis un écran public, Retour
mène uniquement à l'écran neutre ; seul **Retour au Conteur** restaure le privé.

**Outils → Favoris par phase** permet de choisir jusqu'à **quatre raccourcis pour la nuit
et quatre pour le jour**, dans une barre libellée intégrée à la page, sans superposition.
Sur mobile, les favoris restent sur une seule ligne à défilement horizontal,
avec une barre de défilement fine selon le navigateur.
Les choix sont conservés dans `S.settings.favourites`. Les favoris utilisent les outils
de l'app et leurs restrictions : nominer reste indisponible la nuit, après l'exécution
ou sur un écran joueur.

Scripts inclus : **Trouble Brewing**, **Sects & Violets**, **Bad Moon Rising** + base de
**143 rôles** (FR/EN) pour les scripts personnalisés. Thème gothique/horloge, police Cinzel.

## Arbitrage et confidentialité

- **Ivrogne et Lunatique** : le rôle réel (`roleId`) reste distinct du personnage cru
  (`shownRoleId`). « En réalité l'Ivrogne » convertit un Villageois en Marginal et garde
  le Villageois montré. L'Ivrogne n'est pas un simple statut temporaire.
  L'étape de nuit du vrai Lunatique reste distincte de celle du Démon montré ;
  le Conteur gère toujours la transmission de ses choix.
- **Effets** : chaque rappel a une source joueur/personnage, une cible et une durée
  (manuelle, prochaine aube, prochain crépuscule ou échéance précise). Déplacer ou retirer un rappel
  recalcule les statuts sans supprimer les autres sources. Une note libre ne crée aucun
  effet par son vocabulaire. Les statuts manuels sont distincts des effets.
- **Échéances des effets** : les durées aube/crépuscule existantes restent inchangées.
  Une échéance précise utilise `expires: "scheduled"` et un objet `schedule` avec
  `phase` (`"night"` ou `"day"`) et `number`. Elle vise la **fin** de la phase indiquée
  et ne retire jamais l'effet automatiquement.
  Une durée en nuits inclut la nuit courante, ou la prochaine s'il fait jour :
  Nuit 2 + trois nuits donne fin de Nuit 4. Modifiez l'échéance avec l'horloge du rappel
  dans la fiche joueur. **Outils → Échéances des effets** permet aussi de modifier
  ou retirer explicitement l'effet. La revue propose le retrait ou le maintien pour
  cette transition avec un motif. Un effet en retard reste actif et revient à la
  revue de la prochaine transition. Sources et échéances sont
  conservées lors des copies, déplacements, annulations et exports.
- **Liens entre joueurs** : vue privée des seuls rappels enregistrés, avec liens entrants
  et sortants, joueur/personnage source, cible et durée. Les effets manuels sont séparés.
  Une source absente ou non renseignée reste inconnue ; aucun lien n'est déduit d'un rôle.
- **Choix de nuit** : la fenêtre propose source, jeton, effet et durée. Vous pouvez
  **Noter le choix sans effet**. Une source ivre ou empoisonnée ne peut pas appliquer
  son effet, mais son choix peut être consigné. Les morts sont confirmées par le MJ :
  une protection n'empêche pas universellement toute cause de mort.
- **Informations** : les calculs sont des suggestions, jamais une vérité garantie.
  Ils prennent en compte l'alignement enregistré ; les paires de candidats restent
  stables pour une même nuit. Un joueur ivre ou empoisonné peut recevoir une information
  correcte **ou** incorrecte. Le Conteur décide et consigne ce qu'il communique.
- **Information préparée par réveil** : dans la nuit, ouvrez **Préparer l'information**,
  choisissez manuellement un nombre, un personnage ou du texte, puis
  **Enregistrer la préparation**. Rien n'est encore montré ni ajouté au carnet.
  Relisez l'aperçu, utilisez **Montrer uniquement l'information**, masquez vers le
  neutre, revenez au Conteur, puis **Consigner l'information montrée**.
  Cette dernière action ajoute au carnet le texte exact affiché, pas une modification
  ultérieure. Si rôles, effets ou état ont changé, revérifiez et enregistrez la
  préparation avant un nouvel affichage. Aucun calcul de vérité ni effet automatique.
  Une préparation enregistrée appartient au script, à la phase, au numéro et au
  type de nuit courants ; elle ne se reporte pas automatiquement à la suivante.
  Son texte privé fait partie des sauvegardes et exports (`S.night.preparations`),
  contrairement aux brouillons de saisie en mémoire. Une entrée consignée garde l'affichage exact :
  ajoutez une note de correction plutôt que de le réécrire ; sa suppression reste possible.
  Limites : **80 préparations courantes** et **4 000 caractères** pour le texte libre.
- **Écran joueur** : nombre, deux personnages, alignement ou texte choisi uniquement,
  avec enregistrement dans le carnet. Les bluffs s'affichent seulement si trois choix
  distincts sont valides. Masquer l'information mène à un écran neutre ; seul
  **Retour au Conteur** réaffiche l'interface privée. Le mode Table utilise aussi ce
  parcours pour ses compteurs et son minuteur publics.
- **Cartes de communication** : demander de choisir un ou deux joueurs, ouvrir/fermer
  les yeux, utiliser une capacité, ou montrer Oui/Non. L'écran public ne révèle ni nom
  de destinataire, ni rôle, ni statut. Ces gestes ne sont pas automatiquement consignés
  comme informations reçues ; le masquage passe toujours par l'écran neutre.
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
- **Aide proposée par l'app** : dépliez cette rubrique sur une carte de référence,
  une fiche joueur ou une étape de nuit. Elle distingue réveils prévus dans les données,
  rappels, cibles, choix de deux cibles et calcul indicatif ou information manuelle.
  Des valeurs de nuit à zéro signifient aucun réveil programmé, pas un rôle inutilisable.
  Sur la fiche, le contexte peut être celui du personnage montré, sans lui accorder sa
  capacité réelle. Une variante personnalisée d'un identifiant standard avertit que
  les aides restent fondées sur le rôle standard. Le Conteur arbitre toujours les règles.
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
- **Tour de vote guidé** : depuis une nomination, parcourez les sièges dans le sens
  horaire, après le nominé et jusqu'au nominé en dernier. Choisissez Vote oui / Pas de
  vote pour chacun ; un mort sans vote fantôme ne peut pas voter oui. Corrigez au besoin
  avec Annuler le dernier geste. Fermer puis rouvrir reprend le même tour.
  Recommencer exige confirmation, efface les voix et restitue les votes fantômes de
  **cette nomination seulement**. Si les sièges, états des joueurs ou votes ont changé ailleurs, une reprise
  à zéro est requise, sans écraser silencieusement ces changements. Aucune exécution
  n'est automatique ; les capacités modifiant les voix restent à arbitrer.
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

## Débrief progressif, avec choix du contenu public

Depuis **Récapitulatif → Débrief progressif**, préparez en privé des étapes issues des
captures et du carnet. Aucun rôle ni événement n'est coché par défaut. Sélectionnez
précisément ce qui peut être révélé et relisez l'**Aperçu public exact**. Ajouter une entrée
du carnet exige une confirmation explicite de publication de cette donnée privée.
Les textes approuvés sont des copies stables conservées dans `S.debrief`, pas une
projection qui se modifie silencieusement avec la partie.

Montrez une étape à la fois : masquage, écran neutre, retour au Conteur, puis choix de la
suivante. Précédente et Revenir au début changent seulement la présentation, pas la
partie. Si elle est encore en cours, une alerte et une confirmation précèdent chaque
projection susceptible de révéler des secrets.

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

Les boutons principaux **Annuler / Rétablir** décrivent la prochaine action et ouvrent
un aperçu privé **état actuel → état restauré**, à confirmer. Les historiques anciens
incomplets sont signalés ; les libellés ne reproduisent pas le corps des notes privées.
Si la partie ou l'étape d'historique change, rouvrez l'aperçu au lieu d'appliquer un état
périmé. **Ctrl+Z / Ctrl+Y** et le bouton Annuler d'une notification gardent leur action
immédiate, avec un retour descriptif. Annuler ou rétablir met le minuteur en pause ;
les préférences et les signalements locaux ne sont pas restaurés.

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

## Fiche de secours et retours locaux

**Outils → Imprimer** ouvre la **Fiche de secours du Conteur**, un aperçu confidentiel
figé dans l'app, sans ouvrir automatiquement l'impression. Elle reprend ordre des
sièges, rôles réels/montrés, alignement, vie, votes fantômes, exils, effets sourcés et
échéances, états manuels, bluffs, progression de nuit, nominations, exécution et actions
à revoir. Notes générales et carnets privés sont exclus par défaut ; leur inclusion
nécessite de cocher l'option explicite. **Actualiser explicitement la capture** reprend
l'état courant. **Imprimer cette capture confidentielle** isole la fiche au format A4,
pas la fenêtre de jeu. Gardez ce document réservé au MJ et notez les changements
ultérieurs à la main ; ce n'est pas une sauvegarde JSON restaurable.

**Outils → Signaler une difficulté** conserve une bibliothèque locale séparée de la
partie et de ses exports. Rien n'est envoyé. Choisissez Utilisation, Aide aux règles,
Anomalie ou Idée, décrivez le constat et, si utile, le résultat attendu. L'entraînement
a sa propre bibliothèque en session. Limites : **100 signalements, 2 000 caractères
par champ de texte et 250 000 octets** au total ; un dépassement affiche une erreur
sans tronquer les textes ni supprimer automatiquement des entrées.

Le diagnostic est limité à la version de l'app, famille de navigateur, dimensions
de la fenêtre, états réseau/hors-ligne prêt, langue, affichage autonome, Essentiel et Placement.
Il n'inclut ni URL, agent utilisateur brut, console, copie de partie, nom, rôle ou note.
Il reste figé à la création du signalement. **Diagnostic technique seul** exclut aussi
texte libre, catégorie, identifiants et dates du signalement. Les exports JSON/texte
présentent leur contenu exact et demandent une relecture confirmée ; le texte libre
est exclu par défaut. Vos propres mots peuvent contenir des secrets : relisez avant
de télécharger, puis avant tout partage manuel.

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

## Six essais d'usage avec un vrai MJ

La [section 17 du guide](guide.html#usability-check) propose six tâches courtes :
se repérer sur téléphone, retrouver un outil, agir sur un joueur, reprendre une
saisie, préparer une information de réveil et contrôler le retour depuis l'écran public.
Essayez-les en entraînement, avec un vrai MJ, et relevez hésitations, erreurs et
résultats attendus dans **Signaler une difficulté**. **Aucune observation terrain
n'a été conduite** : ce protocole reste à réaliser, il ne prouve ni l'ergonomie
en partie réelle ni une automatisation parfaite des règles.
Les mesures de fenêtre des scénarios navigateur sont des contrôles locaux
reproductibles, pas des observations d'un vrai MJ.

## Lancer en local

L'app charge ses données via `fetch()`, il faut donc un petit serveur HTTP
(ouvrir `index.html` en `file://` ne fonctionne pas).

```bash
python -m http.server 8000   # ou : npx serve .
```
Puis ouvrez http://localhost:8000

## Vérifications de développement

Depuis le dossier du projet, le lanceur intégré de Node exécute les tests `tests\*.test.cjs` :

```powershell
node --test "tests\*.test.cjs"
```

Les suites couvrent notamment `game-core`, `session-core`, la persistance, le hors ligne,
l'intégration de l'app, `workflows`, l'expérience v26, `voting-core`, `shortcuts`,
`presentation`, `usability-core`, `rescue-sheet` et `feedback`. Les fichiers
`tests\browser-*.js` sont des scénarios pour un outil
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
├─ css/compact.css        # navigation mobile compacte
├─ css/navigation.css     # dialogues contextuels et fiches condensées
├─ css/toolbox.css        # catalogue d'outils par intention
├─ js/app.js
├─ js/game-core.js        # état de jeu et contrôles ciblés
├─ js/session-core.js     # minuteur, effectifs et captures
├─ js/experience.js       # parcours MJ et écrans privés
├─ js/workflows.js        # modèles, exercices et actions à revoir
├─ js/voting-core.js      # tour de vote et provenance des gestes
├─ js/round-ui.js         # vote guidé et échéances des effets
├─ js/shortcuts.js        # favoris par phase et liens factuels
├─ js/presentation.js     # cartes de communication et débrief choisi
├─ js/usability-core.js   # descriptions d'historique et aides par rôle
├─ js/usability.js        # modes d'interface, placement et aperçu d'annulation
├─ js/navigation.js       # retours contextuels et protection des saisies en mémoire
├─ js/toolbox.js          # catalogue complet, recherche et filtres d'intention
├─ js/wake-preparation.js # information manuelle préparée, montrée puis consignée
├─ js/rescue-sheet.js     # capture confidentielle et impression A4
├─ js/feedback.js         # signalements locaux et diagnostics limités
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
