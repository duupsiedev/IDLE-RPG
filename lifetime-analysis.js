(function (root, factory) {
  const scenarios = typeof module === "object" && module.exports ? require("./scenarios.js") : root.IdleRpgScenarios;
  const simulator = typeof module === "object" && module.exports ? require("./simulator.js") : root.IdleRpgSimulator;
  const api = factory(scenarios, simulator);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IdleRpgLifetimeAnalysis = api;
})(typeof self !== "undefined" ? self : this, function (Scenarios, Simulator) {
  "use strict";

  const tracked = [
    ["Oldwood", e => e.title === "Unlocked Oldwood Map"],
    ["Cottage", e => e.title === "Moved into Cottage"],
    ["Highlands", e => e.title === "Unlocked Highlands Map"],
    ["Townhouse", e => e.title === "Moved into Townhouse"],
    ["Ashlands", e => e.title === "Unlocked Ashlands Map"],
    ["Manor", e => e.title === "Moved into Manor"]
  ];

  function run(days, config) {
    const results = Scenarios.REPRESENTATIVE_SCENARIOS.flatMap(s => [1, 2].map(seed =>
      Simulator.simulate(days, config, Object.assign({}, s, { id: `${s.id}-${seed}`, seed }))
    ));
    const reference = results.find(r => r.scenario.strategyId === "typical") || results[0];
    const milestones = tracked.map(([name, matches]) => {
      const times = results.map(r => r.state.events.find(matches)).filter(Boolean).map(e => e.seconds);
      return { name, reached: times.length, total: results.length, earliest: times.length ? Math.min(...times) : null, latest: times.length ? Math.max(...times) : null };
    });
    return {
      reference,
      results,
      milestones,
      power: {
        min: Math.min(...results.map(r => r.power)),
        max: Math.max(...results.map(r => r.power))
      }
    };
  }

  return { run };
});
