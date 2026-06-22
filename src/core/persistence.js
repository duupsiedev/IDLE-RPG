(function (root, factory) {
  const stateApi = typeof module === "object" && module.exports ? require("./game-state.js") : root.IncrementKingdomState;
  const api = factory(stateApi);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IncrementKingdomPersistence = api;
})(typeof self !== "undefined" ? self : this, function (State) {
  "use strict";

  const SAVE_KEY = "increment-kingdom.save";
  const MAX_OFFLINE_SECONDS = 7 * 24 * 60 * 60;

  function browserStorage() {
    try { return window.localStorage; } catch (_) { return null; }
  }

  function save(state, storage, now) {
    const target = storage || browserStorage();
    if (!target) return { ok: false, error: "Local storage is unavailable." };
    try {
      const savedAt = now ?? Date.now();
      target.setItem(SAVE_KEY, JSON.stringify({ schemaVersion: State.SCHEMA_VERSION, savedAt, state }));
      return { ok: true, savedAt };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function load(storage, now) {
    const target = storage || browserStorage();
    if (!target) return { ok: false, error: "Local storage is unavailable." };
    try {
      const raw = target.getItem(SAVE_KEY);
      if (!raw) return { ok: false, empty: true };
      const parsed = JSON.parse(raw);
      const state = State.migrate(parsed.state || parsed);
      const savedAt = Number(parsed.savedAt) || (now ?? Date.now());
      const elapsed = Math.max(0, ((now ?? Date.now()) - savedAt) / 1000);
      return { ok: true, state, savedAt, offlineSeconds: Math.min(elapsed, MAX_OFFLINE_SECONDS), elapsedSeconds: elapsed };
    } catch (error) {
      return { ok: false, corrupt: true, error: error.message };
    }
  }

  function hasSave(storage) {
    const target = storage || browserStorage();
    try { return Boolean(target?.getItem(SAVE_KEY)); } catch (_) { return false; }
  }

  function clear(storage) {
    const target = storage || browserStorage();
    try { target?.removeItem(SAVE_KEY); return true; } catch (_) { return false; }
  }

  return { SAVE_KEY, MAX_OFFLINE_SECONDS, save, load, hasSave, clear };
});
