"use strict";

const MODAL_NAV = {
  active: null, parents: [], views: [], drafts: new Map(), fields: new Map(),
  game: null, training: null, initialized: false, replacing: false, restoring: false,
  maxParents: 8, maxDrafts: 24
};

function navigationProtected(includePreview = true) {
  return (typeof playerScreenActive === "function" && playerScreenActive()) ||
    ["privacy-overlay", "lock-overlay", "table-overlay", "storage-warning",
      ...(includePreview ? ["rescue-sheet-overlay"] : [])].some(id => {
      const element = document.getElementById(id);
      return element && !element.classList.contains("hidden");
    });
}

function navigationGameCurrent() {
  return MODAL_NAV.game === S && MODAL_NAV.training === TRAINING;
}

function navigationCheckGame() {
  if (!navigationGameCurrent()) {
    resetNavigation({ skipView: true });
  }
}

function resetNavigation(options = {}) {
  if (typeof xpResetInformationDrafts === "function") xpResetInformationDrafts(MODAL_NAV.game);
  MODAL_NAV.active = null;
  MODAL_NAV.parents.length = 0;
  MODAL_NAV.views.length = 0;
  MODAL_NAV.drafts.clear();
  MODAL_NAV.fields.clear();
  MODAL_NAV.game = S;
  MODAL_NAV.training = TRAINING;
  MODAL_NAV.replacing = false;
  MODAL_NAV.restoring = false;
  MODAL_NAV.skipView = !!options.skipView;
  if (typeof MODAL_CONTEXT !== "undefined") MODAL_CONTEXT = "";
  if (typeof MODAL_RETURN_FOCUS !== "undefined") MODAL_RETURN_FOCUS = null;
  if (typeof VIEW_POSITIONS !== "undefined") Object.keys(VIEW_POSITIONS).forEach(view => delete VIEW_POSITIONS[view]);
  const modal = document.getElementById("modal");
  if (modal) modal.replaceChildren();
  document.getElementById("modal-overlay")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function navigationRemember(map, key, value) {
  map.delete(key);
  map.set(key, value);
  while (map.size > MODAL_NAV.maxDrafts) map.delete(map.keys().next().value);
}

function modalDraftGet(key) {
  navigationCheckGame();
  return MODAL_NAV.drafts.get(key);
}

function modalDraftSet(key, value) {
  navigationCheckGame();
  navigationRemember(MODAL_NAV.drafts, key, value);
}

function modalDraftClear(key) {
  MODAL_NAV.drafts.delete(key);
  MODAL_NAV.fields.delete(key);
  MODAL_NAV.fields.delete("xp:" + key);
}

function modalCommitDraft() {
  const frame = MODAL_NAV.active;
  if (!frame) return;
  frame.dirty = false;
  MODAL_NAV.fields.delete(frame.key);
  navigationUpdateActions();
}

function navigationFields(root) {
  return [...root.querySelectorAll("input:not([type=file]):not([type=hidden]),textarea,select")].map((element, index) => ({
    key: element.dataset.navDraftKey || "",
    id: element.id && !element.id.startsWith("xp-field-") ? element.id : "",
    focus: element.dataset.xpFocus || "", index, value: element.value,
    checked: element.checked, type: element.type,
    start: element.selectionStart, end: element.selectionEnd
  }));
}

function navigationCapture(frame) {
  const root = document.getElementById("modal");
  frame.position = rememberInteraction(root);
  frame.focus = root.contains(document.activeElement) ? document.activeElement : null;
  if (frame.dirty && !frame.managedDraft) navigationRemember(MODAL_NAV.fields, frame.key, navigationFields(root));
}

function navigationRestoreFields(frame) {
  const root = document.getElementById("modal");
  const fields = [...root.querySelectorAll("input:not([type=file]):not([type=hidden]),textarea,select")];
  const saved = MODAL_NAV.fields.get(frame.key);
  if (!saved || frame.managedDraft) return;
  for (const field of saved) {
    const element = fields.find(el => field.key ? el.dataset.navDraftKey === field.key : field.id ? el.id === field.id :
      field.focus ? el.dataset.xpFocus === field.focus : el === fields[field.index]);
    if (!element || element.type !== field.type) continue;
    element.value = field.value;
    if (typeof field.checked === "boolean") element.checked = field.checked;
    if (typeof field.start === "number" && typeof element.setSelectionRange === "function") element.setSelectionRange(field.start, field.end);
  }
  frame.dirty = true;
  navigationUpdateActions();
}

function navigationUpdateActions() {
  const button = document.getElementById("modal-discard");
  if (button) button.hidden = !MODAL_NAV.active?.dirty;
}

function modalSetRestore(render) {
  if (MODAL_NAV.active) MODAL_NAV.active.restore = render;
}

function modalSetDiscard(discard) {
  if (MODAL_NAV.active) MODAL_NAV.active.discard = discard;
}

function modalManageDraft() {
  if (MODAL_NAV.active) {
    MODAL_NAV.active.managedDraft = true;
    MODAL_NAV.fields.delete(MODAL_NAV.active.key);
  }
}

function navigationOpenModal(html, key) {
  navigationCheckGame();
  if (navigationProtected()) return false;
  const modal = document.getElementById("modal");
  const incoming = document.createElement("div");
  if (html && typeof html === "object" && html.nodeType === 1) incoming.append(html);
  else incoming.innerHTML = html;
  const context = key || incoming.querySelector("h2,h3")?.textContent || "dialog";
  const previous = MODAL_NAV.active;
  const same = previous?.key === context;
  if (previous) navigationCapture(previous);
  if (previous && !same && !MODAL_NAV.replacing) {
    previous.nodes = document.createDocumentFragment();
    previous.nodes.append(...modal.childNodes);
    MODAL_NAV.parents.push(previous);
    if (MODAL_NAV.parents.length > MODAL_NAV.maxParents) MODAL_NAV.parents.shift();
  }
  const frame = same ? previous : {
    key: context, opener: previous?.opener || document.activeElement, dirty: false,
    restore: null, position: null, nodes: null
  };
  MODAL_NAV.active = frame;
  const revision = frame.revision = (frame.revision || 0) + 1;
  MODAL_NAV.replacing = false;
  modal.replaceChildren(...incoming.childNodes);
  const actions = document.createElement("nav");
  actions.className = "modal-navigation";
  actions.setAttribute("aria-label", tr("Navigation du dialogue", "Dialog navigation"));
  const back = document.createElement("button");
  back.type = "button"; back.id = "modal-back"; back.className = "btn small ghost";
  back.textContent = "‹ " + tr("Retour", "Back");
  back.onclick = modalBack;
  const discard = document.createElement("button");
  discard.type = "button"; discard.id = "modal-discard"; discard.className = "btn small ghost";
  discard.textContent = tr("Abandonner le brouillon", "Discard draft");
  discard.onclick = modalDiscardDraft;
  const all = document.createElement("button");
  all.type = "button"; all.id = "modal-close-all"; all.className = "btn small ghost";
  all.textContent = tr("Tout fermer", "Close all");
  all.onclick = closeAllModals;
  actions.append(back, discard, all);
  modal.prepend(actions);
  document.getElementById("modal-overlay").classList.remove("hidden");
  document.body.classList.add("modal-open");
  navigationUpdateActions();
  if (same && frame.position) restoreInteraction(modal, frame.position);
  else modal.scrollTop = 0;
  if (!same) modal.querySelector("input:not([type=hidden]),select,textarea,.btn.gold,#modal-back")?.focus({ preventScroll: true });
  queueMicrotask(() => {
    if (MODAL_NAV.active !== frame || frame.revision !== revision || !navigationGameCurrent()) return;
    navigationRestoreFields(frame);
    if (same && frame.position) restoreInteraction(modal, frame.position);
  });
  return true;
}

function navigationCloseModal(restoreParent = true, options = {}) {
  navigationCheckGame();
  if (navigationProtected()) return false;
  const frame = MODAL_NAV.active;
  if (!frame) return false;
  navigationCapture(frame);
  MODAL_NAV.active = null;
  const modal = document.getElementById("modal");
  modal.replaceChildren();
  const parent = restoreParent && MODAL_NAV.parents.pop();
  if (parent) {
    MODAL_NAV.active = parent;
    modal.append(parent.nodes);
    parent.nodes = null;
    if (parent.restore) {
      MODAL_NAV.restoring = true;
      try { parent.restore(); } finally { MODAL_NAV.restoring = false; }
    }
    if (MODAL_NAV.active === parent && parent.position) restoreInteraction(modal, parent.position);
    if (parent.focus?.isConnected) parent.focus.focus({ preventScroll: true });
    navigationUpdateActions();
  } else {
    document.getElementById("modal-overlay").classList.add("hidden");
    document.body.classList.remove("modal-open");
    if (options.restoreFocus !== false && frame.opener?.isConnected && !frame.opener.closest("[inert]")) frame.opener.focus({ preventScroll: true });
  }
  return true;
}

function modalBack() {
  return navigationCloseModal();
}

function closeAllModals(options = {}) {
  navigationCheckGame();
  if (navigationProtected()) return false;
  if (MODAL_NAV.active) navigationCapture(MODAL_NAV.active);
  MODAL_NAV.parents.length = 0;
  return navigationCloseModal(false, options);
}

function modalDiscardDraft() {
  const frame = MODAL_NAV.active;
  if (!frame || navigationProtected()) return false;
  if (!confirm(tr("Abandonner le texte non enregistré de ce dialogue ?", "Discard the unsaved text in this dialog?"))) return false;
  if (frame.discard) frame.discard();
  modalDraftClear(frame.key);
  modalDraftClear(frame.key.replace(/^xp:/, ""));
  frame.dirty = false;
  return navigationCloseModal();
}

function modalNavigate(action) {
  navigationCheckGame();
  if (navigationProtected()) return false;
  const previous = MODAL_NAV.active;
  MODAL_NAV.replacing = true;
  try { action(); } finally { MODAL_NAV.replacing = false; }
  if (MODAL_NAV.active === previous) closeModal();
  return true;
}

function navigationView(view) {
  navigationCheckGame();
  if (navigationProtected()) return false;
  closeAllModals();
  if (currentView !== view && !MODAL_NAV.skipView) {
    MODAL_NAV.views.push(currentView);
    if (MODAL_NAV.views.length > 12) MODAL_NAV.views.shift();
  }
  MODAL_NAV.skipView = false;
  return true;
}

function navigationBrowserBack() {
  navigationCheckGame();
  if (typeof playerScreenActive === "function" && playerScreenActive()) {
    xpNeutralScreen();
    return;
  }
  if (navigationProtected(false)) return;
  if (document.getElementById("rescue-sheet-overlay")) {
    if (typeof closeRescueSheet === "function") closeRescueSheet();
    return;
  }
  if (MODAL_NAV.active) { modalBack(); return; }
  const previous = MODAL_NAV.views.pop();
  if (previous) switchView(previous, { fromNavigation: true });
}

function initNavigation() {
  if (MODAL_NAV.initialized) return;
  MODAL_NAV.initialized = true;
  resetNavigation();
  // Two opaque entries act as a bounded Back guard. Private routes and drafts stay in memory.
  if (!history.state?.botcNavigation) {
    history.replaceState({ botcNavigation: 1 }, "");
    history.pushState({ botcNavigation: 2 }, "");
  } else history.replaceState({ botcNavigation: 2 }, "");
  window.addEventListener("popstate", () => {
    history.pushState({ botcNavigation: 2 }, "");
    navigationBrowserBack();
  });
  const modal = document.getElementById("modal");
  modal.addEventListener("input", event => {
    if (!navigationGameCurrent()) { resetNavigation(); event.stopImmediatePropagation(); return; }
    if (!MODAL_NAV.active || !event.target.matches("textarea,input:not([type=checkbox]):not([type=radio]):not([data-nav-autosave])")) return;
    if (/search|pal-input/.test(event.target.id)) return;
    MODAL_NAV.active.dirty = true;
    navigationUpdateActions();
  }, true);
  for (const type of ["click", "change", "keydown"]) modal.addEventListener(type, event => {
    if (navigationGameCurrent() && !navigationProtected()) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!navigationGameCurrent()) resetNavigation();
  }, true);
}
