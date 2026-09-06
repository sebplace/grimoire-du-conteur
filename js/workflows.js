"use strict";

const WORKFLOW_TEMPLATE_KEY = "botc-mj-templates-v1";
const WORKFLOW_TEMPLATE_LIMIT = 100;
const WORKFLOW_TEMPLATE_BYTES = 4000000;

function initWorkflows() {
  Object.assign(I18N.fr, {
    pendingActions: "Actions à revoir", templates: "Groupes et sacs",
    exercises: "Exercices guidés", compareSnapshots: "Comparer les captures"
  });
  Object.assign(I18N.en, {
    pendingActions: "Pending actions", templates: "Groups and bags",
    exercises: "Guided exercises", compareSnapshots: "Compare captures"
  });
}

function wfClone(value) { return JSON.parse(JSON.stringify(value)); }
function wfStable(value) {
  if (Array.isArray(value)) return "[" + value.map(wfStable).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + wfStable(value[key])).join(",") + "}";
  return JSON.stringify(value);
}
function wfError(fr, en) { throw new Error(tr(fr, en)); }
function wfElement(id) { return document.getElementById(id); }
function wfMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  const target = wfElement("wf-error");
  if (target) { target.textContent = message; target.hidden = false; }
  toast(message);
}
function wfAction(action) {
  try { return action(); } catch (error) { wfMessage(error); return false; }
}
function wfEditable() {
  if (READ_ONLY) wfError("Cette partie est en lecture seule.", "This game is read-only.");
}
function wfModal(title, body, footer = "") {
  openModal(`<section class="wf-modal"><button class="close-x" onclick="closeModal()" aria-label="${escapeHtml(t("close"))}">×</button>
    <h3>${escapeHtml(title)}</h3><p class="wf-error" id="wf-error" role="alert" hidden></p>${body}
    <div class="modal-actions">${footer}<button class="btn ghost" onclick="closeModal()">${escapeHtml(t("close"))}</button></div></section>`);
}
function wfStorage() { return TRAINING ? sessionStorage : localStorage; }
function wfScriptDefinition(script) {
  if (!script || !script.meta || !Array.isArray(script.characters)) wfError("Définition de script absente.", "Script definition missing.");
  return wfClone({ meta: script.meta, characters: script.characters });
}
function wfValidateTemplate(template) {
  if (!template || typeof template.id !== "string" || !template.id ||
      typeof template.name !== "string" || !template.name.trim() || template.name.length > 100) {
    wfError("Modèle invalide : nom requis (100 caractères maximum).", "Invalid template: a name is required (100 characters maximum).");
  }
  if (template.kind === "group") {
    if (!Array.isArray(template.players) || !template.players.length || template.players.length > 100 ||
        template.players.some(player => !player || typeof player.name !== "string" || !player.name.trim() || player.name.length > 100)) {
      wfError("Un groupe doit contenir de 1 à 100 noms non vides (100 caractères maximum).", "A group requires 1 to 100 non-empty names (100 characters maximum).");
    }
    return { id: template.id, name: template.name.trim(), kind: "group", players: template.players.map(player => ({ name: player.name })) };
  }
  if (template.kind !== "bag" || typeof template.scriptId !== "string" || !template.scriptId ||
      !Array.isArray(template.roleIds) || !template.roleIds.length || template.roleIds.length > 100 ||
      template.roleIds.some(id => typeof id !== "string" || !id) || new Set(template.roleIds).size !== template.roleIds.length) {
    wfError("Sac invalide : personnages distincts et script requis.", "Invalid bag: distinct characters and a script are required.");
  }
  return {
    id: template.id, name: template.name.trim(), kind: "bag", scriptId: template.scriptId,
    roleIds: template.roleIds.slice(),
    ...(template.customDefinition ? { customDefinition: wfScriptDefinition(template.customDefinition) } : {})
  };
}
function wfReadTemplates() {
  let raw;
  try { raw = wfStorage().getItem(WORKFLOW_TEMPLATE_KEY); }
  catch (_) { wfError("Impossible de lire les modèles. Stockage indisponible.", "Cannot read templates. Storage is unavailable."); }
  if (raw === null) return [];
  let library;
  try { library = JSON.parse(raw); }
  catch (_) { wfError("La bibliothèque de modèles est illisible. Aucune donnée n'a été remplacée.", "The template library is unreadable. No data has been replaced."); }
  if (!library || library.version !== 1 || !Array.isArray(library.templates) ||
      library.templates.length > WORKFLOW_TEMPLATE_LIMIT || new TextEncoder().encode(raw).length > WORKFLOW_TEMPLATE_BYTES) {
    wfError("Bibliothèque de modèles invalide ou trop volumineuse. Aucun remplacement.", "Invalid or oversized template library. Nothing was replaced.");
  }
  const templates = library.templates.map(wfValidateTemplate);
  if (new Set(templates.map(template => template.id)).size !== templates.length) wfError("Identifiants de modèles en double.", "Duplicate template IDs.");
  return templates;
}
function wfWriteTemplates(templates) {
  wfEditable();
  if (templates.length > WORKFLOW_TEMPLATE_LIMIT) wfError("Limite de 100 modèles atteinte. Supprimez un modèle avant d'en ajouter un.", "The 100-template limit is reached. Delete a template before adding one.");
  const raw = JSON.stringify({ version: 1, templates: templates.map(wfValidateTemplate) });
  if (new TextEncoder().encode(raw).length > WORKFLOW_TEMPLATE_BYTES) wfError("Bibliothèque trop volumineuse (4 Mo maximum). Aucun modèle supprimé.", "Template library too large (4 MB maximum). No templates were dropped.");
  try { wfStorage().setItem(WORKFLOW_TEMPLATE_KEY, raw); }
  catch (_) { wfError("Enregistrement des modèles impossible. Stockage plein ou bloqué ; aucun succès confirmé.", "Could not save templates. Storage is full or blocked; success was not confirmed."); }
}
function wfValidateBag(template) {
  if (template.scriptId !== S.scriptId) wfError("Sélectionnez d'abord le script de ce sac dans Setup. Aucun script n'a été activé.", "Select this bag's matching script in Setup first. No script was activated.");
  const script = currentScript();
  if (template.customDefinition) {
    if (!CUSTOM[S.scriptId] || wfStable(template.customDefinition) !== wfStable(wfScriptDefinition(CUSTOM[S.scriptId]))) {
      wfError("La définition du script personnalisé a changé ou manque. Réimportez la définition d'origine avant de charger ce sac.", "The custom script definition has changed or is missing. Reimport the original definition before loading this bag.");
    }
  } else if (CUSTOM[S.scriptId]) {
    wfError("Ce sac ne contient pas la définition du script personnalisé. Enregistrez un nouveau modèle.", "This bag has no custom script definition. Save a new template.");
  }
  const eligible = new Set((script?.characters || []).filter(role => ["townsfolk", "outsider", "minion", "demon"].includes(role.team)).map(role => role.id));
  if (!template.roleIds.length || new Set(template.roleIds).size !== template.roleIds.length || template.roleIds.some(id => !eligible.has(id))) {
    wfError("Ce sac contient un personnage absent, en double ou incompatible. Aucun changement.", "This bag contains an unavailable, duplicate or incompatible character. Nothing changed.");
  }
}
function saveWorkflowTemplate(kind, name) {
  wfEditable();
  const templates = wfReadTemplates();
  let id = uid();
  while (templates.some(template => template.id === id)) id = uid();
  const template = wfValidateTemplate(kind === "group" ?
    { id, name, kind, players: activePlayers().map(player => ({ name: player.name })) } :
    { id, name, kind, scriptId: S.scriptId, roleIds: S.bag.slice(),
      ...(CUSTOM[S.scriptId] ? { customDefinition: wfScriptDefinition(CUSTOM[S.scriptId]) } : {}) });
  if (kind === "bag") wfValidateBag(template);
  wfWriteTemplates([...templates, template]);
  return template;
}
function loadWorkflowTemplate(id) {
  wfEditable();
  const template = wfReadTemplates().find(item => item.id === id);
  if (!template) wfError("Modèle introuvable.", "Template not found.");
  if (template.kind === "bag") {
    wfValidateBag(template);
    if (!confirm(tr("Remplacer uniquement le sac de Setup par ce modèle ? Aucun rôle ne sera distribué.", "Replace only the Setup bag with this template? No characters will be dealt."))) return false;
    pushHistory(); S.bag = template.roleIds.slice(); save();
    closeModal(); switchView("setup"); renderAll(); return true;
  }
  if (!confirm(tr("Charger ce groupe remplace la partie entière. Seuls les noms et leur ordre sont repris, avec de nouveaux joueurs sans rôles ni secrets. Une sauvegarde de sécurité est obligatoire. Continuer ?", "Loading this group replaces the entire game. Only names and seating order are reused, with fresh players and no roles or secrets. A safety backup is required. Continue?"))) return false;
  stopTimer();
  save();
  backupBefore(tr("Avant chargement du groupe", "Before loading group"));
  const previous = S;
  const preferences = { settings: wfClone(S.settings), lang: S.lang, sound: S.sound, scriptId: S.scriptId };
  const reservedIds = new Set(S.players.map(player => player.id));
  const players = template.players.map(entry => {
    const player = GameCore.normalizePlayer(newPlayer(entry.name));
    while (reservedIds.has(player.id)) player.id = uid();
    reservedIds.add(player.id);
    return player;
  });
  S = Object.assign(defaultState(), preferences, { players, tutoDone: true });
  try { save(); } catch (error) { S = previous; throw error; }
  closeModal(); switchView("setup"); renderAll(); return true;
}
function deleteWorkflowTemplate(id) {
  const templates = wfReadTemplates();
  const selected = templates.find(template => template.id === id);
  if (!selected) wfError("Modèle introuvable.", "Template not found.");
  if (!confirm(tr("Supprimer le modèle ", "Delete template ") + "« " + selected.name + " » ?")) return false;
  wfWriteTemplates(templates.filter(template => template.id !== id)); return true;
}
function openTemplates() {
  wfModal(t("templates"), `<p class="hint">${tr("Modèles privés, propres à ce navigateur. Les modèles d'entraînement sont isolés. Un groupe contient uniquement les noms et l'ordre des sièges ; un sac contient uniquement les rôles et son script.", "Private templates for this browser. Training templates are isolated. Groups contain only names and seating order; bags contain only characters and their script.")}</p>
    <label class="wf-field">${tr("Nom du modèle", "Template name")}<input id="wf-template-name" maxlength="100" autocomplete="off"></label>
    <div class="row"><button class="btn gold" id="wf-save-group">${tr("Enregistrer le groupe", "Save group")}</button><button class="btn" id="wf-save-bag">${tr("Enregistrer le sac", "Save bag")}</button></div>
    <div id="wf-template-list"></div>`);
  wfAction(() => {
    const templates = wfReadTemplates();
    const container = wfElement("wf-template-list");
    container.innerHTML = ["group", "bag"].map(kind => `<section><h4>${kind === "group" ? tr("Groupes", "Groups") : tr("Sacs", "Bags")}</h4>${templates.filter(template => template.kind === kind).map(template => {
      const detail = kind === "group" ? template.players.map(player => player.name).join(", ") :
        template.scriptId + " · " + template.roleIds.map(wfRoleName).join(", ");
      const index = templates.indexOf(template);
      return `<article class="wf-card"><strong>${escapeHtml(template.name)}</strong><p class="hint">${escapeHtml(detail)}</p>
        <div class="row"><button class="btn small" data-wf-load="${index}">${tr("Charger", "Load")}</button><button class="btn small ghost" data-wf-delete="${index}">${tr("Supprimer", "Delete")}</button></div></article>`;
    }).join("") || `<p class="hint">${tr("Aucun modèle.", "No templates.")}</p>`}</section>`).join("");
    container.querySelectorAll("[data-wf-load]").forEach(button => { button.onclick = () => wfAction(() => loadWorkflowTemplate(templates[Number(button.dataset.wfLoad)].id)); });
    container.querySelectorAll("[data-wf-delete]").forEach(button => { button.onclick = () => wfAction(() => { if (deleteWorkflowTemplate(templates[Number(button.dataset.wfDelete)].id)) openTemplates(); }); });
  });
  ["group", "bag"].forEach(kind => { wfElement("wf-save-" + kind).onclick = () => wfAction(() => { saveWorkflowTemplate(kind, wfElement("wf-template-name").value); openTemplates(); }); });
}

function wfExerciseDefinitions() {
  return [
    { id: "vote-tie", name: tr("Égalité des votes", "Vote tie"),
      instructions: tr("Jour 2 : le joueur 2 est au billot avec 4 voix. Dans Jour, ajoutez une voix à la seconde nomination pour atteindre 4 contre 4. Vérifiez avant de passer à la nuit.", "Day 2: Player 2 is on the block with 4 votes. In Day, add one vote to the second nomination to reach 4 versus 4. Check before moving to night."),
      expected: tr("Deux meilleurs totaux admissibles égaux : personne au billot et aucune exécution enregistrée.", "Two equal highest qualifying totals: nobody on the block and no execution recorded.") },
    { id: "ghost-vote", name: tr("Le dernier vote d'un mort", "A dead player's last vote"),
      instructions: tr("Jour 2 : le joueur 1 est mort, son vote est disponible. Ouvrez les votants de la première nomination et dépensez son vote. Puis utilisez « Tester un second vote » dans le résultat pour tenter la seconde nomination. Restez au Jour 2.", "Day 2: Player 1 is dead with a vote available. Open voters for the first nomination and spend that vote. Then use “Try a second vote” in the result to attempt the second nomination. Stay in Day 2."),
      expected: tr("Le premier vote est compté et consommé ; une tentative de second vote est refusée sans modifier les totaux.", "The first vote counts and is spent; an attempted second vote is rejected without changing totals.") },
    { id: "drunk-monk", name: tr("Moine ivre", "Drunk Monk"),
      instructions: tr("Nuit 2 : le joueur 5 est un vrai Moine rendu ivre, pas l'Ivrogne. Arbitrez une tentative de protection sans effet réel : ne laissez aucun rappel Protégé de cette source, marquez sa capacité « Utilisée sans effet » dans sa fiche, puis cochez son réveil.", "Night 2: Player 5 is an actual Monk made drunk, not the Drunk. Adjudicate an attempted protection with no real effect: leave no Protected reminder from this source, mark their ability “Used without effect” in their player sheet, then check their wake step."),
      expected: tr("Le Moine reste Moine et ivre. Son action a été traitée sans protection effective provenant de lui. Le suivi d'usage ici est pédagogique, pas une capacité à usage unique.", "The Monk remains a drunk Monk. Their action has been handled without effective protection from them. Ability usage here is a teaching marker, not a once-per-game ability.") },
    { id: "lunatic", name: tr("Lunatique et vrai Démon", "Lunatic and real Demon"),
      instructions: tr("Nuit 2, Bad Moon Rising : le joueur 5 est le Lunatique qui croit être Pukka ; le joueur 7 est le vrai Pukka. Traitez le réveil du Lunatique, consignez dans le carnet du vrai Pukka les choix que vous lui communiquez, puis cochez le réveil du Lunatique. N'échangez pas les rôles et ne tuez personne pour la seule action du Lunatique.", "Night 2, Bad Moon Rising: Player 5 is the Lunatic who believes they are Pukka; Player 7 is the actual Pukka. Handle the Lunatic's wake, record the choices communicated to the real Pukka in that player's notebook, then check the Lunatic's wake. Do not swap roles or kill anyone for the Lunatic's action alone."),
      expected: tr("Le personnage réel du Lunatique reste distinct du Démon montré. Le vrai Pukka reçoit une information consignée. La vérification constate la présence de la note, pas son exactitude.", "The Lunatic's actual character stays distinct from the shown Demon. The real Pukka receives recorded information. The check verifies that a note exists, not its accuracy.") },
    { id: "execution-survival", name: tr("Exécution sans mort", "Execution without death"),
      instructions: tr("Jour 2, Bad Moon Rising : le Marin (joueur 2) est au billot avec 4 voix. Pour cet exercice, le Conteur décide qu'il est sobre. Exécutez ce candidat en désactivant l'option qui le fait mourir, avec le motif « Marin sobre ». Vérifiez au Jour 2.", "Day 2, Bad Moon Rising: the Sailor (Player 2) is on the block with 4 votes. For this exercise, the Storyteller decides they are sober. Execute this candidate with the death option disabled and reason “Sober Sailor”. Check in Day 2."),
      expected: tr("Une exécution est enregistrée, le Marin reste vivant et une seconde exécution normale n'est plus disponible ce jour.", "An execution is recorded, the Sailor stays alive, and a second normal execution is no longer available that day.") },
    { id: "first-night-pair", name: tr("Paire de première nuit", "First-night target pair"),
      instructions: tr("Nuit 1 : préparez l'information de la Lavandière (joueur 1). Utilisez les cibles multiples pour placer un rappel Villageois sur un vrai Villageois et un rappel Erroné sur un autre joueur, tous deux associés à cette Lavandière. Cochez ensuite son réveil.", "Night 1: prepare the Washerwoman's information (Player 1). Use multiple targets to place a Townsfolk reminder on an actual Townsfolk and a Wrong reminder on a different player, both sourced to this Washerwoman. Then check their wake step."),
      expected: tr("Une paire distincte et sourcée existe, dont une cible est un vrai Villageois. L'information communiquée et les exceptions restent à vérifier par le Conteur.", "A distinct, sourced pair exists and one target is an actual Townsfolk. The Storyteller must still verify the information communicated and any exceptions.") }
  ];
}
function wfNomination(state, nominatorIndex, nomineeIndex, votes) {
  const nominator = state.players[nominatorIndex], nominee = state.players[nomineeIndex];
  return {
    id: uid(), nominatorId: nominator.id, nomineeId: nominee.id,
    nominator: nominator.name, nominee: nominee.name, votes,
    voters: [], ghostVoters: [], voteMode: "manual",
    threshold: GameCore.nominationThreshold(state.players, charById), executed: false
  };
}
function startTrainingExercise(id) {
  const definition = wfExerciseDefinitions().find(exercise => exercise.id === id);
  if (!definition) wfError("Exercice inconnu.", "Unknown exercise.");
  if (startTestGame() === false || !TRAINING) return false;
  const bmr = id === "lunatic" || id === "execution-survival";
  const roles = bmr ? ["grandmother", "sailor", "gambler", "chambermaid", "lunatic", "godfather", "pukka"] :
    ["washerwoman", "chef", "empath", "fortuneteller", "monk", "poisoner", "imp"];
  S.scriptId = bmr ? "bad-moon-rising" : "trouble-brewing";
  if (!SCRIPTS[S.scriptId]) wfError("Le script de cet exercice est indisponible.", "This exercise's script is unavailable.");
  S.players = roles.map((roleId, index) => {
    const player = newPlayer(tr("Joueur ", "Player ") + (index + 1));
    GameCore.setRole(player, roleId, roleId === "lunatic" ? "pukka" : null);
    player.align = ["poisoner", "imp", "godfather", "pukka"].includes(roleId) ? "evil" : "good";
    return player;
  });
  S.phase = ["vote-tie", "ghost-vote", "execution-survival"].includes(id) ? "day" : "night";
  const firstNight = id === "first-night-pair";
  S.night = { number: firstNight ? 1 : 2, mode: firstNight ? "first" : "other", checked: {}, aliveAtDusk: S.players.map(player => player.id) };
  S.day = { number: firstNight ? 0 : S.phase === "day" ? 2 : 1, nominations: [], execution: null };
  S.pendingActions = []; S.snapshots = []; S.history = []; S.redo = []; S.log = [];
  S.exercise = { id, started: Date.now(), checkpoint: {
    phase: S.phase, night: S.night.number, day: S.day.number,
    players: S.players.map(player => player.id), nominations: []
  } };
  if (id === "ghost-vote") S.players[0].alive = false;
  if (id === "drunk-monk") GameCore.setManualStatus(S.players[4], "drunk", true);
  if (S.phase === "day") {
    S.day.nominations = [wfNomination(S, 2, 1, id === "ghost-vote" ? 0 : 4)];
    if (id !== "execution-survival") S.day.nominations.push(wfNomination(S, 4, 3, id === "ghost-vote" ? 0 : 3));
    S.exercise.checkpoint.nominations = S.day.nominations.map(nomination => nomination.id);
  }
  S = normalizeGame(S);
  save(); closeModal(); switchView(S.phase); renderAll(); return true;
}
function openTrainingExercises() {
  const definitions = wfExerciseDefinitions();
  wfModal(t("exercises"), `<p class="hint">${tr("Chaque exercice démarre une partie d'entraînement isolée. Votre vraie partie et vos scripts personnalisés ne sont pas modifiés. Les critères sont limités à l'objectif annoncé, pas une certification des règles.", "Each exercise starts an isolated training game. Your real game and custom scripts are unchanged. Checks cover only the stated objective, not rules certification.")}</p>
    ${definitions.map((exercise, index) => `<article class="wf-card"><h4>${escapeHtml(exercise.name)}</h4><p>${escapeHtml(exercise.instructions)}</p><p class="hint"><strong>${tr("Résultat attendu", "Expected outcome")} :</strong> ${escapeHtml(exercise.expected)}</p>
    <button class="btn gold" data-wf-exercise="${index}">${tr("Commencer l'exercice", "Start exercise")}</button></article>`).join("")}`);
  document.querySelectorAll("[data-wf-exercise]").forEach(button => { button.onclick = () => wfAction(() => startTrainingExercise(definitions[Number(button.dataset.wfExercise)].id)); });
}
function renderExerciseBanner(container) {
  const exercise = TRAINING && S.exercise && wfExerciseDefinitions().find(item => item.id === S.exercise.id);
  if (!exercise) return null;
  const section = document.createElement("section");
  section.className = "wf-exercise-banner";
  const title = document.createElement("strong");
  title.textContent = "🧪 " + exercise.name;
  const instructions = document.createElement("p");
  instructions.textContent = exercise.instructions;
  const actions = document.createElement("div");
  actions.className = "row";
  [
    [tr("Vérifier le résultat", "Check result"), "gold", openExerciseResult],
    [tr("Recommencer l'exercice", "Reset exercise"), "", resetTrainingExercise],
    [tr("Autres exercices", "Other exercises"), "ghost", openTrainingExercises]
  ].forEach(([label, style, handler]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn small " + style;
    button.textContent = label;
    button.onclick = handler;
    actions.appendChild(button);
  });
  section.appendChild(title);
  section.appendChild(instructions);
  section.appendChild(actions);
  if (container) container.appendChild(section);
  return section;
}
function resetTrainingExercise() {
  if (TRAINING && S.exercise) return wfAction(() => startTrainingExercise(S.exercise.id));
  return false;
}
function getExerciseResult() {
  const exercise = TRAINING && S.exercise && wfExerciseDefinitions().find(item => item.id === S.exercise.id);
  if (!exercise) return { passed: false, active: false, expected: tr("Aucun exercice actif.", "No active exercise."), checks: [] };
  const marker = S.exercise.checkpoint || {};
  const players = (marker.players || []).map(id => S.players.find(player => player.id === id));
  const nominations = (marker.nominations || []).map(id => S.day.nominations.find(nomination => nomination.id === id));
  const checks = [];
  const check = (label, passed) => checks.push({ label, passed: !!passed });
  check(tr("Même phase et même tour que l'exercice", "Still in the exercise's phase and round"), S.phase === marker.phase && S.night.number === marker.night && S.day.number === marker.day);
  check(tr("Joueurs de l'exercice conservés", "Exercise players retained"), players.length === 7 && players.every(Boolean));
  if (players.length === 7 && players.every(Boolean)) {
    const checked = role => !!S.night.checked["char:" + role] || !!S.night.checked["char:" + role + ":" + players.find(player => player.roleId === role)?.id];
    if (exercise.id === "vote-tie") {
      const leader = GameCore.nominationLeader(S.day.nominations);
      check(tr("La seconde nomination est passée de 3 à 4 voix", "The second nomination changed from 3 to 4 votes"), nominations.length === 2 && nominations[0]?.votes === 4 && nominations[1]?.votes === 4);
      check(tr("Égalité sans exécution", "Tie with no execution"), leader.tied && !leader.nominationId && !S.day.execution);
    } else if (exercise.id === "ghost-vote") {
      check(tr("Vote fantôme dépensé dans la première nomination", "Ghost vote spent in the first nomination"), !players[0].alive && players[0].ghostUsed && nominations[0]?.voters?.includes(players[0].id) && nominations[0]?.ghostVoters?.includes(players[0].id));
      check(tr("Seconde tentative refusée, sans second vote", "Second attempt rejected, with no second vote"), marker.secondVoteRejected === true && !nominations[1]?.voters?.includes(players[0].id));
    } else if (exercise.id === "drunk-monk") {
      check(tr("Vrai Moine toujours ivre", "Actual Monk still drunk"), players[4].roleId === "monk" && players[4].statuses.drunk);
      check(tr("Action sans effet traitée", "Action handled without effect"), players[4].abilityUsage === "spent" && checked("monk"));
      check(tr("Aucune protection effective du Moine", "No effective protection from the Monk"), !S.players.some(player => player.reminders.some(reminder => reminder.sourcePlayerId === players[4].id && reminder.effect === "protected")));
    } else if (exercise.id === "lunatic") {
      check(tr("Lunatique montré Pukka, vrai Pukka distinct", "Lunatic shown Pukka, separate actual Pukka"), players[4].roleId === "lunatic" && players[4].shownRoleId === "pukka" && players[6].roleId === "pukka");
      check(tr("Réveil traité et note ajoutée au vrai Pukka", "Wake handled and note added for the actual Pukka"), checked("lunatic") && players[6].information.some(note => typeof note.text === "string" && note.text.trim()));
      check(tr("Aucune mort ajoutée", "No deaths added"), players.every(player => player.alive));
    } else if (exercise.id === "execution-survival") {
      check(tr("Exécution du candidat de l'exercice enregistrée", "Exercise candidate's execution recorded"), S.day.execution?.playerId === players[1].id && S.day.execution?.nominationId === marker.nominations?.[0] && nominations[0]?.executed);
      check(tr("Le Marin sobre reste vivant", "Sober Sailor remains alive"), players[1].roleId === "sailor" && !players[1].statuses.drunk && !players[1].statuses.poisoned && players[1].alive && S.day.execution?.died === false);
    } else if (exercise.id === "first-night-pair") {
      const sourced = S.players.flatMap(player => player.reminders.filter(reminder => reminder.sourcePlayerId === players[0].id && reminder.sourceRoleId === "washerwoman").map(reminder => ({ player, reminder })));
      const town = sourced.filter(item => item.reminder.key === "Townsfolk");
      const wrong = sourced.filter(item => item.reminder.key === "Wrong");
      check(tr("Paire distincte avec la bonne source", "Distinct pair with the right source"), town.length === 1 && wrong.length === 1 && town[0].player.id !== wrong[0].player.id && charById(town[0].player.roleId)?.team === "townsfolk");
      check(tr("Réveil de la Lavandière traité", "Washerwoman wake handled"), players[0].roleId === "washerwoman" && checked("washerwoman"));
    }
  }
  return { active: true, id: exercise.id, name: exercise.name, expected: exercise.expected, checks, passed: checks.length > 2 && checks.every(item => item.passed) };
}
function tryExerciseSecondVote() {
  if (!TRAINING || S.exercise?.id !== "ghost-vote") return false;
  const marker = S.exercise.checkpoint;
  if (S.phase !== marker.phase || S.day.number !== marker.day || S.night.number !== marker.night) wfError("Revenez à l'exercice au Jour 2.", "Return to the exercise in Day 2.");
  const player = S.players.find(item => item.id === marker.players[0]);
  const first = S.day.nominations.find(item => item.id === marker.nominations[0]);
  const second = S.day.nominations.find(item => item.id === marker.nominations[1]);
  if (!player || player.alive || !player.ghostUsed || !first?.ghostVoters?.includes(player.id) || !second) wfError("Dépensez d'abord le vote dans la première nomination.", "Spend the vote in the first nomination first.");
  const before = wfStable({ players: S.players, nominations: S.day.nominations });
  // Probe a clone, so even an unexpected rules-engine result cannot change this exercise.
  const trial = wfClone(S);
  let rejected = false;
  try { GameCore.setVoter(trial, second.id, player.id, true); }
  catch (error) { rejected = error.code === "ghost-spent" && before === wfStable({ players: trial.players, nominations: trial.day.nominations }); }
  pushHistory(); marker.secondVoteRejected = rejected; save();
  openExerciseResult(); return rejected;
}
function openExerciseResult() {
  const result = getExerciseResult();
  wfModal(tr("Résultat de l'exercice", "Exercise result"), `<h4>${escapeHtml(result.name || "")}</h4>
    <p class="${result.passed ? "wf-success" : "hint"}">${result.passed ? tr("Objectif observé dans l'état actuel.", "Objective observed in the current state.") : tr("Objectif non encore observé.", "Objective not yet observed.")}</p>
    <ul class="wf-checks">${result.checks.map(check => `<li>${check.passed ? "✓" : "○"} ${escapeHtml(check.label)}</li>`).join("")}</ul>
    <p><strong>${tr("Attendu", "Expected")} :</strong> ${escapeHtml(result.expected)}</p>
    <p class="hint">${tr("Vérification limitée à ces critères. Elle ne certifie ni les informations transmises, ni toutes les règles de la partie.", "This check covers only these criteria. It does not certify communicated information or every game rule.")}</p>
    ${result.id === "ghost-vote" ? `<button class="btn gold" id="wf-second-vote">${tr("Tester un second vote", "Try a second vote")}</button>` : ""}`);
  if (result.id === "ghost-vote") wfElement("wf-second-vote").onclick = () => wfAction(tryExerciseSecondVote);
}

function wfRoleName(id) {
  if (id === undefined) return tr("Inconnu", "Unknown");
  if (id === null || id === "") return tr("Aucun", "None");
  return loc(charById(id)?.name) || String(id);
}

function wfCaptureLabel(entry) {
  const capture = entry.capture;
  const phase = capture.phase === "night" ? tr("Nuit", "Night") : capture.phase === "day" ? tr("Jour", "Day") : tr("Phase inconnue", "Unknown phase");
  const round = value => value && typeof value === "object" ? value.number : value;
  const night = round(capture.night), day = round(capture.day);
  const timestamp = Number.isFinite(capture.time) ? new Date(capture.time).toLocaleString(S.lang === "en" ? "en-GB" : "fr-FR") : "";
  return `${entry.current ? tr("État actuel à l'ouverture", "Current state when opened") : tr("Capture", "Capture") + " " + (entry.index + 1)} · ${phase} · ${tr("Nuit", "Night")} ${night ?? "?"} · ${tr("Jour", "Day")} ${day ?? "?"}${timestamp ? " · " + timestamp : ""}`;
}
function wfSnapshotEntries() {
  const entries = (Array.isArray(S.snapshots) ? S.snapshots : []).map((snapshot, index) => ({
    index, capture: Array.isArray(snapshot) ? { players: snapshot } : snapshot
  })).filter(entry => entry.capture && Array.isArray(entry.capture.players));
  // Old captures have no timestamp. Their stored sequence is the only chronology we can trust.
  if (entries.every(entry => Number.isFinite(entry.capture.time))) entries.sort((a, b) => a.capture.time - b.capture.time || a.index - b.index);
  entries.push({ index: entries.length, current: true, capture: SessionCore.capture(S, charById) });
  return entries;
}
function wfComparisonField(field) {
  const labels = {
    player: ["Présence du joueur", "Player presence"], alive: ["Vie", "Life"],
    roleId: ["Véritable personnage", "Actual character"], shownRoleId: ["Personnage montré", "Shown character"],
    align: ["Alignement explicite", "Explicit alignment"], ghostUsed: ["Vote fantôme", "Ghost vote"],
    exiled: ["Exil", "Exile"], statuses: ["Effets actifs", "Active effects"], reminders: ["Rappels et sources", "Reminders and sources"],
    abilityUsage: ["Utilisation de la capacité", "Ability use"], bluffs: ["Bluffs", "Bluffs"]
  };
  return labels[field] ? tr(...labels[field]) : field;
}
function wfCapturePlayer(capture, change) {
  const players = Array.isArray(capture.players) ? capture.players : [];
  if (change.playerId) return players.find(player => player.id === change.playerId);
  const named = players.filter(player => player.name === change.name);
  return named.length === 1 ? named[0] : null;
}
function wfCapturePersonName(capture, id) {
  if (!id) return tr("Source non renseignée", "Unrecorded source");
  return capture.players?.find(player => player.id === id)?.name || String(id);
}
function wfComparisonValue(field, value, capture, player) {
  if (value === undefined) return tr("Inconnu : non enregistré", "Unknown: not recorded");
  if (field === "roleId") return wfRoleName(value);
  if (field === "shownRoleId") {
    if (value === null) return wfRoleName(player?.roleId) + " (" + tr("identique au véritable personnage", "same as actual character") + ")";
    return wfRoleName(value);
  }
  if (field === "alive") return value ? tr("Vivant", "Alive") : tr("Mort", "Dead");
  if (field === "ghostUsed") return value ? tr("Utilisé", "Spent") : tr("Disponible", "Available");
  if (field === "exiled") return value ? tr("Exilé", "Exiled") : tr("Non exilé", "Not exiled");
  if (field === "align") return value === "good" ? tr("Bon", "Good") : value === "evil" ? tr("Mauvais", "Evil") : tr("Automatique selon le personnage", "Automatic from character");
  if (field === "abilityUsage") return value === "used" ? tr("Utilisée", "Used") : value === "spent" ? tr("Utilisée sans effet", "Used without effect") : tr("Disponible", "Available");
  if (field === "statuses") {
    return [["poisoned", "Empoisonné", "Poisoned"], ["drunk", "Ivre", "Drunk"], ["protected", "Protégé", "Protected"]].map(([key, fr, en]) =>
      `${tr(fr, en)} : ${typeof value?.[key] === "boolean" ? value[key] ? tr("Oui", "Yes") : tr("Non", "No") : tr("Inconnu", "Unknown")}`).join("\n");
  }
  if (field === "reminders") {
    if (!Array.isArray(value)) return tr("Inconnu : données anciennes", "Unknown: legacy data");
    if (!value.length) return tr("Aucun rappel", "No reminders");
    return value.map(reminder => {
      if (!reminder || typeof reminder !== "object") return String(reminder);
      const sourceRole = wfRoleName(reminder.sourceRoleId);
      const source = wfCapturePersonName(capture, reminder.sourcePlayerId);
      const effect = { poisoned: tr("Empoisonné", "Poisoned"), drunk: tr("Ivre", "Drunk"), protected: tr("Protégé", "Protected") }[reminder.effect];
      const expiry = { dawn: tr("Aube", "Dawn"), dusk: tr("Crépuscule", "Dusk"), manual: tr("Retrait manuel", "Manual removal") }[reminder.expires] || tr("Durée inconnue", "Unknown duration");
      return `${loc(reminder.label) || reminder.key || tr("Rappel", "Reminder")} · ${source} · ${sourceRole}${effect ? " · " + effect : ""} · ${expiry}`;
    }).join("\n");
  }
  if (field === "bluffs") return Array.isArray(value) && value.length ? value.map(wfRoleName).join(", ") : tr("Aucun", "None");
  if (field === "player") {
    if (value === null) return tr("Absent de cette capture", "Absent from this capture");
    return [
      value.name || tr("Sans nom", "Unnamed"),
      tr("Véritable", "Actual") + " : " + wfRoleName(value.roleId),
      tr("Montré", "Shown") + " : " + wfComparisonValue("shownRoleId", value.shownRoleId, capture, value),
      wfComparisonValue("alive", value.alive, capture, value)
    ].join("\n");
  }
  return value === null ? tr("Aucun", "None") : typeof value === "object" ? JSON.stringify(value) : String(value);
}
function wfCaptureUnknowns(before, after) {
  const tracked = ["alive", "roleId", "shownRoleId", "align", "ghostUsed", "exiled", "statuses", "reminders", "abilityUsage"];
  const result = [];
  for (const [capture, label] of [[before, tr("Avant", "Before")], [after, tr("Après", "After")]]) {
    (capture.players || []).forEach(player => {
      const unknown = tracked.filter(field => player[field] === undefined);
      if (!player.id) unknown.unshift("identity");
      if (player.statuses && ["drunk", "poisoned", "protected"].some(key => typeof player.statuses[key] !== "boolean") && !unknown.includes("statuses")) unknown.push("statuses");
      if (unknown.length) result.push(`${label} · ${player.name || tr("Sans nom", "Unnamed")} : ${unknown.map(field => field === "identity" ? tr("Identité stable", "Stable identity") : wfComparisonField(field)).join(", ")}`);
    });
    if (capture.bluffs === undefined) result.push(`${label} : ${wfComparisonField("bluffs")}`);
  }
  return result;
}
function wfRenderComparison(before, after) {
  const changes = SessionCore.compareCaptures(before, after);
  const unknowns = wfCaptureUnknowns(before, after);
  const identityUncertain = [...(before.players || []), ...(after.players || [])].some(player => !player.id);
  const rows = changes.map(change => {
    const leftPlayer = wfCapturePlayer(before, change), rightPlayer = wfCapturePlayer(after, change);
    const unknownIdentity = change.field === "player" && identityUncertain;
    const kind = unknownIdentity ? tr("Correspondance non établie (identités anciennes incomplètes)", "Match not established (incomplete legacy identities)") :
      change.type === "added" ? tr("Joueur ajouté", "Player added") : change.type === "removed" ? tr("Joueur retiré", "Player removed") : wfComparisonField(change.field);
    const left = wfComparisonValue(change.field, change.before, before, leftPlayer);
    const right = wfComparisonValue(change.field, change.after, after, rightPlayer);
    return `<article class="wf-card"><h4>${escapeHtml(change.name ? change.name + " · " + kind : kind)}</h4>
      <div class="wf-diff-values"><div><strong>${tr("Avant", "Before")}</strong>${escapeHtml(left)}</div><div><strong>${tr("Après", "After")}</strong>${escapeHtml(right)}</div></div></article>`;
  }).join("");
  const noChange = `<p>${unknowns.length ? tr("Aucune différence constatée dans les champs connus et comparables. Les valeurs inconnues ne prouvent pas une absence de changement.", "No difference observed in known, comparable fields. Unknown values are not evidence of no change.") :
    tr("Aucune différence dans les personnages, effets, rappels, votes fantômes, usages et bluffs comparés.", "No differences in the compared characters, effects, reminders, ghost votes, ability use and bluffs.")}</p>`;
  return `${rows || noChange}${unknowns.length ? `<details class="wf-card" open><summary>${tr("Données inconnues, pas des changements", "Unknown data, not changes")}</summary><ul>${unknowns.map(text => `<li>${escapeHtml(text)}</li>`).join("")}</ul></details>` : ""}`;
}
function openSnapshotComparison() {
  if (typeof SessionCore === "undefined") return toast(tr("Comparaison indisponible. Rechargez l'application.", "Comparison unavailable. Reload the app."));
  wfAction(() => {
    const entries = wfSnapshotEntries();
    const options = entries.map((entry, index) => `<option value="${index}">${escapeHtml(wfCaptureLabel(entry))}</option>`).join("");
    wfModal(t("compareSnapshots"), `<p class="wf-private">${tr("Conteur uniquement : vrais personnages et effets. Aucune restauration ni modification de la partie.", "Storyteller only: actual characters and effects. No game restoration or modification.")}</p>
      <p class="hint">${tr("Les captures gardent leurs numéros de nuit et de jour enregistrés. Comparaison des personnages, vie, alignements, effets, rappels, exils, votes fantômes, usages et bluffs ; les notes et décisions non capturées ne sont pas déduites.", "Captures retain their recorded night and day numbers. Compares characters, life, alignments, effects, reminders, exile, ghost votes, ability use and bluffs; uncaptured notes and decisions are not inferred.")}</p>
      ${entries.length === 1 ? `<p class="hint">${tr("Aucune ancienne capture : seul l'état actuel est disponible.", "No saved captures: only the current state is available.")}</p>` : ""}
      <div class="wf-comparison-selectors"><label class="wf-field">${tr("Avant", "Before")}<select id="wf-before">${options}</select></label>
      <label class="wf-field">${tr("Après", "After")}<select id="wf-after">${options}</select></label></div>
      <p class="hint" id="wf-comparison-order" role="status"></p><div id="wf-comparison-results"></div>`);
    const left = wfElement("wf-before"), right = wfElement("wf-after");
    left.value = String(Math.max(0, entries.length - 2)); right.value = String(entries.length - 1);
    const render = () => wfAction(() => {
      let beforeIndex = Number(left.value), afterIndex = Number(right.value);
      if (!entries[beforeIndex] || !entries[afterIndex]) return;
      const reversed = beforeIndex > afterIndex;
      if (reversed) {
        [beforeIndex, afterIndex] = [afterIndex, beforeIndex];
        left.value = String(beforeIndex); right.value = String(afterIndex);
      }
      wfElement("wf-comparison-order").textContent = reversed ? tr("Sélections remises dans l'ordre chronologique.", "Selections reordered chronologically.") : "";
      wfElement("wf-comparison-results").innerHTML = wfRenderComparison(entries[beforeIndex].capture, entries[afterIndex].capture);
    });
    left.onchange = render; right.onchange = render; render();
  });
}

function getPendingActions(nextPhase, nightSteps) {
  const explicit = (Array.isArray(S.pendingActions) ? S.pendingActions : []).filter(action => action && action.status === "open");
  const actions = explicit.map(action => ({ ...action, source: "explicit" }));
  if (S.phase === "night") {
    const steps = Array.isArray(nightSteps) ? nightSteps : typeof getNightSteps === "function" ? getNightSteps() : [];
    steps.filter(step => step && typeof step.key === "string" && !["meta:dawn", "meta:dusk"].includes(step.key) &&
      !S.night.checked?.[step.key]).forEach(step => actions.push({
      id: "wf-night-" + S.night.number + "-" + step.key, source: "night-step", stepKey: step.key,
      kind: "night-step", playerId: step.playerId, text: loc(step.title) || step.key,
      phase: "night", night: S.night.number, day: S.day.number, status: "open"
    }));
  }
  if (S.phase === "day" && (!nextPhase || nextPhase === "night") && !S.day.execution) {
    const leader = GameCore.nominationLeader(S.day.nominations);
    const nomination = S.day.nominations.find(item => item.id === leader.nominationId);
    if (nomination) {
      const id = "wf-execution-" + S.day.number + "-" + nomination.id + "-" + nomination.votes;
      if (!(S.pendingActions || []).some(action => action.id === id && action.status === "resolved")) {
        actions.push({
          id, source: "execution", kind: "execution-review", playerId: nomination.nomineeId,
          text: tr("Candidat au billot sans exécution enregistrée. Exécuter, ne pas exécuter ou appliquer une exception reste votre décision.", "Candidate on the block with no execution recorded. Executing, not executing or applying an exception remains your decision."),
          phase: "day", night: S.night.number, day: S.day.number, status: "open"
        });
      }
    }
  }
  return actions;
}
function wfTransitionGuard() {
  const state = S, phase = S.phase, night = S.night.number, day = S.day.number, training = TRAINING;
  return () => S === state && S.phase === phase && S.night.number === night && S.day.number === day && TRAINING === training && !READ_ONLY;
}
function wfResolvePending(action, reason) {
  wfEditable();
  if (!reason || !reason.trim()) wfError("Indiquez un motif avant de résoudre cette action.", "Enter a reason before resolving this action.");
  const text = reason.trim().slice(0, 1000);
  pushHistory();
  if (action.source === "explicit") {
    const target = S.pendingActions.find(item => item.id === action.id && item.status === "open");
    if (!target) wfError("Cette action a déjà changé. Rouvrez le panneau.", "This action has already changed. Reopen the panel.");
    target.status = "resolved"; target.resolutionReason = text; target.resolvedAt = Date.now();
  } else if (action.source === "night-step") {
    S.night.checked[action.stepKey] = true;
  } else {
    S.pendingActions = S.pendingActions || [];
    S.pendingActions.push({
      id: action.id, kind: action.kind, playerId: action.playerId, text: action.text, status: "resolved",
      phase: action.phase, night: action.night, day: action.day, resolutionReason: text, resolvedAt: Date.now()
    });
  }
  logEvent(tr("Action revue", "Action reviewed") + " : " + action.text + " · " + text, "✓");
  save(); renderAll();
}
function reviewPendingTransition(nextPhase, commit, nightSteps) {
  const guard = wfTransitionGuard();
  let committed = false;
  if (typeof commit === "function" && !getPendingActions(nextPhase, nightSteps).length) {
    if (!guard()) return false;
    committed = true;
    commit();
    return true;
  }
  function show() {
    const actions = getPendingActions(nextPhase, nightSteps);
    wfModal(t("pendingActions"), `<p class="hint">${tr("Repères privés du Conteur, pas des obligations garanties par les règles. Résoudre signifie que vous avez arbitré l'action ; cela ne tue personne et n'applique aucun effet. Les étapes de nuit résolues sont cochées.", "Private Storyteller reminders, not guaranteed rules obligations. Resolve means you have adjudicated the action; it kills nobody and applies no effect. Resolved night steps are checked.")}</p>
      ${actions.map((action, index) => {
        const player = S.players.find(item => item.id === action.playerId);
        const stamp = `${tr("Nuit", "Night")} ${action.night ?? "?"} · ${tr("Jour", "Day")} ${action.day ?? "?"}`;
        return `<article class="wf-card"><strong>${escapeHtml(action.text || action.kind || tr("Action", "Action"))}</strong>
          <p class="hint">${escapeHtml(player ? player.name + " · " + stamp : stamp)}</p>
          <label class="wf-field">${tr("Motif de résolution / non applicable", "Reason for resolution / not applicable")}<input id="wf-reason-${index}" maxlength="1000"></label>
          <button class="btn small" data-wf-resolve="${index}">${tr("Résoudre / non applicable", "Resolve / not applicable")}</button></article>`;
      }).join("") || `<p>${tr("Aucune action listée. Cela ne garantit pas que toutes les règles ont été vérifiées.", "No actions listed. This does not guarantee that every rule has been checked.")}</p>`}
      ${typeof commit === "function" ? `<label class="wf-field">${tr("Motif pour continuer avec des actions ouvertes", "Reason to continue with open actions")}<textarea id="wf-continue-reason" maxlength="1000"></textarea></label>
        <div class="row"><button class="btn ghost" onclick="closeModal()">${tr("Retour", "Back")}</button><button class="btn gold" id="wf-continue">${actions.length ? tr("Continuer malgré les actions", "Continue anyway") : tr("Continuer", "Continue")}</button></div>` : ""}`);
    document.querySelectorAll("[data-wf-resolve]").forEach(button => {
      button.onclick = () => wfAction(() => {
        if (!guard() || committed) wfError("La partie ou la phase a changé. Rouvrez le panneau.", "The game or phase changed. Reopen the panel.");
        const index = Number(button.dataset.wfResolve), action = actions[index];
        if (!getPendingActions(nextPhase, nightSteps).some(item => item.id === action.id && item.source === action.source)) wfError("Cette action a changé. Rouvrez le panneau.", "This action changed. Reopen the panel.");
        wfResolvePending(action, wfElement("wf-reason-" + index).value); show();
      });
    });
    if (typeof commit === "function") wfElement("wf-continue").onclick = () => wfAction(() => {
      if (committed) return false;
      if (!guard()) wfError("La partie ou la phase a changé. Rouvrez le panneau.", "The game or phase changed. Reopen the panel.");
      const remaining = getPendingActions(nextPhase, nightSteps);
      const reason = wfElement("wf-continue-reason").value.trim();
      if (remaining.length && !reason) wfError("Indiquez pourquoi vous continuez avec des actions ouvertes.", "Explain why you are continuing with open actions.");
      if (remaining.length) {
        pushHistory();
        logEvent(tr("Actions différées avant la transition", "Actions deferred before transition") + " : " + remaining.map(action => action.text || action.kind).join(" ; ") + " · " + reason.slice(0, 1000), "⚠");
        save();
      }
      committed = true; closeModal(); commit(); return true;
    });
  }
  show();
}
function openPendingActions(nightSteps) { reviewPendingTransition(null, null, nightSteps); }
