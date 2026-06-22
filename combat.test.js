const assert = require("node:assert/strict");
const State = require("./src/core/game-state.js");
const Progression = require("./src/core/progression.js");
const Combat = require("./src/core/combat.js");

const hunter = State.createNewGame("hunter", "ranger");
assert.equal(Combat.selectMonster(hunter, "cellar-rat"), true, "a valid monster can be selected");
const startingHp = Combat.snapshot(hunter).playerHp;
Combat.tick(hunter, 2);
assert.ok(Combat.snapshot(hunter).playerHp < startingHp, "monsters fight back");

const startingDexterity = hunter.stats.dexterity;
for (let i = 0; i < 200 && !hunter.combat.defeats["cellar-rat"]; i++) Combat.tick(hunter, .5);
assert.equal(hunter.combat.defeats["cellar-rat"], 1, "automatic combat reaches victory");
const firstGain = hunter.stats.dexterity - startingDexterity;
for (let i = 0; i < 200 && hunter.combat.defeats["cellar-rat"] < 2; i++) Combat.tick(hunter, .5);
const secondGain = hunter.stats.dexterity - startingDexterity - firstGain;
assert.ok(firstGain > secondGain, "repeat rewards diminish per defeat");

const moneyBefore = hunter.resources.money;
Progression.tick(hunter, 10);
Combat.tick(hunter, 10);
assert.ok(hunter.resources.money > moneyBefore, "jobs continue alongside combat");

const underprepared = State.createNewGame("warrior", "commoner");
Combat.selectMonster(underprepared, "ruined-golem");
for (let i = 0; i < 300 && underprepared.combat.losses === 0; i++) Combat.tick(underprepared, .5);
assert.equal(underprepared.combat.phase, "recovering", "losing starts recovery");
Combat.tick(underprepared, 8);
assert.equal(underprepared.combat.phase, "fighting", "the selected target is retried after recovery");

console.log("Combat checks passed.");
