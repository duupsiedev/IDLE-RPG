(function (root, factory) {
  const progression = typeof module === "object" && module.exports ? require("./progression.js") : root.IncrementKingdomProgression;
  const combat = typeof module === "object" && module.exports ? require("./combat.js") : root.IncrementKingdomCombat;
  const api = factory(progression, combat);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IncrementKingdomTime = api;
})(typeof self !== "undefined" ? self : this, function (Progression, Combat) {
  "use strict";

  function totals(state) {
    return {
      money: state.resources.money,
      jobLevels: Object.values(state.jobs).reduce((sum, track) => sum + track.level, 0),
      skillLevels: Object.values(state.skills).reduce((sum, track) => sum + track.level, 0),
      defeats: Object.values(state.combat.defeats).reduce((sum, count) => sum + count, 0),
      stats: Object.values(state.stats).reduce((sum, value) => sum + value, 0)
    };
  }

  function advance(state, seconds, maximumStep, tuning) {
    const before = totals(state);
    let remaining = Math.max(0, Number(seconds) || 0);
    const stepSize = Math.max(.1, maximumStep || 1);
    while (remaining > 0) {
      const step = Math.min(stepSize, remaining);
      Progression.tick(state, step, tuning);
      Combat.tick(state, step, tuning);
      remaining -= step;
    }
    const after = totals(state);
    return {
      seconds: Math.max(0, Number(seconds) || 0),
      money: after.money - before.money,
      jobLevels: after.jobLevels - before.jobLevels,
      skillLevels: after.skillLevels - before.skillLevels,
      defeats: after.defeats - before.defeats,
      stats: after.stats - before.stats
    };
  }

  return { advance };
});
