"use strict";

const ESSENTIAL_TOOLS = new Set(["roleTour", "privateMessage", "silentCards", "guidedVote", "savedGames", "print", "userGuide", "feedback", "interfaceMode"]);

function initUsability() {
  Object.assign(I18N.fr, {
    interfaceMode: "Interface Essentiel / Complet", advancedTools: "Tous les outils",
    seatPlacement: "Placement des sièges", historyPreview: "Aperçu de l'annulation", roleAssistance: "Aide proposée par l'app"
  });
  Object.assign(I18N.en, {
    interfaceMode: "Essential / Full interface", advancedTools: "All tools",
    seatPlacement: "Seat placement", historyPreview: "Undo preview", roleAssistance: "App assistance"
  });
}

function setEssentialMode(enabled) {
  if (READ_ONLY || playerScreenActive()) return toast(tr("Modification indisponible.", "Change unavailable."));
  S.settings.essentialMode = !!enabled;
  if (enabled) S.night.guided = true;
  save(); applyInterfaceMode(); buildDock();
  if (enabled && !["grimoire", "night", "day"].includes(currentView)) switchView("grimoire");
  else renderAll();
}

function applyInterfaceMode() {
  const essential = !!S.settings.essentialMode;
  document.body.classList.toggle("essential-mode", essential);
  document.body.classList.toggle("seat-placement", !!S.settings.seatPlacement);
  const root = $("#interface-controls"); if (!root) return;
  const key = [essential, !!S.settings.seatPlacement, S.lang, READ_ONLY].join(":");
  if (root.dataset.modeKey !== key) {
    root.dataset.modeKey = key;
    root.innerHTML = `<button class="btn small" id="ui-mode" aria-pressed="${essential}" ${READ_ONLY ? "disabled" : ""}>${essential ? tr("Essentiel", "Essential") : tr("Complet", "Full")} ▾</button>
      <span class="interface-hint">${essential ? tr("Les autres fonctions restent dans Tous les outils.", "Other functions remain in All tools.") : tr("Toutes les fonctions sont accessibles.", "All functions are available.")}</span>`;
    $("#ui-mode").onclick = () => openInterfaceMode();
  }
  const message = $("#btn-messages");
  if (message) message.textContent = tr("Messages", "Messages");
  const tools = $("#btn-tools");
  if (tools) tools.textContent = essential ? tr("Plus d'outils", "More tools") : t("tools");
}

function openInterfaceMode() {
  openModal(`<h3>${t("interfaceMode")}</h3>
    <p class="hint">${tr("Essentiel garde le grimoire, la nuit guidée, les votes et les messages. Aucun personnage, effet ou outil n'est supprimé. Vos favoris restent disponibles.", "Essential keeps the grimoire, guided night, voting and messages. No character, effect or tool is removed. Your favourites remain available.")}</p>
    <div class="row"><button class="btn ${S.settings.essentialMode ? "gold" : ""}" id="mode-essential">${tr("Utiliser Essentiel", "Use Essential")}</button><button class="btn ${S.settings.essentialMode ? "" : "gold"}" id="mode-full">${tr("Utiliser Complet", "Use Full")}</button></div>
    <h3>${tr("Affichage et langue", "Display and language")}</h3>
    <div class="row">
      <button class="btn" id="mode-fr" aria-pressed="${S.lang === "fr"}">Français</button>
      <button class="btn" id="mode-en" aria-pressed="${S.lang === "en"}">English</button>
      <button class="btn" id="mode-fullscreen">${tr("Plein écran", "Fullscreen")}</button>
      <button class="btn" id="mode-sound" aria-pressed="${!!S.sound}">${tr("Sons", "Sound")} : ${S.sound ? tr("activés", "on") : tr("désactivés", "off")}</button>
    </div>
    <div class="modal-actions"><button class="btn ghost" onclick="closeModal()">${t("close")}</button></div>`, "interface-mode");
  $("#mode-essential").onclick = () => { setEssentialMode(true); closeModal(); };
  $("#mode-full").onclick = () => { setEssentialMode(false); closeModal(); };
  $("#mode-fr").onclick = () => { setLang("fr"); openInterfaceMode(); };
  $("#mode-en").onclick = () => { setLang("en"); openInterfaceMode(); };
  $("#mode-fullscreen").onclick = toggleFullscreen;
  $("#mode-sound").onclick = () => { $("#btn-sound").click(); openInterfaceMode(); };
}

function toggleSeatPlacement() {
  if (READ_ONLY || playerScreenActive()) return toast(tr("Placement indisponible.", "Placement unavailable."));
  S.settings.seatPlacement = !S.settings.seatPlacement;
  save(); applyInterfaceMode(); renderGrimoire();
  toast(S.settings.seatPlacement ? tr("Placement activé : glissez les sièges pour les organiser.", "Placement enabled: drag seats to arrange them.") : tr("Mode Partie : sièges verrouillés, rappels et fiches utilisables.", "Play mode: seats locked, reminders and player cards remain usable."));
}

function isEssentialTool(tool) { return ESSENTIAL_TOOLS.has(tool.key); }

function historyDescription(direction = "undo") {
  const target = (direction === "redo" ? S.redo : S.history)?.at(-1);
  if (!target) return null;
  return UsabilityCore.describeHistory(snapshot(), target, charById, S.lang, direction);
}

function historyActionLabel(direction = "undo") {
  const description = historyDescription(direction);
  return t(direction) + (description?.title ? " : " + description.title : "");
}

function updateUndoUI() {
  for (const [id, direction] of [["g-undo", "undo"], ["g-redo", "redo"]]) {
    const button = $("#" + id); if (!button) continue;
    const description = historyDescription(direction);
    const text = t(direction) + (description?.title ? " : " + description.title : "");
    button.disabled = !description || READ_ONLY;
    button.textContent = (direction === "undo" ? "↶ " : "↪ ") + text;
    button.title = text; button.setAttribute("aria-label", text);
    button.onclick = () => openHistoryPreview(direction);
  }
}

function historyFingerprint() {
  const state = snapshot();
  delete state.timer; delete state._view;
  return JSON.stringify(state);
}

function openHistoryPreview(direction = "undo") {
  if (READ_ONLY || playerScreenActive()) return;
  const target = (direction === "redo" ? S.redo : S.history)?.at(-1);
  const description = historyDescription(direction);
  if (!target || !description) return toast(t("nothingUndo"));
  const game = S, fingerprint = historyFingerprint();
  openModal(`<h3>${escapeHtml(historyActionLabel(direction))}</h3>
    <p class="hint">${tr("Aperçu privé : état actuel → état restauré. Le minuteur sera mis en pause. Les préférences et les retours locaux ne sont pas restaurés.", "Private preview: current state → restored state. The timer will pause. Preferences and local feedback are not restored.")}</p>
    <div class="history-preview">${description.changes.map(change => `<article><strong>${escapeHtml(change.label)}</strong><div>${escapeHtml(change.current)} → ${escapeHtml(change.target)}</div></article>`).join("") || `<p>${tr("Aucun changement connu dans les champs comparables.", "No known change in comparable fields.")}</p>`}</div>
    ${description.partial ? `<p class="hint">${tr("Historique partiel : certains anciens champs ne sont pas connus.", "Partial history: some older fields are unknown.")}</p>` : ""}
    <div class="modal-actions"><button class="btn gold" id="history-apply">${t(direction)}</button><button class="btn ghost" onclick="closeModal()">${t("cancel")}</button></div>`);
  $("#history-apply").onclick = () => {
    if (READ_ONLY || S !== game || fingerprint !== historyFingerprint() || (direction === "redo" ? S.redo : S.history)?.at(-1) !== target) {
      toast(tr("La partie a changé. Rouvrez l'aperçu.", "The game changed. Reopen the preview.")); return;
    }
    closeModal(); direction === "redo" ? redo() : undo();
  };
}

function roleAssistanceHTML(role, shown = false) {
  if (!role) return "";
  const support = UsabilityCore.roleAssistance(role, { standardRole: masterRole(role.id), lang: S.lang });
  const yes = tr("Disponible", "Available"), manual = tr("Manuel", "Manual");
  const rows = [
    [tr("Réveils prévus", "Scheduled wakes"), [support.wake.first ? t("nightFirst") : "", support.wake.other ? t("nightOther") : ""].filter(Boolean).join(" · ") || tr("Aucun dans les données de ce personnage", "None in this character's data")],
    [tr("Rappels prédéfinis", "Predefined reminders"), support.reminders ? yes : manual],
    [tr("Pose de rappels sur cibles", "Targeted reminders"), support.targets ? yes : manual],
    [tr("Choix de deux cibles", "Two-target choice"), support.multiTargets ? yes : manual],
    [tr("Suggestion d'information", "Information suggestion"), support.information ? tr("Calcul indicatif, à arbitrer", "Advisory calculation, adjudicate") : tr("Pas de calcul automatique", "No automatic calculation")]
  ];
  return `<details class="role-assistance"><summary>${t("roleAssistance")}</summary>
    ${shown ? `<p class="hint">${tr("Cette aide décrit le personnage montré. Elle ne lui donne pas sa capacité réelle.", "This describes the shown character. It does not grant its ability.")}</p>` : ""}
    <dl>${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>
    ${[...(support.warnings || []), ...(support.manual || [])].map(message => `<p class="hint">${escapeHtml(loc(message))}</p>`).join("")}
    <p class="hint">${tr("Les capacités, enregistrements particuliers, protections et conditions de victoire restent des décisions du MJ. Cette liste n'est pas une certification du script.", "Abilities, special registration, protection and win conditions remain Storyteller decisions. This list does not certify the script.")}</p></details>`;
}
