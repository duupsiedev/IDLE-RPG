(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IdleRpgScenarios = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const CLASSES = {
    warrior: { name: "Warrior", stats: { strength: 1.25, constitution: 1.2 }, combat: 1.08 },
    mage: { name: "Mage", stats: { intelligence: 1.3, mind: 1.2 }, combat: 1.04 },
    hunter: { name: "Hunter", stats: { dexterity: 1.25, agility: 1.2, luck: 1.2 }, combat: 1.06 }
  };

  const ORIGINS = {
    commoner: { name: "Commoner", globalXp: 1.05 },
    scholar: { name: "Scholar", skillXp: 1.12 },
    nomad: { name: "Nomad", jobXp: 1.08 },
    ranger: { name: "Ranger", monsterStats: 1.1 },
    "fallen-noble": { name: "Fallen Noble", jobIncome: 1.08 }
  };

  const STRATEGIES = {
    optimizer: {
      name: "Optimizer", decisionHours: .08, monsterLag: 0, shopOrder: "maps", skillPlan: "balanced"
    },
    typical: {
      name: "Typical", decisionHours: 6, monsterLag: 0, shopOrder: "maps", skillPlan: "balanced"
    },
    casual: {
      name: "Casual", decisionHours: 24, monsterLag: 0, shopOrder: "housing", skillPlan: "balanced"
    },
    inefficient: {
      name: "Inefficient but valid", decisionHours: 36, monsterLag: 1, shopOrder: "housing", skillPlan: "favorite"
    }
  };

  // A deliberately compact sample: enough variety to expose brittle balance without
  // turning every dashboard run into a combinatorial research project.
  const REPRESENTATIVE_SCENARIOS = [
    { id: "fast", classId: "warrior", originId: "ranger", strategyId: "optimizer" },
    { id: "typical-warrior", classId: "warrior", originId: "commoner", strategyId: "typical" },
    { id: "typical-mage", classId: "mage", originId: "scholar", strategyId: "typical" },
    { id: "typical-hunter", classId: "hunter", originId: "nomad", strategyId: "typical" },
    { id: "casual", classId: "mage", originId: "fallen-noble", strategyId: "casual" },
    { id: "slow", classId: "hunter", originId: "commoner", strategyId: "inefficient" }
  ];

  function resolve(input) {
    const value = input || REPRESENTATIVE_SCENARIOS[1];
    return {
      id: value.id || "custom",
      classId: value.classId,
      originId: value.originId,
      strategyId: value.strategyId,
      seed: value.seed || 1,
      class: CLASSES[value.classId] || CLASSES.warrior,
      origin: ORIGINS[value.originId] || ORIGINS.commoner,
      strategy: STRATEGIES[value.strategyId] || STRATEGIES.typical
    };
  }

  return { CLASSES, ORIGINS, STRATEGIES, REPRESENTATIVE_SCENARIOS, resolve };
});
