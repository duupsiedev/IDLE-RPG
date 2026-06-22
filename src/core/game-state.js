(function (root, factory) {
  const content = typeof module === "object" && module.exports ? require("../data/game-content.js") : root.IncrementKingdomContent;
  const api = factory(content);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IncrementKingdomState = api;
})(typeof self !== "undefined" ? self : this, function (Content) {
  "use strict";

  const SCHEMA_VERSION = 3;

  function createNewGame(classId, originId) {
    const characterClass = Content.CLASSES.find(item => item.id === classId) || Content.CLASSES[0];
    const origin = Content.ORIGINS.find(item => item.id === originId) || Content.ORIGINS[0];
    const stats = Object.fromEntries(Content.STATS.map(stat => [stat.id, characterClass.stats.includes(stat.id) ? 1.15 : 1]));
    return {
      schemaVersion: SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      elapsedSeconds: 0,
      identity: { classId: characterClass.id, originId: origin.id },
      resources: { money: 0, morale: 1 },
      location: { regionId: Content.REGIONS[0].id },
      stats,
      jobs: Object.fromEntries(Content.JOBS.map(job => [job.id, { level: 0, xp: 0 }])),
      skills: Object.fromEntries(Content.SKILLS.map(skill => [skill.id, { level: 0, xp: 0 }])),
      activities: { jobId: Content.JOBS[0].id, skillId: Content.SKILLS[0].id, monsterId: null },
      shop: { houseTier: 1 },
      combat: {
        phase: "idle", playerHp: null, monsterHp: null,
        playerAttackTimer: 0, monsterAttackTimer: 0, phaseRemaining: 0,
        defeats: {}, losses: 0, lastMessage: "Choose a monster to begin hunting."
      }
    };
  }

  function migrate(savedState) {
    if (!savedState || typeof savedState !== "object") throw new Error("Save data is not an object.");
    const identity = savedState.identity || {};
    const base = createNewGame(identity.classId, identity.originId);
    const migrated = {
      ...base,
      ...savedState,
      schemaVersion: SCHEMA_VERSION,
      identity: { ...base.identity, ...(savedState.identity || {}) },
      resources: { ...base.resources, ...(savedState.resources || {}) },
      location: { ...base.location, ...(savedState.location || {}) },
      stats: { ...base.stats, ...(savedState.stats || {}) },
      jobs: { ...base.jobs, ...(savedState.jobs || {}) },
      skills: { ...base.skills, ...(savedState.skills || {}) },
      activities: { ...base.activities, ...(savedState.activities || {}) },
      shop: { ...base.shop, ...(savedState.shop || {}) },
      combat: { ...base.combat, ...(savedState.combat || {}), defeats: { ...base.combat.defeats, ...(savedState.combat?.defeats || {}) } }
    };
    if (!Content.CLASSES.some(item => item.id === migrated.identity.classId)) migrated.identity.classId = base.identity.classId;
    if (!Content.ORIGINS.some(item => item.id === migrated.identity.originId)) migrated.identity.originId = base.identity.originId;
    return migrated;
  }

  return { SCHEMA_VERSION, createNewGame, migrate };
});
