(function (root, factory) {
  const scenarios = typeof module === "object" && module.exports ? require("./scenarios.js") : root.IdleRpgScenarios;
  const content = typeof module === "object" && module.exports ? require("./src/data/game-content.js") : root.IncrementKingdomContent;
  const gameState = typeof module === "object" && module.exports ? require("./src/core/game-state.js") : root.IncrementKingdomState;
  const progression = typeof module === "object" && module.exports ? require("./src/core/progression.js") : root.IncrementKingdomProgression;
  const combat = typeof module === "object" && module.exports ? require("./src/core/combat.js") : root.IncrementKingdomCombat;
  const api = factory(scenarios, content, gameState, progression, combat);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IdleRpgSimulator = api;
})(typeof self !== "undefined" ? self : this, function (Scenarios, Content, GameState, Progression, Combat) {
  "use strict";

  const DEFAULTS = {
    jobIncome: 1,
    jobXp: 1,
    skillXp: 1,
    monsterStats: 1,
    diminishing: .055,
    housingPower: 1,
    offlineEfficiency: 1
  };

  const SKILL_FAVORITES = {
    warrior: "conditioning",
    mage: "etiquette",
    hunter: "athletics"
  };

  const POWER_MILESTONES = [25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
  const KILL_MILESTONES = [1, 10, 50, 250, 1000, 5000];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function random(state) {
    state.randomState += 0x6D2B79F5;
    let value = state.randomState;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  }

  function formatStat(statId) {
    const stat = Content.STATS.find(item => item.id === statId);
    return stat ? stat.name : statId;
  }

  function event(sim, type, title, detail) {
    sim.events.push({ seconds: sim.state.elapsedSeconds, type, title, detail });
  }

  function power(state) {
    const s = state.stats;
    return s.strength * 2 + s.constitution * 2.2 + s.dexterity + s.agility * 1.5 +
      s.vitality + s.intelligence * 1.2 + s.mind + s.spirit + s.luck * .4;
  }

  function morale(state, cfg) {
    return Progression.effectiveMorale
      ? Progression.effectiveMorale(state, cfg)
      : 1 + ((state.resources.morale || 1) - 1) * (cfg.housingPower || 1);
  }

  function combatEstimate(state, monster) {
    const player = Combat.playerValues(state);
    const dealt = Math.max(.2, player.damage * player.accuracy - monster.defense);
    const playerDps = dealt / player.attackInterval;
    const monsterDps = Math.max(.2, monster.damage - player.defense) / monster.attackInterval;
    const winTime = monster.hp / Math.max(.01, playerDps);
    const liveTime = player.maxHp / Math.max(.01, monsterDps);
    return {
      canWin: winTime <= liveTime,
      seconds: winTime + 1.5,
      winTime,
      liveTime
    };
  }

  function chooseJob(state) {
    const available = Content.JOBS.filter(job => Progression.canUseJob(state, job));
    const current = Content.JOBS.find(job => job.id === state.activities.jobId);
    const best = available.reduce((winner, job) => job.baseIncome > winner.baseIncome ? job : winner, current || available[0]);
    if (best && best.id !== state.activities.jobId && Progression.selectJob(state, best.id)) return best;
    return current || best;
  }

  function chooseSkill(state, scenario) {
    const strategy = scenario.strategy;
    let skillId;
    if (strategy.skillPlan === "favorite") {
      skillId = SKILL_FAVORITES[scenario.classId] || Content.SKILLS[0].id;
    } else if (strategy.skillPlan === "gates") {
      skillId = state.skills.conditioning.level < 10 ? "conditioning"
        : state.skills.etiquette.level < 15 ? "etiquette"
          : Content.SKILLS.reduce((lowest, skill) => state.skills[skill.id].level < state.skills[lowest.id].level ? skill : lowest, Content.SKILLS[0]).id;
    } else {
      skillId = Content.SKILLS.reduce((lowest, skill) => state.skills[skill.id].level < state.skills[lowest.id].level ? skill : lowest, Content.SKILLS[0]).id;
    }
    Progression.selectSkill(state, skillId);
    return Content.SKILLS.find(skill => skill.id === state.activities.skillId);
  }

  function buyHousing(sim) {
    const nextHouse = Content.HOUSES[sim.state.shop.houseTier];
    if (!nextHouse) return;
    if (Progression.buyNextHouse(sim.state)) {
      event(sim, "house", `Moved into ${nextHouse.name}`, `Morale is now ${sim.state.resources.morale.toFixed(2)}×.`);
    }
  }

  function chooseMonster(sim, scenario) {
    const state = sim.state;
    const current = Content.STARTER_MONSTERS.find(monster => monster.id === state.activities.monsterId);
    const currentDefeats = current ? state.combat.defeats[current.id] || 0 : Infinity;
    if (current && currentDefeats < scenario.strategy.overFarm) return current;

    let bestIndex = 0;
    for (let i = 0; i < Content.STARTER_MONSTERS.length; i++) {
      if (combatEstimate(state, Content.STARTER_MONSTERS[i]).canWin) bestIndex = i;
    }
    const chosenIndex = Math.max(0, bestIndex - scenario.strategy.monsterLag);
    const chosen = Content.STARTER_MONSTERS[chosenIndex];
    if (chosen && chosen.id !== state.activities.monsterId && Combat.selectMonster(state, chosen.id)) {
      event(sim, "monster", `Now hunting ${chosen.name}`, `${formatStat(chosen.rewardStat)} is the current repeatable stat target.`);
    }
    return chosen;
  }

  function makeDecisions(sim, scenario) {
    const oldJobId = sim.state.activities.jobId;
    const oldSkillId = sim.state.activities.skillId;
    const job = chooseJob(sim.state);
    const skill = chooseSkill(sim.state, scenario);
    if (job && job.id !== oldJobId) event(sim, "job", `New job: ${job.name}`, `Income now favors ${job.category} tier ${job.tier}.`);
    if (skill && skill.id !== oldSkillId) event(sim, "skill", `Training ${skill.name}`, skill.description);
    if (scenario.strategy.shopOrder === "housing" || scenario.strategy.shopOrder === "balanced") buyHousing(sim);
    chooseMonster(sim, scenario);
    const timingVariation = scenario.strategyId === "optimizer" ? 1 : .8 + random(sim) * .4;
    sim.nextDecision = sim.state.elapsedSeconds + scenario.strategy.decisionHours * 3600 * timingVariation;
  }

  function noteProgressEvents(sim) {
    const state = sim.state;
    const currentPower = power(state);
    for (const milestone of POWER_MILESTONES) {
      if (currentPower >= milestone && sim.lastPowerMilestone < milestone) {
        event(sim, "power", `${milestone.toLocaleString()} combat power`, "The build crossed a long-term strength benchmark.");
        sim.lastPowerMilestone = milestone;
      }
    }

    for (const monster of Content.STARTER_MONSTERS) {
      const total = state.combat.defeats[monster.id] || 0;
      const previous = sim.lastDefeats[monster.id] || 0;
      for (const milestone of KILL_MILESTONES) {
        if (total >= milestone && previous < milestone) {
          event(sim, "kill", `${milestone.toLocaleString()}× ${monster.name}`, `${formatStat(monster.rewardStat)} gains from this monster are now tapering.`);
        }
      }
      sim.lastDefeats[monster.id] = total;
    }

    for (const skill of Content.SKILLS) {
      const level = state.skills[skill.id].level;
      const previous = sim.lastSkillLevels[skill.id] || 0;
      for (const milestone of [5, 10, 20, 35, 50, 75, 100]) {
        if (level >= milestone && previous < milestone) {
          event(sim, "skill", `${skill.name} reached ${milestone}`, "A passive training milestone.");
        }
      }
      sim.lastSkillLevels[skill.id] = level;
    }
  }

  function legacyState(sim) {
    const state = sim.state;
    const jobIndex = Math.max(0, Content.JOBS.findIndex(job => job.id === state.activities.jobId));
    const monsterIndex = Math.max(0, Content.STARTER_MONSTERS.findIndex(monster => monster.id === state.activities.monsterId));
    return {
      seconds: state.elapsedSeconds,
      money: state.resources.money,
      house: Math.max(0, state.shop.houseTier - 1),
      map: 0,
      job: jobIndex,
      jobLevels: Content.JOBS.map(job => state.jobs[job.id].level),
      jobXp: Content.JOBS.map(job => state.jobs[job.id].xp),
      skillLevels: Content.SKILLS.map(skill => state.skills[skill.id].level),
      skillXp: Content.SKILLS.map(skill => state.skills[skill.id].xp),
      skill: Math.max(0, Content.SKILLS.findIndex(skill => skill.id === state.activities.skillId)),
      stats: { ...state.stats },
      defeats: Content.STARTER_MONSTERS.map(monster => state.combat.defeats[monster.id] || 0),
      losses: state.combat.losses,
      monster: monsterIndex,
      events: sim.events,
      samples: sim.samples,
      nextDecision: sim.nextDecision
    };
  }

  function simulate(days, overrides, scenarioInput) {
    const scenario = Scenarios.resolve(scenarioInput);
    const cfg = Object.assign({}, DEFAULTS, overrides || {});
    const state = GameState.createNewGame(scenario.classId, scenario.originId);
    const sim = {
      state,
      events: [],
      samples: [],
      nextDecision: 0,
      lastPowerMilestone: 0,
      lastDefeats: {},
      lastSkillLevels: {},
      randomState: scenario.seed >>> 0
    };
    event(sim, "start", "The journey begins", `${scenario.class.name}, ${scenario.origin.name}, ${scenario.strategy.name}.`);

    const total = Math.max(60, days * 86400);
    const stepSize = clamp(total / 180000, .25, 120);
    const sampleEvery = total / 160;
    let nextSample = 0;

    while (state.elapsedSeconds < total) {
      if (state.elapsedSeconds >= sim.nextDecision) makeDecisions(sim, scenario);
      const step = Math.min(stepSize, total - state.elapsedSeconds);
      const effectiveStep = step * cfg.offlineEfficiency * scenario.strategy.offlineEfficiency;
      Progression.tick(state, effectiveStep, cfg);
      Combat.tick(state, effectiveStep, cfg);
      if (effectiveStep < step) state.elapsedSeconds += step - effectiveStep;
      noteProgressEvents(sim);
      if (state.elapsedSeconds >= nextSample) {
        sim.samples.push({ seconds: state.elapsedSeconds, power: power(state), morale: morale(state, cfg) });
        nextSample += sampleEvery;
      }
    }

    const legacy = legacyState(sim);
    const currentPower = power(state);
    const totalDefeats = legacy.defeats.reduce((sum, count) => sum + count, 0);
    const sludge = totalDefeats === 0 || (days >= 7 && currentPower < 25);
    return {
      state: legacy,
      gameState: state,
      config: cfg,
      scenario,
      power: currentPower,
      morale: morale(state, cfg),
      sludge,
      data: {
        JOBS: Content.JOBS,
        HOUSES: Content.HOUSES,
        MAPS: Content.REGIONS,
        MONSTERS: Content.STARTER_MONSTERS,
        SKILLS: Content.SKILLS
      }
    };
  }

  return { DEFAULTS, simulate, combat: combatEstimate, power };
});
