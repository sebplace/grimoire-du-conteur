"use strict";

const TOOLBOX_GROUPS = Object.freeze([
  { id: "prepare", fr: "Préparer", en: "Prepare", icon: "⚙",
    help: { fr: "Installer la partie, choisir le script et s'entraîner.", en: "Set up the game, choose a script and practise." },
    aliases: "préparation installation composition répartition démarrer setup start practice training" },
  { id: "run", fr: "Animer", en: "Run", icon: "◐",
    help: { fr: "Accompagner la nuit, les votes et les échanges.", en: "Guide the night, voting and player communication." },
    aliases: "animation jouer nuit jour message vote mener live play night day communicate" },
  { id: "consult", fr: "Consulter", en: "Consult", icon: "📖",
    help: { fr: "Retrouver une règle, une information ou une aide.", en: "Find rules, information and help." },
    aliases: "consultation référence règles aide recherche lire reference rules help lookup read" },
  { id: "save", fr: "Sauvegarder", en: "Save", icon: "💾",
    help: { fr: "Conserver la partie, vérifier son historique et la retrouver.", en: "Keep the game, review its history and restore it." },
    aliases: "sauvegarde sauvegardes enregistrer restaurer exporter backup backups export restore recover" }
].map(group => Object.freeze({ ...group, help: Object.freeze(group.help) })));

const TOOLBOX_DEFINITIONS = Object.freeze([
  ["interfaceMode", "prepare", "Interface Essentiel / Complet", "Essential / Full interface", "interface débutant expert simplifier affichage beginner full essential display", "modal", true],
  ["feedback", "consult", "Retour d'expérience", "Feedback", "avis problème signaler bug suggestion"],
  ["historyPreview", "save", "Aperçu de l'annulation", "Undo preview", "annuler rétablir historique undo redo history"],
  ["guidedVote", "run", "Vote guidé", "Guided vote", "voter nomination scrutin majorité fantôme ballot majority ghost", "modal", true],
  ["favourites", "prepare", "Favoris par phase", "Phase favourites", "raccourcis personnaliser shortcuts favorites customize"],
  ["scheduledEffects", "run", "Effets programmés", "Scheduled effects", "échéance expiration rappels aube crépuscule reminder expiry dawn dusk"],
  ["silentCards", "run", "Cartes silencieuses", "Silent cards", "communiquer message montrer chuchoter whisper communication show", "modal", true],
  ["playerLinks", "consult", "Liens entre joueurs", "Player links", "relations source cible rappels reminder source target"],
  ["progressiveDebrief", "run", "Débrief progressif", "Progressive debrief", "révéler révélation fin bilan reveal end recap"],
  ["roleTour", "prepare", "Distribution des personnages", "Role distribution", "distribuer rôles tour révéler attribution assign deal roles", "modal", true],
  ["multiTargets", "run", "Choix de plusieurs cibles", "Multiple targets", "sélectionner sélectionner deux joueurs choix select choose two players"],
  ["pendingActions", "run", "Actions en attente", "Pending actions", "réveils à faire rappels nuit restant wake reminders remaining"],
  ["templates", "prepare", "Modèles de partie", "Game templates", "préparer composition équipes rôles modèles setup teams roles"],
  ["exercises", "prepare", "Exercices d'entraînement", "Training exercises", "apprendre tutoriel pratiquer exercices learn tutorial practice"],
  ["compareSnapshots", "save", "Comparer les instantanés", "Compare snapshots", "différences comparer captures sauvegardes differences compare captures"],
  ["setupChecklist", "prepare", "Vérifications de préparation", "Setup checklist", "préparer vérifier contrôle liste lancement check ready start", "modal", true],
  ["privateMessage", "run", "Message privé", "Private message", "montrer joueur information réponse révéler show player information answer", "modal", true],
  ["informationNotebook", "consult", "Carnet d'informations", "Information notebook", "notes privées réponses informations historique private notes answers history"],
  ["trainingGame", "prepare", "Partie d'entraînement", "Training game", "bac à sable démo démonstration test sandbox demo practice", "transition"],
  ["safetyBackups", "save", "Sauvegardes de sécurité", "Safety backups", "récupération restaurer secours perdu automatique restore recovery lost automatic"],
  ["endCheck", "run", "Décision de fin de partie", "End-of-game decision", "victoire vainqueur gagner équipe gagnante terminer winner victory end"],
  ["lock", "run", "Verrouiller l'écran", "Lock screen", "verrou anti toucher accidentel confidentialité écran lock touch privacy screen", "overlay"],
  ["randomTool", "run", "Tirage au sort", "Random picker", "hasard aléatoire dés joueur chance dice player"],
  ["recap", "consult", "Récapitulatif", "Recap", "résumé bilan partie débrief synthèse summary overview debrief"],
  ["palette", "consult", "Palette de commandes", "Command palette", "recherche commande raccourci clavier search command keyboard shortcut"],
  ["tableMode", "run", "Écran public", "Public display", "table joueurs majorité minuteur public player display majority timer", "overlay"],
  ["validator", "prepare", "Valider la composition", "Validate composition", "vérifier rôles répartition équipe distribution setup roles team validate"],
  ["savedGames", "save", "Parties sauvegardées", "Saved games", "enregistrer charger restaurer exporter importer fichier save load restore export import file", "modal", true],
  ["gameLog", "consult", "Journal de partie", "Game log", "événements chronologie historique events timeline history"],
  ["snapshots", "save", "Instantanés", "Snapshots", "capture photo point de sauvegarde revenir checkpoint backup restore"],
  ["notes", "consult", "Notes du Conteur", "Storyteller notes", "écrire mémo carnet privé write memo notebook private"],
  ["glossary", "consult", "Glossaire", "Glossary", "règles termes définition vocabulaire rules terms definition vocabulary"],
  ["userGuide", "consult", "Guide utilisateur", "User guide", "aide manuel documentation tutoriel help manual documentation tutorial", "external", true],
  ["print", "save", "Fiche de secours à imprimer", "Printable rescue sheet", "imprimer impression papier pdf hors ligne secours print paper offline rescue", "preview", true],
  ["view:setup", "prepare", "Préparation de la partie", "Game setup", "setup réglages préparation joueurs places rôles settings seats players roles", "view", true, "setup", "⚙"],
  ["view:reference", "consult", "Référence des personnages", "Character reference", "référentiel personnages capacités rôles aide reference characters abilities roles help", "view", true, "reference", "📇"],
  ["view:scripts", "prepare", "Scripts", "Scripts", "script scénario scénarios choisir importer personnalisé scénario scenario choose import custom", "view", true, "scripts", "📜"]
].map(([key, group, fr, en, aliases, kind = "modal", essential = false, view, icon]) =>
  Object.freeze({ key, group, labels: Object.freeze({ fr, en }), aliases, kind, essential, view, icon })));

function normalizeToolSearch(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe").replace(/Œ/g, "OE").replace(/æ/g, "ae")
    .replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();
}

function buildToolboxRegistry(dockTools, options = {}) {
  const registered = new Map(), issues = [];
  if (!Array.isArray(dockTools)) issues.push({ kind: "invalid-registry" });
  for (const tool of Array.isArray(dockTools) ? dockTools : []) {
    if (!tool || typeof tool.key !== "string" || !tool.key.trim()) {
      issues.push({ kind: "invalid-tool" });
      continue;
    }
    if (registered.has(tool.key)) {
      issues.push({ kind: "duplicate", key: tool.key });
      if (typeof registered.get(tool.key).fn !== "function" && typeof tool.fn === "function") registered.set(tool.key, tool);
    } else registered.set(tool.key, tool);
  }
  const definitions = [...TOOLBOX_DEFINITIONS];
  for (const [key, tool] of registered) {
    if (!definitions.some(definition => definition.key === key)) {
      const name = tool.name && typeof tool.name === "object" ? tool.name : { fr: tool.name, en: tool.name };
      definitions.push({ key, group: "consult", labels: { fr: name.fr || key, en: name.en || key },
        aliases: "", kind: "modal", essential: false });
      issues.push({ kind: "unclassified", key });
    }
  }
  const lang = options.lang === "en" ? "en" : "fr";
  const tools = definitions.map(definition => {
    const registeredTool = registered.get(definition.key);
    const run = definition.kind === "view" ? options.views?.[definition.view] : registeredTool?.fn;
    const available = typeof run === "function";
    if (!available) issues.push({ kind: "unavailable", key: definition.key });
    const labelKey = definition.view ? "tab." + definition.view : definition.key;
    const translated = typeof options.translate === "function" ? options.translate(labelKey) : "";
    const label = translated && translated !== labelKey ? String(translated) : definition.labels[lang];
    const group = TOOLBOX_GROUPS.find(item => item.id === definition.group);
    const searchText = normalizeToolSearch([label, definition.labels.fr, definition.labels.en, definition.key,
      definition.aliases, group.fr, group.en, group.aliases, registeredTool?.name?.fr, registeredTool?.name?.en].join(" "));
    return { ...definition, label, icon: registeredTool?.icon || definition.icon || group.icon,
      available, run: available ? run : null, searchText };
  });
  return { tools, issues };
}

function searchToolbox(tools, { query = "", showAll = true, group = "all" } = {}) {
  const words = normalizeToolSearch(query).split(" ").filter(Boolean);
  // A search is global, even when a useful-tools or intention filter was selected.
  if (words.length) return tools.filter(tool => words.every(word => tool.searchText.includes(word)));
  return tools.filter(tool => (showAll || tool.essential) && (group === "all" || tool.group === group));
}

function groupToolbox(tools) {
  return TOOLBOX_GROUPS.map(group => ({ ...group, tools: tools.filter(tool => tool.group === group.id) }));
}

function canUseToolbox({ readOnly = false, playerScreen = false } = {}) {
  return !readOnly && !playerScreen;
}

function toolboxBlocked() {
  return !canUseToolbox({
    readOnly: typeof READ_ONLY !== "undefined" && READ_ONLY,
    playerScreen: typeof playerScreenActive === "function" && playerScreenActive()
  });
}

function toolboxText(fr, en) {
  return typeof S !== "undefined" && S.lang === "en" ? en : fr;
}

function currentToolboxRegistry() {
  const views = {};
  if (typeof switchView === "function") {
    for (const view of ["setup", "reference", "scripts"]) views[view] = () => switchView(view);
  }
  return buildToolboxRegistry(typeof DOCK_TOOLS === "undefined" ? [] : DOCK_TOOLS, {
    lang: typeof S === "undefined" ? "fr" : S.lang,
    translate: typeof t === "function" ? t : undefined, views
  });
}

function toolboxLeaveModal() {
  if (typeof closeAllModals === "function") closeAllModals({ restoreFocus: false });
  else closeModal();
}

function invokeToolboxTool(key) {
  if (toolboxBlocked()) return false;
  const tool = currentToolboxRegistry().tools.find(item => item.key === key);
  if (!tool?.available) {
    if (typeof toast === "function") toast(toolboxText("Outil indisponible. Rouvrez le catalogue pour vérifier.", "Tool unavailable. Reopen the catalogue to check."));
    return false;
  }
  if (tool.kind === "view" || tool.kind === "overlay") toolboxLeaveModal();
  // Modal, private-preview and external tools retain the originating catalogue. A cancelled
  // game transition must retain it too; only a successful transition leaves it.
  const result = tool.run();
  if (tool.kind === "transition" && result !== false) toolboxLeaveModal();
  return result !== false;
}

function openToolbox(showAll = false, intention = "all") {
  if (toolboxBlocked()) return null;
  const catalogue = currentToolboxRegistry();
  const state = {
    query: "", group: TOOLBOX_GROUPS.some(group => group.id === intention) ? intention : "all",
    showAll: showAll === true || !(typeof S !== "undefined" && S.settings?.essentialMode)
  };
  const root = xpNode("section", "xp-modal toolbox");
  root.dataset.xpModal = "toolbox";
  root.appendChild(xpNode("h2", "", toolboxText("Boîte à outils", "Toolbox")));
  root.appendChild(xpNode("p", "hint", toolboxText("Que souhaitez-vous faire ? Les outils sont classés par intention.",
    "What would you like to do? Tools are grouped by task.")));
  const search = xpNode("div", "toolbox-search");
  const label = xpNode("label", "", toolboxText("Rechercher un outil", "Find a tool"));
  label.htmlFor = "toolbox-search";
  const input = xpNode("input");
  input.type = "search"; input.id = "toolbox-search"; input.autocomplete = "off";
  input.spellcheck = false;
  input.dataset.xpFocus = "toolbox-search";
  input.placeholder = toolboxText("Ex. : vote, imprimer, réveil…", "E.g. vote, print, wake…");
  input.setAttribute("aria-describedby", "toolbox-search-help");
  const clear = xpButton(toolboxText("Effacer", "Clear"), () => {
    input.value = ""; state.query = ""; render(); input.focus({ preventScroll: true });
  }, "btn ghost");
  clear.id = "toolbox-clear";
  search.append(label, input, clear);
  root.appendChild(search);
  const searchHelp = xpNode("p", "hint", toolboxText(
    "La recherche parcourt toujours tous les outils, même en mode Essentiel.", "Search always covers all tools, including in Essential mode."));
  searchHelp.id = "toolbox-search-help";
  root.appendChild(searchHelp);
  const scopes = xpNode("div", "toolbox-scopes");
  scopes.setAttribute("role", "group");
  scopes.setAttribute("aria-label", toolboxText("Outils affichés", "Tools shown"));
  const useful = xpButton(toolboxText("Outils essentiels", "Essential tools"), () => { state.showAll = false; render(); });
  useful.id = "toolbox-essential";
  const all = xpButton(toolboxText("Tous les outils", "All tools") + ` (${catalogue.tools.length})`,
    () => { state.showAll = true; state.group = "all"; render(); });
  all.id = "toolbox-all";
  scopes.append(useful, all);
  root.appendChild(scopes);
  const intentions = xpNode("div", "toolbox-intentions");
  intentions.setAttribute("role", "group");
  intentions.setAttribute("aria-label", toolboxText("Filtrer par intention", "Filter by task"));
  const filters = [{ id: "all", fr: "Toutes les intentions", en: "All tasks" }, ...TOOLBOX_GROUPS];
  const groupButtons = filters.map(group => {
    const button = xpButton(toolboxText(group.fr, group.en), () => {
      state.group = group.id; state.query = ""; input.value = ""; render();
    }, "btn ghost");
    button.dataset.toolboxGroup = group.id;
    intentions.appendChild(button);
    return button;
  });
  root.appendChild(intentions);
  const status = xpNode("p", "hint toolbox-status");
  status.id = "toolbox-status"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");
  root.appendChild(status);
  const warnings = catalogue.issues.filter(issue => issue.kind !== "unavailable");
  if (warnings.length) {
    const issueBox = xpNode("details", "toolbox-issues");
    issueBox.appendChild(xpNode("summary", "", toolboxText("Catalogue à vérifier", "Catalogue needs review") + ` (${warnings.length})`));
    const list = xpNode("ul");
    const descriptions = {
      duplicate: toolboxText("Identifiant en double, affiché une seule fois", "Duplicate key, displayed once"),
      unclassified: toolboxText("Nouvel outil classé dans Consulter", "New tool listed under Consult"),
      "invalid-registry": toolboxText("Registre des outils indisponible", "Tool registry unavailable"),
      "invalid-tool": toolboxText("Une entrée du registre ne possède pas d'identifiant valide", "A registry entry has no valid identifier")
    };
    for (const issue of warnings) list.appendChild(xpNode("li", "", descriptions[issue.kind] + (issue.key ? " : " + issue.key : "")));
    issueBox.appendChild(list); root.appendChild(issueBox);
  }
  const results = xpNode("div", "toolbox-results");
  results.id = "toolbox-results";
  input.setAttribute("aria-controls", results.id);
  root.appendChild(results);
  const actions = xpNode("div", "modal-actions xp-modal-actions");
  actions.appendChild(xpButton(toolboxText("Fermer", "Close"), () => closeModal(), "btn ghost"));
  root.appendChild(actions);

  function render() {
    const searching = !!normalizeToolSearch(state.query);
    const shown = searchToolbox(catalogue.tools, state);
    useful.setAttribute("aria-pressed", !searching && !state.showAll ? "true" : "false");
    all.setAttribute("aria-pressed", searching || state.showAll ? "true" : "false");
    groupButtons.forEach(button => button.setAttribute("aria-pressed",
      button.dataset.toolboxGroup === (searching ? "all" : state.group) ? "true" : "false"));
    clear.disabled = !input.value;
    status.textContent = `${shown.length} / ${catalogue.tools.length} ` +
      toolboxText("outils", "tools") + (searching ? toolboxText(" — recherche dans tout le catalogue", " — searching the whole catalogue") : "");
    results.replaceChildren();
    if (!shown.length) {
      results.appendChild(xpNode("p", "toolbox-empty", toolboxText(
        "Aucun outil trouvé. Essayez un autre mot ou effacez la recherche.", "No tools found. Try another word or clear the search.")));
      return;
    }
    for (const group of groupToolbox(shown)) {
      if (!group.tools.length) continue;
      const section = xpNode("section", "toolbox-group");
      const heading = xpNode("h3", "", toolboxText(group.fr, group.en) + ` (${group.tools.length})`);
      heading.id = "toolbox-heading-" + group.id;
      section.setAttribute("aria-labelledby", heading.id);
      section.append(heading, xpNode("p", "hint", toolboxText(group.help.fr, group.help.en)));
      const list = xpNode("ul", "toolbox-tool-list");
      for (const tool of group.tools) {
        const item = xpNode("li");
        const button = xpButton("", () => invokeToolboxTool(tool.key), "btn toolbox-tool");
        button.dataset.toolboxKey = tool.key; button.dataset.xpFocus = "toolbox:" + tool.key;
        button.disabled = !tool.available;
        const icon = xpNode("span", "toolbox-icon", tool.icon);
        icon.setAttribute("aria-hidden", "true");
        const words = xpNode("span", "toolbox-tool-text");
        words.appendChild(xpNode("span", "", tool.label));
        let note = "";
        if (!tool.available) note = toolboxText("Indisponible — fonction non chargée", "Unavailable — function not loaded");
        else if (tool.kind === "external") note = toolboxText("Ouvre un nouvel onglet", "Opens a new tab");
        else if (tool.kind === "preview") note = toolboxText("Ouvre un aperçu privé avant impression", "Opens a private preview before printing");
        else if (tool.kind === "view") note = toolboxText("Ouvre cette vue", "Opens this view");
        else if (tool.kind === "overlay") note = toolboxText("Quitte le catalogue et affiche un écran", "Leaves the catalogue and shows a screen");
        else if (tool.kind === "transition") note = toolboxText("Ouvre une partie d'entraînement séparée", "Opens a separate training game");
        if (note) words.appendChild(xpNode("small", "toolbox-tool-note", note));
        button.append(icon, words); item.appendChild(button); list.appendChild(item);
      }
      section.appendChild(list); results.appendChild(section);
    }
  }
  input.addEventListener("input", () => { state.query = input.value; render(); });
  input.addEventListener("search", () => { state.query = input.value; render(); });
  render();
  if (openModal("", "toolbox") === false) return null;
  document.getElementById("modal").appendChild(root);
  input.focus({ preventScroll: true });
  return root;
}

function renderToolboxDock(container) {
  if (!container) return false;
  container.replaceChildren();
  if (toolboxBlocked()) return false;
  container.classList.add("toolbox-dock");
  for (const group of TOOLBOX_GROUPS) {
    const button = xpButton("", () => openToolbox(true, group.id), "dock-btn toolbox-dock-intention");
    button.dataset.toolboxIntention = group.id;
    const icon = xpNode("span", "di", group.icon); icon.setAttribute("aria-hidden", "true");
    button.append(icon, xpNode("span", "dl", toolboxText(group.fr, group.en)));
    container.appendChild(button);
  }
  const all = xpButton(toolboxText("Tous les outils", "All tools"), () => openToolbox(true), "dock-btn");
  all.id = "dock-advanced";
  container.appendChild(all);
  return true;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TOOLBOX_GROUPS, TOOLBOX_DEFINITIONS, normalizeToolSearch, buildToolboxRegistry, searchToolbox,
    groupToolbox, canUseToolbox };
}
