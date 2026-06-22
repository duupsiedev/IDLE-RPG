(function (root, factory) {
  const scenarios = typeof module === "object" && module.exports ? require("./scenarios.js") : root.IdleRpgScenarios;
  const api = factory(scenarios);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IdleRpgSimulator = api;
})(typeof self !== "undefined" ? self : this, function (Scenarios) {
  "use strict";

  const DEFAULTS = {
    jobIncome: 1,
    jobXp: 1,
    skillXp: 1,
    monsterStats: 1,
    diminishing: 0.055,
    housingPower: 1,
    offlineEfficiency: 1
  };

  const JOBS = [
    { name: "Errand Runner", income: 0.55, xp: 1, unlock: 0 },
    { name: "Farmhand", income: 2.2, xp: 1.35, unlock: 12 },
    { name: "Guild Porter", income: 8.5, xp: 1.8, unlock: 28 },
    { name: "Caravan Factor", income: 32, xp: 2.4, unlock: 52 },
    { name: "Royal Contractor", income: 125, xp: 3.1, unlock: 82 }
  ];

  const HOUSES = [
    { name: "Campsite", cost: 0, morale: 1 },
    { name: "Rented Room", cost: 750, morale: 1.1 },
    { name: "Cottage", cost: 900000, morale: 1.25 },
    { name: "Townhouse", cost: 5500000000, morale: 1.5 },
    { name: "Manor", cost: 320000000000, morale: 2 }
  ];

  const MAPS = [
    { name: "Outskirts Map", cost: 0 },
    { name: "Oldwood Map", cost: 2600 },
    { name: "Highlands Map", cost: 85000000 },
    { name: "Ashlands Map", cost: 18000000000 }
  ];

  const MONSTERS = [
    { name: "Cellar Rat", map: 0, hp: 14, damage: 1.5, defense: 0, speed: .65, reward: .08, stat: "dexterity" },
    { name: "Stray Boar", map: 0, hp: 38, damage: 3.5, defense: .5, speed: .55, reward: .13, stat: "strength" },
    { name: "Oldwood Wolf", map: 1, hp: 95, damage: 7, defense: 1.8, speed: .8, reward: .22, stat: "agility" },
    { name: "Mire Witch", map: 1, hp: 210, damage: 13, defense: 4, speed: .65, reward: .36, stat: "mind" },
    { name: "Highland Troll", map: 2, hp: 520, damage: 26, defense: 9, speed: .5, reward: .62, stat: "constitution" },
    { name: "Storm Drake", map: 2, hp: 1250, damage: 48, defense: 18, speed: .8, reward: 1.05, stat: "spirit" },
    { name: "Ash Colossus", map: 3, hp: 3600, damage: 92, defense: 38, speed: .6, reward: 1.8, stat: "vitality" },
    { name: "Cinder Sage", map: 3, hp: 8200, damage: 155, defense: 65, speed: .75, reward: 3.1, stat: "intelligence" }
  ];

  const SKILLS = ["Commerce", "Athletics", "Hunting"];
  const STATS = ["strength", "vitality", "constitution", "intelligence", "mind", "spirit", "dexterity", "agility", "luck"];
  const xpNeeded = level => 10 * Math.pow(level + 1, 1.72);
  const jobXpNeeded = level => 7 * Math.pow(level + 1, 1.68);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function makeState(scenario) {
    const state = {
      seconds: 0, money: 0, house: 0, map: 0, job: 0,
      jobLevels: JOBS.map(() => 0), jobXp: JOBS.map(() => 0),
      skillLevels: SKILLS.map(() => 0), skillXp: SKILLS.map(() => 0), skill: 0,
      stats: Object.fromEntries(STATS.map(s => [s, 1])), lastPowerMilestone: 0,
      defeats: MONSTERS.map(() => 0), monster: 0, fightProgress: 0,
      events: [], samples: [], unlockedJobs: 1, nextDecision: 0,
      combatModifier: scenario.class.combat, randomState: scenario.seed >>> 0
    };
    for (const [stat, multiplier] of Object.entries(scenario.class.stats)) state.stats[stat] *= multiplier;
    return state;
  }

  function random(state) {
    state.randomState += 0x6D2B79F5;
    let value = state.randomState;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  }

  function morale(state, cfg) {
    return 1 + (HOUSES[state.house].morale - 1) * cfg.housingPower;
  }

  function power(state) {
    const s = state.stats;
    return s.strength * 2 + s.constitution * 2.2 + s.dexterity + s.agility * 1.5 + s.vitality + s.intelligence + s.mind + s.spirit + s.luck * .4;
  }

  function combat(state, monsterIndex) {
    const s = state.stats, m = MONSTERS[monsterIndex];
    const athletics = 1 + state.skillLevels[1] * .018;
    const hit = clamp(.72 + (s.dexterity - monsterIndex * 5) * .008, .45, .98);
    const attack = Math.max(.2, (2 + s.strength * 1.45 + s.dexterity * .12) * athletics - m.defense);
    const playerDps = attack * (.75 + s.agility * .018) * hit * state.combatModifier;
    const playerHp = (20 + s.constitution * 9 + s.vitality * 3) * athletics * state.combatModifier;
    const mitigation = 100 / (100 + s.constitution * 2.2 + s.spirit);
    const monsterDps = m.damage * m.speed * mitigation;
    const winTime = m.hp / playerDps;
    const liveTime = playerHp / Math.max(.01, monsterDps);
    return { canWin: winTime <= liveTime, seconds: winTime + 3, winTime, liveTime };
  }

  function event(state, type, title, detail) {
    state.events.push({ seconds: state.seconds, type, title, detail });
  }

  function levelTracks(state, dt, cfg) {
    const j = state.job;
    const commerce = 1 + state.skillLevels[0] * .025;
    const training = morale(state, cfg);
    state.money += JOBS[j].income * (1 + state.jobLevels[j] * .12) * commerce * cfg.jobIncome * dt;
    state.jobXp[j] += JOBS[j].xp * training * cfg.jobXp * dt;
    while (state.jobXp[j] >= jobXpNeeded(state.jobLevels[j])) {
      state.jobXp[j] -= jobXpNeeded(state.jobLevels[j]);
      state.jobLevels[j]++;
      const next = state.job + 1;
      if (next < JOBS.length && state.jobLevels[j] >= JOBS[next].unlock && state.unlockedJobs <= next) {
        state.unlockedJobs = next + 1;
        event(state, "job", `New job: ${JOBS[next].name}`, `The income engine jumps to tier ${next + 1}.`);
      }
    }

    const k = state.skill;
    state.skillXp[k] += (.72 + k * .08) * training * cfg.skillXp * dt;
    while (state.skillXp[k] >= xpNeeded(state.skillLevels[k])) {
      state.skillXp[k] -= xpNeeded(state.skillLevels[k]);
      state.skillLevels[k]++;
      if ([5, 10, 20, 35, 50, 75, 100].includes(state.skillLevels[k]))
        event(state, "skill", `${SKILLS[k]} reached ${state.skillLevels[k]}`, "A passive efficiency milestone.");
    }
  }

  function shop(state, strategy) {
    const nextMap = MAPS[state.map + 1];
    const nextHouse = HOUSES[state.house + 1];
    // Maps win ties: access is more interesting than a raw multiplier.
    if (strategy.shopOrder !== "housing" && nextMap && state.money >= nextMap.cost) {
      state.money -= nextMap.cost; state.map++;
      event(state, "map", `Unlocked ${nextMap.name}`, `${MONSTERS.find(m => m.map === state.map).name} is now available.`);
    } else if (nextHouse && state.money >= nextHouse.cost) {
      state.money -= nextHouse.cost; state.house++;
      event(state, "house", `Moved into ${nextHouse.name}`, `Morale is now ${nextHouse.morale.toFixed(2)}× before tuning.`);
    } else if (nextMap && state.money >= nextMap.cost) {
      state.money -= nextMap.cost; state.map++;
      event(state, "map", `Unlocked ${nextMap.name}`, `${MONSTERS.find(m => m.map === state.map).name} is now available.`);
    }
  }

  function makeDecisions(state, scenario) {
    const strategy = scenario.strategy;
    state.job = Math.max(0, state.unlockedJobs - 1);
    state.skill = strategy.skillPlan === "favorite"
      ? ({ warrior: 1, mage: 0, hunter: 2 }[scenario.classId] || 0)
      : state.skillLevels.indexOf(Math.min(...state.skillLevels));
    shop(state, strategy);
    let best = 0;
    for (let i = 0; i < MONSTERS.length && MONSTERS[i].map <= state.map; i++) {
      if (combat(state, i).canWin) best = i;
    }
    const chosen = Math.max(0, best - strategy.monsterLag);
    if (chosen !== state.monster) {
      state.monster = chosen; state.fightProgress = 0;
      event(state, "monster", `Now hunting ${MONSTERS[chosen].name}`, "The player's current repeatable stat target.");
    }
    const timingVariation = scenario.strategyId === "optimizer" ? 1 : .8 + random(state) * .4;
    state.nextDecision = state.seconds + strategy.decisionHours * 3600 * timingVariation;
  }

  function battle(state, dt, cfg) {
    const fight = combat(state, state.monster);
    if (!fight.canWin) return;
    state.fightProgress += dt / fight.seconds;
    const kills = Math.floor(state.fightProgress);
    if (!kills) return;
    state.fightProgress -= kills;
    const m = MONSTERS[state.monster];
    for (let n = 0; n < kills; n++) {
      const old = state.defeats[state.monster]++;
      const diminishing = Math.pow(1 + old * cfg.diminishing, .62);
      const hunting = 1 + state.skillLevels[2] * .022;
      state.stats[m.stat] += m.reward * morale(state, cfg) * hunting * cfg.monsterStats / diminishing;
      // Luck trickles from every victory so it exists before a dedicated monster does.
      state.stats.luck += m.reward * .018 / diminishing;
    }
    const total = state.defeats[state.monster];
    for (const milestone of [1, 10, 50, 250, 1000]) {
      if (total >= milestone && total - kills < milestone)
        event(state, "kill", `${milestone.toLocaleString()}× ${m.name}`, `${m.stat[0].toUpperCase() + m.stat.slice(1)} gains are now tapering.`);
    }
  }

  function notePowerMilestones(state) {
    const current = power(state);
    const milestones = [25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    for (const milestone of milestones) {
      if (current >= milestone && state.lastPowerMilestone < milestone) {
        event(state, "power", `${milestone.toLocaleString()} combat power`, "The build crossed a long-term strength benchmark.");
        state.lastPowerMilestone = milestone;
      }
    }
  }

  function simulate(days, overrides, scenarioInput) {
    const scenario = Scenarios.resolve(scenarioInput);
    const cfg = Object.assign({}, DEFAULTS, overrides || {});
    if (scenario.origin.globalXp) {
      cfg.jobXp *= scenario.origin.globalXp;
      cfg.skillXp *= scenario.origin.globalXp;
    }
    for (const key of ["jobIncome", "jobXp", "skillXp", "monsterStats", "housingPower", "offlineEfficiency"])
      cfg[key] *= scenario.origin[key] || 1;
    const state = makeState(scenario);
    event(state, "start", "The journey begins", `${scenario.class.name}, ${scenario.origin.name}, ${scenario.strategy.name}.`);
    const total = Math.max(60, days * 86400);
    const dt = clamp(total / 180000, .25, 300);
    const sampleEvery = total / 160;
    let nextSample = 0;
    while (state.seconds < total) {
      const step = Math.min(dt, total - state.seconds);
      if (state.seconds >= state.nextDecision) makeDecisions(state, scenario);
      levelTracks(state, step * cfg.offlineEfficiency, cfg);
      battle(state, step * cfg.offlineEfficiency, cfg);
      notePowerMilestones(state);
      state.seconds += step;
      if (state.seconds >= nextSample) {
        state.samples.push({ seconds: state.seconds, power: power(state), morale: morale(state, cfg) });
        nextSample += sampleEvery;
      }
    }
    return { state, config: cfg, scenario, power: power(state), morale: morale(state, cfg), data: { JOBS, HOUSES, MAPS, MONSTERS, SKILLS } };
  }

  return { DEFAULTS, simulate, combat, power };
});
