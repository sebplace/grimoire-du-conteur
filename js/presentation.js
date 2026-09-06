"use strict";

const PRESENTATION_TEXT = {
  fr: {
    silentCards: "Cartes de communication", progressiveDebrief: "Débrief progressif",
    "pr.recipient": "Destinataire privé", "pr.anyRecipient": "Sans destinataire",
    "pr.cardsHelp": "Le nom choisi reste côté Conteur. Seul le texte de la carte sera montré. Ces gestes ne sont pas ajoutés au carnet.",
    "pr.chooseOne": "Choisissez un joueur.", "pr.chooseTwo": "Choisissez deux joueurs.",
    "pr.useAbility": "Voulez-vous utiliser votre capacité ?", "pr.openEyes": "Ouvrez les yeux.",
    "pr.closeEyes": "Fermez les yeux.", "pr.yes": "Oui.", "pr.no": "Non.",
    "pr.privatePrep": "Préparation privée du Conteur. Rien n’est projeté à l’ouverture. Chaque personnage et événement commence décoché.",
    "pr.ongoing": "Partie encore en cours : ce débrief peut révéler des secrets. Une confirmation sera demandée avant chaque projection.",
    "pr.ongoingConfirm": "La partie est en cours. Vérifiez l’aperçu ci-dessus : son contenu sera visible par les joueurs.",
    "pr.confirmShow": "Je confirme : montrer cette étape", "pr.cancel": "Annuler",
    "pr.capture": "Capture", "pr.current": "État actuel à l’ouverture", "pr.unknownPhase": "Phase inconnue",
    "pr.night": "Nuit", "pr.day": "Jour", "pr.unknown": "Inconnu", "pr.unassigned": "Non attribué",
    "pr.captureChoice": "Capture à préparer", "pr.addCapture": "Créer une étape depuis cette capture",
    "pr.addBlank": "Créer une étape vide", "pr.previousCapture": "Capture précédente",
    "pr.noFrames": "Aucune étape préparée. Choisissez une capture pour commencer.",
    "pr.frame": "Étape", "pr.frameTitle": "Titre public de cette étape", "pr.saveTitle": "Enregistrer le titre",
    "pr.actual": "Véritable personnage", "pr.shown": "Personnage montré",
    "pr.actualWarning": "Secrets du Conteur : le véritable personnage et le personnage montré se sélectionnent séparément.",
    "pr.died": "État enregistré : mort.", "pr.revived": "État enregistré : vivant.",
    "pr.poisoned": "Empoisonnement", "pr.drunk": "Ivresse", "pr.protected": "Protection",
    "pr.on": "actif", "pr.off": "inactif", "pr.alignment": "Alignement enregistré",
    "pr.good": "Bon", "pr.evil": "Mauvais", "pr.automatic": "Automatique selon le personnage",
    "pr.unknownHint": "Capture ancienne ou incomplète : les champs manquants sont inconnus. Aucun changement n’est inventé.",
    "pr.noEvents": "Aucun changement de vie, d’effet ou d’alignement connu et comparable.",
    "pr.candidates": "Contenu préparé : cochez uniquement ce qui peut devenir public",
    "pr.preview": "Aperçu public exact", "pr.emptyPreview": "Aucun élément sélectionné. La projection est désactivée.",
    "pr.show": "Montrer cette étape", "pr.previous": "Précédente", "pr.next": "Suivante",
    "pr.reset": "Revenir au début", "pr.deleteFrame": "Supprimer cette étape",
    "pr.manual": "Texte de scène manuel", "pr.manualHelp": "Ce texte exact sera ajouté à l’étape et sélectionné pour la projection.",
    "pr.addManual": "Ajouter ce texte à l’étape", "pr.privateNotes": "Carnets privés",
    "pr.notesWarning": "Attention : une note peut contenir une fausse information ou un secret. Choisissez une seule entrée, relisez le texte exact et confirmez explicitement sa publication.",
    "pr.noteChoice": "Une entrée exacte à examiner", "pr.chooseNote": "Choisir une entrée privée",
    "pr.notePreview": "Aperçu privé de l’entrée choisie", "pr.approveNote": "J’autorise la publication de cette entrée exacte.",
    "pr.addNote": "Ajouter cette seule entrée au script public", "pr.note": "Entrée de carnet approuvée",
    "pr.noNotes": "Aucune entrée de carnet disponible dans cette capture ou la partie actuelle.",
    "pr.source": "Provenance privée", "pr.limit": "Limites : 200 étapes, 10 000 caractères par étape et 200 000 caractères pour le script sérialisé complet. Aucun contenu n’est tronqué.",
    "pr.saveFailed": "Enregistrement impossible. La préparation précédente est conservée.",
    "pr.changed": "La préparation ou la partie a changé. Vérifiez à nouveau l’aperçu avant de montrer.",
    "pr.savedCopies": "Les textes préparés sont des copies stables. Changer la partie ne change pas silencieusement ce script public."
  },
  en: {
    silentCards: "Communication cards", progressiveDebrief: "Progressive debrief",
    "pr.recipient": "Private recipient", "pr.anyRecipient": "No recipient",
    "pr.cardsHelp": "The chosen name stays on the Storyteller side. Only the card text is shown. These gestures are not added to the notebook.",
    "pr.chooseOne": "Choose one player.", "pr.chooseTwo": "Choose two players.",
    "pr.useAbility": "Would you like to use your ability?", "pr.openEyes": "Open your eyes.",
    "pr.closeEyes": "Close your eyes.", "pr.yes": "Yes.", "pr.no": "No.",
    "pr.privatePrep": "Private Storyteller preparation. Nothing is projected when opened. Every character and event starts unchecked.",
    "pr.ongoing": "Game still in progress: this debrief may reveal secrets. Confirmation is required before every projection.",
    "pr.ongoingConfirm": "The game is still in progress. Check the preview above: players will be able to see this content.",
    "pr.confirmShow": "I confirm: show this stage", "pr.cancel": "Cancel",
    "pr.capture": "Capture", "pr.current": "Current state when opened", "pr.unknownPhase": "Unknown phase",
    "pr.night": "Night", "pr.day": "Day", "pr.unknown": "Unknown", "pr.unassigned": "Unassigned",
    "pr.captureChoice": "Capture to prepare", "pr.addCapture": "Create a stage from this capture",
    "pr.addBlank": "Create a blank stage", "pr.previousCapture": "Previous capture",
    "pr.noFrames": "No stages prepared. Choose a capture to begin.",
    "pr.frame": "Stage", "pr.frameTitle": "Public title for this stage", "pr.saveTitle": "Save title",
    "pr.actual": "Actual character", "pr.shown": "Shown character",
    "pr.actualWarning": "Storyteller secrets: actual and shown characters are selected separately.",
    "pr.died": "Recorded state: dead.", "pr.revived": "Recorded state: alive.",
    "pr.poisoned": "Poison", "pr.drunk": "Drunkenness", "pr.protected": "Protection",
    "pr.on": "active", "pr.off": "inactive", "pr.alignment": "Recorded alignment",
    "pr.good": "Good", "pr.evil": "Evil", "pr.automatic": "Automatic from character",
    "pr.unknownHint": "Legacy or incomplete capture: missing fields are unknown. No changes are invented.",
    "pr.noEvents": "No known, comparable life, effect or alignment changes.",
    "pr.candidates": "Prepared content: check only what may become public",
    "pr.preview": "Exact public preview", "pr.emptyPreview": "No items selected. Projection is disabled.",
    "pr.show": "Show this stage", "pr.previous": "Previous", "pr.next": "Next",
    "pr.reset": "Return to beginning", "pr.deleteFrame": "Delete this stage",
    "pr.manual": "Manual stage text", "pr.manualHelp": "This exact text will be added to the stage and selected for projection.",
    "pr.addManual": "Add this text to the stage", "pr.privateNotes": "Private notebooks",
    "pr.notesWarning": "Warning: a note may contain false information or a secret. Choose one entry, review its exact text and explicitly approve publication.",
    "pr.noteChoice": "One exact entry to review", "pr.chooseNote": "Choose a private entry",
    "pr.notePreview": "Private preview of the chosen entry", "pr.approveNote": "I approve publication of this exact entry.",
    "pr.addNote": "Add only this entry to the public script", "pr.note": "Approved notebook entry",
    "pr.noNotes": "No notebook entries available in this capture or the current game.",
    "pr.source": "Private provenance", "pr.limit": "Limits: 200 stages, 10,000 characters per stage and 200,000 characters for the complete serialized script. No content is truncated.",
    "pr.saveFailed": "Unable to save. The previous preparation is preserved.",
    "pr.changed": "The preparation or game changed. Check the preview again before showing it.",
    "pr.savedCopies": "Prepared text is stored as stable copies. Changing the game never silently changes this public script."
  }
};

const PresentationCore = (() => {
  const MAX_FRAMES = 200, MAX_TEXT = 10000, MAX_ITEMS = 200, MAX_SERIALIZED = 200000;
  const kinds = new Set(["actual", "shown", "death", "effect", "alignment", "note", "manual"]);
  const cards = [
    ["choose1", "☝", "pr.chooseOne"], ["choose2", "✌", "pr.chooseTwo"],
    ["ability", "?", "pr.useAbility"], ["open", "◉", "pr.openEyes"],
    ["close", "◡", "pr.closeEyes"], ["yes", "✓", "pr.yes"], ["no", "✕", "pr.no"]
  ];
  const text = (lang, key) => PRESENTATION_TEXT[lang === "en" ? "en" : "fr"][key] || key;
  const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const validText = value => typeof value === "string" && value.length <= MAX_TEXT;
  const id = (value, fallback) => typeof value === "string" && value.length > 0 && value.length <= 160 ? value : fallback;
  const local = (value, lang) => typeof value === "string" ? value :
    isObject(value) ? value[lang] || value.fr || value.en || "" : "";
  const round = value => {
    const n = isObject(value) ? value.number : value;
    return Number.isInteger(n) && n >= 0 ? n : null;
  };
  const sourceCopy = source => {
    const result = {};
    if (isObject(source)) for (const key of ["captureId", "playerId", "entryId", "field"]) {
      if (typeof source[key] === "string" && source[key].length <= 160) result[key] = source[key];
    }
    return result;
  };
  const roleName = (roleId, resolve, lang) => {
    if (roleId === null || roleId === "") return text(lang, "pr.unassigned");
    if (typeof roleId !== "string") return text(lang, "pr.unknown");
    return local(resolve(roleId)?.name, lang) || roleId;
  };
  function silentCard(cardId, lang = "fr") {
    const card = cards.find(item => item[0] === cardId);
    return card ? { title: text(lang, card[2]), lines: [card[1]] } : null;
  }
  function enforceBudget(debrief) {
    if (JSON.stringify(debrief).length > MAX_SERIALIZED) {
      const error = new Error("debrief-size-limit");
      error.code = "debrief-size-limit";
      throw error;
    }
    return debrief;
  }
  function normalizeDebrief(value) {
    const frames = [], seen = new Set();
    if (isObject(value) && value.version === 1 && Array.isArray(value.frames)) {
      for (const frame of value.frames.slice(0, MAX_FRAMES)) {
        if (!isObject(frame) || !validText(frame.title)) continue;
        const frameId = id(frame.id, "frame-" + frames.length);
        if (seen.has(frameId)) continue;
        seen.add(frameId);
        const items = [], usedIds = new Set();
        let length = frame.title.length;
        for (const item of (Array.isArray(frame.items) ? frame.items : []).slice(0, MAX_ITEMS)) {
          if (!isObject(item) || !kinds.has(item.kind) || !validText(item.text) || !item.text.trim()) continue;
          const itemId = id(item.id, "item-" + items.length);
          if (usedIds.has(itemId) || length + item.text.length + 1 > MAX_TEXT) continue;
          usedIds.add(itemId); length += item.text.length + 1;
          items.push({ id: itemId, kind: item.kind, text: item.text,
            selected: item.selected === true, source: sourceCopy(item.source) });
        }
        frames.push({ id: frameId, title: frame.title, items, source: sourceCopy(frame.source) });
      }
    }
    const cursor = Number.isInteger(value?.cursor) ? Math.max(0, Math.min(frames.length - 1, value.cursor)) : 0;
    return enforceBudget({ version: 1, cursor: Math.max(0, cursor), frames });
  }
  function publicFrame(frame) {
    const clean = normalizeDebrief({ version: 1, frames: [frame] }).frames[0];
    return clean ? { title: clean.title, lines: clean.items.filter(item => item.selected).map(item => item.text) } :
      { title: "", lines: [] };
  }
  function captureLabel(capture, lang = "fr") {
    const phase = capture?.phase === "night" ? "pr.night" : capture?.phase === "day" ? "pr.day" : "pr.unknownPhase";
    return `${text(lang, phase)} · ${text(lang, "pr.night")} ${round(capture?.night) ?? "?"} · ${text(lang, "pr.day")} ${round(capture?.day) ?? "?"}`;
  }
  function captureEntries(snapshots, current, lang = "fr") {
    const entries = (Array.isArray(snapshots) ? snapshots : []).map((capture, index) => ({
      capture: Array.isArray(capture) ? { players: capture } : capture, index, current: false
    })).filter(entry => isObject(entry.capture) && Array.isArray(entry.capture.players));
    if (entries.every(entry => Number.isFinite(entry.capture.time))) {
      entries.sort((a, b) => a.capture.time - b.capture.time || a.index - b.index);
    }
    if (isObject(current)) entries.push({ capture: current, index: entries.length, current: true });
    return entries.map(entry => ({
      ...entry, id: id(entry.capture.id, entry.current ? "current" : "legacy-" + entry.index),
      label: `${text(lang, entry.current ? "pr.current" : "pr.capture")}${entry.current ? "" : " " + (entry.index + 1)} · ${captureLabel(entry.capture, lang)}`
    }));
  }
  function candidatesForCapture(capture, before, compare, resolve, lang = "fr") {
    const candidates = [], unknown = [];
    const source = { captureId: id(capture?.id, "legacy") };
    const add = (kind, content, playerId, field) => {
      if (validText(content)) candidates.push({ id: "candidate-" + candidates.length, kind, text: content,
        selected: false, source: { ...source, playerId: id(playerId, ""), field } });
    };
    for (const [index, p] of (Array.isArray(capture?.players) ? capture.players : []).entries()) {
      if (!isObject(p)) continue;
      const name = typeof p.name === "string" ? p.name : text(lang, "pr.unknown");
      if (p.roleId === undefined) unknown.push(`${name} : ${text(lang, "pr.actual")} (${text(lang, "pr.unknown")})`);
      else add("actual", `${name} : ${text(lang, "pr.actual")} = ${roleName(p.roleId, resolve, lang)}`, p.id, "roleId");
      if (p.shownRoleId === undefined) unknown.push(`${name} : ${text(lang, "pr.shown")} (${text(lang, "pr.unknown")})`);
      else if (typeof p.shownRoleId === "string" && p.shownRoleId) {
        add("shown", `${name} : ${text(lang, "pr.shown")} = ${roleName(p.shownRoleId, resolve, lang)}`, p.id, "shownRoleId");
      }
      if (!p.id || typeof p.alive !== "boolean" || p.align === undefined ||
          !isObject(p.statuses) || ["poisoned", "drunk", "protected"].some(key => typeof p.statuses[key] !== "boolean")) {
        unknown.push(`${name || index + 1} : ${text(lang, "pr.unknownHint")}`);
      }
    }
    for (const p of Array.isArray(before?.players) ? before.players : []) {
      if (!isObject(p) || !p.id || p.roleId === undefined || p.shownRoleId === undefined ||
          typeof p.alive !== "boolean" || p.align === undefined || !isObject(p.statuses) ||
          ["poisoned", "drunk", "protected"].some(key => typeof p.statuses[key] !== "boolean")) {
        unknown.push(`${text(lang, "pr.previousCapture")} · ${typeof p?.name === "string" ? p.name : text(lang, "pr.unknown")} : ${text(lang, "pr.unknownHint")}`);
      }
    }
    let eventCount = 0;
    for (const change of before && typeof compare === "function" ? compare(before, capture) : []) {
      if (!change || change.type !== "changed") continue;
      const name = typeof change.name === "string" ? change.name : text(lang, "pr.unknown");
      if (change.field === "alive" && typeof change.before === "boolean" && typeof change.after === "boolean") {
        add("death", `${name} : ${text(lang, change.after ? "pr.revived" : "pr.died")}`, change.playerId, "alive");
        eventCount++;
      } else if (change.field === "statuses") {
        for (const key of ["poisoned", "drunk", "protected"]) {
          if (typeof change.before?.[key] !== "boolean" || typeof change.after?.[key] !== "boolean" ||
              change.before[key] === change.after[key]) continue;
          add("effect", `${name} : ${text(lang, "pr." + key)} ${text(lang, change.before[key] ? "pr.on" : "pr.off")} → ${text(lang, change.after[key] ? "pr.on" : "pr.off")}`,
            change.playerId, "statuses." + key);
          eventCount++;
        }
      } else if (change.field === "align" && [null, "good", "evil"].includes(change.before) && [null, "good", "evil"].includes(change.after)) {
        add("alignment", `${name} : ${text(lang, "pr.alignment")} ${text(lang, change.before ? "pr." + change.before : "pr.automatic")} → ${text(lang, change.after ? "pr." + change.after : "pr.automatic")}`,
          change.playerId, "align");
        eventCount++;
      }
    }
    return { candidates, unknown, eventCount };
  }
  function createFrame(frameId, title, candidates, source) {
    if (!validText(title) || !Array.isArray(candidates)) throw new Error("invalid-frame");
    const frame = { id: frameId, title, source, items: candidates.map(item => ({ ...item, selected: false })) };
    const clean = normalizeDebrief({ version: 1, frames: [frame] }).frames[0];
    if (!clean || clean.items.length !== frame.items.length) throw new Error("frame-limit");
    return clean;
  }
  function addItem(debrief, frameId, item) {
    const next = normalizeDebrief(debrief);
    const frame = next.frames.find(candidate => candidate.id === frameId);
    if (!frame || !isObject(item) || !kinds.has(item.kind) || !validText(item.text) || !item.text.trim()) throw new Error("invalid-item");
    if (frame.items.length >= MAX_ITEMS || frame.title.length + frame.items.reduce((sum, row) => sum + row.text.length + 1, 0) + item.text.length + 1 > MAX_TEXT ||
        frame.items.some(row => row.id === item.id)) throw new Error("frame-limit");
    frame.items.push({ id: id(item.id, "item-" + frame.items.length), kind: item.kind,
      selected: item.selected === true, text: item.text, source: sourceCopy(item.source) });
    return enforceBudget(next);
  }
  function approveNote(debrief, frameId, note, itemId, confirmed) {
    if (confirmed !== true || !isObject(note) || !validText(note.text)) throw new Error("private-note-not-approved");
    return addItem(debrief, frameId, { id: itemId, kind: "note", selected: true, text: note.text, source: sourceCopy(note.source) });
  }
  function privateNotes(capture, captureId) {
    const notes = [];
    for (const p of Array.isArray(capture?.players) ? capture.players : []) {
      for (const entry of Array.isArray(p?.information) ? p.information : []) {
        if (!isObject(entry) || !validText(entry.text)) continue;
        notes.push({ text: entry.text, playerName: typeof p.name === "string" ? p.name : "",
          night: round(entry.night), day: round(entry.day),
          source: { captureId: id(captureId, "current"), playerId: id(p.id, ""), entryId: id(entry.id, ""), field: "information" } });
      }
    }
    return notes;
  }
  return Object.freeze({ MAX_FRAMES, MAX_TEXT, MAX_SERIALIZED, cardIds: Object.freeze(cards.map(card => card[0])),
    silentCard, normalizeDebrief, publicFrame, captureLabel, captureEntries, candidatesForCapture,
    createFrame, addItem, approveNote, privateNotes });
})();

if (typeof module === "object" && module.exports) module.exports = PresentationCore;

function initPresentation() {
  Object.assign(I18N.fr, PRESENTATION_TEXT.fr);
  Object.assign(I18N.en, PRESENTATION_TEXT.en);
}

function presentationNode(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}

function presentationField(parent, label, input) {
  return xpField(parent, label, input);
}

function presentationRenderPreview(container, frame) {
  const output = PresentationCore.publicFrame(frame);
  container.replaceChildren();
  container.appendChild(presentationNode("h3", "", output.title));
  for (const line of output.lines) container.appendChild(presentationNode("p", "pr-exact-text", line));
  if (!output.lines.length) container.appendChild(presentationNode("p", "hint", t("pr.emptyPreview")));
  return output;
}

function openSilentCards() {
  if (playerScreenActive()) return;
  const game = S;
  const root = xpModal(t("silentCards"), "silent-cards");
  if (!root) return;
  const body = root.querySelector(".xp-modal-content");
  body.appendChild(presentationNode("p", "hint", t("pr.cardsHelp")));
  presentationField(body, t("pr.recipient"), xpSelect([
    ["", t("pr.anyRecipient")],
    ...S.players.filter(p => !p.exiled && charById(p.roleId)?.team !== "fabled").map(p => [p.id, p.name])
  ]));
  const cards = presentationNode("div", "pr-silent-cards");
  for (const id of PresentationCore.cardIds) {
    const card = PresentationCore.silentCard(id, S.lang);
    const button = xpButton("", () => {
      const chosen = PresentationCore.silentCard(id, S.lang);
      showPlayerScreen({ title: chosen.title, lines: chosen.lines, kind: "gesture",
        onReturn: () => { if (S === game) openSilentCards(); } });
      closeModal();
    }, "btn pr-silent-card");
    const icon = presentationNode("span", "pr-card-icon", card.lines[0]);
    icon.setAttribute("aria-hidden", "true");
    button.append(icon, presentationNode("span", "", card.title));
    cards.appendChild(button);
  }
  body.appendChild(cards);
}

function presentationSave(next, recordHistory = true) {
  const before = S.debrief;
  const owned = Object.prototype.hasOwnProperty.call(S, "debrief");
  const undo = {};
  for (const key of ["history", "redo"]) undo[key] = {
    owned: Object.prototype.hasOwnProperty.call(S, key), value: Array.isArray(S[key]) ? S[key].slice() : S[key]
  };
  try {
    const normalized = PresentationCore.normalizeDebrief(next);
    if (recordHistory) pushHistory();
    S.debrief = normalized;
    if (save() === false) throw new Error("save-rejected");
    return true;
  } catch (error) {
    if (owned) S.debrief = before; else delete S.debrief;
    for (const key of ["history", "redo"]) {
      if (undo[key].owned) S[key] = undo[key].value; else delete S[key];
    }
    toast(t(error.code === "debrief-size-limit" ? "pr.limit" : "pr.saveFailed"));
    return false;
  }
}

function presentationReadDebrief() {
  try { return PresentationCore.normalizeDebrief(S.debrief); }
  catch (_) { toast(t("pr.limit")); return null; }
}

function openProgressiveDebrief() {
  if (playerScreenActive()) return;
  if (!presentationReadDebrief()) return;
  const game = S;
  const current = SessionCore.capture(S, charById);
  const entries = PresentationCore.captureEntries(S.snapshots, current, S.lang);
  const root = xpModal(t("progressiveDebrief"), "progressive-debrief");
  if (!root) return;
  const body = root.querySelector(".xp-modal-content");
  body.appendChild(presentationNode("p", "hint", t("pr.privatePrep")));
  body.appendChild(presentationNode("p", "hint", t("pr.savedCopies")));
  if (S.winner == null) body.appendChild(presentationNode("p", "pr-warning", t("pr.ongoing")));
  const captureSelect = presentationField(body, t("pr.captureChoice"), xpSelect(
    entries.map((entry, index) => [String(index), entry.label]), String(entries.length - 1)));
  const unknowns = presentationNode("div", "pr-capture-hints");
  body.appendChild(unknowns);
  const prepare = () => {
    const index = Number(captureSelect.value), entry = entries[index];
    if (!entry) return null;
    return { entry, data: PresentationCore.candidatesForCapture(entry.capture, entries[index - 1]?.capture,
      SessionCore.compareCaptures, charById, S.lang) };
  };
  const describe = () => {
    unknowns.replaceChildren();
    const prepared = prepare();
    if (prepared?.data.unknown.length) {
      const detail = presentationNode("details", "pr-private-source");
      detail.appendChild(presentationNode("summary", "", t("pr.unknownHint")));
      for (const line of prepared.data.unknown) detail.appendChild(presentationNode("p", "hint", line));
      unknowns.appendChild(detail);
    }
    if (!prepared?.data.eventCount) unknowns.appendChild(presentationNode("p", "hint", t("pr.noEvents")));
  };
  const addCapture = xpButton(t("pr.addCapture"), () => {
    if (S !== game) return toast(t("pr.changed"));
    const next = presentationReadDebrief(), prepared = prepare();
    if (!next) return;
    if (!prepared || next.frames.length >= PresentationCore.MAX_FRAMES) return toast(t("pr.limit"));
    try {
      next.frames.push(PresentationCore.createFrame(uid(), PresentationCore.captureLabel(prepared.entry.capture, S.lang),
        prepared.data.candidates, { captureId: prepared.entry.id }));
      next.cursor = next.frames.length - 1;
      if (presentationSave(next)) render();
    } catch (_) { toast(t("pr.limit")); }
  }, "btn");
  body.appendChild(addCapture);
  body.appendChild(xpButton(t("pr.addBlank"), () => {
    if (S !== game) return toast(t("pr.changed"));
    const next = presentationReadDebrief();
    if (!next) return;
    if (next.frames.length >= PresentationCore.MAX_FRAMES) return toast(t("pr.limit"));
    next.frames.push(PresentationCore.createFrame(uid(), t("pr.frame"), [], {}));
    next.cursor = next.frames.length - 1;
    if (presentationSave(next)) render();
  }, "btn ghost"));
  const editor = presentationNode("section", "pr-debrief-editor");
  body.appendChild(editor);
  captureSelect.addEventListener("change", describe);
  describe();

  const render = () => {
    const position = typeof xpCaptureModalPosition === "function" ? xpCaptureModalPosition(root) : null;
    editor.replaceChildren();
    const debrief = presentationReadDebrief();
    if (!debrief) return;
    const frame = debrief.frames[debrief.cursor];
    if (!frame) { editor.appendChild(presentationNode("p", "hint", t("pr.noFrames"))); return; }
    const stage = presentationField(editor, t("pr.frame"), xpSelect(debrief.frames.map((candidate, index) =>
      [String(index), `${index + 1}. ${candidate.title}`]), String(debrief.cursor)));
    const move = index => {
      if (S !== game) return toast(t("pr.changed"));
      const next = presentationReadDebrief();
      if (!next) return;
      next.cursor = Math.max(0, Math.min(next.frames.length - 1, index));
      if (presentationSave(next, false)) render();
    };
    stage.addEventListener("change", () => move(Number(stage.value)));
    const nav = presentationNode("div", "row");
    const previous = xpButton(t("pr.previous"), () => move(debrief.cursor - 1));
    const next = xpButton(t("pr.next"), () => move(debrief.cursor + 1));
    previous.disabled = debrief.cursor === 0; next.disabled = debrief.cursor === debrief.frames.length - 1;
    nav.append(previous, next, xpButton(t("pr.reset"), () => move(0)));
    editor.appendChild(nav);
    const title = presentationField(editor, t("pr.frameTitle"), presentationNode("input"));
    title.type = "text"; title.maxLength = PresentationCore.MAX_TEXT; title.value = frame.title;
    const update = (edit, recordHistory = true) => {
      if (S !== game) return toast(t("pr.changed"));
      const updated = presentationReadDebrief();
      if (!updated) return;
      const currentFrame = updated.frames.find(item => item.id === frame.id);
      if (!currentFrame) return toast(t("pr.changed"));
      edit(currentFrame, updated);
      presentationSave(updated, recordHistory);
      render();
    };
    editor.appendChild(xpButton(t("pr.saveTitle"), () => {
      if (title.value.length + frame.items.reduce((sum, item) => sum + item.text.length + 1, 0) > PresentationCore.MAX_TEXT) return toast(t("pr.limit"));
      update(chosen => { chosen.title = title.value; });
    }, "btn small"));
    editor.appendChild(presentationNode("p", "pr-warning", t("pr.actualWarning")));
    const choices = presentationNode("fieldset", "pr-choices");
    choices.appendChild(presentationNode("legend", "", t("pr.candidates")));
    for (const item of frame.items) {
      const label = presentationNode("label", "pr-choice");
      const input = presentationNode("input"); input.type = "checkbox"; input.checked = item.selected;
      input.dataset.xpFocus = "debrief-item:" + item.id;
      input.addEventListener("change", () => update(chosen => {
        const match = chosen.items.find(row => row.id === item.id);
        if (match) match.selected = input.checked;
      }));
      label.append(input, presentationNode("span", "pr-exact-text", item.text));
      choices.appendChild(label);
    }
    editor.appendChild(choices);
    const previewTitle = presentationNode("h3", "", t("pr.preview"));
    const preview = presentationNode("div", "pr-public-preview");
    editor.append(previewTitle, preview);
    const output = presentationRenderPreview(preview, frame);
    const confirmation = presentationNode("div", "pr-show-confirmation");
    const project = expected => {
      const latest = presentationReadDebrief()?.frames.find(row => row.id === frame.id);
      if (S !== game || !latest || JSON.stringify(PresentationCore.publicFrame(latest)) !== JSON.stringify(expected)) return toast(t("pr.changed"));
      showPlayerScreen({ title: expected.title, lines: expected.lines.slice(), kind: "debrief",
        onReturn: () => { if (S === game) openProgressiveDebrief(); } });
      closeModal();
    };
    const show = xpButton(t("pr.show"), () => {
      if (!output.lines.length) return;
      if (S.winner != null) return project(output);
      confirmation.replaceChildren(presentationNode("p", "pr-warning", t("pr.ongoingConfirm")),
        xpButton(t("pr.confirmShow"), () => project(output), "btn gold"),
        xpButton(t("pr.cancel"), () => confirmation.replaceChildren(), "btn ghost"));
      confirmation.querySelector("button")?.focus({ preventScroll: true });
    }, "btn gold");
    show.disabled = !output.lines.length;
    editor.append(show, confirmation);

    const manual = presentationField(editor, t("pr.manual"), presentationNode("textarea"));
    manual.rows = 3; manual.maxLength = PresentationCore.MAX_TEXT;
    editor.appendChild(presentationNode("p", "hint", t("pr.manualHelp")));
    editor.appendChild(xpButton(t("pr.addManual"), () => {
      if (S !== game) return toast(t("pr.changed"));
      try {
        const added = PresentationCore.addItem(S.debrief, frame.id, {
          id: uid(), kind: "manual", selected: true, text: manual.value, source: { field: "manual" }
        });
        if (presentationSave(added)) render();
      } catch (_) { toast(t("pr.limit")); }
    }));
    const notesSection = presentationNode("details", "pr-private-notes");
    notesSection.appendChild(presentationNode("summary", "", t("pr.privateNotes")));
    notesSection.appendChild(presentationNode("p", "pr-warning", t("pr.notesWarning")));
    const capturedEntry = entries.find(entry => entry.id === frame.source.captureId);
    const noteSources = capturedEntry && !capturedEntry.current ?
      [...PresentationCore.privateNotes(capturedEntry.capture, capturedEntry.id), ...PresentationCore.privateNotes(current, "current")] :
      PresentationCore.privateNotes(current, "current");
    if (!noteSources.length) notesSection.appendChild(presentationNode("p", "hint", t("pr.noNotes")));
    const noteSelect = presentationField(notesSection, t("pr.noteChoice"), xpSelect([
      ["", t("pr.chooseNote")], ...noteSources.map((note, index) => [
        String(index), `${note.playerName} · ${t("pr.night")} ${note.night ?? "?"} · ${t("pr.day")} ${note.day ?? "?"} · ${index + 1}`
      ])
    ], ""));
    const notePreview = presentationNode("div", "pr-note-preview");
    notePreview.appendChild(presentationNode("h4", "", t("pr.notePreview")));
    const exact = presentationNode("p", "pr-exact-text");
    const provenance = presentationNode("p", "hint");
    notePreview.append(exact, provenance);
    notesSection.appendChild(notePreview);
    const approveLabel = presentationNode("label", "pr-choice");
    const approve = presentationNode("input"); approve.type = "checkbox";
    approveLabel.append(approve, presentationNode("span", "", t("pr.approveNote")));
    notesSection.appendChild(approveLabel);
    const addNote = xpButton(t("pr.addNote"), () => {
      if (S !== game) return toast(t("pr.changed"));
      const chosen = noteSelect.value === "" ? null : noteSources[Number(noteSelect.value)];
      try {
        const added = PresentationCore.approveNote(S.debrief, frame.id, chosen, uid(), approve.checked);
        if (presentationSave(added)) render();
      } catch (_) { toast(t("pr.limit")); }
    });
    addNote.disabled = true;
    const noteChanged = () => {
      const chosen = noteSelect.value === "" ? null : noteSources[Number(noteSelect.value)];
      exact.textContent = chosen?.text || "";
      provenance.textContent = chosen ? `${t("pr.source")} : ${chosen.playerName} · ${chosen.source.captureId}` : "";
      addNote.disabled = !chosen || !approve.checked;
    };
    noteSelect.addEventListener("change", () => { approve.checked = false; noteChanged(); });
    approve.addEventListener("change", noteChanged);
    notesSection.appendChild(addNote);
    editor.appendChild(notesSection);
    editor.appendChild(xpButton(t("pr.deleteFrame"), () => update((chosen, updated) => {
      updated.frames = updated.frames.filter(candidate => candidate.id !== chosen.id);
    }), "btn ghost"));
    if (position && typeof xpRestoreModalPosition === "function") xpRestoreModalPosition(root, position);
  };
  render();
}
