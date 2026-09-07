(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WakePreparation = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";
  const MAX = 80, TEXT_MAX = 4000;
  const string = (value, max = 200) => typeof value === "string" && value.length <= max;
  const object = value => value && typeof value === "object" && !Array.isArray(value);
  const timestamp = value => Number.isFinite(value) && value >= 0 ? value : 0;
  const scope = state => JSON.stringify([state.scriptId, state.phase, state.night.number, state.night.mode]);
  function context(state, step, player) {
    return {
      scope: scope(state), phase: state.phase, night: state.night.number, day: state.day.number,
      stepKey: step.key, playerId: player.id, actualRoleId: player.roleId || "",
      shownRoleId: player.shownRoleId || player.roleId || "", charId: step.charId || ""
    };
  }
  function fingerprint(state) {
    const values = [scope(state), state.bluffs, state.players.map(p => [
      p.id, p.name, p.roleId, p.shownRoleId, p.align, p.alive, p.exiled,
      p.statuses, p.manualStatuses, p.reminders, p.abilityUsage
    ])];
    // Keep a change detector, not another copy of private grimoire content.
    const text = JSON.stringify(values);
    let a = 2166136261, b = 5381;
    for (let i = 0; i < text.length; i++) {
      a = Math.imul(a ^ text.charCodeAt(i), 16777619);
      b = Math.imul(b, 33) ^ text.charCodeAt(i);
    }
    return (a >>> 0).toString(16) + ":" + (b >>> 0).toString(16);
  }
  function validContext(c, state) {
    return object(c) && c.scope === scope(state) && c.phase === state.phase &&
      c.night === state.night.number && Number.isSafeInteger(c.day) && c.day >= 0 &&
      ["stepKey", "playerId", "actualRoleId", "shownRoleId", "charId"].every(k => string(c[k])) &&
      state.players.some(p => p.id === c.playerId);
  }
  function normalize(state) {
    if (!state?.night || !Array.isArray(state.players)) return state;
    const entries = Array.isArray(state.night.preparations) ? state.night.preparations : [];
    const seen = new Set();
    state.night.preparations = entries.slice(-MAX).flatMap(entry => {
      if (!object(entry) || !string(entry.id) || !entry.id || !validContext(entry.context, state) ||
          !["number", "character", "text"].includes(entry.kind) || !string(entry.value, TEXT_MAX) ||
          !string(entry.text, TEXT_MAX) || !entry.text.trim() || !string(entry.signature, 80)) return [];
      const key = JSON.stringify([entry.context.stepKey, entry.context.playerId]);
      if (seen.has(key)) return [];
      seen.add(key);
      const c = entry.context;
      const clean = {
        id: entry.id, context: { scope: c.scope, phase: c.phase, night: c.night, day: c.day,
          stepKey: c.stepKey, playerId: c.playerId, actualRoleId: c.actualRoleId,
          shownRoleId: c.shownRoleId, charId: c.charId },
        kind: entry.kind, value: entry.value, text: entry.text, signature: entry.signature,
        preparedAt: timestamp(entry.preparedAt)
      };
      const d = entry.displayed;
      if (object(d) && string(d.id) && d.id && string(d.text, TEXT_MAX) && d.text.trim() &&
          ["number", "character", "text"].includes(d.kind) && validContext(d.context, state) &&
          d.context.stepKey === c.stepKey && d.context.playerId === c.playerId) {
        clean.displayed = { id: d.id, text: d.text, kind: d.kind,
          context: { ...clean.context, actualRoleId: d.context.actualRoleId,
            shownRoleId: d.context.shownRoleId, charId: d.context.charId },
          ts: timestamp(d.ts), recordedId: string(d.recordedId) ? d.recordedId : null };
      }
      return [clean];
    });
    return state;
  }
  function find(state, stepKey, playerId) {
    return (Array.isArray(state.night?.preparations) ? state.night.preparations : []).find(e =>
      e.context?.scope === scope(state) && e.context.stepKey === stepKey && e.context.playerId === playerId);
  }
  function stale(state, step, player, entry) {
    return !entry || JSON.stringify(entry.context) !== JSON.stringify(context(state, step, player)) ||
      entry.signature !== fingerprint(state);
  }
  function prepare(state, step, player, kind, value, text, id, now = Date.now()) {
    if (!step || !player || player.exiled || (step.playerId && step.playerId !== player.id) ||
        !["number", "character", "text"].includes(kind) || !string(value, TEXT_MAX) ||
        !string(text, TEXT_MAX) || !text.trim() || !string(id) || !id ||
        (kind === "number" && (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) ||
        (kind === "character" && !value)) throw new Error("Invalid preparation");
    normalize(state);
    const previous = find(state, step.key, player.id);
    if (!previous && state.night.preparations.length >= MAX) throw new Error("Preparation limit");
    const entry = { id, context: context(state, step, player), kind, value, text,
      signature: fingerprint(state), preparedAt: now };
    if (previous?.displayed) entry.displayed = previous.displayed;
    state.night.preparations = state.night.preparations.filter(e => e !== previous).concat(entry);
    return entry;
  }
  function display(entry, now = Date.now()) {
    if (entry.displayed?.id === entry.id) return entry.displayed;
    if (entry.displayed && !entry.displayed.recordedId) throw new Error("Record the previous display first");
    entry.displayed = {
      id: entry.id, text: entry.text, kind: entry.kind, context: { ...entry.context },
      ts: now, recordedId: null
    };
    return entry.displayed;
  }
  function record(entry, player, makeEntry) {
    const d = entry.displayed;
    if (!d || d.context.playerId !== player.id) throw new Error("Nothing displayed");
    if (!Array.isArray(player.information)) player.information = [];
    const existing = player.information.find(note => note.wakeReceipt?.id === d.id);
    if (existing) { d.recordedId = existing.id; return false; }
    if (d.recordedId) return false;
    const note = makeEntry(d.text, {
      phase: d.context.phase, night: d.context.night, day: d.context.day,
      wakeReceipt: { id: d.id, displayedAt: d.ts, stepKey: d.context.stepKey,
        actualRoleId: d.context.actualRoleId, shownRoleId: d.context.shownRoleId, kind: d.kind }
    });
    player.information.push(note);
    d.recordedId = note.id;
    return true;
  }
  return { MAX, TEXT_MAX, scope, context, fingerprint, normalize, find, stale, prepare, display, record };
});

function wakeText(fr, en) { return S.lang === "en" ? en : fr; }
const wakeEditorDrafts = new WeakMap();

function enhanceWakePreparations(steps) {
  const view = document.getElementById("view-night");
  if (!view || typeof WakePreparation === "undefined") return;
  view.querySelectorAll(".xp-wake-summary").forEach(node => node.remove());
  for (const step of steps) {
    const element = [...view.querySelectorAll(".night-step[data-key]")].find(el => el.dataset.key === step.key);
    if (!element) continue;
    const row = xpNode("div", "xp-wake-summary");
    const entry = step.playerId && WakePreparation.find(S, step.key, step.playerId);
    const label = entry ? wakeText("Information préparée · vérifier / montrer", "Information prepared · review / show") :
      wakeText("Préparer l’information", "Prepare information");
    const button = xpButton(label, () => openWakePreparation(step.key, step.playerId), "btn small ghost");
    button.dataset.wakePrepare = step.key;
    row.appendChild(button);
    if (entry) {
      const player = S.players.find(p => p.id === step.playerId);
      const status = WakePreparation.stale(S, step, player, entry) ? wakeText("À revérifier", "Review needed") :
        entry.displayed?.recordedId ? wakeText("Consignée", "Recorded") : wakeText("Prête", "Prepared");
      row.appendChild(xpNode("span", "hint", status));
    }
    element.querySelector(".nbody")?.appendChild(row);
  }
}

function openWakePreparation(stepKey, requestedPlayerId) {
  if (playerScreenActive()) return;
  const game = S, phaseScope = WakePreparation.scope(S);
  const training = typeof TRAINING !== "undefined" && TRAINING;
  const step = getNightSteps().find(s => s.key === stepKey);
  if (!step) return;
  const candidates = S.players.filter(p => !p.exiled && (!step.playerId || p.id === step.playerId));
  if (!candidates.length) return toast(t("xp.noPlayers"));
  const root = xpModal(wakeText("Information du réveil", "Wake information"), "wake:" + stepKey);
  if (typeof modalManageDraft === "function") modalManageDraft();
  if (!wakeEditorDrafts.has(game) || wakeEditorDrafts.get(game).training !== training) {
    wakeEditorDrafts.set(game, { training, values: new Map() });
  }
  const drafts = wakeEditorDrafts.get(game).values;
  for (const [key, value] of drafts) if (value.scope !== phaseScope) drafts.delete(key);
  const body = root.querySelector(".xp-modal-content");
  body.appendChild(xpNode("p", "hint", wakeText(
    "Préparez votre choix manuel. Aucune vérité n’est calculée. Affichez, masquez, revenez au Conteur, puis consignez exactement ce qui a été montré.",
    "Prepare your manual choice. No truth is calculated. Show, hide, return to the Storyteller, then record exactly what was shown.")));
  const playerSelect = xpField(body, t("xp.player"), xpSelect(candidates.map(p => [p.id, p.name]),
    candidates.some(p => p.id === requestedPlayerId) ? requestedPlayerId : candidates[0].id));
  playerSelect.disabled = !!step.playerId;
  const draftKey = () => JSON.stringify([stepKey, playerSelect.value]);
  if (typeof modalSetDiscard === "function") modalSetDiscard(() => drafts.delete(draftKey()));
  const heading = xpNode("p", "xp-wake-context");
  const warning = xpNode("p", "xp-warning"); warning.setAttribute("role", "status");
  const editor = xpNode("div", "xp-wake-editor");
  const preview = xpNode("p", "xp-note-text xp-wake-preview");
  const receipt = xpNode("p", "hint xp-wake-receipt");
  body.append(heading, warning, editor, preview, receipt);
  const kind = xpField(editor, t("xp.type"), xpSelect([
    ["number", t("xp.number")], ["character", wakeText("Un personnage", "One character")], ["text", t("xp.text")]
  ]));
  const fields = xpNode("div"); editor.appendChild(fields);
  let input, dirty = false;
  const keepDraft = () => {
    if (S !== game) return;
    xpKeepDraft(drafts, draftKey(), { scope: phaseScope, kind: kind.value, value: input.value });
    dirty = true; update();
  };
  const current = () => {
    if (S !== game || (typeof TRAINING !== "undefined" && TRAINING) !== training ||
        WakePreparation.scope(S) !== phaseScope) return null;
    const liveStep = getNightSteps().find(s => s.key === stepKey);
    const player = S.players.find(p => p.id === playerSelect.value && !p.exiled);
    return liveStep && player && (!liveStep.playerId || liveStep.playerId === player.id) ?
      { step: liveStep, player, entry: WakePreparation.find(S, stepKey, player.id) } : null;
  };
  const originalReceipt = () => S === game && WakePreparation.scope(S) === phaseScope &&
    (typeof TRAINING !== "undefined" && TRAINING) === training &&
    S.players.some(p => p.id === playerSelect.value) ? WakePreparation.find(S, stepKey, playerSelect.value) : null;
  const fail = () => toast(wakeText("Enregistrement impossible ; rien n’a été modifié.", "Unable to save; nothing was changed."));
  const options = [["", t("xp.choose")], ...(currentScript()?.characters || [])
    .filter(c => c.team !== "fabled").map(c => [c.id, loc(c.name)])];
  const renderInput = value => {
    fields.replaceChildren();
    input = kind.value === "character" ? xpSelect(options, value || "") : xpNode(kind.value === "text" ? "textarea" : "input");
    if (kind.value === "number") { input.type = "number"; input.step = "1"; }
    if (kind.value === "text") { input.rows = 4; input.maxLength = WakePreparation.TEXT_MAX; }
    if (kind.value !== "character") input.value = value ?? "";
    xpField(fields, kind.value === "character" ? wakeText("Personnage", "Character") : t("xp." + kind.value), input);
    input.addEventListener("input", keepDraft);
    input.addEventListener("change", keepDraft);
  };
  const prepare = xpButton(wakeText("Enregistrer la préparation", "Save preparation"), () => {
    const live = current();
    if (!live || xpReadOnly()) return fail();
    const value = input.value;
    const role = kind.value === "character" && options.some(([id]) => id === value) && charById(value);
    const text = kind.value === "character" ? role && loc(role.name) : value;
    if (typeof text !== "string" || !text.trim()) return toast(t("xp.invalidMessage"));
    try {
      xpSavedChange(() => WakePreparation.prepare(S, live.step,
        S.players.find(p => p.id === live.player.id), kind.value, value, text, uid()));
    } catch (_) { return fail(); }
    drafts.delete(draftKey());
    if (typeof modalCommitDraft === "function") modalCommitDraft();
    dirty = false; update(); enhanceWakePreparations(getNightSteps());
  }, "btn");
  prepare.dataset.wakeSave = "";
  const show = xpButton(wakeText("Montrer uniquement l’information", "Show information only"), () => {
    const live = current();
    if (!live?.entry || dirty || xpReadOnly() || document.hidden || WakePreparation.stale(S, live.step, live.player, live.entry)) return update();
    let displayed;
    try {
      xpSavedChange(() => {
        const entry = WakePreparation.find(S, stepKey, live.player.id);
        displayed = { ...WakePreparation.display(entry) };
      });
    } catch (_) { return fail(); }
    showPlayerScreen({
      title: t("xp.private"), lines: [displayed.text], playerId: live.player.id, kind: displayed.kind,
      onReturn: () => { if (S === game && root.isConnected) { update(); record.focus({ preventScroll: true }); } }
    });
  }, "btn gold");
  show.dataset.wakeShow = "";
  const record = xpButton(wakeText("Consigner l’information montrée", "Record displayed information"), () => {
    const entry = originalReceipt();
    if (!entry?.displayed || playerScreenActive() || xpReadOnly()) return update();
    try {
      xpSavedChange(() => WakePreparation.record(
        WakePreparation.find(S, stepKey, playerSelect.value), S.players.find(p => p.id === playerSelect.value), xpInformationEntry));
    } catch (_) { return fail(); }
    update(); enhanceWakePreparations(getNightSteps()); renderGrimoire();
  }, "btn");
  record.dataset.wakeRecord = "";
  const notebook = xpButton(t("xp.notebook"), () => openNotebook(playerSelect.value), "btn ghost");
  root.querySelector(".xp-modal-actions").prepend(prepare, show, record, notebook);
  const update = () => {
    const live = current(), entry = live?.entry || originalReceipt();
    const invalid = !live, old = live && entry && WakePreparation.stale(S, live.step, live.player, entry);
    heading.textContent = live ? `${live.player.name} · ${step.title} · ${t("xp.night")} ${S.night.number} · ` +
      `${wakeText("Réel", "Actual")}: ${loc(charById(live.player.roleId)?.name) || t("xp.noRole")} · ` +
      `${t("xp.shown")}: ${loc(charById(live.player.shownRoleId || live.player.roleId)?.name) || t("xp.noRole")}` : "";
    warning.textContent = invalid ? wakeText("Le contexte a changé. Fermez et rouvrez ce réveil.", "Context changed. Close and reopen this wake.") :
      old ? wakeText("État, effets ou personnage modifiés depuis la préparation. Vérifiez votre choix et enregistrez de nouveau avant d’afficher.",
        "State, effects or character changed since preparation. Review your choice and save again before showing.") :
      dirty ? wakeText("Modifications non enregistrées.", "Unsaved changes.") : "";
    preview.textContent = entry ? wakeText("Préparé : ", "Prepared: ") + entry.text : "";
    receipt.textContent = entry?.displayed ? wakeText("Dernier affichage exact : ", "Last exact display: ") + entry.displayed.text +
      (entry.displayed.recordedId ? wakeText(" · Consigné", " · Recorded") : wakeText(" · Non consigné", " · Not recorded")) : "";
    prepare.disabled = invalid || xpReadOnly();
    show.disabled = invalid || xpReadOnly() || !entry || old || dirty ||
      !!(entry.displayed && !entry.displayed.recordedId && entry.displayed.id !== entry.id);
    record.disabled = xpReadOnly() || !entry?.displayed || !!entry.displayed.recordedId;
  };
  const load = () => {
    const entry = current()?.entry, draft = drafts.get(draftKey());
    kind.value = draft?.kind || entry?.kind || "number";
    renderInput(draft?.value ?? entry?.value); dirty = !!draft; update();
  };
  kind.addEventListener("change", () => { renderInput(""); keepDraft(); });
  playerSelect.addEventListener("change", load);
  root.addEventListener("focusin", update);
  load();
}
