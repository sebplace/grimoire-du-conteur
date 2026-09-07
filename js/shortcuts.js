"use strict";

const SHORTCUT_DEFAULTS = Object.freeze({
  night: ["privacy", "pendingActions", "multiTargets", "informationNotebook"],
  day: ["nominate", "timer", "pendingActions", "privacy"]
});
const SHORTCUT_BAR_CACHE = new WeakMap();

function initShortcuts() {
  Object.assign(I18N.fr, {
    favourites: "Favoris par phase", playerLinks: "Liens entre joueurs",
    "sc.customize": "Personnaliser", "sc.night": "Nuit", "sc.day": "Jour",
    "sc.help": "Choisissez jusqu'à quatre raccourcis par phase. Enregistrer applique vos choix aux deux phases et corrige les entrées signalées ci-dessous.",
    "sc.invalid": "Configuration de favoris invalide. Personnalisez-la pour la corriger.",
    "sc.unavailable": "Raccourci indisponible", "sc.duplicate": "Raccourci en double",
    "sc.limit": "Quatre favoris maximum par phase. Décochez un raccourci pour en choisir un autre.",
    "sc.save": "Enregistrer", "sc.cancel": "Annuler", "sc.close": "Fermer",
    "sc.saveFailed": "Enregistrement impossible. Vos anciens favoris sont conservés.",
    "sc.stale": "La partie a changé. Rouvrez les favoris avant d'enregistrer.",
    "sc.changedTools": "La liste des outils a changé. Rouvrez les favoris pour vérifier vos choix.",
    "sc.blocked": "Indisponible en lecture seule ou sur un écran joueur.",
    "sc.nominateBlocked": "Les nominations sont disponibles le jour, avant l'exécution.",
    "sc.private": "Conteur uniquement. Liens factuels des rappels actuellement enregistrés, sans déduction de capacité ni information calculée.",
    "sc.selectPlayer": "Joueur observé", "sc.noPlayers": "Aucun joueur disponible.",
    "sc.missingPlayer": "Joueur introuvable. Choisissez un joueur présent.",
    "sc.incoming": "Sources vers ce joueur", "sc.outgoing": "Ce joueur vers d'autres cibles",
    "sc.noIncoming": "Aucun lien entrant enregistré.", "sc.noOutgoing": "Aucun lien sortant vers un autre joueur.",
    "sc.linksCount": "Liens enregistrés distincts", "sc.selfHelp": "Les rappels vers soi-même figurent uniquement dans les liens entrants et sont comptés une seule fois.",
    "sc.source": "Source enregistrée", "sc.target": "Cible", "sc.sourceRole": "Personnage source enregistré",
    "sc.reminder": "Rappel", "sc.effect": "Effet de statut enregistré", "sc.expiry": "Expiration",
    "sc.descriptive": "Rappel descriptif, sans effet de statut enregistré",
    "sc.unknown": "Non renseigné", "sc.missingSource": "Source absente de la partie",
    "sc.unknownEffect": "Effet enregistré non reconnu",
    "sc.unattributed": "Rappels sans joueur source enregistré",
    "sc.noInference": "Un personnage source seul n'identifie pas un joueur. Aucun lien n'est déduit de son rôle.",
    "sc.manual": "Effets manuels / du personnage", "sc.manualStatus": "Statut manuel",
    "sc.intrinsicDrunk": "Véritable Ivrogne : effet intrinsèque du personnage",
    "sc.noManual": "Aucun effet manuel ni effet intrinsèque de l'Ivrogne enregistré.",
    "sc.notLinks": "Ces effets ne sont pas des liens entre joueurs.",
    "sc.card": "Ouvrir la fiche", "sc.cardUnavailable": "Fiche indisponible.",
    "sc.exiled": "exilé", "sc.fabled": "Légendaire", "sc.dead": "mort",
    "sc.poisoned": "Empoisonné", "sc.drunk": "Ivre", "sc.protected": "Protégé",
    "sc.scheduled": "Échéance programmée", "sc.invalidSchedule": "Échéance inconnue ou invalide",
    "sc.dawn": "aube suivante", "sc.dusk": "crépuscule suivant", "sc.manualExpiry": "retrait manuel"
  });
  Object.assign(I18N.en, {
    favourites: "Phase favourites", playerLinks: "Player links",
    "sc.customize": "Customize", "sc.night": "Night", "sc.day": "Day",
    "sc.help": "Choose up to four shortcuts per phase. Saving applies your choices to both phases and corrects the entries reported below.",
    "sc.invalid": "Invalid favourite configuration. Customize it to correct it.",
    "sc.unavailable": "Unavailable shortcut", "sc.duplicate": "Duplicate shortcut",
    "sc.limit": "At most four favourites per phase. Uncheck one shortcut to select another.",
    "sc.save": "Save", "sc.cancel": "Cancel", "sc.close": "Close",
    "sc.saveFailed": "Could not save. Your previous favourites have been retained.",
    "sc.stale": "The game changed. Reopen favourites before saving.",
    "sc.changedTools": "The tool list changed. Reopen favourites to review your choices.",
    "sc.blocked": "Unavailable in read-only mode or on a player screen.",
    "sc.nominateBlocked": "Nominations are available during the day, before execution.",
    "sc.private": "Storyteller only. Factual links from currently recorded reminders, without inferred abilities or calculated information.",
    "sc.selectPlayer": "Observed player", "sc.noPlayers": "No players available.",
    "sc.missingPlayer": "Player not found. Choose a player who is present.",
    "sc.incoming": "Sources to this player", "sc.outgoing": "This player to other targets",
    "sc.noIncoming": "No incoming links recorded.", "sc.noOutgoing": "No outgoing links to another player.",
    "sc.linksCount": "Distinct recorded links", "sc.selfHelp": "Self-targeted reminders appear only under incoming links and are counted once.",
    "sc.source": "Recorded source", "sc.target": "Target", "sc.sourceRole": "Recorded source character",
    "sc.reminder": "Reminder", "sc.effect": "Recorded status effect", "sc.expiry": "Expiry",
    "sc.descriptive": "Descriptive reminder, with no recorded status effect",
    "sc.unknown": "Not recorded", "sc.missingSource": "Source missing from the game",
    "sc.unknownEffect": "Unrecognized recorded effect",
    "sc.unattributed": "Reminders without a recorded source player",
    "sc.noInference": "A source character alone does not identify a player. No link is inferred from their role.",
    "sc.manual": "Manual / character effects", "sc.manualStatus": "Manual status",
    "sc.intrinsicDrunk": "Actual Drunk: intrinsic character effect",
    "sc.noManual": "No manual status or intrinsic Drunk effect recorded.",
    "sc.notLinks": "These effects are not links between players.",
    "sc.card": "Open player sheet", "sc.cardUnavailable": "Player sheet unavailable.",
    "sc.exiled": "exiled", "sc.fabled": "Fabled", "sc.dead": "dead",
    "sc.poisoned": "Poisoned", "sc.drunk": "Drunk", "sc.protected": "Protected",
    "sc.scheduled": "Scheduled expiry", "sc.invalidSchedule": "Unknown or invalid scheduled expiry",
    "sc.dawn": "next dawn", "sc.dusk": "next dusk", "sc.manualExpiry": "manual removal"
  });
}

function readShortcutFavourites(settings, phase, availableKeys) {
  phase = phase === "day" ? "day" : "night";
  const available = new Set(availableKeys);
  const defaults = () => SHORTCUT_DEFAULTS[phase].filter(key => available.has(key));
  const result = { keys: [], selected: [], issues: [], source: "saved" };
  if (!settings || settings.favourites === undefined) {
    result.source = "default"; result.keys = defaults(); result.selected = result.keys.slice(); return result;
  }
  const value = settings.favourites;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    result.source = "invalid"; result.issues.push({ kind: "invalid" }); return result;
  }
  if (value[phase] === undefined) {
    result.source = "default"; result.keys = defaults(); result.selected = result.keys.slice(); return result;
  }
  if (!Array.isArray(value[phase])) {
    result.source = "invalid"; result.issues.push({ kind: "invalid" }); return result;
  }
  const seen = new Set();
  value[phase].forEach(key => {
    if (typeof key !== "string" || !key) { result.issues.push({ kind: "invalid" }); return; }
    if (seen.has(key)) { result.issues.push({ kind: "duplicate", key }); return; }
    seen.add(key);
    if (!available.has(key) || key === "favourites") { result.issues.push({ kind: "unavailable", key }); return; }
    result.selected.push(key);
  });
  if (result.selected.length > 4) result.issues.push({ kind: "limit" });
  result.keys = result.selected.slice(0, 4);
  return result;
}

function scBlocked() {
  return (typeof READ_ONLY !== "undefined" && READ_ONLY) ||
    (typeof playerScreenActive === "function" && playerScreenActive());
}
function scNode(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
}
function scButton(text, className, action) {
  const button = scNode("button", className || "btn", text);
  button.type = "button";
  button.disabled = !!scBlocked();
  button.addEventListener("click", () => { if (!scBlocked()) action(); });
  return button;
}
function scRegistry() {
  const registry = new Map();
  if (typeof DOCK_TOOLS !== "undefined") DOCK_TOOLS.forEach(tool => {
    if (!tool || typeof tool.key !== "string" || tool.key === "favourites" ||
        typeof tool.fn !== "function" || registry.has(tool.key)) return;
    registry.set(tool.key, { key: tool.key, icon: String(tool.icon || "•"), label: t(tool.key), run: tool.fn });
  });
  const extras = [
    { key: "privacy", icon: "🕶", run: () => showPrivacy() },
    { key: "timer", icon: "⏱", run: () => {
      switchView("day");
      const timer = document.getElementById("timer-card");
      if (timer) {
        timer.setAttribute("tabindex", "-1");
        timer.scrollIntoView?.({ block: "center", behavior: "auto" });
        timer.focus({ preventScroll: true });
      }
    } },
    { key: "nominate", icon: "⚖", run: () => nominatePrompt() }
  ];
  extras.forEach(tool => registry.set(tool.key, { ...tool, label: t(tool.key) }));
  return registry;
}
function scActionDisabled(key) {
  return !!scBlocked() || (key === "nominate" && (S.phase !== "day" || !!S.day?.execution));
}
function scInvoke(key) {
  const action = scRegistry().get(key);
  if (!action || scActionDisabled(key)) return false;
  action.run(); return true;
}
function scIssueText(issue) {
  return t("sc." + issue.kind) + (issue.key ? " : " + issue.key : "");
}
function renderFavourites(container = document.getElementById("favourites-bar")) {
  if (!container || !S) return null;
  const phase = S.phase === "day" ? "day" : "night";
  const registry = scRegistry();
  const preference = readShortcutFavourites(S.settings, phase, registry.keys());
  const signature = JSON.stringify({
    phase, lang: S.lang, blocked: !!scBlocked(), issues: preference.issues,
    tools: preference.keys.map(key => { const action = registry.get(key); return [key, action.icon, action.label, scActionDisabled(key)]; })
  });
  const cached = SHORTCUT_BAR_CACHE.get(container);
  if (cached?.signature === signature && cached.root.parentElement === container) return cached.root;
  const focusedKey = container.contains(document.activeElement) ? document.activeElement?.dataset?.shortcutKey : null;
  const root = scNode("div", "sc-favourites");
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", t("favourites") + " · " + t("sc." + phase));
  root.appendChild(scNode("span", "sc-favourites-phase", (phase === "night" ? "☾ " : "☀ ") + t("sc." + phase)));
  preference.keys.forEach(key => {
    const action = registry.get(key);
    const button = scButton(action.icon + " " + action.label, "btn small sc-favourite", () => scInvoke(key));
    button.dataset.shortcutKey = key;
    button.disabled = scActionDisabled(key);
    if (button.disabled) button.title = t(scBlocked() ? "sc.blocked" : "sc.nominateBlocked");
    root.appendChild(button);
  });
  const customize = scButton("☆ " + t("sc.customize"), "btn small ghost sc-customize", openFavourites);
  customize.dataset.shortcutKey = "favourites";
  root.appendChild(customize);
  if (preference.issues.length) {
    const warning = scNode("p", "sc-warning", preference.issues.map(scIssueText).join(" · "));
    warning.setAttribute("role", "status");
    root.appendChild(warning);
  }
  container.replaceChildren(root);
  SHORTCUT_BAR_CACHE.set(container, { signature, root });
  if (focusedKey) [...root.querySelectorAll("button")].find(button => button.dataset.shortcutKey === focusedKey && !button.disabled)?.focus({ preventScroll: true });
  return root;
}
function scModal(title, key) {
  openModal('<section id="sc-modal-root" class="sc-modal"></section>', key);
  const root = document.getElementById("sc-modal-root");
  if (!root) return null;
  root.appendChild(scNode("h3", "", title));
  return root;
}
function openFavourites() {
  if (scBlocked()) return null;
  const originalState = S;
  const registry = scRegistry();
  const preferences = Object.fromEntries(["night", "day"].map(phase => [phase, readShortcutFavourites(S.settings, phase, registry.keys())]));
  const drafts = Object.fromEntries(["night", "day"].map(phase => [phase, preferences[phase].selected.slice()]));
  let phase = S.phase === "day" ? "day" : "night";
  const root = scModal(t("favourites"), "shortcuts-favourites");
  if (!root) return null;
  root.appendChild(scNode("p", "hint", t("sc.help")));
  const warnings = ["night", "day"].flatMap(name => preferences[name].issues.map(issue => t("sc." + name) + " : " + scIssueText(issue)));
  if (warnings.length) root.appendChild(scNode("p", "sc-warning", warnings.join("\n")));
  const error = scNode("p", "sc-warning");
  error.setAttribute("role", "alert"); error.hidden = true;
  const tabs = scNode("div", "row sc-tabs");
  tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", t("favourites"));
  const panel = scNode("div", "sc-favourite-options");
  panel.id = "sc-favourites-panel"; panel.setAttribute("role", "tabpanel");
  const count = scNode("p", "hint");
  count.setAttribute("role", "status");
  const tabButtons = new Map();
  const saveButton = scButton(t("sc.save"), "btn gold", () => {
    if (S !== originalState) { error.textContent = t("sc.stale"); error.hidden = false; return; }
    const currentRegistry = scRegistry();
    if (Object.values(drafts).some(keys => keys.length > 4)) { error.textContent = t("sc.limit"); error.hidden = false; return; }
    if (Object.values(drafts).some(keys => keys.some(key => !currentRegistry.has(key)))) {
      error.textContent = t("sc.changedTools"); error.hidden = false; return;
    }
    const previous = S.settings;
    S.settings = { ...previous, favourites: { night: drafts.night.slice(), day: drafts.day.slice() } };
    try { save(); }
    catch (_) {
      S.settings = previous; error.textContent = t("sc.saveFailed"); error.hidden = false; return;
    }
    closeModal(); renderFavourites();
  });
  const refresh = () => {
    count.textContent = `${t("sc." + phase)} : ${drafts[phase].length} / 4`;
    saveButton.disabled = !!scBlocked() || Object.values(drafts).some(keys => keys.length > 4);
    panel.querySelectorAll("input").forEach(input => {
      input.checked = drafts[phase].includes(input.value);
      input.disabled = !!scBlocked() || (!input.checked && drafts[phase].length >= 4);
    });
  };
  const showPhase = next => {
    phase = next;
    tabButtons.forEach((button, key) => {
      button.setAttribute("aria-selected", String(key === phase));
      button.tabIndex = key === phase ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", "sc-tab-" + phase);
    panel.replaceChildren();
    registry.forEach(action => {
      const label = scNode("label", "sc-favourite-choice");
      const input = scNode("input"); input.type = "checkbox"; input.value = action.key;
      input.addEventListener("change", () => {
        if (scBlocked()) { refresh(); return; }
        if (input.checked && !drafts[phase].includes(input.value)) {
          if (drafts[phase].length >= 4) { error.textContent = t("sc.limit"); error.hidden = false; refresh(); return; }
          drafts[phase].push(input.value);
        } else if (!input.checked) drafts[phase] = drafts[phase].filter(key => key !== input.value);
        refresh();
      });
      label.append(input, scNode("span", "", action.icon + " " + action.label));
      panel.appendChild(label);
    });
    refresh();
  };
  ["night", "day"].forEach(name => {
    const button = scButton(t("sc." + name), "btn small ghost", () => showPhase(name));
    button.id = "sc-tab-" + name; button.setAttribute("role", "tab"); button.setAttribute("aria-controls", panel.id);
    button.addEventListener("keydown", event => {
      if (scBlocked() || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? "night" : event.key === "End" ? "day" : phase === "night" ? "day" : "night";
      showPhase(next); tabButtons.get(next).focus();
    });
    tabButtons.set(name, button); tabs.appendChild(button);
  });
  const actions = scNode("div", "modal-actions");
  actions.append(saveButton, scButton(t("sc.cancel"), "btn ghost", closeModal));
  root.append(error, tabs, count, panel, actions);
  showPhase(phase); tabButtons.get(phase).focus({ preventScroll: true });
  return root;
}

function getPlayerLinks(state, playerId) {
  const players = Array.isArray(state?.players) ? state.players.filter(player => player && typeof player === "object") : [];
  const selected = players.find(player => player.id === playerId) || null;
  const person = player => player ? {
    id: player.id, name: typeof player.name === "string" ? player.name : "",
    roleId: player.roleId ?? null, exiled: player.exiled === true, alive: player.alive
  } : null;
  const result = { player: person(selected), incoming: [], outgoing: [], unattributed: [], manual: [], characterEffects: [], linkCount: 0 };
  players.forEach((target, playerIndex) => {
    (Array.isArray(target.reminders) ? target.reminders : []).forEach((value, reminderIndex) => {
      const reminder = value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : { label: String(value ?? "") };
      const sourceId = typeof reminder.sourcePlayerId === "string" && reminder.sourcePlayerId.trim() ? reminder.sourcePlayerId : null;
      const entry = {
        occurrence: playerIndex + ":" + reminderIndex, sourcePlayerId: sourceId,
        source: person(players.find(player => player.id === sourceId)),
        targetPlayerId: target.id, target: person(target), reminder
      };
      if (!sourceId) {
        if (target.id === playerId) result.unattributed.push(entry);
        return;
      }
      if (target.id === playerId) result.incoming.push(entry);
      if (sourceId === playerId) result.outgoing.push(entry);
    });
  });
  if (selected) {
    result.manual = ["poisoned", "drunk", "protected"].filter(effect => selected.manualStatuses?.[effect] === true).map(effect => ({ effect, source: "manual" }));
    if (selected.roleId === "drunk") result.characterEffects.push({ effect: "drunk", source: "character" });
  }
  result.linkCount = new Set([...result.incoming, ...result.outgoing].map(link => link.occurrence)).size;
  return result;
}
function scRoleName(id) {
  return id ? loc(charById(id)?.name) || String(id) : t("sc.unknown");
}
function scPersonLabel(player, missingId) {
  if (!player) return missingId ? t("sc.missingSource") + " (" + missingId + ")" : t("sc.unknown");
  const annotations = [];
  if (player.exiled) annotations.push(t("sc.exiled"));
  if (charById(player.roleId)?.team === "fabled") annotations.push(t("sc.fabled"));
  if (player.alive === false) annotations.push(t("sc.dead"));
  return player.name + (annotations.length ? " (" + annotations.join(", ") + ")" : "");
}
function scExpiry(reminder) {
  if (reminder.expires === "scheduled") {
    if (!["night", "day"].includes(reminder.schedule?.phase) || !Number.isInteger(reminder.schedule?.number) || reminder.schedule.number < 1) return t("sc.invalidSchedule");
    return typeof expiryName === "function" ? expiryName(reminder.expires, reminder) :
      t("sc.scheduled") + " : " + t("sc." + reminder.schedule.phase) + " " + reminder.schedule.number;
  }
  if (!["dawn", "dusk", "manual"].includes(reminder.expires)) return t("sc.unknown");
  return typeof expiryName === "function" ? expiryName(reminder.expires, reminder) :
    t(reminder.expires === "manual" ? "sc.manualExpiry" : "sc." + reminder.expires);
}
function scPlayerCardButton(player, label) {
  const button = scButton(label + " : " + scPersonLabel(player), "btn small ghost", () => {
    if (!player || !S.players.some(current => current.id === player.id) || typeof openSeatModal !== "function") return;
    openSeatModal(player.id);
  });
  button.disabled = !player || !!scBlocked() || typeof openSeatModal !== "function";
  return button;
}
function scLinkCard(link) {
  const card = scNode("article", "sc-link-card");
  const source = scPersonLabel(link.source, link.sourcePlayerId);
  const target = scPersonLabel(link.target);
  card.appendChild(scNode("h5", "sc-link-direction", source + " → " + target));
  const fields = [
    [t("sc.source"), source],
    [t("sc.target"), target],
    [t("sc.sourceRole"), scRoleName(link.reminder.sourceRoleId)],
    [t("sc.reminder"), loc(link.reminder.label) || link.reminder.key || t("sc.unknown")],
    [t("sc.effect"), ["poisoned", "drunk", "protected"].includes(link.reminder.effect) ? t("sc." + link.reminder.effect) :
      link.reminder.effect ? t("sc.unknownEffect") + " : " + String(link.reminder.effect) : t("sc.descriptive")],
    [t("sc.expiry"), scExpiry(link.reminder)]
  ];
  const details = scNode("dl", "sc-link-details");
  fields.forEach(([label, value]) => details.append(scNode("dt", "", label), scNode("dd", "", value)));
  card.appendChild(details);
  const controls = scNode("div", "row");
  if (link.source) controls.appendChild(scPlayerCardButton(link.source, t("sc.card") + " (" + t("sc.source") + ")"));
  if (link.target && link.target.id !== link.source?.id) controls.appendChild(scPlayerCardButton(link.target, t("sc.card") + " (" + t("sc.target") + ")"));
  card.appendChild(controls);
  return card;
}
function openPlayerLinks(playerId) {
  if (scBlocked()) return null;
  const players = Array.isArray(S.players) ? S.players : [];
  const root = scModal(t("playerLinks"), "shortcuts-player-links");
  if (!root) return null;
  root.appendChild(scNode("p", "sc-private", t("sc.private")));
  const field = scNode("label", "sc-field", t("sc.selectPlayer"));
  const select = scNode("select");
  const initial = playerId === undefined ? players[0]?.id : playerId;
  if (!players.some(player => player.id === initial)) {
    const option = scNode("option", "", players.length ? t("sc.missingPlayer") : t("sc.noPlayers"));
    option.value = ""; select.appendChild(option);
  }
  players.forEach(player => {
    const option = scNode("option", "", scPersonLabel(player));
    option.value = player.id; select.appendChild(option);
  });
  select.value = players.some(player => player.id === initial) ? initial : "";
  select.disabled = !players.length;
  field.appendChild(select); root.appendChild(field);
  const body = scNode("div", "sc-links-body");
  root.appendChild(body);
  const render = () => {
    if (scBlocked()) return;
    body.replaceChildren();
    const links = getPlayerLinks(S, select.value);
    if (!links.player) { body.appendChild(scNode("p", "hint", players.length ? t("sc.missingPlayer") : t("sc.noPlayers"))); return; }
    body.appendChild(scNode("h4", "sc-selected-player", scPersonLabel(links.player)));
    body.appendChild(scNode("p", "sc-link-count", t("sc.linksCount") + " : " + links.linkCount));
    const columns = scNode("div", "sc-link-columns");
    const outgoing = links.outgoing.filter(link => link.targetPlayerId !== select.value);
    [
      [t("sc.incoming"), links.incoming, t("sc.noIncoming")],
      [t("sc.outgoing"), outgoing, t("sc.noOutgoing")]
    ].forEach(([title, records, empty]) => {
      const section = scNode("section", "sc-link-column");
      section.appendChild(scNode("h4", "", title + " (" + records.length + ")"));
      if (!records.length) section.appendChild(scNode("p", "hint", empty));
      records.forEach(link => section.appendChild(scLinkCard(link)));
      columns.appendChild(section);
    });
    body.appendChild(columns);
    if (links.incoming.some(link => link.sourcePlayerId === select.value)) body.appendChild(scNode("p", "hint", t("sc.selfHelp")));
    const manual = scNode("section", "sc-manual-effects");
    manual.appendChild(scNode("h4", "", t("sc.manual")));
    manual.appendChild(scNode("p", "hint", t("sc.notLinks")));
    links.manual.forEach(status => manual.appendChild(scNode("p", "", t("sc.manualStatus") + " : " + t("sc." + status.effect))));
    links.characterEffects.forEach(() => manual.appendChild(scNode("p", "", t("sc.intrinsicDrunk"))));
    if (!links.manual.length && !links.characterEffects.length) manual.appendChild(scNode("p", "hint", t("sc.noManual")));
    body.appendChild(manual);
    if (links.unattributed.length) {
      const section = scNode("section", "sc-unattributed");
      section.appendChild(scNode("h4", "", t("sc.unattributed") + " (" + links.unattributed.length + ")"));
      section.appendChild(scNode("p", "hint", t("sc.noInference")));
      links.unattributed.forEach(link => section.appendChild(scLinkCard(link)));
      body.appendChild(section);
    }
  };
  select.addEventListener("change", render);
  if (typeof modalSetRestore === "function") modalSetRestore(() => openPlayerLinks(select.value));
  const actions = scNode("div", "modal-actions");
  actions.appendChild(scButton(t("sc.close"), "btn ghost", closeModal)); root.appendChild(actions);
  render();
  (players.length ? select : actions.querySelector("button"))?.focus({ preventScroll: true });
  return root;
}

if (typeof module === "object" && module.exports) module.exports = { getPlayerLinks, readShortcutFavourites };
