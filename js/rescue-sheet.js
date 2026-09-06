"use strict";

const RESCUE_SHEET_TEXT = {
  fr: {
    rescueSheet: "Fiche de secours du Conteur", reserved: "Réservé au MJ",
    warning: "CONFIDENTIEL : cette fiche contient les véritables personnages et les effets. Ne la remettez pas aux joueurs.",
    frozen: "Cette impression capture l’état maintenant. Elle ne se mettra pas à jour.",
    checklist: "[ ] Garder cette fiche hors de vue des joueurs. [ ] Noter les changements ultérieurs à la main.",
    timestamp: "Capture", version: "Version de l’application", script: "Script", phase: "Phase actuelle",
    night: "Nuit", day: "Jour", unknown: "Non enregistré", none: "Aucun", unassigned: "Non attribué",
    unavailable: "Personnage indisponible", missingPlayer: "Joueur introuvable", unnamed: "Sans nom",
    first: "Première nuit", other: "Autres nuits", currentOrder: "Ordre de la nuit actuelle",
    upcomingOrder: "Ordre préparé pour la prochaine nuit", recordedOrder: "Ordre de nuit enregistré",
    noNight: "Aucune étape dans l’ordre fourni.", missingNight: "Ordre de nuit indisponible.",
    seating: "Places", seat: "Place", player: "Joueur", characters: "Personnages", actual: "Véritable",
    shown: "Montré", sameShown: "Identique au véritable", invalidShown: "À vérifier : personnage montré manquant ou invalide",
    alignment: "Alignement", good: "Bon", evil: "Mauvais", explicit: "explicite", fromRole: "selon le véritable personnage",
    life: "État", alive: "Vivant", dead: "Mort", exiled: "Exilé", participating: "Non exilé",
    ghost: "Vote fantôme", available: "disponible", spent: "utilisé", notYet: "non applicable tant que vivant",
    ability: "Capacité", abilityAvailable: "disponible", abilityUsed: "utilisée", abilitySpent: "utilisée sans effet",
    statuses: "Effets enregistrés", manual: "Effets manuels", intrinsic: "Effets intrinsèques",
    poisoned: "Empoisonnement", drunk: "Ivresse", protected: "Protection", yes: "oui", no: "non",
    reminders: "Rappels et effets sourcés", source: "Source", target: "Cible", reminder: "Rappel",
    key: "Clé", effect: "Effet", descriptive: "descriptif, aucun effet", duration: "Durée",
    dawn: "Retrait à l’aube", dusk: "Retrait au crépuscule", manualExpiry: "Retrait manuel",
    scheduled: "Échéance planifiée à revoir par le Conteur", schedule: "Fin de", noSource: "Source non renseignée",
    bluffs: "Bluffs choisis", validBluffs: "3 personnages bons distincts, connus et absents des véritables rôles en jeu.",
    invalidBluffs: "ATTENTION : les bluffs ne sont pas exactement 3 personnages bons distincts, connus et hors jeu.",
    teensy: "Moins de 7 joueurs de base : les bluffs habituels ne sont pas requis, sauf règle particulière.",
    done: "fait", pending: "à faire", actor: "Joueur réveillé", instruction: "Instruction enregistrée",
    votes: "Nominations et votes du jour", nominator: "Nominant", nominee: "Nominé",
    total: "Total enregistré", threshold: "Seuil figé", voters: "Votants", ghostTrace: "Votes fantômes dépensés",
    closed: "clôturée", open: "ouverte", executed: "exécution enregistrée", execution: "Exécution du jour",
    died: "Mort provoquée enregistrée", survived: "Survie / aucune nouvelle mort enregistrée", outcomeUnknown: "Résultat de l’exécution non enregistré",
    reason: "Motif", pendingActions: "Actions restant à revoir", pendingUnavailable: "Actions dérivées indisponibles ; seules les actions enregistrées sont listées.",
    kind: "Type", nextTransition: "Avant la prochaine transition", majority: "Majorité actuelle des vivants enregistrés",
    privateNotes: "Notes privées incluses explicitement", notesWarning: "Inclure les notes générales et les carnets privés. Ils peuvent contenir des secrets et de fausses informations.",
    notes: "Notes générales", notebook: "Carnet", includeNotes: "Inclure les notes privées", refresh: "Actualiser explicitement la capture",
    print: "Imprimer cette capture confidentielle", close: "Fermer", printFailed: "L’impression n’a pas pu être ouverte.",
    captureFailed: "La capture de secours n’a pas pu être préparée. Aucune donnée n’a été modifiée.",
    footer: "Grimoire du Conteur · fiche locale de secours · aucun service externe."
  },
  en: {
    rescueSheet: "Storyteller rescue sheet", reserved: "Storyteller only",
    warning: "CONFIDENTIAL: this sheet contains actual characters and effects. Do not hand it to players.",
    frozen: "This print captures the state now. It will not update.",
    checklist: "[ ] Keep this sheet out of players’ sight. [ ] Record later changes by hand.",
    timestamp: "Captured", version: "App version", script: "Script", phase: "Current phase",
    night: "Night", day: "Day", unknown: "Not recorded", none: "None", unassigned: "Unassigned",
    unavailable: "Unavailable character", missingPlayer: "Missing player", unnamed: "Unnamed",
    first: "First night", other: "Other nights", currentOrder: "Current night order",
    upcomingOrder: "Prepared order for the upcoming night", recordedOrder: "Recorded night order",
    noNight: "No steps in the supplied order.", missingNight: "Night order unavailable.",
    seating: "Seats", seat: "Seat", player: "Player", characters: "Characters", actual: "Actual",
    shown: "Shown", sameShown: "Same as actual", invalidShown: "Review: missing or invalid shown character",
    alignment: "Alignment", good: "Good", evil: "Evil", explicit: "explicit", fromRole: "from actual character",
    life: "State", alive: "Alive", dead: "Dead", exiled: "Exiled", participating: "Not exiled",
    ghost: "Ghost vote", available: "available", spent: "spent", notYet: "not applicable while alive",
    ability: "Ability", abilityAvailable: "available", abilityUsed: "used", abilitySpent: "used without effect",
    statuses: "Recorded effects", manual: "Manual effects", intrinsic: "Intrinsic effects",
    poisoned: "Poison", drunk: "Drunkenness", protected: "Protection", yes: "yes", no: "no",
    reminders: "Sourced reminders and effects", source: "Source", target: "Target", reminder: "Reminder",
    key: "Key", effect: "Effect", descriptive: "descriptive, no effect", duration: "Duration",
    dawn: "Remove at dawn", dusk: "Remove at dusk", manualExpiry: "Remove manually",
    scheduled: "Scheduled expiry for Storyteller review", schedule: "End of", noSource: "Source not recorded",
    bluffs: "Chosen bluffs", validBluffs: "3 distinct known good characters, absent from actual in-play roles.",
    invalidBluffs: "WARNING: bluffs are not exactly 3 distinct known good characters out of play.",
    teensy: "Fewer than 7 base players: usual bluffs are not required unless a special rule says otherwise.",
    done: "done", pending: "pending", actor: "Waking player", instruction: "Recorded instruction",
    votes: "Current day nominations and votes", nominator: "Nominator", nominee: "Nominee",
    total: "Recorded total", threshold: "Frozen threshold", voters: "Voters", ghostTrace: "Spent ghost votes",
    closed: "closed", open: "open", executed: "execution recorded", execution: "Current day execution",
    died: "Death caused by execution recorded", survived: "Survived / no new death recorded", outcomeUnknown: "Execution outcome not recorded",
    reason: "Reason", pendingActions: "Actions still requiring review", pendingUnavailable: "Derived actions unavailable; only recorded actions are listed.",
    kind: "Type", nextTransition: "Before the next transition", majority: "Current majority of recorded living players",
    privateNotes: "Private notes explicitly included", notesWarning: "Include general notes and private notebooks. They may contain secrets and false information.",
    notes: "General notes", notebook: "Notebook", includeNotes: "Include private notes", refresh: "Explicitly refresh capture",
    print: "Print this confidential capture", close: "Close", printFailed: "The print dialog could not be opened.",
    captureFailed: "The rescue capture could not be prepared. No game data was changed.",
    footer: "Grimoire du Conteur · local paper rescue sheet · no external service."
  }
};

const RescueSheetCore = (() => {
  const scalar = value => typeof value === "string" || typeof value === "number" ? String(value) : "";
  const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const local = (value, lang) => typeof value === "string" ? value :
    object(value) ? scalar(value[lang] ?? value.en ?? value.fr) : "";
  const number = value => Number.isSafeInteger(value) && value >= 0 ? String(value) : "?";
  const phaseNumber = value => number(object(value) ? value.number : value);
  const freeze = value => {
    if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  };
  const labels = lang => RESCUE_SHEET_TEXT[lang === "en" ? "en" : "fr"];
  function makeSheet(state, resolve, nightSteps, lang = "fr", now = Date.now(), options = {}) {
    if (!object(state) || typeof resolve !== "function" || !Number.isFinite(now) || !Number.isFinite(new Date(now).getTime())) {
      throw new Error("invalid-rescue-capture");
    }
    lang = lang === "en" ? "en" : "fr";
    const l = labels(lang), players = (Array.isArray(state.players) ? state.players : []).filter(object);
    const role = id => typeof id === "string" && id ? resolve(id) : null;
    const roleName = id => !id ? l.unassigned : local(role(id)?.name, lang) || `${l.unavailable} [${scalar(id)}]`;
    const person = id => players.find(p => p.id === id);
    const personName = (id, legacy) => {
      if (typeof id === "string" && id) return scalar(person(id)?.name) || `${l.missingPlayer} [${id}]`;
      return scalar(legacy) || l.unknown;
    };
    const bool = value => value === true ? l.yes : value === false ? l.no : l.unknown;
    const statuses = value => ["poisoned", "drunk", "protected"].map(key => `${l[key]}: ${bool(value?.[key])}`);
    const phase = value => value === "night" ? l.night : value === "day" ? l.day : l.unknown;
    const rounds = value => `${phase(value?.phase)} · ${l.night} ${phaseNumber(value?.night)} · ${l.day} ${phaseNumber(value?.day)}`;
    const reminders = [];
    const seating = players.map((p, index) => {
      const actual = role(p.roleId), shown = role(p.shownRoleId);
      const name = scalar(p.name) || l.unnamed;
      const specialShown = p.roleId === "drunk" || p.roleId === "lunatic";
      const shownValid = !specialShown || (p.shownRoleId && shown?.team === (p.roleId === "drunk" ? "townsfolk" : "demon"));
      let alignment = l.unknown;
      if (["good", "evil"].includes(p.align)) alignment = `${l[p.align]} (${l.explicit})`;
      else if (["townsfolk", "outsider", "minion", "demon"].includes(actual?.team)) {
        alignment = `${l[["minion", "demon"].includes(actual.team) ? "evil" : "good"]} (${l.fromRole})`;
      }
      for (const r of Array.isArray(p.reminders) ? p.reminders : []) {
        if (!object(r) && typeof r !== "string") continue;
        const token = object(r) ? r : { label: r };
        const expiry = ({ manual: l.manualExpiry, dawn: l.dawn, dusk: l.dusk, scheduled: l.scheduled })[token.expires] || l.unknown;
        reminders.push({
          target: `${index + 1}. ${name}`,
          source: token.sourcePlayerId ? personName(token.sourcePlayerId) : l.noSource,
          sourceRole: token.sourceRoleId ? roleName(token.sourceRoleId) : l.noSource,
          label: local(token.label, lang) || scalar(token.key) || l.unknown,
          key: scalar(token.key) || l.unknown,
          effect: ["poisoned", "drunk", "protected"].includes(token.effect) ? l[token.effect] :
            token.effect === null ? l.descriptive : l.unknown,
          duration: expiry,
          schedule: object(token.schedule) ? `${l.schedule} ${phase(token.schedule.phase)} ${number(token.schedule.number)}` :
            token.expires === "scheduled" ? l.unknown : ""
        });
      }
      const ghost = p.ghostUsed === true ? l.spent :
        p.ghostUsed === false ? p.alive === true ? l.notYet : p.alive === false ? l.available : l.unknown : l.unknown;
      return {
        seat: index + 1, name, actual: roleName(p.roleId),
        shown: p.shownRoleId ? roleName(p.shownRoleId) : specialShown ? l.unassigned : `${l.sameShown}: ${roleName(p.roleId)}`,
        shownWarning: shownValid ? "" : l.invalidShown,
        alignment, life: p.alive === true ? l.alive : p.alive === false ? l.dead : l.unknown,
        exile: p.exiled === true ? l.exiled : p.exiled === false ? l.participating : l.unknown,
        ghost, ability: ({ available: l.abilityAvailable, used: l.abilityUsed, spent: l.abilitySpent })[p.abilityUsage] || l.unknown,
        statuses: statuses(p.statuses), manualStatuses: statuses(p.manualStatuses),
        intrinsic: p.roleId === "drunk" ? l.drunk : l.none
      };
    });
    const active = players.filter(p => !p.exiled && role(p.roleId)?.team !== "fabled");
    const inPlay = new Set(active.map(p => p.roleId));
    const bluffs = Array.isArray(state.bluffs) ? state.bluffs : [];
    const validBluffs = bluffs.length === 3 && new Set(bluffs).size === 3 && bluffs.every(id =>
      typeof id === "string" && ["townsfolk", "outsider"].includes(role(id)?.team) && !inPlay.has(id));
    const nominations = (Array.isArray(state.day?.nominations) ? state.day.nominations : []).filter(object).map((n, index) => ({
      number: index + 1, nominator: personName(n.nominatorId, n.nominator), nominee: personName(n.nomineeId, n.nominee),
      votes: number(n.votes), threshold: number(n.threshold),
      state: n.executed === true ? l.executed : n.closed === true ? l.closed : n.closed === false ? l.open : l.unknown,
      voters: (Array.isArray(n.voters) ? n.voters : []).filter(id => typeof id === "string").map(id =>
        personName(id) + (Array.isArray(n.ghostVoters) && n.ghostVoters.includes(id) ? ` (${l.ghost}: ${l.spent})` : "")),
      ghostVoters: (Array.isArray(n.ghostVoters) ? n.ghostVoters : []).filter(id => typeof id === "string").map(id => personName(id))
    }));
    const execution = object(state.day?.execution) ? {
      player: personName(state.day.execution.playerId),
      outcome: state.day.execution.died === true ? l.died : state.day.execution.died === false ? l.survived : l.outcomeUnknown,
      reason: scalar(state.day.execution.reason) || l.unknown
    } : null;
    const pending = (Array.isArray(options.pendingActions) ? options.pendingActions :
      Array.isArray(state.pendingActions) ? state.pendingActions : []).filter(a => object(a) && a.status === "open").map(a => ({
      text: local(a.text, lang) || l.unknown, kind: scalar(a.kind) || l.unknown,
      player: a.playerId ? personName(a.playerId) : "", source: a.sourcePlayerId ? personName(a.sourcePlayerId) : "",
      rounds: rounds(a)
    }));
    const result = {
      lang, title: l.rescueSheet, warning: l.warning, reserved: l.reserved,
      timestamp: new Date(now).toISOString(), appVersion: scalar(options.appVersion) || l.unknown,
      script: local(options.scriptName, lang) || scalar(state.scriptId) || l.unknown,
      rounds: rounds(state), seating, reminders,
      bluffs: { names: bluffs.map(roleName), valid: validBluffs, warning: validBluffs ? l.validBluffs : l.invalidBluffs,
        teensy: active.filter(p => role(p.roleId)?.team !== "traveler").length < 7 ? l.teensy : "" },
      night: {
        title: `${state.phase === "night" ? l.currentOrder : state.phase === "day" ? l.upcomingOrder : l.recordedOrder}: ${l.night} ${phaseNumber(state.night)}`,
        mode: state.night?.mode === "first" ? l.first : state.night?.mode === "other" ? l.other : l.unknown,
        available: Array.isArray(nightSteps),
        steps: (Array.isArray(nightSteps) ? nightSteps : []).filter(object).map((step, index) => ({
          number: index + 1, done: state.night?.checked?.[step.key] === true,
          title: local(step.title, lang) || l.unknown,
          who: local(step.who, lang) || (step.playerId ? personName(step.playerId) : ""),
          instruction: local(step.text, lang) || l.unknown
        }))
      },
      day: { number: phaseNumber(state.day), majority: Math.ceil(active.filter(p => p.alive === true).length / 2),
        nominations, execution },
      pending, pendingWarning: options.pendingUnavailable === true ? l.pendingUnavailable : "",
      checklist: [l.frozen, l.checklist], footer: l.footer
    };
    if (options.includeNotes === true) {
      result.privateNotes = [];
      if (typeof state.notes === "string" && state.notes) result.privateNotes.push({ title: l.notes, text: state.notes });
      for (const p of players) for (const entry of Array.isArray(p.information) ? p.information : []) {
        if (object(entry) && typeof entry.text === "string") result.privateNotes.push({
          title: `${l.notebook}: ${scalar(p.name) || l.unnamed} · ${rounds(entry)}`, text: entry.text
        });
      }
    }
    return freeze(result);
  }
  const escape = value => scalar(value).replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const lines = values => values.map(value => `<div class="rs-text">${escape(value)}</div>`).join("");
  function renderHTML(sheet) {
    const l = labels(sheet.lang);
    const table = (headers, rows) => `<table class="rs-table"><thead><tr>${headers.map(h => `<th scope="col">${escape(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
    const cell = value => `<td>${value}</td>`;
    let html = `<header><p class="rs-confidential">${escape(sheet.reserved)}</p><h1>${escape(sheet.title)}</h1>
      <p class="rs-warning">${escape(sheet.warning)}</p>
      ${lines([`${l.timestamp}: ${sheet.timestamp}`, `${l.version}: ${sheet.appVersion}`, `${l.script}: ${sheet.script}`, `${l.phase}: ${sheet.rounds}`])}
      <div class="rs-checklist">${lines(sheet.checklist)}</div></header>`;
    for (let offset = 0; offset < sheet.seating.length; offset += 20) {
      html += `<section class="rs-player-chunk"><h2>${escape(l.seating)} ${offset + 1}-${Math.min(sheet.seating.length, offset + 20)}</h2>` +
        table([l.seat + " / " + l.player, l.characters, l.life + " / " + l.alignment, l.statuses],
          sheet.seating.slice(offset, offset + 20).map(p => `<tr>` +
            cell(lines([`${p.seat}. ${p.name}`])) +
            cell(lines([`${l.actual}: ${p.actual}`, `${l.shown}: ${p.shown}`, p.shownWarning, `${l.ability}: ${p.ability}`].filter(Boolean))) +
            cell(lines([p.life, p.exile, `${l.alignment}: ${p.alignment}`, `${l.ghost}: ${p.ghost}`])) +
            cell(lines([...p.statuses, `${l.manual}:`, ...p.manualStatuses, `${l.intrinsic}: ${p.intrinsic}`])) + `</tr>`)) + "</section>";
    }
    html += `<section><h2>${escape(l.reminders)}</h2>` + (sheet.reminders.length ? table(
      [l.source + " → " + l.target, l.reminder + " / " + l.effect, l.duration],
      sheet.reminders.map(r => `<tr>` + cell(lines([`${l.source}: ${r.source} (${r.sourceRole})`, `${l.target}: ${r.target}`])) +
        cell(lines([r.label, `${l.key}: ${r.key}`, `${l.effect}: ${r.effect}`])) + cell(lines([r.duration, r.schedule].filter(Boolean))) + `</tr>`)) :
      `<p>${escape(l.none)}</p>`) + "</section>";
    html += `<section><h2>${escape(l.bluffs)}</h2>${lines(sheet.bluffs.names)}
      <p class="rs-warning">${escape(sheet.bluffs.warning)}</p>${sheet.bluffs.teensy ? `<p>${escape(sheet.bluffs.teensy)}</p>` : ""}</section>`;
    html += `<section><h2>${escape(sheet.night.title)}</h2><p>${escape(sheet.night.mode)}</p>` +
      (sheet.night.steps.length ? table([l.done + " / " + l.pending, l.actor, l.instruction], sheet.night.steps.map(step => `<tr>` +
        cell(lines([`${step.done ? "[x]" : "[ ]"} ${step.number}. ${step.done ? l.done : l.pending}`])) +
        cell(lines([step.title, step.who].filter(Boolean))) + cell(lines([step.instruction])) + `</tr>`)) :
        `<p>${escape(sheet.night.available ? l.noNight : l.missingNight)}</p>`) + "</section>";
    html += `<section><h2>${escape(l.votes)} (${escape(l.day)} ${escape(sheet.day.number)})</h2><p>${escape(l.majority)}: ${escape(sheet.day.majority)}</p>` +
      (sheet.day.nominations.length ? table([l.nominator + " → " + l.nominee, l.total + " / " + l.threshold, l.voters],
        sheet.day.nominations.map(n => `<tr>` + cell(lines([`${n.number}. ${n.nominator} → ${n.nominee}`, n.state])) +
          cell(lines([`${l.total}: ${n.votes}`, `${l.threshold}: ${n.threshold}`])) +
          cell(lines([...(n.voters.length ? n.voters : [l.unknown]), `${l.ghostTrace}: ${n.ghostVoters.join(", ") || l.none}`])) + "</tr>")) :
        `<p>${escape(l.none)}</p>`) +
      `<h3>${escape(l.execution)}</h3>` + (sheet.day.execution ? lines([
        sheet.day.execution.player, sheet.day.execution.outcome, `${l.reason}: ${sheet.day.execution.reason}`
      ]) : `<p>${escape(l.none)}</p>`) + "</section>";
    html += `<section><h2>${escape(l.pendingActions)} (${escape(l.nextTransition)})</h2>` +
      (sheet.pendingWarning ? `<p>${escape(sheet.pendingWarning)}</p>` : "") +
      (sheet.pending.length ? `<ol>${sheet.pending.map(action => `<li>${lines([
        action.text, `${l.kind}: ${action.kind}`, action.player ? `${l.target}: ${action.player}` : "",
        action.source ? `${l.source}: ${action.source}` : "", action.rounds
      ].filter(Boolean))}</li>`).join("")}</ol>` : `<p>${escape(l.none)}</p>`) + "</section>";
    if (sheet.privateNotes) html += `<section class="rs-private-notes"><h2>${escape(l.privateNotes)}</h2>
      <p class="rs-warning">${escape(l.notesWarning)}</p>${sheet.privateNotes.map(note =>
      `<h3>${escape(note.title)}</h3>${lines([note.text])}`).join("")}</section>`;
    return html + `<footer>${escape(sheet.footer)}</footer>`;
  }
  return Object.freeze({ makeSheet, renderHTML, labels });
})();

if (typeof module === "object" && module.exports) module.exports = RescueSheetCore;

let rescueSheetSession = null;

function initRescueSheet() {
  Object.assign(I18N.fr, { rescueSheet: RESCUE_SHEET_TEXT.fr.rescueSheet });
  Object.assign(I18N.en, { rescueSheet: RESCUE_SHEET_TEXT.en.rescueSheet });
}

function rescueSheetCapture() {
  const steps = typeof getNightSteps === "function" ? getNightSteps() : null;
  let pendingActions, pendingUnavailable = false;
  if (typeof getPendingActions === "function") {
    try { pendingActions = getPendingActions(S.phase === "night" ? "day" : "night", steps); }
    catch (_) { pendingUnavailable = true; }
  }
  const options = {
    appVersion: typeof OFFLINE !== "undefined" ? OFFLINE.version : undefined,
    scriptName: typeof currentScript === "function" ? currentScript()?.meta?.name : undefined,
    pendingActions, pendingUnavailable
  };
  const now = Date.now();
  return {
    standard: RescueSheetCore.makeSheet(S, charById, steps, S.lang, now, options),
    notes: RescueSheetCore.makeSheet(S, charById, steps, S.lang, now, { ...options, includeNotes: true })
  };
}

function closeRescueSheet() {
  const session = rescueSheetSession;
  if (!session || (typeof playerScreenActive === "function" && playerScreenActive())) return;
  session.observer.disconnect();
  session.cleanup.forEach(remove => remove());
  for (const [element, attributes] of session.background) {
    for (const [name, value] of Object.entries(attributes)) {
      if (value === null) element.removeAttribute(name); else element.setAttribute(name, value);
    }
  }
  session.root.remove();
  document.body.classList.toggle("rescue-sheet-open", session.bodyClass);
  document.documentElement.classList.toggle("rescue-sheet-open", session.htmlClass);
  rescueSheetSession = null;
  if (session.focus?.isConnected) session.focus.focus({ preventScroll: true });
}

function openRescueSheet() {
  if (typeof playerScreenActive === "function" && playerScreenActive()) return;
  if (rescueSheetSession) { rescueSheetSession.root.querySelector("button")?.focus(); return; }
  const l = RescueSheetCore.labels(S.lang);
  let captured;
  try { captured = rescueSheetCapture(); }
  catch (_) { toast(l.captureFailed); return; }
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const root = node("section", "rs-overlay"); root.id = "rescue-sheet-overlay";
  root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "rescue-sheet-heading");
  const controls = node("div", "rs-controls");
  const heading = node("h2", "", l.reserved); heading.id = "rescue-sheet-heading";
  controls.append(heading, node("p", "rs-warning", l.warning), node("p", "hint", l.frozen));
  const checkLabel = node("label", "rs-notes-choice");
  const includeNotes = node("input"); includeNotes.type = "checkbox"; includeNotes.id = "rescue-include-notes";
  checkLabel.append(includeNotes, node("span", "", l.notesWarning));
  controls.appendChild(checkLabel);
  const actions = node("div", "row");
  const button = (text, id, handler) => {
    const element = node("button", "btn", text); element.type = "button"; element.id = id;
    element.addEventListener("click", handler); actions.appendChild(element); return element;
  };
  const article = node("article", "rs-sheet"); article.id = "rescue-print-sheet";
  const render = () => { article.innerHTML = RescueSheetCore.renderHTML(includeNotes.checked ? captured.notes : captured.standard); };
  button(l.refresh, "rescue-refresh", () => {
    if (typeof playerScreenActive === "function" && playerScreenActive()) return;
    try { captured = rescueSheetCapture(); render(); }
    catch (_) { toast(l.captureFailed); }
  });
  const print = button(l.print, "rescue-print", () => {
    if (typeof playerScreenActive === "function" && playerScreenActive()) return;
    try { window.print(); } catch (_) { toast(l.printFailed); }
  });
  button(l.close, "rescue-close", closeRescueSheet);
  controls.appendChild(actions);
  root.append(controls, article);
  includeNotes.addEventListener("change", render);
  render();
  const session = {
    root, focus: document.activeElement, background: new Map(), cleanup: [],
    bodyClass: document.body.classList.contains("rescue-sheet-open"),
    htmlClass: document.documentElement.classList.contains("rescue-sheet-open")
  };
  rescueSheetSession = session;
  document.body.appendChild(root);
  document.body.classList.add("rescue-sheet-open");
  document.documentElement.classList.add("rescue-sheet-open");
  const protect = () => {
    for (const child of document.body.children) {
      if (child === root) continue;
      if (!session.background.has(child)) session.background.set(child, {
        inert: child.getAttribute("inert"), "aria-hidden": child.getAttribute("aria-hidden")
      });
      child.setAttribute("inert", ""); child.setAttribute("aria-hidden", "true");
    }
  };
  protect();
  session.observer = new MutationObserver(protect); session.observer.observe(document.body, { childList: true });
  const listen = (target, type, handler, capture = false) => {
    target.addEventListener(type, handler, capture);
    session.cleanup.push(() => target.removeEventListener(type, handler, capture));
  };
  for (const type of ["keydown", "keypress", "keyup"]) listen(window, type, event => {
    if (typeof playerScreenActive === "function" && playerScreenActive()) return;
    event.stopImmediatePropagation();
    if (type !== "keydown") return;
    if (event.key === "Escape") { event.preventDefault(); closeRescueSheet(); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") { event.preventDefault(); print.click(); }
    else if (event.key === "Tab") {
      event.preventDefault();
      const focusable = [includeNotes, ...root.querySelectorAll("button")];
      const index = focusable.indexOf(document.activeElement);
      focusable[(index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
    }
  }, true);
  listen(document, "focusin", event => {
    if (!root.contains(event.target) && !(typeof playerScreenActive === "function" && playerScreenActive())) print.focus({ preventScroll: true });
  }, true);
  listen(window, "beforeprint", () => {
    root.classList.toggle("rescue-print-blocked", typeof playerScreenActive === "function" && playerScreenActive());
  });
  listen(window, "afterprint", () => root.classList.remove("rescue-print-blocked"));
  print.focus({ preventScroll: true });
}
