"use strict";

const EXPERIENCE_TEXT = {
  fr: {
    setupChecklist: "Vérifications de préparation", privateMessage: "Message privé",
    informationNotebook: "Carnet d’informations", trainingGame: "Partie d’entraînement",
    safetyBackups: "Sauvegardes de sécurité",
    "xp.private": "Information privée", "xp.hide": "Masquer l’information",
    "xp.neutral": "Écran masqué", "xp.handBack": "Rendez l’appareil au Conteur.",
    "xp.return": "Retour au Conteur", "xp.close": "Fermer", "xp.cancel": "Annuler",
    "xp.bluffs": "Ces personnages ne sont PAS en jeu",
    "xp.invalidBluffs": "Choisissez exactement 3 personnages bons distincts du script, qui ne sont pas réellement en jeu.",
    "xp.message": "Message privé", "xp.player": "Joueur", "xp.type": "Type d’information",
    "xp.number": "Nombre", "xp.characters": "Deux personnages", "xp.alignment": "Alignement",
    "xp.text": "Texte libre", "xp.good": "Bon", "xp.evil": "Mauvais",
    "xp.firstCharacter": "Premier personnage", "xp.secondCharacter": "Second personnage",
    "xp.choose": "Choisir…", "xp.show": "Afficher et consigner",
    "xp.privateHelp": "Choisissez uniquement ce que le joueur doit lire, y compris une fausse information décidée par le Conteur. « Afficher » consigne ce texte exact dans son carnet. Masquez l’écran avant de reprendre l’appareil ; revenez ensuite explicitement au Conteur.",
    "xp.invalidMessage": "Choisissez un joueur et renseignez une information valide ; les deux personnages doivent être distincts.",
    "xp.recorded": "Information privée consignée", "xp.noPlayers": "Ajoutez d’abord un joueur.",
    "xp.notebook": "Carnet d’informations", "xp.notebookHelp": "Notes privées du Conteur : notez ce qui a été communiqué, pas une vérité calculée. Ajouter ou modifier une note n’affiche rien au joueur.",
    "xp.emptyNotebook": "Aucune information consignée.", "xp.add": "Ajouter une note",
    "xp.edit": "Modifier", "xp.delete": "Supprimer", "xp.confirmDelete": "Confirmer la suppression",
    "xp.save": "Enregistrer", "xp.phase": "Phase", "xp.night": "Nuit", "xp.day": "Jour",
    "xp.invalidNote": "Saisissez un texte et des numéros de nuit/jour valides.",
    "xp.shown": "Personnage montré", "xp.drunkRequired": "Requis : choisissez un Villageois à montrer à l’Ivrogne.",
    "xp.drunkHelp": "L’Ivrogne reste son véritable personnage. Le Villageois montré guide son réveil et les informations que vous choisissez ; il ne devient pas un vrai Villageois en jeu.",
    "xp.lunaticHelp": "Le Démon montré au Lunatique est une croyance, pas son véritable personnage. Le Conteur gère ses choix et les informations transmises.",
    "xp.usage": "Utilisation de la capacité", "xp.available": "Disponible",
    "xp.used": "Utilisée", "xp.spent": "Utilisée sans effet",
    "xp.usageHelp": "Suivi manuel pour le personnage actuel, notamment les capacités à usage unique. Une utilisation sans effet peut consommer l’usage ; vérifiez la règle du personnage. Ce suivi ne change ni les statuts ni les rappels.",
    "xp.roleHelp": "Repères du Conteur", "xp.genericHelp": "Distinguez le véritable personnage, ce qui est montré et les informations reçues. Un rappel placé sur une cible appartient à sa source ; retirer une source ne doit pas effacer les autres effets.",
    "xp.fortuneHelp": "Vérifiez le Leurre choisi à la préparation. Les informations montrées restent une décision du Conteur, en tenant compte des effets actifs.",
    "xp.washerHelp": "Préparez les deux cibles comme un ensemble : un rappel Villageois et un rappel Erroné, avec leur source Lavandière.",
    "xp.poisonHelp": "Le poison est un effet distinct du personnage de la cible. Suivez sa source et sa durée sans changer le rôle attribué.",
    "xp.monkHelp": "La protection doit rester associée à sa source et à sa durée ; elle ne signifie pas que toute cause de mort est empêchée.",
    "xp.setup": "Vérifications de préparation", "xp.advisory": "Aide de préparation, pas une validation complète des règles. Les interactions, exceptions et scripts personnalisés restent à vérifier par le Conteur.",
    "xp.rolesComplete": "Personnages attribués et présents dans le script",
    "xp.drunkCheck": "Personnages montrés valides pour les Ivrognes",
    "xp.bluffCheck": "Trois bluffs bons, distincts et hors jeu",
    "xp.bluffOptional": "Bluffs facultatifs : valides si renseignés",
    "xp.teensy": "Moins de 7 joueurs : les informations habituelles de première nuit du Démon et des Sbires, dont les bluffs, ne sont pas requises (sauf règle particulière).",
    "xp.fortuneCheck": "Voyante : exactement un rappel Leurre avec sa source",
    "xp.washerCheck": "Lavandière : paire Villageois / Erroné sur deux joueurs distincts",
    "xp.manualSetup": "J’ai vérifié les autres instructions de préparation du script.",
    "xp.manualJinx": "J’ai vérifié les interactions et les jinx du script.",
    "xp.checkCount": "Vérifications satisfaites", "xp.openSetup": "Ouvrir Setup",
    "xp.openNight": "Ouvrir la nuit", "xp.reviewBluffs": "Vérifier les bluffs",
    "xp.notApplicable": "Non applicable", "xp.review": "À vérifier", "xp.ok": "OK",
    "xp.gmOnly": "Conteur uniquement — vrais personnages", "xp.noRole": "Aucun personnage",
    "xp.alive": "Vivant", "xp.dead": "Mort", "xp.ghostAvailable": "Vote fantôme disponible",
    "xp.ghostUsed": "Vote fantôme utilisé", "xp.infos": "informations",
    "xp.poisoned": "Empoisonné", "xp.drunk": "Ivre", "xp.protected": "Protégé",
    "xp.guided": "Guidé", "xp.full": "Tout voir", "xp.previous": "Précédent",
    "xp.next": "Suivant", "xp.step": "Étape", "xp.noSteps": "Aucune étape de nuit.",
    "xp.tools": "Outils du Conteur",
    roleDistribution: "Distribution privée des rôles", multiTargetPicker: "Choisir deux cibles",
    roleTour: "Distribution privée des rôles", multiTargets: "Choisir deux cibles",
    "xp.roleAcknowledged": "Personnage actuel montré au joueur.",
    "xp.tourHelp": "Sélectionnez un joueur, confirmez l’affichage, puis masquez l’écran avant de reprendre l’appareil. Le retour propose le prochain joueur sans afficher son personnage.",
    "xp.revealed": "Déjà montré", "xp.notRevealed": "À montrer", "xp.tourDone": "Tous les personnages actuels ont été montrés.",
    "xp.showCharacter": "Montrer à ce joueur", "xp.yourCharacter": "Votre personnage",
    "xp.invalidShown": "Choisissez un personnage montré valide dans la fiche du joueur.",
    "xp.saveFailed": "Enregistrement impossible. Aucune nouvelle information n’a été affichée.",
    "xp.source": "Joueur source", "xp.targetKind": "Type de choix", "xp.customTargets": "Choix libre",
    "xp.targetHelp": "Touchez exactement deux joueurs dans l’ordre des sièges. Les rappels sont descriptifs : aucune vérité, capacité ou transition n’est décidée automatiquement.",
    "xp.targetImpaired": "Source ivre ou empoisonnée : aucune capacité n’est appliquée. Ces rappels sont uniquement descriptifs ; choisissez vous-même l’information.",
    "xp.noSource": "Aucune source compatible. Utilisez Choix libre ou vérifiez les personnages montrés.",
    "xp.targetOne": "Première cible", "xp.targetTwo": "Seconde cible", "xp.seat": "Siège",
    "xp.targetOrder": "Ordre de sélection", "xp.result": "Réponse choisie par le Conteur",
    "xp.yes": "Oui", "xp.no": "Non", "xp.noInfo": "Aucune information",
    "xp.targetNote": "Note privée facultative", "xp.saveTargets": "Enregistrer le choix",
    "xp.showTargets": "Enregistrer et montrer la réponse", "xp.targetsSaved": "Choix enregistré dans le carnet de la source.",
    "xp.invalidTargets": "Choisissez une source compatible et exactement deux joueurs distincts encore participants.",
    "xp.pairHelp": "La première cible reçoit le rappel indiqué, la seconde Erroné. Seule la paire de cette source est remplacée.",
    "xp.markerTownsfolk": "Villageois", "xp.markerOutsider": "Marginal", "xp.markerMinion": "Sbire", "xp.markerWrong": "Erroné"
  },
  en: {
    setupChecklist: "Setup checks", privateMessage: "Private message",
    informationNotebook: "Information notebook", trainingGame: "Training game",
    safetyBackups: "Safety backups",
    "xp.private": "Private information", "xp.hide": "Hide information",
    "xp.neutral": "Screen hidden", "xp.handBack": "Hand the device back to the Storyteller.",
    "xp.return": "Return to Storyteller", "xp.close": "Close", "xp.cancel": "Cancel",
    "xp.bluffs": "These characters are NOT in play",
    "xp.invalidBluffs": "Choose exactly 3 different good characters from this script that are not actually in play.",
    "xp.message": "Private message", "xp.player": "Player", "xp.type": "Information type",
    "xp.number": "Number", "xp.characters": "Two characters", "xp.alignment": "Alignment",
    "xp.text": "Free text", "xp.good": "Good", "xp.evil": "Evil",
    "xp.firstCharacter": "First character", "xp.secondCharacter": "Second character",
    "xp.choose": "Choose…", "xp.show": "Show and record",
    "xp.privateHelp": "Choose only what the player should read, including false information chosen by the Storyteller. Show records that exact text in their notebook. Hide the screen before taking the device back, then explicitly return to the Storyteller.",
    "xp.invalidMessage": "Choose a player and valid information; the two characters must be different.",
    "xp.recorded": "Private information recorded", "xp.noPlayers": "Add a player first.",
    "xp.notebook": "Information notebook", "xp.notebookHelp": "Private Storyteller notes: record what was communicated, not a calculated truth. Adding or editing a note does not show anything to the player.",
    "xp.emptyNotebook": "No information recorded.", "xp.add": "Add a note",
    "xp.edit": "Edit", "xp.delete": "Delete", "xp.confirmDelete": "Confirm deletion",
    "xp.save": "Save", "xp.phase": "Phase", "xp.night": "Night", "xp.day": "Day",
    "xp.invalidNote": "Enter text and valid night/day numbers.",
    "xp.shown": "Shown character", "xp.drunkRequired": "Required: choose a Townsfolk character to show the Drunk.",
    "xp.drunkHelp": "The Drunk remains their actual character. The shown Townsfolk guides waking and the information you choose; it does not become an actual Townsfolk in play.",
    "xp.lunaticHelp": "The Demon shown to the Lunatic is a belief, not their actual character. The Storyteller manages their choices and the information passed on.",
    "xp.usage": "Ability use", "xp.available": "Available",
    "xp.used": "Used", "xp.spent": "Used without effect",
    "xp.usageHelp": "Manual tracking for the current character, especially once-per-game abilities. A use without effect may still spend the ability; check that character’s rule. Tracking does not change statuses or reminders.",
    "xp.roleHelp": "Storyteller pointers", "xp.genericHelp": "Keep the actual character, what is shown, and received information separate. A reminder on a target belongs to its source; removing one source must not erase other effects.",
    "xp.fortuneHelp": "Check the Red herring chosen during setup. What you show remains a Storyteller decision, taking active effects into account.",
    "xp.washerHelp": "Prepare the two targets as a pair: a Townsfolk reminder and a Wrong reminder, both sourced to the Washerwoman.",
    "xp.poisonHelp": "Poison is an effect, separate from the target’s character. Track its source and duration without changing the assigned role.",
    "xp.monkHelp": "Keep protection linked to its source and duration; it does not mean that every cause of death is prevented.",
    "xp.setup": "Setup checks", "xp.advisory": "A preparation aid, not a complete rules validator. The Storyteller must still review interactions, exceptions and custom scripts.",
    "xp.rolesComplete": "Assigned characters present in the script",
    "xp.drunkCheck": "Valid shown characters for Drunks",
    "xp.bluffCheck": "Three distinct good bluffs, not in play",
    "xp.bluffOptional": "Optional bluffs: valid if supplied",
    "xp.teensy": "Fewer than 7 players: the usual first-night Demon and Minion information, including bluffs, is not required unless a special rule says otherwise.",
    "xp.fortuneCheck": "Fortune Teller: exactly one sourced Red herring reminder",
    "xp.washerCheck": "Washerwoman: Townsfolk / Wrong pair on two different players",
    "xp.manualSetup": "I have reviewed the script’s other setup instructions.",
    "xp.manualJinx": "I have reviewed the script’s interactions and jinxes.",
    "xp.checkCount": "Checks satisfied", "xp.openSetup": "Open Setup",
    "xp.openNight": "Open night", "xp.reviewBluffs": "Review bluffs",
    "xp.notApplicable": "Not applicable", "xp.review": "Review needed", "xp.ok": "OK",
    "xp.gmOnly": "Storyteller only — actual characters", "xp.noRole": "No character",
    "xp.alive": "Alive", "xp.dead": "Dead", "xp.ghostAvailable": "Ghost vote available",
    "xp.ghostUsed": "Ghost vote used", "xp.infos": "information entries",
    "xp.poisoned": "Poisoned", "xp.drunk": "Drunk", "xp.protected": "Protected",
    "xp.guided": "Guided", "xp.full": "Full list", "xp.previous": "Previous",
    "xp.next": "Next", "xp.step": "Step", "xp.noSteps": "No night steps.",
    "xp.tools": "Storyteller tools",
    roleDistribution: "Private role distribution", multiTargetPicker: "Choose two targets",
    roleTour: "Private role distribution", multiTargets: "Choose two targets",
    "xp.roleAcknowledged": "Current character shown to the player.",
    "xp.tourHelp": "Select a player, confirm the display, then hide the screen before taking the device back. Returning suggests the next player without showing their character.",
    "xp.revealed": "Already shown", "xp.notRevealed": "Not shown", "xp.tourDone": "All current characters have been shown.",
    "xp.showCharacter": "Show to this player", "xp.yourCharacter": "Your character",
    "xp.invalidShown": "Choose a valid shown character in the player card first.",
    "xp.saveFailed": "Unable to save. No new information was displayed.",
    "xp.source": "Source player", "xp.targetKind": "Choice type", "xp.customTargets": "Custom choice",
    "xp.targetHelp": "Select exactly two players in seating order. Reminders are descriptive: no truth, ability or phase transition is decided automatically.",
    "xp.targetImpaired": "Drunk or poisoned source: no ability is applied. These reminders are descriptive only; choose the information yourself.",
    "xp.noSource": "No compatible source. Use Custom choice or check the shown characters.",
    "xp.targetOne": "First target", "xp.targetTwo": "Second target", "xp.seat": "Seat",
    "xp.targetOrder": "Selection order", "xp.result": "Storyteller-chosen answer",
    "xp.yes": "Yes", "xp.no": "No", "xp.noInfo": "No information",
    "xp.targetNote": "Optional private note", "xp.saveTargets": "Save choice",
    "xp.showTargets": "Save and show answer", "xp.targetsSaved": "Choice recorded in the source’s notebook.",
    "xp.invalidTargets": "Choose a compatible source and exactly two distinct players still participating.",
    "xp.pairHelp": "The first target receives the named reminder, the second Wrong. Only this source’s pair is replaced.",
    "xp.markerTownsfolk": "Townsfolk", "xp.markerOutsider": "Outsider", "xp.markerMinion": "Minion", "xp.markerWrong": "Wrong"
  }
};

let experienceInitialized = false;
let experienceScreen = null;

function xpNode(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function xpButton(label, action, className = "btn") {
  const button = xpNode("button", className, label);
  button.type = "button";
  button.dataset.xpFocus = "button:" + label;
  button.addEventListener("click", action);
  return button;
}

function initExperience() {
  Object.assign(I18N.fr, EXPERIENCE_TEXT.fr);
  Object.assign(I18N.en, EXPERIENCE_TEXT.en);
  if (experienceInitialized) return;
  experienceInitialized = true;
  for (const type of ["keydown", "keyup", "keypress"]) {
    window.addEventListener(type, event => {
      if (!experienceScreen) return;
      event.stopImmediatePropagation();
      event.preventDefault();
      if (type !== "keydown" || event.repeat) return;
      if (event.key === "Escape") {
        xpNeutralScreen();
      } else if (event.key === "Tab") {
        const buttons = [...experienceScreen.root.querySelectorAll("button")];
        const index = buttons.indexOf(document.activeElement);
        buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
      } else if ((event.key === "Enter" || event.key === " ") &&
                 experienceScreen.root.contains(document.activeElement) &&
                 document.activeElement.tagName === "BUTTON") {
        document.activeElement.click();
      }
    }, true);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && experienceScreen) xpNeutralScreen();
  });
  document.addEventListener("focusin", event => {
    if (experienceScreen && !experienceScreen.root.contains(event.target)) {
      event.stopImmediatePropagation();
      experienceScreen.root.querySelector("button")?.focus({ preventScroll: true });
    }
  }, true);
  for (const type of ["click", "pointerdown", "contextmenu"]) {
    window.addEventListener(type, event => {
      if (experienceScreen && !experienceScreen.root.contains(event.target)) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    }, true);
  }
}

function playerScreenActive() {
  return experienceScreen !== null;
}

function xpProtectBackground() {
  const state = experienceScreen;
  if (!state) return;
  for (const child of document.body.children) {
    if (child === state.root) continue;
    if (!state.background.has(child)) {
      state.background.set(child, {
        inert: child.getAttribute("inert"), aria: child.getAttribute("aria-hidden")
      });
    }
    child.setAttribute("inert", "");
    child.setAttribute("aria-hidden", "true");
  }
}

function showPlayerScreen({ title, lines, playerId, kind, onReturn, onHide } = {}) {
  if (!experienceInitialized) initExperience();
  if (experienceScreen?.neutral) return false;
  // Only caller-supplied scalar text enters this surface; never copy grimoire markup.
  const safeText = value => typeof value === "string" || typeof value === "number" ? String(value) : "";
  const safeLines = Array.isArray(lines) ? lines.map(safeText).filter(Boolean) : [];
  if (!experienceScreen) {
    const root = xpNode("section", "xp-player-screen");
    root.id = "xp-player-screen";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "xp-player-title");
    experienceScreen = {
      root, background: new Map(), focus: document.activeElement,
      neutral: false, onReturn: null, onHide: null,
      scrollX: window.scrollX, scrollY: window.scrollY,
      bodyClass: document.body.classList.contains("xp-screen-open"),
      htmlClass: document.documentElement.classList.contains("xp-screen-open")
    };
    document.body.classList.add("xp-screen-open");
    document.documentElement.classList.add("xp-screen-open");
    document.body.appendChild(root);
    xpProtectBackground();
    experienceScreen.observer = new MutationObserver(xpProtectBackground);
    experienceScreen.observer.observe(document.body, { childList: true });
  }
  if (typeof onReturn === "function") experienceScreen.onReturn = onReturn;
  if (typeof onHide === "function") experienceScreen.onHide = onHide;
  const root = experienceScreen.root;
  root.replaceChildren();
  const panel = xpNode("div", "xp-player-content");
  const heading = xpNode("h1", "", safeText(title) || t("xp.private"));
  heading.id = "xp-player-title";
  panel.appendChild(heading);
  for (const line of safeLines) panel.appendChild(xpNode("p", "xp-player-line", line));
  const hide = xpButton(t("xp.hide"), xpNeutralScreen, "btn gold");
  panel.appendChild(hide);
  root.appendChild(panel);
  hide.focus({ preventScroll: true });
  if (document.hidden) xpNeutralScreen();
  return experienceScreen?.neutral === false;
}

function xpScreenCallback(state, name) {
  const callback = state[name];
  state[name] = null;
  if (typeof callback !== "function") return;
  try { callback(); } catch (error) { console.error("Player screen callback failed", error); }
}

function xpNeutralScreen() {
  if (!experienceScreen || experienceScreen.neutral) return;
  const state = experienceScreen;
  state.neutral = true;
  const panel = xpNode("div", "xp-player-content");
  const heading = xpNode("h1", "", t("xp.neutral"));
  heading.id = "xp-player-title";
  panel.append(heading, xpNode("p", "", t("xp.handBack")));
  const back = xpButton(t("xp.return"), xpClosePlayerScreen, "btn gold");
  panel.appendChild(back);
  experienceScreen.root.replaceChildren(panel);
  back.focus({ preventScroll: true });
  xpScreenCallback(state, "onHide");
}

function xpClosePlayerScreen() {
  const state = experienceScreen;
  if (!state || !state.neutral) return;
  state.observer.disconnect();
  for (const [element, original] of state.background) {
    for (const [attribute, value] of [["inert", original.inert], ["aria-hidden", original.aria]]) {
      if (value === null) element.removeAttribute(attribute);
      else element.setAttribute(attribute, value);
    }
  }
  experienceScreen = null;
  document.body.classList.toggle("xp-screen-open", state.bodyClass);
  document.documentElement.classList.toggle("xp-screen-open", state.htmlClass);
  state.root.remove();
  window.scrollTo(state.scrollX, state.scrollY);
  const focus = state.focus?.isConnected ? state.focus : document.getElementById("btn-tools");
  focus?.focus({ preventScroll: true });
  xpScreenCallback(state, "onReturn");
}

function xpBluffsValid() {
  const ids = S.bluffs;
  if (!Array.isArray(ids) || ids.length !== 3 || new Set(ids).size !== 3) return false;
  const inPlay = new Set(inPlayRoleIds());
  const scriptIds = new Set((currentScript()?.characters || []).map(c => c.id));
  return ids.every(id => {
    const role = charById(id);
    return role && scriptIds.has(id) && !inPlay.has(id) &&
      (role.team === "townsfolk" || role.team === "outsider");
  });
}

function showBluffsToPlayer() {
  if (playerScreenActive()) return;
  if (!xpBluffsValid()) return toast(t("xp.invalidBluffs"));
  showPlayerScreen({ title: t("xp.bluffs"), lines: S.bluffs.map(id => loc(charById(id).name)), kind: "bluffs" });
}

function xpCaptureModalPosition(root) {
  if (!root) return null;
  const modal = root.closest("#modal");
  const active = root.contains(document.activeElement) ? document.activeElement : null;
  return {
    top: modal?.scrollTop || 0, left: modal?.scrollLeft || 0,
    focus: active?.dataset.xpFocus || null,
    selectionStart: active?.selectionStart, selectionEnd: active?.selectionEnd
  };
}

function xpRestoreModalPosition(root, position, fallback) {
  if (!root?.isConnected || playerScreenActive() || !position) return;
  const target = [...root.querySelectorAll("[data-xp-focus]")].find(el =>
    el.dataset.xpFocus === position.focus && !el.disabled) || fallback;
  target?.focus({ preventScroll: true });
  if (target && typeof position.selectionStart === "number" && typeof target.setSelectionRange === "function") {
    try { target.setSelectionRange(position.selectionStart, position.selectionEnd); } catch (_) {}
  }
  const modal = root.closest("#modal");
  if (modal) { modal.scrollTop = position.top; modal.scrollLeft = position.left; }
}

function xpModal(title, key = title) {
  if (playerScreenActive()) return null;
  const old = document.querySelector("#modal .xp-modal");
  const position = old?.dataset.xpModal === key ? xpCaptureModalPosition(old) : null;
  const opener = old?.xpOpener || document.activeElement;
  openModal(`<div class="xp-modal"><h2>${escapeHtml(title)}</h2><div class="xp-modal-content"></div><div class="modal-actions xp-modal-actions"></div></div>`, "xp:" + key);
  const root = document.querySelector("#modal .xp-modal");
  root.dataset.xpModal = key;
  root.xpOpener = opener;
  const close = () => {
    closeModal();
    if (document.getElementById("modal-overlay")?.classList.contains("hidden") &&
        !playerScreenActive() && opener?.isConnected && !opener.closest("[inert]")) {
      opener.focus({ preventScroll: true });
    }
  };
  root.querySelector(".xp-modal-actions").appendChild(xpButton(t("xp.close"), close, "btn ghost"));
  root.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.stopPropagation(); close(); }
  });
  if (position) {
    queueMicrotask(() => xpRestoreModalPosition(root, position));
    setTimeout(() => xpRestoreModalPosition(root, position), 45);
  }
  return root;
}

function xpField(parent, labelText, input) {
  const field = xpNode("div", "xp-field");
  const label = xpNode("label", "", labelText);
  input.id = input.id || "xp-field-" + uid();
  input.dataset.xpFocus = "field:" + labelText;
  label.htmlFor = input.id;
  field.append(label, input);
  parent.appendChild(field);
  return input;
}

function xpSelect(options, selected) {
  const select = xpNode("select");
  for (const [value, label] of options) {
    const option = xpNode("option", "", label);
    option.value = value;
    select.appendChild(option);
  }
  if (selected !== undefined) select.value = selected;
  return select;
}

function xpPlayerSelect(parent, pid) {
  return xpField(parent, t("xp.player"), xpSelect(
    S.players.map(p => [p.id, p.name]),
    S.players.some(p => p.id === pid) ? pid : S.players[0]?.id
  ));
}

function xpInformationEntry(text, overrides = {}) {
  return Object.assign({
    id: uid(), night: S.night.number, day: S.day.number,
    phase: S.phase, text, ts: Date.now()
  }, overrides);
}

function xpReadOnly() {
  return typeof READ_ONLY !== "undefined" && READ_ONLY;
}

function xpSavedChange(change) {
  if (xpReadOnly()) throw new Error("Read-only game");
  const game = S;
  const previous = {};
  for (const key of ["players", "night", "history", "redo", "log"]) {
    previous[key] = { owned: Object.prototype.hasOwnProperty.call(game, key), value: game[key] };
  }
  try {
    game.history = (game.history || []).slice();
    pushHistory();
    game.players = JSON.parse(JSON.stringify(game.players));
    game.night = JSON.parse(JSON.stringify(game.night));
    game.log = (game.log || []).slice();
    const result = change();
    if (S !== game || save() === false) throw new Error("Save rejected");
    return result;
  } catch (error) {
    for (const [key, old] of Object.entries(previous)) {
      if (old.owned) game[key] = old.value;
      else delete game[key];
    }
    throw error;
  }
}

const xpEditorDrafts = new WeakMap();
function xpResetInformationDrafts(game = S) {
  if (!game || typeof game !== "object") return;
  xpEditorDrafts.delete(game);
  if (typeof wakeEditorDrafts !== "undefined") wakeEditorDrafts.delete(game);
}

function xpDrafts(game = S) {
  const training = typeof TRAINING !== "undefined" && TRAINING;
  if (!xpEditorDrafts.has(game) || xpEditorDrafts.get(game).training !== training) xpEditorDrafts.set(game, {
    training, message: new Map(), notebook: new Map(), selectedMessage: null, selectedNotebook: null
  });
  const store = xpEditorDrafts.get(game);
  for (const type of ["message", "notebook"]) {
    for (const id of store[type].keys()) if (!game.players.some(p => p.id === id)) store[type].delete(id);
  }
  return store;
}

function xpKeepDraft(store, id, draft) {
  if (!store.has(id) && store.size >= 80) throw new Error("Draft limit");
  store.set(id, draft);
}

function xpDraftText(fr, en) { return S.lang === "en" ? en : fr; }

function xpDraftHint(body) {
  body.appendChild(xpNode("p", "hint xp-draft-hint", xpDraftText(
    "Brouillon conservé en mémoire pour ce joueur en fermant ou en revenant. « Abandonner le brouillon » l’efface. Un rechargement ou un remplacement de partie l’efface également.",
    "Draft kept in memory for this player when closing or returning. Discard draft clears it. Reloading or replacing the game also clears it.")));
}

function xpParticipatingPlayers() {
  return S.players.filter(p => !p.exiled && charById(p.roleId)?.team !== "fabled");
}

function xpValidShownRole(p) {
  const role = charById(GameCore.shownRoleId(p));
  if (!role || !charById(p.roleId)) return null;
  if (p.roleId === "drunk" && (!p.shownRoleId || role.team !== "townsfolk")) return null;
  if (p.roleId === "lunatic" && (!p.shownRoleId || role.team !== "demon")) return null;
  return role;
}

function roleRevealSignature(p) {
  return JSON.stringify([p.roleId, p.shownRoleId, GameCore.effectiveAlignment(p, charById)]);
}

function markRoleRevealed(p) {
  if (playerScreenActive() || document.hidden) return false;
  if (!S.players.includes(p) || !xpParticipatingPlayers().includes(p) || !xpValidShownRole(p)) return false;
  const original = S.revealedRoles;
  const originalPending = S.pendingActions;
  const hadRevealed = Object.prototype.hasOwnProperty.call(S, "revealedRoles");
  S.revealedRoles = { ...original, [p.id]: roleRevealSignature(p) };
  if (Array.isArray(originalPending)) {
    S.pendingActions = originalPending.map(action =>
      action?.kind === "role" && action.playerId === p.id && action.status === "open" ?
        { ...action, status: "resolved", resolvedAt: Date.now(), resolutionReason: t("xp.roleAcknowledged") } : action);
  }
  try {
    if (save() === false) throw new Error("Save rejected");
    return true;
  } catch (_) {
    if (hadRevealed) S.revealedRoles = original;
    else delete S.revealedRoles;
    if (Array.isArray(originalPending)) S.pendingActions = originalPending;
    toast(t("xp.saveFailed"));
    return false;
  }
}

function openRoleDistributionTour(preferredId) {
  if (playerScreenActive()) return;
  const participants = xpParticipatingPlayers();
  if (!participants.length) return toast(t("xp.noPlayers"));
  const game = S;
  const revealed = p => S.revealedRoles?.[p.id] === roleRevealSignature(p);
  let selectedId = participants.some(p => p.id === preferredId) ? preferredId :
    (participants.find(p => !revealed(p)) || participants[0]).id;
  const root = xpModal(t("roleDistribution"), "role-distribution");
  const body = root.querySelector(".xp-modal-content");
  body.appendChild(xpNode("p", "hint", t("xp.tourHelp")));
  const progress = xpNode("p", "xp-check-count");
  const list = xpNode("div", "xp-tour-list");
  const detail = xpNode("p", "hint");
  body.append(progress, list, detail);
  const show = xpButton(t("xp.showCharacter"), () => {
    const p = S.players.find(player => player.id === selectedId);
    if (S !== game || !p || !xpParticipatingPlayers().includes(p)) return toast(t("xp.invalidShown"));
    const role = xpValidShownRole(p);
    if (!role) return toast(t("xp.invalidShown"));
    if (document.hidden || playerScreenActive()) return;
    const alignment = p.roleId === "lunatic" ? "evil" : GameCore.effectiveAlignment(p, charById);
    const lines = [loc(role.name), loc(role.ability), t("xp." + alignment)].filter(Boolean);
    if (!markRoleRevealed(p)) return;
    showPlayerScreen({
      title: `${p.name} · ${t("xp.yourCharacter")}`, lines, playerId: p.id, kind: "role",
      onReturn: () => {
        if (S !== game || !S.players.includes(p) || !xpParticipatingPlayers().includes(p)) return;
        const next = xpParticipatingPlayers().find(player => !revealed(player));
        openRoleDistributionTour(next?.id || p.id);
      }
    });
    closeModal();
  }, "btn gold");
  root.querySelector(".xp-modal-actions").prepend(show);
  const render = () => {
    const position = xpCaptureModalPosition(root);
    list.replaceChildren();
    for (const p of participants) {
      const button = xpButton("", () => { selectedId = p.id; render(); }, "btn xp-tour-player");
      button.dataset.xpFocus = "tour:" + p.id;
      button.setAttribute("aria-pressed", String(p.id === selectedId));
      button.append(xpNode("strong", "", p.name),
        xpNode("small", "", t(revealed(p) ? "xp.revealed" : "xp.notRevealed")));
      list.appendChild(button);
    }
    const count = participants.filter(revealed).length;
    progress.textContent = `${t("xp.revealed")} : ${count}/${participants.length}`;
    if (count === participants.length) progress.textContent += " · " + t("xp.tourDone");
    const selected = participants.find(p => p.id === selectedId);
    const valid = selected && xpValidShownRole(selected);
    detail.textContent = valid ? `${selected.name} · ${t(revealed(selected) ? "xp.revealed" : "xp.notRevealed")}` : t("xp.invalidShown");
    show.disabled = !valid;
    xpRestoreModalPosition(root, position);
  };
  render();
}

const XP_TARGET_KINDS = ["fortuneteller", "washerwoman", "librarian", "investigator", "custom"];
const XP_TARGET_MARKERS = { washerwoman: "Townsfolk", librarian: "Outsider", investigator: "Minion" };

function xpBuildTargetPlan(sourceId, kind, targetIds, outcome = "none", note = "") {
  const invalid = () => { throw new Error(t("xp.invalidTargets")); };
  if (!XP_TARGET_KINDS.includes(kind) || !Array.isArray(targetIds) ||
      targetIds.length !== 2 || new Set(targetIds).size !== 2 ||
      !["none", "yes", "no"].includes(outcome) || typeof note !== "string") invalid();
  const participating = xpParticipatingPlayers();
  const source = participating.find(p => p.id === sourceId);
  const targets = targetIds.map(id => participating.find(p => p.id === id));
  if (!source || targets.some(p => !p) ||
      (kind !== "custom" && xpValidShownRole(source)?.id !== kind)) invalid();
  const originals = S.players;
  const players = JSON.parse(JSON.stringify(originals));
  players.forEach(p => GameCore.normalizePlayer(p));
  const draftSource = players.find(p => p.id === sourceId);
  const impaired = GameCore.isImpaired(draftSource);
  const marker = XP_TARGET_MARKERS[kind];
  if (marker) {
    // Work on a detached graph: validation or a second-token failure cannot leave half a pair.
    for (const player of players) {
      player.reminders = player.reminders.filter(r => !(r.sourcePlayerId === sourceId &&
        r.sourceRoleId === kind && [marker, "Wrong"].includes(r.key) && !r.effect));
    }
    [marker, "Wrong"].forEach((key, index) => {
      GameCore.addReminder(players, targetIds[index], {
        label: t("xp.marker" + key), key, sourcePlayerId: sourceId, sourceRoleId: kind,
        effect: null, expires: "manual"
      });
    });
  }
  const lines = targets.map((p, index) =>
    `${t(index ? "xp.targetTwo" : "xp.targetOne")} : ${p.name}`);
  if (kind === "fortuneteller") lines.push(`${t("xp.result")} : ${t(outcome === "none" ? "xp.noInfo" : "xp." + outcome)}`);
  const notebook = marker ? targets.map((p, index) =>
    `${index + 1}. ${t("xp.marker" + (index ? "Wrong" : marker))} : ${p.name}`) : lines.slice();
  if (note.trim()) notebook.push(note);
  draftSource.information.push(xpInformationEntry(notebook.join("\n")));
  return { state: S, originals, players, sourceId, kind, outcome, lines, impaired };
}

function xpCommitTargetPlan(plan) {
  if (S !== plan.state || S.players !== plan.originals) throw new Error(t("xp.invalidTargets"));
  const state = S;
  const prior = {};
  for (const key of ["history", "redo"]) {
    prior[key] = { owned: Object.prototype.hasOwnProperty.call(state, key),
      value: Array.isArray(state[key]) ? state[key].slice() : state[key] };
  }
  try {
    pushHistory();
    state.players = plan.players;
    if (save() === false) throw new Error("Save rejected");
  } catch (error) {
    state.players = plan.originals;
    for (const key of ["history", "redo"]) {
      if (prior[key].owned) state[key] = prior[key].value;
      else delete state[key];
    }
    throw error;
  }
  return true;
}

function openMultiTargetPicker(sourceId, kind) {
  if (playerScreenActive()) return;
  const participants = xpParticipatingPlayers();
  if (!participants.length) return toast(t("xp.noPlayers"));
  const initialSource = participants.find(p => p.id === sourceId) ||
    participants.find(p => XP_TARGET_KINDS.includes(xpValidShownRole(p)?.id)) || participants[0];
  const initialKind = XP_TARGET_KINDS.includes(kind) ? kind :
    XP_TARGET_KINDS.includes(xpValidShownRole(initialSource)?.id) ? xpValidShownRole(initialSource).id : "custom";
  const game = S;
  const root = xpModal(t("multiTargetPicker"), "multi-target-picker");
  const body = root.querySelector(".xp-modal-content");
  body.appendChild(xpNode("p", "hint", t("xp.targetHelp")));
  const types = xpField(body, t("xp.targetKind"), xpSelect(XP_TARGET_KINDS
    .filter(key => key === "custom" || charById(key))
    .map(key => [key, key === "custom" ? t("xp.customTargets") : loc(charById(key).name)]), initialKind));
  const sources = xpField(body, t("xp.source"), xpSelect([]));
  const warning = xpNode("p", "xp-warning");
  warning.setAttribute("role", "status");
  body.appendChild(warning);
  const ring = xpNode("div", "xp-target-ring");
  ring.setAttribute("role", "group");
  ring.setAttribute("aria-label", t("xp.targetOrder"));
  if (participants.length > 12) ring.classList.add("xp-target-many");
  body.appendChild(ring);
  const selection = xpNode("ol", "xp-target-selection");
  selection.setAttribute("aria-live", "polite");
  body.appendChild(selection);
  const result = xpField(body, t("xp.result"), xpSelect([
    ["none", t("xp.noInfo")], ["yes", t("xp.yes")], ["no", t("xp.no")]
  ], "none"));
  const note = xpField(body, t("xp.targetNote"), xpNode("textarea"));
  note.rows = 2;
  let selected = [];
  const selectButtons = new Map();
  const commit = display => {
    if (S !== game) return toast(t("xp.invalidTargets"));
    let plan;
    try { plan = xpBuildTargetPlan(sources.value, types.value, selected, result.value, note.value); }
    catch (_) { return toast(t("xp.invalidTargets")); }
    if (display && (plan.kind !== "fortuneteller" || plan.outcome === "none" || document.hidden)) return;
    try { xpCommitTargetPlan(plan); }
    catch (_) { return toast(t("xp.saveFailed")); }
    if (display) {
      showPlayerScreen({ title: t("xp.private"), lines: plan.lines, playerId: plan.sourceId, kind: "targets" });
      closeModal();
    } else {
      toast(t("xp.targetsSaved"));
    }
    renderGrimoire();
  };
  const saveChoice = xpButton(t("xp.saveTargets"), () => commit(false), "btn gold");
  const showChoice = xpButton(t("xp.showTargets"), () => commit(true));
  root.querySelector(".xp-modal-actions").prepend(saveChoice, showChoice);
  const update = () => {
    selection.replaceChildren();
    [0, 1].forEach(index => {
      const p = S.players.find(player => player.id === selected[index]);
      const marker = XP_TARGET_MARKERS[types.value];
      const label = marker ? t("xp.marker" + (index ? "Wrong" : marker)) : t(index ? "xp.targetTwo" : "xp.targetOne");
      selection.appendChild(xpNode("li", "", `${label} : ${p?.name || t("xp.choose")}`));
    });
    for (const [id, button] of selectButtons) {
      const order = selected.indexOf(id);
      button.setAttribute("aria-pressed", String(order >= 0));
      button.querySelector(".xp-target-order").textContent = order >= 0 ? String(order + 1) : "";
    }
    const source = S.players.find(p => p.id === sources.value);
    const impaired = source && (source.roleId === "drunk" || source.statuses?.drunk || source.statuses?.poisoned);
    warning.textContent = !source ? t("xp.noSource") : impaired ? t("xp.targetImpaired") :
      XP_TARGET_MARKERS[types.value] ? t("xp.pairHelp") : t("xp.targetHelp");
    result.closest(".xp-field").hidden = types.value !== "fortuneteller";
    showChoice.hidden = types.value !== "fortuneteller";
    saveChoice.disabled = !source || selected.length !== 2;
    showChoice.disabled = saveChoice.disabled || result.value === "none";
  };
  const populateSources = preferred => {
    const candidates = xpParticipatingPlayers().filter(p =>
      types.value === "custom" || XP_TARGET_KINDS.includes(xpValidShownRole(p)?.id));
    sources.replaceChildren();
    const placeholder = xpNode("option", "", t("xp.choose")); placeholder.value = ""; sources.appendChild(placeholder);
    for (const p of candidates) {
      const option = xpNode("option", "", p.name); option.value = p.id; sources.appendChild(option);
    }
    const compatible = candidates.filter(p => types.value === "custom" || xpValidShownRole(p)?.id === types.value);
    sources.value = (compatible.find(p => p.id === preferred) || compatible[0])?.id || "";
    selected = [];
    result.value = "none";
    update();
  };
  participants.forEach((p, index) => {
    const button = xpButton("", () => {
      const position = selected.indexOf(p.id);
      if (position >= 0) selected.splice(position, 1);
      else if (selected.length < 2) selected.push(p.id);
      else return toast(t("xp.invalidTargets"));
      update();
    }, "btn xp-target-seat");
    button.dataset.xpFocus = "target:" + p.id;
    const angle = 2 * Math.PI * index / participants.length - Math.PI / 2;
    button.style.setProperty("--seat-x", `${50 + 40 * Math.cos(angle)}%`);
    button.style.setProperty("--seat-y", `${50 + 40 * Math.sin(angle)}%`);
    button.append(xpNode("small", "", `${t("xp.seat")} ${S.players.indexOf(p) + 1}`),
      xpNode("span", "xp-target-name", p.name), xpNode("strong", "xp-target-order"));
    ring.appendChild(button);
    selectButtons.set(p.id, button);
  });
  types.addEventListener("change", () => populateSources(sources.value));
  sources.addEventListener("change", () => {
    const source = S.players.find(p => p.id === sources.value);
    if (types.value !== "custom" && source) types.value = xpValidShownRole(source)?.id || "";
    selected = []; result.value = "none"; update();
  });
  result.addEventListener("change", update);
  populateSources(initialSource.id);
}

function openMessageComposer(pid) {
  if (playerScreenActive()) return;
  if (!S.players.length) return toast(t("xp.noPlayers"));
  const game = S, store = xpDrafts();
  const root = xpModal(t("xp.message"), "message");
  if (typeof modalManageDraft === "function") modalManageDraft();
  const body = root.querySelector(".xp-modal-content");
  body.appendChild(xpNode("p", "hint", t("xp.privateHelp")));
  xpDraftHint(body);
  const players = xpPlayerSelect(body, pid || store.selectedMessage);
  if (typeof modalSetDiscard === "function") modalSetDiscard(() => store.message.delete(players.value));
  const type = xpField(body, t("xp.type"), xpSelect(
    ["number", "characters", "alignment", "text"].map(key => [key, t("xp." + key)])
  ));
  const fields = xpNode("div", "xp-message-fields");
  body.appendChild(fields);
  let read, draft;
  const remember = () => {
    if (S !== game) return;
    draft.type = type.value;
    store.selectedMessage = players.value;
    xpKeepDraft(store.message, players.value, draft);
  };
  const field = (name, label, control, fallback = "") => {
    control.value = draft[name] ?? fallback;
    const capture = () => {
      if (draft[name] !== control.value) delete draft.recorded;
      draft[name] = control.value;
      remember();
    };
    control.addEventListener("input", capture);
    control.addEventListener("change", capture);
    return xpField(fields, label, control);
  };
  const renderFields = () => {
    fields.replaceChildren();
    if (type.value === "number") {
      const number = field("number", t("xp.number"), xpSelect(
        Array.from({ length: 21 }, (_, i) => [String(i), String(i)])
      ), "0");
      read = () => {
        const value = Number(number.value);
        return number.value !== "" && Number.isInteger(value) && value >= 0 && value <= 20 ? [String(value)] : null;
      };
    } else if (type.value === "characters") {
      const options = [["", t("xp.choose")], ...(currentScript()?.characters || [])
        .filter(c => c.team !== "fabled").map(c => [c.id, loc(c.name)])];
      const first = field("first", t("xp.firstCharacter"), xpSelect(options));
      const second = field("second", t("xp.secondCharacter"), xpSelect(options));
      read = () => {
        if (!first.value || !second.value || first.value === second.value) return null;
        const roles = [charById(first.value), charById(second.value)];
        return roles.every(Boolean) ? roles.map(role => loc(role.name)) : null;
      };
    } else if (type.value === "alignment") {
      const alignment = field("alignment", t("xp.alignment"), xpSelect([
        ["good", t("xp.good")], ["evil", t("xp.evil")]
      ]), "good");
      read = () => ["good", "evil"].includes(alignment.value) ? [t("xp." + alignment.value)] : null;
    } else {
      const text = field("text", t("xp.text"), xpNode("textarea"));
      text.rows = 5; text.maxLength = 4000;
      read = () => text.value.trim() ? [text.value] : null;
    }
  };
  const load = () => {
    draft = store.message.get(players.value) || { type: "number" };
    type.value = draft.type;
    remember(); renderFields();
  };
  type.addEventListener("change", () => { delete draft.recorded; remember(); renderFields(); });
  players.addEventListener("change", load);
  load();
  const show = xpButton(t("xp.show"), () => {
    if (S !== game || xpReadOnly() || document.hidden) return toast(t("xp.saveFailed"));
    const p = S.players.find(player => player.id === players.value);
    const lines = read();
    if (!p || !lines || lines.some(line => line.length > 4000)) return toast(t("xp.invalidMessage"));
    const signature = JSON.stringify([S.phase, S.night.number, S.day.number, p.id, p.roleId, p.shownRoleId, type.value, lines]);
    if (draft.recorded !== signature) {
      try {
        xpSavedChange(() => {
          const player = S.players.find(item => item.id === p.id);
          if (!Array.isArray(player.information)) player.information = [];
          player.information.push(xpInformationEntry(lines.join("\n")));
          logEvent(`${t("xp.recorded")} — ${player.name}`, "✉");
        });
      } catch (_) { return toast(t("xp.saveFailed")); }
      draft.recorded = signature;
    }
    remember();
    if (typeof modalCommitDraft === "function") modalCommitDraft();
    showPlayerScreen({ title: t("xp.private"), lines, playerId: p.id, kind: type.value });
  }, "btn gold");
  show.disabled = xpReadOnly();
  const discard = xpButton(xpDraftText("Abandonner le brouillon", "Discard draft"), () => {
    store.message.delete(players.value);
    load();
    if (typeof modalCommitDraft === "function") modalCommitDraft();
  }, "btn ghost");
  root.querySelector(".xp-modal-actions").prepend(show, discard,
    xpButton(t("xp.notebook"), () => openNotebook(players.value), "btn ghost"));
  players.focus();
}

function openNotebook(pid) {
  if (playerScreenActive()) return;
  if (!S.players.length) return toast(t("xp.noPlayers"));
  const game = S, store = xpDrafts();
  const root = xpModal(t("xp.notebook"), "notebook");
  if (typeof modalManageDraft === "function") modalManageDraft();
  const body = root.querySelector(".xp-modal-content");
  body.appendChild(xpNode("p", "hint", t("xp.notebookHelp")));
  xpDraftHint(body);
  const players = xpPlayerSelect(body, pid || store.selectedNotebook);
  if (typeof modalSetDiscard === "function") modalSetDiscard(() => store.notebook.delete(players.value));
  const content = xpNode("div", "xp-notebook");
  body.appendChild(content);
  const render = restore => {
    const position = restore || xpCaptureModalPosition(root);
    content.replaceChildren();
    const p = S.players.find(player => player.id === players.value);
    if (!p) return;
    store.selectedNotebook = p.id;
    const add = xpButton(t("xp.add"), () => edit(p, null), "btn gold");
    add.disabled = xpReadOnly() || S !== game;
    add.dataset.xpFocus = "notebook:add";
    content.appendChild(add);
    if (store.notebook.has(p.id)) {
      content.appendChild(xpButton(xpDraftText("Reprendre le brouillon", "Resume draft"), () => edit(p, null, true), "btn"));
      content.appendChild(xpButton(xpDraftText("Abandonner le brouillon", "Discard draft"), () => {
        store.notebook.delete(p.id); render();
        if (typeof modalCommitDraft === "function") modalCommitDraft();
      }, "btn ghost"));
      add.disabled = true;
    }
    const entries = (Array.isArray(p.information) ? p.information : []).map((entry, index) => ({ entry, index }))
      .sort((a, b) => (Number(a.entry.ts) || 0) - (Number(b.entry.ts) || 0) || a.index - b.index);
    if (!entries.length) content.appendChild(xpNode("p", "hint", t("xp.emptyNotebook")));
    for (const { entry } of entries) {
      const row = xpNode("article", "xp-note");
      row.appendChild(xpNode("div", "xp-note-stamp",
        `${t("xp.night")} ${entry.night ?? "—"} · ${t("xp.day")} ${entry.day ?? "—"} · ${t(entry.phase === "day" ? "xp.day" : "xp.night")}`));
      row.appendChild(xpNode("p", "xp-note-text", entry.text ?? ""));
      const actions = xpNode("div", "row");
      const editButton = xpButton(t("xp.edit"), () => edit(p, entry), "btn small");
      editButton.disabled = !!entry.wakeReceipt || xpReadOnly() || S !== game || store.notebook.has(p.id);
      if (entry.wakeReceipt) row.appendChild(xpNode("p", "hint", xpDraftText(
        "Affichage exact conservé. Ajoutez une note pour une correction.", "Exact display preserved. Add a note for a correction.")));
      editButton.dataset.xpFocus = "notebook:edit:" + entry.id;
      actions.appendChild(editButton);
      const deleteButton = xpButton(t("xp.delete"), () => {
        const listPosition = xpCaptureModalPosition(root);
        const confirm = xpButton(t("xp.confirmDelete"), () => {
          if (S !== game) return toast(t("xp.saveFailed"));
          try {
            xpSavedChange(() => {
              const player = S.players.find(item => item.id === p.id);
              player.information = player.information.filter(item => item.id !== entry.id);
            });
          } catch (_) { return toast(t("xp.saveFailed")); }
          render(listPosition);
          renderGrimoire();
        }, "btn small");
        actions.replaceChildren(
          confirm, xpButton(t("xp.cancel"), () => render(listPosition), "btn small ghost")
        );
        confirm.focus({ preventScroll: true });
      }, "btn small ghost");
      deleteButton.disabled = xpReadOnly() || S !== game;
      deleteButton.dataset.xpFocus = "notebook:delete:" + entry.id;
      actions.appendChild(deleteButton);
      row.appendChild(actions);
      content.appendChild(row);
    }
    xpRestoreModalPosition(root, position, position?.focus ? add : null);
  };
  const edit = (p, entry, resume = false) => {
    if (S !== game || xpReadOnly()) return toast(t("xp.saveFailed"));
    const listPosition = xpCaptureModalPosition(root);
    const draft = resume ? store.notebook.get(p.id) : {
      entryId: entry?.id || null, original: entry ? JSON.stringify(entry) : null,
      text: entry?.text ?? "", phase: entry?.phase || S.phase,
      night: String(entry?.night ?? S.night.number), day: String(entry?.day ?? S.day.number)
    };
    if (!draft) return;
    xpKeepDraft(store.notebook, p.id, draft);
    content.replaceChildren();
    players.disabled = true;
    const form = xpNode("form", "xp-note-editor");
    content.appendChild(form);
    const text = xpField(form, t("xp.text"), xpNode("textarea"));
    text.rows = 5; text.maxLength = 4000;
    text.value = draft.text;
    const phase = xpField(form, t("xp.phase"), xpSelect([
      ["night", t("xp.night")], ["day", t("xp.day")]
    ], draft.phase));
    const number = (label, value) => {
      const input = xpNode("input");
      input.type = "number"; input.min = "0"; input.step = "1"; input.required = true;
      input.value = String(value);
      return xpField(form, label, input);
    };
    const night = number(t("xp.night"), draft.night);
    const day = number(t("xp.day"), draft.day);
    const remember = () => Object.assign(draft, { text: text.value, phase: phase.value, night: night.value, day: day.value });
    for (const control of [text, phase, night, day]) {
      control.addEventListener("input", remember);
      control.addEventListener("change", remember);
    }
    const cancel = () => { players.disabled = false; render(listPosition); };
    const actions = xpNode("div", "row");
    const saveButton = xpButton(t("xp.save"), () => {}, "btn gold");
    saveButton.type = "submit";
    actions.append(saveButton, xpButton(t("xp.cancel"), () => { remember(); cancel(); }, "btn ghost"),
      xpButton(xpDraftText("Abandonner le brouillon", "Discard draft"), () => {
        store.notebook.delete(p.id); cancel();
        if (typeof modalCommitDraft === "function") modalCommitDraft();
      }, "btn ghost"));
    form.appendChild(actions);
    form.addEventListener("submit", event => {
      event.preventDefault();
      remember();
      if (S !== game) return toast(t("xp.saveFailed"));
      if (!text.value.trim() || text.value.length > 4000 || ![night, day].every(input => input.value !== "" &&
          Number.isSafeInteger(Number(input.value)) && Number(input.value) >= 0) ||
          !["night", "day"].includes(phase.value)) return toast(t("xp.invalidNote"));
      const data = { text: text.value, night: Number(night.value), day: Number(day.value), phase: phase.value };
      try {
        xpSavedChange(() => {
          const player = S.players.find(item => item.id === p.id);
          if (!player) throw new Error("Player removed");
          if (draft.entryId) {
            const existing = player.information.find(item => item.id === draft.entryId);
            if (!existing || existing.wakeReceipt || JSON.stringify(existing) !== draft.original) throw new Error("Note changed");
            Object.assign(existing, data);
          } else {
            if (!Array.isArray(player.information)) player.information = [];
            player.information.push(xpInformationEntry(text.value, data));
          }
        });
      } catch (_) { return toast(xpDraftText("Enregistrement impossible ou note modifiée depuis l’ouverture. Le brouillon est conservé.",
        "Unable to save or note changed since opening. Draft retained.")); }
      store.notebook.delete(p.id);
      if (typeof modalCommitDraft === "function") modalCommitDraft();
      cancel();
      renderGrimoire();
    });
    text.focus();
  };
  players.addEventListener("change", () => render());
  render();
  if (store.notebook.has(players.value)) edit(S.players.find(p => p.id === players.value), null, true);
  else players.focus();
}

function xpAbilityState(p) {
  return ["available", "used", "spent"].includes(p.abilityUsage) ? p.abilityUsage : "available";
}

function playerExtrasHtml(p) {
  const isDrunk = p.roleId === "drunk", isLunatic = p.roleId === "lunatic";
  let shown = "";
  if (isDrunk || isLunatic) {
    const roles = (currentScript()?.characters || []).filter(c => c.team === (isDrunk ? "townsfolk" : "demon"));
    shown = `<label class="xp-field"><span>${t("xp.shown")}</span><select data-xp-shown>
      <option value="">${t("xp.choose")}</option>${roles.map(c =>
      `<option value="${escapeHtml(c.id)}"${c.id === p.shownRoleId ? " selected" : ""}>${escapeHtml(loc(c.name))}</option>`).join("")}
      </select></label>
      <p class="hint">${t(isDrunk ? "xp.drunkHelp" : "xp.lunaticHelp")}</p>
      ${isDrunk && !roles.some(c => c.id === p.shownRoleId) ? `<p class="xp-warning" role="status">${t("xp.drunkRequired")}</p>` : ""}`;
  }
  const helpKey = {
    drunk: "xp.drunkHelp", lunatic: "xp.lunaticHelp", fortuneteller: "xp.fortuneHelp",
    washerwoman: "xp.washerHelp", poisoner: "xp.poisonHelp", monk: "xp.monkHelp"
  }[p.roleId];
  return `<section class="xp-player-extras">
    ${shown}
    <label class="xp-field"><span>${t("xp.usage")}</span><select data-xp-usage${p.roleId ? "" : " disabled"}>
      ${["available", "used", "spent"].map(value => `<option value="${value}"${xpAbilityState(p) === value ? " selected" : ""}>${t("xp." + value)}</option>`).join("")}
    </select></label>
    <p class="hint">${t("xp.usageHelp")}</p>
    <div class="row"><button type="button" class="btn small" data-xp-notebook>${t("xp.notebook")} (${(p.information || []).length})</button>
    <button type="button" class="btn small" data-xp-message>${t("xp.message")}</button></div>
    <details><summary>${t("xp.roleHelp")}</summary><p class="hint">${t("xp.genericHelp")}</p>
    ${helpKey ? `<p class="hint">${t(helpKey)}</p>` : ""}</details>
  </section>`;
}

function wirePlayerExtras(p, rerender) {
  const root = document.querySelector("#modal .xp-player-extras");
  if (!root) return;
  root.querySelector("[data-xp-notebook]").onclick = () => openNotebook(p.id);
  root.querySelector("[data-xp-message]").onclick = () => openMessageComposer(p.id);
  const shown = root.querySelector("[data-xp-shown]");
  if (shown) shown.onchange = () => {
    const role = shown.value && charById(shown.value);
    const team = p.roleId === "drunk" ? "townsfolk" : "demon";
    if (shown.value && (!role || role.team !== team)) return;
    pushHistory();
    GameCore.setRole(p, p.roleId, shown.value || null);
    save();
    if (rerender) rerender();
  };
  root.querySelector("[data-xp-usage]").onchange = event => {
    const value = event.target.value;
    if (!p.roleId || !["available", "used", "spent"].includes(value)) return;
    pushHistory();
    p.abilityUsage = value;
    save();
    if (rerender) rerender();
  };
}

function openSetupChecklist() {
  if (playerScreenActive()) return;
  const root = xpModal(t("xp.setup"));
  const body = root.querySelector(".xp-modal-content");
  body.appendChild(xpNode("p", "hint", t("xp.advisory")));
  const count = xpNode("p", "xp-check-count");
  body.appendChild(count);
  const rows = xpNode("div", "xp-checks");
  body.appendChild(rows);
  const go = (view, focusKey) => {
    closeModal();
    if (focusKey) {
      S.night.focusKey = focusKey;
      save();
    }
    switchView(view);
  };
  const checks = [];
  const addCheck = (label, ok, players = [], action = null, detail = "") => {
    checks.push(ok);
    const row = xpNode("div", "xp-check");
    row.appendChild(xpNode("strong", "", `${ok ? "✓" : "⚠"} ${label} — ${t(ok ? "xp.ok" : "xp.review")}`));
    if (detail) row.appendChild(xpNode("p", "hint", detail));
    const links = xpNode("div", "row");
    for (const p of players) links.appendChild(xpButton(p.name, () => {
      closeModal(); openSeatModal(p.id);
    }, "btn small ghost"));
    if (action) links.appendChild(xpButton(action.label, action.fn, "btn small"));
    row.appendChild(links);
    rows.appendChild(row);
  };
  const missing = S.players.filter(p => !p.roleId || !charById(p.roleId));
  addCheck(t("xp.rolesComplete"), S.players.length > 0 && !missing.length, missing,
    { label: t("xp.openSetup"), fn: () => go("setup") }, `${S.players.length - missing.length}/${S.players.length}`);
  const drunks = S.players.filter(p => p.roleId === "drunk");
  const invalidDrunks = drunks.filter(p => charById(p.shownRoleId)?.team !== "townsfolk");
  addCheck(t("xp.drunkCheck"), !invalidDrunks.length, invalidDrunks);
  const playerCount = S.players.filter(p => !["traveler", "fabled"].includes(charById(p.roleId)?.team)).length;
  const teensy = playerCount < 7;
  addCheck(t(teensy ? "xp.bluffOptional" : "xp.bluffCheck"),
    xpBluffsValid() || (teensy && !(S.bluffs || []).length), [],
    { label: t("xp.reviewBluffs"), fn: () => go("night", "meta:demoninfo") }, teensy ? t("xp.teensy") : "");
  const reminders = S.players.flatMap(p => (p.reminders || []).map(reminder => ({ p, reminder })));
  const fortune = S.players.filter(p => p.roleId === "fortuneteller");
  if (fortune.length) {
    const red = reminders.filter(({ reminder: r }) => r.sourceRoleId === "fortuneteller" && r.key === "Red herring");
    addCheck(t("xp.fortuneCheck"), red.length === 1, fortune,
      { label: t("xp.openNight"), fn: () => go("night", "char:fortuneteller") });
  }
  const washer = S.players.filter(p => p.roleId === "washerwoman");
  if (washer.length) {
    const sourced = reminders.filter(({ reminder: r }) => r.sourceRoleId === "washerwoman");
    const town = sourced.filter(({ reminder: r }) => r.key === "Townsfolk");
    const wrong = sourced.filter(({ reminder: r }) => r.key === "Wrong");
    const paired = town.length === 1 && wrong.length === 1 && town[0].p.id !== wrong[0].p.id;
    addCheck(t("xp.washerCheck"), paired, washer,
      { label: t("xp.openNight"), fn: () => go("night", "char:washerwoman") });
  }
  const checked = (S.setupChecks && S.setupChecks[S.scriptId]) || {};
  const manual = [];
  const updateCount = () => {
    count.textContent = `${t("xp.checkCount")} : ${checks.filter(Boolean).length + manual.filter(input => input.checked).length}/${checks.length + manual.length}`;
  };
  for (const [key, label] of [["setup", "xp.manualSetup"], ["jinx", "xp.manualJinx"]]) {
    const input = xpNode("input"); input.type = "checkbox"; input.checked = !!checked[key];
    manual.push(input);
    const labelNode = xpNode("label", "xp-check xp-manual-check");
    labelNode.append(input, xpNode("span", "", t(label)));
    rows.appendChild(labelNode);
    input.addEventListener("change", () => {
      pushHistory();
      if (!S.setupChecks || typeof S.setupChecks !== "object") S.setupChecks = {};
      if (!Object.prototype.hasOwnProperty.call(S.setupChecks, S.scriptId) ||
          typeof S.setupChecks[S.scriptId] !== "object" || S.setupChecks[S.scriptId] === null) {
        Object.defineProperty(S.setupChecks, S.scriptId, { value: {}, writable: true, enumerable: true, configurable: true });
      }
      S.setupChecks[S.scriptId][key] = input.checked;
      save();
      updateCount();
    });
  }
  updateCount();
}

function renderGMList(container) {
  if (!container) return;
  container.replaceChildren();
  container.classList.add("xp-gm-list");
  container.appendChild(xpNode("p", "hint", t("xp.gmOnly")));
  for (const p of S.players) {
    const role = charById(p.roleId), shown = charById(p.shownRoleId);
    const row = xpButton("", () => openSeatModal(p.id), "xp-gm-row");
    row.appendChild(xpNode("strong", "xp-gm-name", p.name));
    row.appendChild(xpNode("span", "xp-gm-role",
      role ? `${TEAM_GLYPH[role.team] || ""} ${loc(role.name)}` : t("xp.noRole")));
    if (shown) row.appendChild(xpNode("span", "xp-gm-shown", `${t("xp.shown")} : ${loc(shown.name)}`));
    const status = [t(p.alive ? "xp.alive" : "xp.dead")];
    if (!p.alive) status.push(t(p.ghostUsed ? "xp.ghostUsed" : "xp.ghostAvailable"));
    for (const key of ["poisoned", "drunk", "protected"]) if (p.statuses?.[key]) status.push(t("xp." + key));
    status.push(`${(p.information || []).length} ${t("xp.infos")}`);
    status.push(`${t("xp.usage")} : ${t("xp." + xpAbilityState(p))}`);
    row.appendChild(xpNode("span", "xp-gm-status", status.join(" · ")));
    const reminders = (p.reminders || []).map(r => loc(r.label) || r.key || "").filter(Boolean);
    if (reminders.length) row.appendChild(xpNode("span", "xp-gm-reminders", reminders.join(" · ")));
    container.appendChild(row);
  }
}

function enhanceNightView(steps) {
  const view = document.getElementById("view-night");
  if (!view || !S.night) return;
  if (typeof enhanceWakePreparations === "function") enhanceWakePreparations(steps);
  view.querySelector(".xp-night-toolbar")?.remove();
  const elements = [...view.querySelectorAll(".night-step[data-key]")];
  const present = new Set(elements.map(element => element.dataset.key));
  const ordered = (steps || []).filter(step => present.has(step.key));
  const toolbar = xpNode("div", "xp-night-toolbar");
  toolbar.setAttribute("role", "group");
  toolbar.setAttribute("aria-label", t("xp.guided"));
  const modes = xpNode("div", "row");
  const progress = xpNode("p", "xp-night-progress");
  progress.setAttribute("aria-live", "polite");
  const navigation = xpNode("div", "row");
  const guided = xpButton(t("xp.guided"), () => setMode(true));
  const full = xpButton(t("xp.full"), () => setMode(false));
  modes.append(guided, full);
  const previous = xpButton(`← ${t("xp.previous")}`, () => move(-1));
  const next = xpButton(`${t("xp.next")} →`, () => move(1));
  navigation.append(previous, next);
  toolbar.append(modes, progress, navigation);
  const first = elements[0];
  if (first) first.before(toolbar); else view.appendChild(toolbar);
  if (typeof S.night.guided !== "boolean") S.night.guided = false;
  const update = () => {
    let index = ordered.findIndex(step => step.key === S.night.focusKey);
    if (index < 0 && ordered.length) {
      index = 0;
      S.night.focusKey = ordered[0].key;
      save();
    }
    for (const element of elements) {
      element.classList.toggle("hidden", S.night.guided && element.dataset.key !== S.night.focusKey);
    }
    guided.setAttribute("aria-pressed", String(S.night.guided));
    full.setAttribute("aria-pressed", String(!S.night.guided));
    guided.classList.toggle("gold", S.night.guided);
    full.classList.toggle("gold", !S.night.guided);
    previous.disabled = index <= 0;
    next.disabled = index < 0 || index >= ordered.length - 1;
    const step = ordered[index];
    progress.textContent = step ? `${t("xp.step")} ${index + 1}/${ordered.length} — ${loc(step.title)}${step.who ? " · " + loc(step.who) : ""}` : t("xp.noSteps");
  };
  const setMode = value => { S.night.guided = value; save(); update(); };
  const move = direction => {
    const index = ordered.findIndex(step => step.key === S.night.focusKey) + direction;
    if (index < 0 || index >= ordered.length) return;
    S.night.focusKey = ordered[index].key;
    save();
    update();
    if (!S.night.guided) elements.find(element => element.dataset.key === S.night.focusKey)?.scrollIntoView({ block: "nearest" });
  };
  update();
}

function openMobileTools(showAll = false) {
  return openToolbox(showAll);
}
