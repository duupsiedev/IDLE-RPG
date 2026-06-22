(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IncrementKingdomContent = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const STATS = [
    { id: "strength", name: "Strength", short: "STR", description: "Raises physical damage.", example: value => `About ${(value * 1.5).toFixed(1)} base physical damage.` },
    { id: "vitality", name: "Vitality", short: "VIT", description: "Raises health recovery.", example: value => `About ${(value * .12).toFixed(2)} health recovered per second.` },
    { id: "constitution", name: "Constitution", short: "CON", description: "Raises maximum health and physical resilience.", example: value => `Provides ${Math.round(value * 9)} health before equipment.` },
    { id: "intelligence", name: "Intelligence", short: "INT", description: "Raises magical power.", example: value => `About ${(value * 1.5).toFixed(1)} base magical damage.` },
    { id: "mind", name: "Mind", short: "MND", description: "Improves focus and magical consistency.", example: value => `${(value * .4).toFixed(1)} focus rating.` },
    { id: "spirit", name: "Spirit", short: "SPR", description: "Raises magical resilience and recovery.", example: value => `${(value * .7).toFixed(1)} magical resistance.` },
    { id: "dexterity", name: "Dexterity", short: "DEX", description: "Raises accuracy and critical reliability.", example: value => `${(70 + value * .4).toFixed(1)}% basic accuracy versus an equal foe.` },
    { id: "agility", name: "Agility", short: "AGI", description: "Raises attack speed and evasion.", example: value => `${(.75 + value * .018).toFixed(2)} attacks per second.` },
    { id: "luck", name: "Luck", short: "LCK", description: "Improves favorable outcomes and rare rewards.", example: value => `${(value * .15).toFixed(2)}% bonus favorable-outcome chance.` }
  ];

  const CLASSES = [
    { id: "warrior", name: "Warrior", description: "Tough physical combatant.", stats: ["strength", "vitality", "constitution"] },
    { id: "mage", name: "Mage", description: "Focused magical combatant.", stats: ["intelligence", "mind", "spirit"] },
    { id: "hunter", name: "Hunter", description: "Precise and fortunate combatant.", stats: ["dexterity", "agility", "luck"] }
  ];

  const ORIGINS = [
    { id: "commoner", name: "Commoner", description: "+5% all experience.", bonuses: { globalXp: 1.05 } },
    { id: "scholar", name: "Scholar", description: "+8% skill experience.", bonuses: { skillXp: 1.08 } },
    { id: "nomad", name: "Nomad", description: "+8% job experience.", bonuses: { jobXp: 1.08 } },
    { id: "ranger", name: "Ranger", description: "+5% stats earned from monsters.", bonuses: { statGain: 1.05 } },
    { id: "fallen-noble", name: "Fallen Noble", description: "+8% money from jobs.", bonuses: { money: 1.08 } }
  ];

  const jobNames = {
    construction: ["Laborer", "Carpenter", "Mason", "Architect", "Master Builder"],
    army: ["Recruit", "Guard", "Soldier", "Knight", "Commander"],
    royal: ["Court Runner", "Scribe", "Steward", "Magistrate", "Chancellor"]
  };
  const JOBS = Object.entries(jobNames).flatMap(([category, names]) => names.map((name, index) => ({
    id: `${category}-${index + 1}`, name, category, tier: index + 1,
    baseIncome: category === "construction" ? .2 * Math.pow(2.4, index) : category === "army" ? 8 * Math.pow(2.6, index) : 300 * Math.pow(2.8, index),
    baseXp: 1 + index * .15
  })));

  const SKILLS = [
    ["conditioning", "Conditioning", "physique", "Improves health and physical training."],
    ["athletics", "Athletics", "physique", "Improves combat speed and physical performance."],
    ["fortitude", "Fortitude", "physique", "Improves resilience and recovery."],
    ["bargaining", "Bargaining", "commerce", "Improves money earned from work."],
    ["accounting", "Accounting", "commerce", "Improves economic efficiency."],
    ["logistics", "Logistics", "commerce", "Improves job progression and access."],
    ["etiquette", "Etiquette", "prestige", "Builds access to courtly work."],
    ["leadership", "Leadership", "prestige", "Improves military and royal influence."],
    ["diplomacy", "Diplomacy", "prestige", "Improves high-level prestige rewards."]
  ].map(([id, name, category, description]) => ({ id, name, category, description }));

  const REGIONS = ["Outskirts", "Oldwood", "Highlands", "Ashlands", "Crownlands"].map((name, index) => ({ id: `region-${index + 1}`, name, tier: index + 1 }));
  const HOUSES = [
    ["Campsite", 0, 1], ["Rented Room", 100, 1.1], ["Cottage", 1500, 1.2], ["Townhouse", 30000, 1.35], ["Manor", 750000, 1.55],
    ["Estate", 25000000, 1.8], ["Keep", 1000000000, 2.1], ["Castle", 60000000000, 2.5], ["Palace", 5000000000000, 3], ["Royal Capital", 600000000000000, 4]
  ].map(([name, cost, morale], index) => ({ id: `house-${index + 1}`, name, tier: index + 1, cost, morale }));

  const STARTER_MONSTERS = [
    ["cellar-rat", "Cellar Rat", "dexterity", 14, 1.2, 0, 1.8, .08],
    ["wild-dog", "Wild Dog", "agility", 30, 2.1, .2, 1.45, .11],
    ["road-bandit", "Road Bandit", "strength", 58, 3.6, .7, 1.7, .16],
    ["bog-slime", "Bog Slime", "vitality", 90, 5.2, 1.2, 2.1, .22],
    ["hedge-witch", "Hedge Witch", "mind", 130, 7.2, 1.8, 1.65, .3],
    ["ruined-golem", "Ruined Golem", "constitution", 190, 10, 3, 2.25, .42]
  ].map(([id, name, rewardStat, hp, damage, defense, attackInterval, reward], index) => ({
    id, name, regionId: "region-1", rank: index + 1, rewardStat, hp, damage, defense, attackInterval, reward
  }));

  return { STATS, CLASSES, ORIGINS, JOBS, SKILLS, REGIONS, HOUSES, STARTER_MONSTERS };
});
