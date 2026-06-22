const assert = require("node:assert/strict");
const State = require("./src/core/game-state.js");
const Persistence = require("./src/core/persistence.js");
const Time = require("./src/core/time-engine.js");

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

const storage = memoryStorage();
const character = State.createNewGame("mage", "scholar");
const savedAt = 1_000_000;
assert.equal(Persistence.save(character, storage, savedAt).ok, true, "a character can be saved locally");
assert.equal(Persistence.hasSave(storage), true, "the local save is discoverable");

const loaded = Persistence.load(storage, savedAt + 2 * 60 * 60 * 1000);
assert.equal(loaded.ok, true, "a valid local save loads");
assert.equal(loaded.offlineSeconds, 7200, "elapsed time becomes offline time");
const report = Time.advance(loaded.state, loaded.offlineSeconds, 1);
assert.ok(report.money > 0, "offline time advances job income");
assert.ok(report.jobLevels > 0 && report.skillLevels > 0, "offline time advances both training tracks");

const capped = Persistence.load(storage, savedAt + 30 * 24 * 60 * 60 * 1000);
assert.equal(capped.offlineSeconds, Persistence.MAX_OFFLINE_SECONDS, "offline work is safely capped at seven days");

const legacy = State.createNewGame("hunter", "ranger");
legacy.schemaVersion = 2;
delete legacy.combat.lastMessage;
const migrated = State.migrate(legacy);
assert.equal(migrated.schemaVersion, State.SCHEMA_VERSION, "older saves migrate to the current schema");
assert.equal(typeof migrated.combat.lastMessage, "string", "migration fills new combat fields");

storage.setItem(Persistence.SAVE_KEY, "not json");
assert.equal(Persistence.load(storage).corrupt, true, "corrupt saves fail safely");
assert.equal(Persistence.clear(storage), true, "local saves can be explicitly cleared");

console.log("Persistence and offline-progress checks passed.");
