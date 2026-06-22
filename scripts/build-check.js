"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "index.html", "simulator.html", "src/styles/game.css", "src/ui/game-app.js",
  "src/data/game-content.js", "src/core/game-state.js", "src/core/progression.js", "src/core/combat.js",
  "src/core/time-engine.js", "src/core/persistence.js"
];

for (const file of requiredFiles) assert.ok(fs.existsSync(path.join(root, file)), `Missing required file: ${file}`);

for (const test of ["game.test.js", "combat.test.js", "persistence.test.js", "simulator.test.js"]) {
  const result = spawnSync(process.execPath, [test], { cwd: root, stdio: "inherit" });
  assert.equal(result.status, 0, `${test} failed`);
}

const sourceFiles = requiredFiles.filter(file => file.endsWith(".js"));
for (const file of sourceFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { cwd: root, stdio: "inherit" });
  assert.equal(result.status, 0, `Syntax check failed: ${file}`);
}

console.log("Build verification passed.");
