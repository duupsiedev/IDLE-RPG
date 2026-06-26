(function (root, factory) {
  const content = typeof module === "object" && module.exports ? require("./src/data/game-content.js") : root.IncrementKingdomContent;
  const api = factory(content);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IdleRpgScenarios = api;
})(typeof self !== "undefined" ? self : this, function (Content) {
  "use strict";

  const byId = (items, id, fallback) => items.find(item => item.id === id) || fallback;

  const STRATEGIES = {
    optimizer: {
      name: "Optimizer",
      decisionHours: .08,
      monsterLag: 0,
      shopOrder: "balanced",
      skillPlan: "gates",
      overFarm: 0,
      offlineEfficiency: 1
    },
    typical: {
      name: "Typical",
      decisionHours: 6,
      monsterLag: 0,
      shopOrder: "balanced",
      skillPlan: "balanced",
      overFarm: 3,
      offlineEfficiency: .92
    },
    casual: {
      name: "Casual",
      decisionHours: 24,
      monsterLag: 0,
      shopOrder: "housing",
      skillPlan: "balanced",
      overFarm: 10,
      offlineEfficiency: .78
    },
    inefficient: {
      name: "Inefficient but valid",
      decisionHours: 36,
      monsterLag: 1,
      shopOrder: "housing",
      skillPlan: "favorite",
      overFarm: 25,
      offlineEfficiency: .68
    }
  };

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
    const characterClass = byId(Content.CLASSES, value.classId, Content.CLASSES[0]);
    const origin = byId(Content.ORIGINS, value.originId, Content.ORIGINS[0]);
    const strategy = STRATEGIES[value.strategyId] || STRATEGIES.typical;
    return {
      id: value.id || "custom",
      classId: characterClass.id,
      originId: origin.id,
      strategyId: Object.keys(STRATEGIES).find(key => STRATEGIES[key] === strategy) || "typical",
      seed: value.seed || 1,
      class: characterClass,
      origin,
      strategy
    };
  }

  return { STRATEGIES, REPRESENTATIVE_SCENARIOS, resolve };
});
