"use strict";

const FeedbackCore = (() => {
  const STORAGE_KEY = "botc-mj-feedback-v1";
  const MAX_REPORTS = 100, MAX_FIELD = 2000, MAX_BYTES = 250000;
  const CATEGORIES = Object.freeze(["usability", "rule-guidance", "bug", "idea"]);
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
  function fail(code) { const error = new Error(code); error.code = code; throw error; }
  function freeze(value) {
    if (object(value) || Array.isArray(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  function byteLength(text) { return new TextEncoder().encode(text).length; }
  function browserFamily(userAgent) {
    if (typeof userAgent !== "string") return "Other";
    if (/Edg(?:e|A|iOS)?\//i.test(userAgent)) return "Edge";
    if (/Firefox\/|FxiOS\//i.test(userAgent)) return "Firefox";
    if (/Chrome\/|CriOS\//i.test(userAgent)) return "Chrome";
    if (/Safari\//i.test(userAgent) && /Version\//i.test(userAgent)) return "Safari";
    return "Other";
  }
  function buildDiagnostics(input = {}) {
    const source = object(input) ? input : {};
    const bool = key => typeof source[key] === "boolean" ? source[key] : null;
    const size = value => Number.isInteger(value) && value >= 0 && value <= 32768 ? value : null;
    return freeze({
      appVersion: typeof source.appVersion === "string" && /^grimoire-mj-v\d{1,6}(?:\.\d{1,6}){0,2}$/.test(source.appVersion) ? source.appVersion : null,
      uiLanguage: ["fr", "en"].includes(source.uiLanguage) ? source.uiLanguage : null,
      browserFamily: ["Chrome", "Edge", "Safari", "Firefox", "Other"].includes(source.browserFamily) ? source.browserFamily : "Other",
      viewport: { width: size(source.viewport?.width), height: size(source.viewport?.height) },
      standalone: bool("standalone"), online: bool("online"), readyOffline: bool("readyOffline"),
      essentialMode: bool("essentialMode"), seatPlacement: bool("seatPlacement")
    });
  }
  function timestamp(value, nullable = false) {
    if (nullable && value === null) return null;
    if (!Number.isInteger(value) || value < 0 || value > 8640000000000000) fail("invalid-report");
    return value;
  }
  function text(value, required = false) {
    if (typeof value !== "string") fail("invalid-report");
    if (value.length > MAX_FIELD) fail("field-limit");
    if (required && !value.trim()) fail("required");
    return value;
  }
  function validateReport(input) {
    if (!object(input) || typeof input.id !== "string" || !/^fb-[a-z0-9-]{8,80}$/i.test(input.id) || !CATEGORIES.includes(input.category)) fail("invalid-report");
    const createdAt = timestamp(input.createdAt), updatedAt = timestamp(input.updatedAt ?? createdAt);
    if (updatedAt < createdAt) fail("invalid-report");
    return freeze({
      id: input.id, category: input.category, createdAt, updatedAt,
      occurredAt: timestamp(input.occurredAt ?? null, true),
      happened: text(input.happened, true), expected: text(input.expected ?? ""),
      diagnostics: buildDiagnostics(input.diagnostics)
    });
  }
  function validateLibrary(input) {
    if (!object(input) || input.version !== 1 || !Array.isArray(input.reports)) fail("invalid-library");
    if (input.reports.length > MAX_REPORTS) fail("report-limit");
    const reports = input.reports.map(validateReport);
    if (new Set(reports.map(report => report.id)).size !== reports.length) fail("invalid-library");
    const library = { version: 1, reports };
    if (byteLength(JSON.stringify(library)) > MAX_BYTES) fail("byte-limit");
    return freeze(library);
  }
  function technicalText(diagnostics) {
    const display = value => value === null ? "Unknown" : String(value);
    return [
      "Local feedback: technical diagnostics only",
      "appVersion: " + display(diagnostics.appVersion),
      "uiLanguage: " + display(diagnostics.uiLanguage),
      "browserFamily: " + diagnostics.browserFamily,
      "viewport.width: " + display(diagnostics.viewport.width),
      "viewport.height: " + display(diagnostics.viewport.height),
      ...["standalone", "online", "readyOffline", "essentialMode", "seatPlacement"].map(key => key + ": " + display(diagnostics[key]))
    ].join("\n");
  }
  function encodeReport(input, options = {}) {
    const includeText = options.includeText === true;
    const format = options.format ?? "json";
    if (!["json", "text"].includes(format)) fail("invalid-export");
    const diagnostics = buildDiagnostics(object(input) ? input.diagnostics : null);
    if (!includeText) return format === "json" ?
      JSON.stringify({ format: "botc-feedback-technical-v1", diagnostics }, null, 2) : technicalText(diagnostics);
    const report = validateReport(input);
    if (format === "json") return JSON.stringify({ format: "botc-feedback-report-v1", report }, null, 2);
    return [
      "Local feedback report", "id: " + report.id, "category: " + report.category,
      "createdAt: " + new Date(report.createdAt).toISOString(),
      "updatedAt: " + new Date(report.updatedAt).toISOString(),
      "occurredAt: " + (report.occurredAt === null ? "Not recorded" : new Date(report.occurredAt).toISOString()),
      "", "What happened:", report.happened, "", "Expected outcome:", report.expected,
      "", technicalText(diagnostics)
    ].join("\n");
  }
  function encodeLibrary(input, options = {}) {
    const library = validateLibrary(input);
    return options.includeText === true ?
      JSON.stringify({ format: "botc-feedback-library-v1", version: 1, reports: library.reports }, null, 2) :
      JSON.stringify({ format: "botc-feedback-technical-library-v1", diagnostics: library.reports.map(report => buildDiagnostics(report.diagnostics)) }, null, 2);
  }
  function createStore(storage) {
    function raw() {
      try { return storage.getItem(STORAGE_KEY); } catch (_) { fail("storage-read"); }
    }
    function readVersion() {
      const value = raw();
      if (value === null) return { raw: value, library: freeze({ version: 1, reports: [] }) };
      if (typeof value !== "string" || byteLength(value) > MAX_BYTES) fail("byte-limit");
      let parsed;
      try { parsed = JSON.parse(value); } catch (_) { fail("invalid-library"); }
      return { raw: value, library: validateLibrary(parsed) };
    }
    function write(library, expectedRaw) {
      const clean = validateLibrary(library), content = JSON.stringify(clean);
      if (raw() !== expectedRaw) fail("conflict");
      try { storage.setItem(STORAGE_KEY, content); } catch (_) { fail("storage-write"); }
      return clean;
    }
    function find(version, id, expected) {
      const report = version.library.reports.find(item => item.id === id);
      if (!report) fail("missing-report");
      if (expected && JSON.stringify(report) !== JSON.stringify(validateReport(expected))) fail("conflict");
      return report;
    }
    return Object.freeze({
      read: () => readVersion().library,
      add(input) {
        const version = readVersion(), report = validateReport(input);
        write({ version: 1, reports: [...version.library.reports, report] }, version.raw);
        return report;
      },
      update(id, patch, now, expected) {
        const version = readVersion(), previous = find(version, id, expected);
        if (!object(patch)) fail("invalid-report");
        const report = validateReport({
          id: previous.id, createdAt: previous.createdAt, updatedAt: Math.max(previous.updatedAt, timestamp(now)),
          category: own(patch, "category") ? patch.category : previous.category,
          happened: own(patch, "happened") ? patch.happened : previous.happened,
          expected: own(patch, "expected") ? patch.expected : previous.expected,
          occurredAt: own(patch, "occurredAt") ? patch.occurredAt : previous.occurredAt,
          diagnostics: previous.diagnostics
        });
        write({ version: 1, reports: version.library.reports.map(item => item.id === id ? report : item) }, version.raw);
        return report;
      },
      remove(id, expected) {
        const version = readVersion(); find(version, id, expected);
        return write({ version: 1, reports: version.library.reports.filter(report => report.id !== id) }, version.raw);
      }
    });
  }
  return Object.freeze({
    STORAGE_KEY, MAX_REPORTS, MAX_FIELD, MAX_BYTES, CATEGORIES,
    browserFamily, buildDiagnostics, validateReport, validateLibrary, encodeReport, encodeLibrary, createStore
  });
})();

function initFeedback() {
  Object.assign(I18N.fr, {
    feedback: "Signaler une difficulté",
    "fb.localOnly": "Rien n’est envoyé automatiquement",
    "fb.localHelp": "Cette bibliothèque reste dans ce navigateur, séparée de la partie et de ses exports. L'entraînement utilise sa propre bibliothèque temporaire.",
    "fb.secretWarning": "Votre texte libre peut contenir des secrets de partie. Relisez le contenu exact du fichier avant de le télécharger, puis avant de le partager vous-même.",
    "fb.technicalHelp": "Le diagnostic technique seul exclut le texte, la catégorie, les identifiants et les dates du signalement. Il ne contient aucune donnée de partie.",
    "fb.new": "Nouveau signalement", "fb.technical": "Diagnostic technique seul",
    "fb.library": "Exporter la bibliothèque", "fb.empty": "Aucun signalement local.",
    "fb.category": "Catégorie", "fb.usability": "Utilisation", "fb.rule-guidance": "Aide aux règles", "fb.bug": "Anomalie", "fb.idea": "Idée",
    "fb.happened": "Que s'est-il passé ?", "fb.expected": "Résultat attendu (facultatif)",
    "fb.occurredAt": "Date du constat (facultative)", "fb.createdAt": "Créé le", "fb.updatedAt": "Modifié le",
    "fb.immutable": "Le diagnostic correspond à la création de ce signalement et ne change pas pendant une modification. Créez explicitement un nouveau signalement pour en capturer un autre.",
    "fb.save": "Enregistrer localement", "fb.edit": "Modifier", "fb.delete": "Supprimer", "fb.cancel": "Annuler", "fb.close": "Fermer",
    "fb.confirmDelete": "Supprimer ce signalement local ? Cette suppression est définitive.",
    "fb.json": "Aperçu JSON", "fb.text": "Aperçu texte", "fb.preview": "Vérifier le fichier avant téléchargement",
    "fb.includeText": "Inclure le texte libre et les métadonnées du signalement",
    "fb.reviewed": "J'ai relu le contenu exact affiché ci-dessous.",
    "fb.download": "Télécharger ce fichier", "fb.back": "Retour à la bibliothèque",
    "fb.scopeChanged": "Le mode de partie a changé. Rouvrez la bibliothèque pour continuer.",
    "fb.storage-read": "Lecture du stockage local impossible. Aucun changement effectué.",
    "fb.storage-write": "Enregistrement local impossible : stockage plein ou bloqué. Aucun succès confirmé.",
    "fb.invalid-library": "Bibliothèque locale invalide. Elle n'a pas été remplacée.",
    "fb.invalid-report": "Signalement invalide. Vérifiez la catégorie, les textes et les dates.",
    "fb.required": "Décrivez ce qui s'est passé avant d'enregistrer.",
    "fb.field-limit": "Chaque champ de texte est limité à 2 000 caractères. Rien n'a été tronqué.",
    "fb.report-limit": "Limite de 100 signalements atteinte. Supprimez explicitement une entrée pour en ajouter une.",
    "fb.byte-limit": "Limite de 250 000 octets atteinte. Aucune entrée n'a été supprimée automatiquement.",
    "fb.conflict": "Ce signalement ou la bibliothèque a changé ailleurs. Rouvrez-la pour éviter d'écraser une modification.",
    "fb.missing-report": "Signalement introuvable. Rouvrez la bibliothèque.",
    "fb.invalid-export": "Format d'export invalide.", "fb.error": "Opération locale impossible. Aucune donnée de diagnostic supplémentaire n'a été collectée."
  });
  Object.assign(I18N.en, {
    feedback: "Report a difficulty",
    "fb.localOnly": "Nothing is sent automatically",
    "fb.localHelp": "This library stays in this browser, separate from the game and its exports. Training uses its own temporary library.",
    "fb.secretWarning": "Your free text may contain game secrets. Review the exact file contents before downloading, and again before sharing it yourself.",
    "fb.technicalHelp": "Technical-only diagnostics exclude report text, category, identifiers and dates. They contain no game data.",
    "fb.new": "New report", "fb.technical": "Technical diagnostics only",
    "fb.library": "Export library", "fb.empty": "No local reports.",
    "fb.category": "Category", "fb.usability": "Usability", "fb.rule-guidance": "Rule guidance", "fb.bug": "Bug", "fb.idea": "Idea",
    "fb.happened": "What happened?", "fb.expected": "Expected outcome (optional)",
    "fb.occurredAt": "Time observed (optional)", "fb.createdAt": "Created", "fb.updatedAt": "Edited",
    "fb.immutable": "Diagnostics were captured when this report was created and never change during editing. Explicitly create a new report to capture a fresh diagnostic.",
    "fb.save": "Save locally", "fb.edit": "Edit", "fb.delete": "Delete", "fb.cancel": "Cancel", "fb.close": "Close",
    "fb.confirmDelete": "Delete this local report? This deletion is permanent.",
    "fb.json": "Preview JSON", "fb.text": "Preview text", "fb.preview": "Review file before downloading",
    "fb.includeText": "Include free text and report metadata",
    "fb.reviewed": "I have reviewed the exact contents shown below.",
    "fb.download": "Download this file", "fb.back": "Back to library",
    "fb.scopeChanged": "The game mode changed. Reopen the library to continue.",
    "fb.storage-read": "Cannot read local storage. Nothing was changed.",
    "fb.storage-write": "Cannot save locally: storage is full or blocked. Success was not confirmed.",
    "fb.invalid-library": "Invalid local library. It has not been replaced.",
    "fb.invalid-report": "Invalid report. Check the category, text and dates.",
    "fb.required": "Describe what happened before saving.",
    "fb.field-limit": "Each text field is limited to 2,000 characters. Nothing was truncated.",
    "fb.report-limit": "The 100-report limit is reached. Explicitly delete an entry before adding another.",
    "fb.byte-limit": "The 250,000-byte limit is reached. No entries were automatically dropped.",
    "fb.conflict": "This report or library changed elsewhere. Reopen it to avoid overwriting an edit.",
    "fb.missing-report": "Report not found. Reopen the library.",
    "fb.invalid-export": "Invalid export format.", "fb.error": "The local operation failed. No additional diagnostic data was collected."
  });
}
function fbPlayerScreenActive() { return typeof playerScreenActive === "function" && playerScreenActive(); }
function fbNode(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
function fbContext() {
  const training = !!TRAINING;
  return { training, store: FeedbackCore.createStore(training ? sessionStorage : localStorage) };
}
function fbCheckContext(context) {
  if (!!TRAINING !== context.training) { const error = new Error("scopeChanged"); error.code = "scopeChanged"; throw error; }
}
function fbError(root, error) {
  const allowed = ["scopeChanged", "storage-read", "storage-write", "invalid-library", "invalid-report", "required", "field-limit", "report-limit", "byte-limit", "conflict", "missing-report", "invalid-export"];
  const code = allowed.includes(error?.code) ? error.code : "error";
  let target = root.querySelector(".fb-error");
  if (!target) { target = fbNode("p", "fb-error"); target.setAttribute("role", "alert"); root.appendChild(target); }
  target.hidden = false; target.textContent = t("fb." + code);
}
function fbButton(root, text, style, action) {
  const button = fbNode("button", "btn " + (style || ""), text);
  button.type = "button";
  button.addEventListener("click", () => {
    if (fbPlayerScreenActive()) return;
    try { action(); } catch (error) { fbError(root, error); }
  });
  return button;
}
function fbModal(title) {
  if (fbPlayerScreenActive()) return null;
  openModal('<section class="fb-modal" id="fb-modal-root"></section>', "local-feedback");
  const root = document.getElementById("fb-modal-root");
  if (!root) return null;
  root.appendChild(fbNode("h3", "", title));
  const warning = fbNode("p", "fb-local-only", t("fb.localOnly"));
  warning.setAttribute("role", "note");
  root.appendChild(warning);
  const error = fbNode("p", "fb-error"); error.setAttribute("role", "alert"); error.hidden = true; root.appendChild(error);
  return root;
}
function fbCollectDiagnostics() {
  return FeedbackCore.buildDiagnostics({
    appVersion: OFFLINE?.version,
    uiLanguage: S?.lang,
    browserFamily: FeedbackCore.browserFamily(navigator.userAgent),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    standalone: !!window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true,
    online: navigator.onLine,
    readyOffline: OFFLINE?.ready,
    essentialMode: S?.settings?.essentialMode === true,
    seatPlacement: S?.settings?.seatPlacement === true
  });
}
function fbNewId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return "fb-" + crypto.randomUUID();
  return "fb-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2) + "-" + Math.random().toString(36).slice(2);
}
function fbDate(value) { return new Date(value).toLocaleString(S?.lang === "en" ? "en-GB" : "fr-FR"); }
function fbLocalDateValue(value) {
  if (value === null) return "";
  const date = new Date(value), pad = number => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function fbOpenEditor(context, previous) {
  fbCheckContext(context);
  const draft = previous || {
    id: fbNewId(), createdAt: Date.now(), category: "usability", happened: "", expected: "", occurredAt: null,
    diagnostics: fbCollectDiagnostics()
  };
  const root = fbModal(previous ? t("fb.edit") : t("fb.new"));
  if (!root) return null;
  root.appendChild(fbNode("p", "hint", t("fb.immutable")));
  root.appendChild(fbNode("p", "hint", t("fb.createdAt") + " : " + fbDate(draft.createdAt)));
  const field = (labelText, control) => {
    const label = fbNode("label", "fb-field", labelText);
    label.appendChild(control); root.appendChild(label); return control;
  };
  const category = field(t("fb.category"), fbNode("select"));
  FeedbackCore.CATEGORIES.forEach(key => {
    const option = fbNode("option", "", t("fb." + key)); option.value = key; category.appendChild(option);
  });
  category.value = draft.category;
  const happened = field(t("fb.happened"), fbNode("textarea"));
  happened.value = draft.happened; happened.maxLength = FeedbackCore.MAX_FIELD; happened.required = true;
  const expected = field(t("fb.expected"), fbNode("textarea"));
  expected.value = draft.expected; expected.maxLength = FeedbackCore.MAX_FIELD;
  const date = field(t("fb.occurredAt"), fbNode("input"));
  date.type = "datetime-local"; date.value = fbLocalDateValue(draft.occurredAt);
  const originalDateValue = date.value;
  root.appendChild(fbNode("p", "fb-warning", t("fb.secretWarning")));
  const actions = fbNode("div", "modal-actions");
  actions.appendChild(fbButton(root, t("fb.save"), "gold", () => {
    fbCheckContext(context);
    let occurredAt = null;
    if (date.value) {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(date.value) || !Number.isFinite(Date.parse(date.value))) {
        const error = new Error("invalid-report"); error.code = "invalid-report"; throw error;
      }
      occurredAt = date.value === originalDateValue ? draft.occurredAt : Date.parse(date.value);
    }
    const patch = { category: category.value, happened: happened.value, expected: expected.value, occurredAt };
    if (previous) context.store.update(previous.id, patch, Date.now(), previous);
    else context.store.add({
      id: draft.id, createdAt: draft.createdAt, updatedAt: draft.createdAt,
      category: patch.category, happened: patch.happened, expected: patch.expected, occurredAt,
      diagnostics: draft.diagnostics
    });
    openFeedback();
  }));
  actions.appendChild(fbButton(root, t("fb.cancel"), "ghost", openFeedback));
  root.appendChild(actions); happened.focus({ preventScroll: true });
  return root;
}
function fbOpenPreview(context, input, options = {}) {
  fbCheckContext(context);
  const root = fbModal(t("fb.preview"));
  if (!root) return null;
  const library = options.library === true, technicalOnly = options.technicalOnly === true;
  const format = options.format === "text" && !library ? "text" : "json";
  const snapshot = library ? FeedbackCore.validateLibrary(input) : technicalOnly ?
    { diagnostics: FeedbackCore.buildDiagnostics(input.diagnostics) } : FeedbackCore.validateReport(input);
  root.appendChild(fbNode("p", "fb-warning", t("fb.secretWarning")));
  root.appendChild(fbNode("p", "hint", t("fb.technicalHelp")));
  const includeText = fbNode("input"); includeText.type = "checkbox"; includeText.checked = false;
  if (!technicalOnly) {
    const label = fbNode("label", "fb-check");
    label.append(includeText, fbNode("span", "", t("fb.includeText"))); root.appendChild(label);
  }
  const preview = fbNode("pre", "fb-preview"); preview.tabIndex = 0;
  preview.setAttribute("aria-label", t("fb.preview")); root.appendChild(preview);
  const reviewed = fbNode("input"); reviewed.type = "checkbox"; reviewed.checked = false;
  const reviewLabel = fbNode("label", "fb-check");
  reviewLabel.append(reviewed, fbNode("span", "", t("fb.reviewed"))); root.appendChild(reviewLabel);
  let outbound = "";
  const download = fbButton(root, t("fb.download"), "gold", () => {
    fbCheckContext(context);
    if (!reviewed.checked) return;
    const name = library ? "botc-feedback-library.json" : "botc-feedback-" + (includeText.checked ? "report" : "technical") + (format === "text" ? ".txt" : ".json");
    downloadFile(name, outbound, format === "text" ? "text/plain;charset=utf-8" : "application/json");
  });
  download.disabled = true;
  const refresh = () => {
    if (fbPlayerScreenActive()) return;
    outbound = library ? FeedbackCore.encodeLibrary(snapshot, { includeText: includeText.checked }) :
      FeedbackCore.encodeReport(snapshot, { includeText: !technicalOnly && includeText.checked, format });
    preview.textContent = outbound; reviewed.checked = false; download.disabled = true;
  };
  includeText.addEventListener("change", () => {
    if (fbPlayerScreenActive()) return;
    try { fbCheckContext(context); refresh(); } catch (error) { fbError(root, error); download.disabled = true; }
  });
  reviewed.addEventListener("change", () => { download.disabled = !reviewed.checked || fbPlayerScreenActive(); });
  const actions = fbNode("div", "modal-actions");
  actions.append(download, fbButton(root, t("fb.back"), "ghost", openFeedback));
  root.appendChild(actions); refresh(); preview.focus({ preventScroll: true });
  return root;
}
function openFeedback() {
  if (fbPlayerScreenActive()) return null;
  const root = fbModal(t("feedback"));
  if (!root) return null;
  root.appendChild(fbNode("p", "hint", t("fb.localHelp")));
  root.appendChild(fbNode("p", "fb-warning", t("fb.secretWarning")));
  const controls = fbNode("div", "row fb-controls");
  root.appendChild(controls);
  const technicalContext = { training: !!TRAINING };
  controls.appendChild(fbButton(root, t("fb.technical"), "", () => {
    fbCheckContext(technicalContext);
    fbOpenPreview(technicalContext, { diagnostics: fbCollectDiagnostics() }, { technicalOnly: true });
  }));
  let context;
  try {
    context = fbContext();
    const library = context.store.read();
    controls.appendChild(fbButton(root, t("fb.new"), "gold", () => fbOpenEditor(context)));
    const exportLibrary = fbButton(root, t("fb.library"), "", () => {
      fbCheckContext(context); fbOpenPreview(context, context.store.read(), { library: true });
    });
    exportLibrary.disabled = !library.reports.length; controls.appendChild(exportLibrary);
    root.appendChild(fbNode("p", "hint", `${library.reports.length} / ${FeedbackCore.MAX_REPORTS}`));
    if (!library.reports.length) root.appendChild(fbNode("p", "hint", t("fb.empty")));
    library.reports.slice().reverse().forEach(report => {
      const card = fbNode("article", "fb-report");
      card.appendChild(fbNode("h4", "", t("fb." + report.category)));
      card.appendChild(fbNode("p", "hint", t("fb.createdAt") + " : " + fbDate(report.createdAt) + " · " + t("fb.updatedAt") + " : " + fbDate(report.updatedAt)));
      if (report.occurredAt !== null) card.appendChild(fbNode("p", "hint", t("fb.occurredAt") + " : " + fbDate(report.occurredAt)));
      card.appendChild(fbNode("p", "fb-report-text", report.happened));
      if (report.expected) card.appendChild(fbNode("p", "fb-report-text", t("fb.expected") + " : " + report.expected));
      const buttons = fbNode("div", "row");
      buttons.append(
        fbButton(root, t("fb.edit"), "small", () => fbOpenEditor(context, report)),
        fbButton(root, t("fb.delete"), "small ghost", () => {
          fbCheckContext(context);
          if (!confirm(t("fb.confirmDelete"))) return;
          context.store.remove(report.id, report); openFeedback();
        }),
        fbButton(root, t("fb.json"), "small", () => fbOpenPreview(context, report, { format: "json" })),
        fbButton(root, t("fb.text"), "small", () => fbOpenPreview(context, report, { format: "text" }))
      );
      card.appendChild(buttons); root.appendChild(card);
    });
  } catch (error) { fbError(root, error); }
  const actions = fbNode("div", "modal-actions");
  actions.appendChild(fbButton(root, t("fb.close"), "ghost", closeModal)); root.appendChild(actions);
  (controls.querySelector("button") || actions.querySelector("button"))?.focus({ preventScroll: true });
  return root;
}

if (typeof module === "object" && module.exports) module.exports = FeedbackCore;
