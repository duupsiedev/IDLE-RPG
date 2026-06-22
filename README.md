# Increment Kingdom

A dependency-free idle RPG in active development, accompanied by a progression simulator that reports ranges across representative playstyles instead of treating one optimal route as truth.

## Run it

Open `index.html` to play the current starter slice. Open `simulator.html` for the progression lab.

To run the basic model checks:

```powershell
node game.test.js
node simulator.test.js
```

## Current model

- Jobs run continuously, earning money and job experience.
- Three passive disciplines train alongside work and combat.
- The automated shopper prioritizes maps, then housing.
- Combat farms the strongest monster the character can defeat reliably.
- Victories give permanent stats with diminishing returns.
- Housing starts at `1.00×` Morale and multiplies experience and monster-stat gains.

- Three starter classes and five origins alter representative runs.
- Optimized, typical, casual, and inefficient-but-valid strategies use different check-in schedules and choices.
- Each strategy uses seeded schedule variation so milestone results appear as time windows.

## Structure

- `scenarios.js` defines classes, origins, playstyles, and the representative scenario set.
- `simulator.js` contains the progression engine.
- `lifetime-analysis.js` compares runs and produces milestone ranges.
- `app.js` renders the dashboard.
- `simulator.test.js` protects expected scenario coverage and progression behavior.

All starting numbers are hypotheses, not final balance. The simulator exists so those hypotheses are cheap to test.
