(function (root, factory) {
  const content = typeof module === "object" && module.exports ? require("../data/game-content.js") : root.IncrementKingdomContent;
  const api = factory(content);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IncrementKingdomCombat = api;
})(typeof self !== "undefined" ? self : this, function (Content) {
  "use strict";

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const monsterById = id => Content.STARTER_MONSTERS.find(monster => monster.id === id);
  const originOf = state => Content.ORIGINS.find(origin => origin.id === state.identity.originId);

  function playerValues(state) {
    const s = state.stats;
    const scaling = state.identity.classId === "mage"
      ? s.intelligence * 1.5 + s.mind * .15
      : state.identity.classId === "hunter"
        ? s.dexterity * 1.15 + s.agility * .45
        : s.strength * 1.5 + s.dexterity * .15;
    return {
      maxHp: 25 + s.constitution * 10 + s.vitality * 3,
      damage: 2 + scaling,
      defense: s.constitution * .35 + s.spirit * .08,
      attackInterval: clamp(1.4 - s.agility * .025, .45, 1.4),
      accuracy: clamp(.8 + s.dexterity * .01, .6, .98)
    };
  }

  function beginFight(state) {
    const monster = monsterById(state.activities.monsterId);
    if (!monster) return false;
    const player = playerValues(state);
    state.combat.phase = "fighting";
    state.combat.playerHp = player.maxHp;
    state.combat.monsterHp = monster.hp;
    state.combat.playerAttackTimer = 0;
    state.combat.monsterAttackTimer = 0;
    state.combat.phaseRemaining = 0;
    return true;
  }

  function selectMonster(state, monsterId) {
    if (!monsterById(monsterId)) return false;
    state.activities.monsterId = monsterId;
    state.combat.lastMessage = `Hunting ${monsterById(monsterId).name}.`;
    return beginFight(state);
  }

  function effectiveMorale(state, tuning) {
    const power = tuning?.housingPower ?? 1;
    return 1 + ((state.resources.morale || 1) - 1) * power;
  }

  function victory(state, monster, tuning) {
    const previousDefeats = state.combat.defeats[monster.id] || 0;
    const diminishingRate = tuning?.diminishing ?? .055;
    const diminishing = Math.pow(1 + previousDefeats * diminishingRate, .62);
    const originMultiplier = originOf(state).bonuses.statGain || 1;
    const gained = monster.reward * effectiveMorale(state, tuning) * originMultiplier * (tuning?.monsterStats || 1) / diminishing;
    state.stats[monster.rewardStat] += gained;
    state.combat.defeats[monster.id] = previousDefeats + 1;
    state.combat.phase = "respawning";
    state.combat.phaseRemaining = 1.5;
    state.combat.monsterHp = 0;
    state.combat.lastMessage = `Victory · +${gained.toFixed(3)} ${monster.rewardStat}.`;
  }

  function defeat(state, monster) {
    state.combat.losses++;
    state.combat.phase = "recovering";
    state.combat.phaseRemaining = 8;
    state.combat.playerHp = 0;
    state.combat.lastMessage = `${monster.name} defeated you. Recovering, then retrying automatically.`;
  }

  function tick(state, seconds, tuning) {
    const monster = monsterById(state.activities.monsterId);
    if (!monster || state.combat.phase === "idle") return;
    if (state.combat.phase !== "fighting") {
      state.combat.phaseRemaining -= seconds;
      if (state.combat.phaseRemaining <= 0) beginFight(state);
      return;
    }

    const player = playerValues(state);
    state.combat.playerAttackTimer += seconds;
    state.combat.monsterAttackTimer += seconds;

    while (state.combat.playerAttackTimer >= player.attackInterval && state.combat.phase === "fighting") {
      state.combat.playerAttackTimer -= player.attackInterval;
      const dealt = Math.max(.2, player.damage * player.accuracy - monster.defense);
      state.combat.monsterHp -= dealt;
      if (state.combat.monsterHp <= 0) victory(state, monster, tuning);
    }
    while (state.combat.monsterAttackTimer >= monster.attackInterval && state.combat.phase === "fighting") {
      state.combat.monsterAttackTimer -= monster.attackInterval;
      state.combat.playerHp -= Math.max(.2, monster.damage - player.defense);
      if (state.combat.playerHp <= 0) defeat(state, monster);
    }
  }

  function snapshot(state) {
    const monster = monsterById(state.activities.monsterId);
    const player = playerValues(state);
    return {
      phase: state.combat.phase, monster, player,
      phaseRemaining: state.combat.phaseRemaining,
      playerHp: state.combat.playerHp ?? player.maxHp,
      monsterHp: state.combat.monsterHp ?? (monster ? monster.hp : 0),
      message: state.combat.lastMessage
    };
  }

  return { playerValues, selectMonster, tick, snapshot };
});
