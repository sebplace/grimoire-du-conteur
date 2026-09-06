"use strict";

class GamePersistence {
  constructor(storage, key) {
    this.storage = storage;
    this.key = key;
    this.expected = undefined;
  }
  read() {
    const raw = this.storage.getItem(this.key);
    const value = raw === null ? null : JSON.parse(raw);
    this.expected = raw;
    return value;
  }
  write(value) {
    if (this.expected === undefined || this.storage.getItem(this.key) !== this.expected) {
      const error = new Error("Another tab changed this game. Reload before editing.");
      error.name = "GameConflictError";
      throw error;
    }
    const raw = JSON.stringify(value);
    this.storage.setItem(this.key, raw);
    this.expected = raw;
  }
  backups() {
    const value = JSON.parse(this.storage.getItem(this.key + ":backups") || "[]");
    if (!Array.isArray(value)) throw new Error("Invalid backup archive");
    return value;
  }
  backup(reason) {
    const raw = this.storage.getItem(this.key);
    if (!raw) return;
    const state = JSON.parse(raw);
    // Keep the game, not copies of its copies. Undo history is not needed to restore it.
    delete state.history; delete state.redo;
    const entries = [{ id: Date.now().toString(36), date: Date.now(), reason, raw: JSON.stringify(state) }, ...this.backups()].slice(0, 8);
    while (entries.length > 1 && JSON.stringify(entries).length > 1500000) entries.pop();
    for (;;) {
      try { this.storage.setItem(this.key + ":backups", JSON.stringify(entries)); return; }
      catch (error) {
        if (error.name !== "QuotaExceededError" || entries.length <= 1) throw error;
        entries.pop();
      }
    }
  }
}

if (typeof module !== "undefined" && module.exports) module.exports = GamePersistence;
