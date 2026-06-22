const assert = require("node:assert/strict");
const Content = require("./src/data/game-content.js");
const State = require("./src/core/game-state.js");
const Progression = require("./src/core/progression.js");

assert.equal(Content.CLASSES.length, 3, "three classes are defined");
assert.equal(Content.ORIGINS.length, 5, "five origins are defined");
assert.equal(Content.STATS.length, 9, "nine starter stats are defined");
assert.equal(Content.JOBS.length, 15, "three categories of five jobs are defined");
assert.equal(Content.SKILLS.length, 9, "three categories of three skills are defined");
assert.equal(Content.REGIONS.length, 5, "five region slots are defined");
assert.equal(Content.HOUSES.length, 10, "ten housing tiers are defined");
assert.equal(Content.STARTER_MONSTERS.length, 6, "the starter region has six monsters");

const warrior = State.createNewGame("warrior", "fallen-noble");
assert.equal(warrior.schemaVersion, 3, "new saves have the current schema version");
assert.ok(warrior.stats.strength > warrior.stats.intelligence, "class bonuses apply to the intended stats");
Progression.tick(warrior, 60);
assert.ok(warrior.resources.money > 0, "jobs generate money");
assert.ok(warrior.jobs[warrior.activities.jobId].level > 0, "active jobs gain levels");
assert.ok(warrior.skills[warrior.activities.skillId].level > 0, "active skills gain levels simultaneously");
assert.equal(Progression.selectJob(warrior, "royal-1"), false, "advanced jobs enforce mixed unlock requirements");

warrior.resources.money = 100;
assert.equal(Progression.buyNextHouse(warrior), true, "an affordable next house can be purchased");
assert.equal(warrior.resources.morale, 1.1, "housing directly raises Morale");

console.log("Game foundation checks passed.");
