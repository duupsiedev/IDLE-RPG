(function (root, factory) {
  const content = typeof module === "object" && module.exports ? require("../data/game-content.js") : root.IncrementKingdomContent;
  const api = factory(content);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IncrementKingdomProgression = api;
})(typeof self !== "undefined" ? self : this, function (Content) {
  "use strict";

  const xpRequired = level => 12 * Math.pow(level + 1, 1.55);
  const getOrigin = state => Content.ORIGINS.find(item => item.id === state.identity.originId);

  function levelTrack(track) {
    while (track.xp >= xpRequired(track.level)) {
      track.xp -= xpRequired(track.level);
      track.level++;
    }
  }

  function tick(state, seconds) {
    const origin = getOrigin(state);
    const globalXp = origin.bonuses.globalXp || 1;
    const job = Content.JOBS.find(item => item.id === state.activities.jobId);
    const jobTrack = state.jobs[job.id];
    const incomeBonus = origin.bonuses.money || 1;
    const jobXpBonus = origin.bonuses.jobXp || 1;
    state.resources.money += job.baseIncome * (1 + jobTrack.level * .08) * incomeBonus * seconds;
    jobTrack.xp += job.baseXp * globalXp * jobXpBonus * state.resources.morale * seconds;
    levelTrack(jobTrack);

    const skill = Content.SKILLS.find(item => item.id === state.activities.skillId);
    const skillTrack = state.skills[skill.id];
    skillTrack.xp += .45 * globalXp * (origin.bonuses.skillXp || 1) * state.resources.morale * seconds;
    levelTrack(skillTrack);
    state.elapsedSeconds += seconds;
  }

  function canUseJob(state, job) {
    if (job.category === "construction") return job.tier === 1 || state.jobs[`construction-${job.tier - 1}`].level >= job.tier * 5;
    if (job.category === "army") return job.tier === 1
      ? state.jobs["construction-3"].level >= 15 && state.skills.conditioning.level >= 10
      : state.jobs[`army-${job.tier - 1}`].level >= job.tier * 7;
    return job.tier === 1
      ? state.jobs["army-3"].level >= 20 && state.skills.etiquette.level >= 15
      : state.jobs[`royal-${job.tier - 1}`].level >= job.tier * 9;
  }

  function selectJob(state, jobId) {
    const job = Content.JOBS.find(item => item.id === jobId);
    if (!job || !canUseJob(state, job)) return false;
    state.activities.jobId = jobId;
    return true;
  }

  function selectSkill(state, skillId) {
    if (!Content.SKILLS.some(item => item.id === skillId)) return false;
    state.activities.skillId = skillId;
    return true;
  }

  function buyNextHouse(state) {
    const house = Content.HOUSES[state.shop.houseTier];
    if (!house || state.resources.money < house.cost) return false;
    state.resources.money -= house.cost;
    state.shop.houseTier = house.tier;
    state.resources.morale = house.morale;
    return true;
  }

  return { xpRequired, tick, canUseJob, selectJob, selectSkill, buyNextHouse };
});
