# Zero-Cost Project Rule

This repository must remain permanently usable, buildable, testable, and publishable without creating fees, bills, paid usage, or financial liability for the owner.

This is a hard project constraint, not a preference.

## Non-negotiable rules

- Never add, enable, recommend as required, or provision anything that can charge money or generate metered billable usage.
- Never require a credit card, billing profile, paid account, subscription, paid license, usage credits, or a trial that can convert into a paid plan.
- Never add paid or usage-metered APIs, AI services, databases, hosting, storage, analytics, monitoring, logging, email, SMS, payment services, CDNs, build services, or other cloud resources.
- Never add API keys, billing credentials, cloud credentials, payment credentials, or secrets associated with a billable service.
- Never enable GitHub Codespaces, Git LFS, paid GitHub Marketplace apps, sponsorship spending, paid runners, or workflows/actions that could consume billable minutes or resources.
- Never introduce automatic deployment, scheduled cloud work, background cloud jobs, or infrastructure provisioning.
- Never rely on a service whose free tier permits automatic paid overages. A service that merely begins charging after a quota is exhausted is prohibited.
- Never make a purchase, start a trial, upgrade a plan, attach a payment method, or accept a billing agreement on the owner's behalf.

## Allowed architecture

- Prefer a completely self-contained static application using local HTML, CSS, JavaScript, and repository-owned assets.
- Runtime functionality must work without paid external services.
- Local development tools and dependencies must be free to use, must not require billing information, and must not contact a metered service as part of normal use.
- A public repository on GitHub Free is allowed.
- Static GitHub Pages hosting is allowed only when it uses the free public-repository offering, requires no payment method, has no paid overage path enabled, and does not require a billable workflow.
- If a quota-based free service stops working when its free allowance is exhausted, that failure is acceptable only when it cannot create a charge. The project should continue working locally.

## Future-proof billing requirements

- Never assume that a service remains free because it was free when it was first added. Re-check its current official pricing, quotas, overage behavior, licensing, and billing requirements before adding it or materially changing how it is used.
- Existing external integrations must be re-evaluated before upgrades, migrations, deployment changes, major releases, or increased usage.
- A pricing change must never be able to break the local game or silently create a bill. Keep the core application self-contained and removable from any optional hosting provider.
- Prefer repository-owned assets and browser-native functionality so a third party cannot later place essential game functionality behind a paid plan.
- Pin dependency versions when dependencies are genuinely necessary, record their purpose, and review their license and cost implications before upgrades.
- Do not treat a temporary promotion, free credit, educational credit, grant, trial, or introductory allowance as a free solution.

## Modular, extensible architecture

The project must be designed with the expectation that more classes, origins, jobs, skills, stats, monsters, maps, upgrades, mechanics, screens, and save-data fields will be added over time.

- Do not build the project as a single-file application or allow one file to become a catch-all for unrelated systems.
- Keep HTML structure, presentation, application startup, UI rendering, game rules, simulation, content data, persistence, formatting, and tests separate when they have distinct responsibilities.
- Keep game content and balance values in dedicated data/configuration modules instead of scattering numbers and names through UI or engine code.
- Keep core game and simulation rules independent from the browser UI so they can be tested without rendering the page.
- Give major systems clear module boundaries—for example: jobs, skills, combat, monsters, shops, housing, progression, saving, and offline progress.
- Prefer small modules with explicit inputs and outputs. Avoid hidden global state and unnecessary coupling between systems.
- New content should normally be addable through data definitions or a focused module without editing many unrelated files.
- Preserve save compatibility. Save data must have a schema version, and incompatible changes must include a migration path before persistent saves are introduced.
- Add or update focused tests whenever game rules, progression formulas, save behavior, or module contracts change.
- Avoid both extremes: do not create monolithic files, but do not split trivial code into layers or files that add no meaningful boundary. Separate by responsibility and reason to change.
- When a file begins handling multiple unrelated responsibilities or becomes difficult to navigate and test, refactor it before adding another system to it.
- Document important architectural decisions and public module contracts as the project grows.

## Progression simulator and lifetime-balance rule

The progression simulator is a required design reference for the entire lifetime of the game. Major progression and economy decisions must be tested through simulation before they are treated as balanced.

The simulator must never assume that one perfectly optimized route represents normal play.

- Never balance content solely around the fastest, mathematically optimal, or frame-perfect strategy.
- Simulate multiple distinct player strategies, including at minimum:
  - an informed optimizer;
  - a typical player making reasonable but imperfect choices;
  - a casual player who checks infrequently and changes goals slowly;
  - a deliberately inefficient but valid build or progression path;
  - long offline periods and irregular return schedules.
- When classes, origins, builds, job choices, skill choices, or progression branches exist, test representative combinations rather than only the strongest combination.
- Model realistic decision delay. Non-optimizer simulations must not instantly buy, switch, equip, or change targets at the exact mathematically ideal moment.
- Model wasted time and human behavior within reasonable bounds, such as over-farming a monster, saving too long for an upgrade, training a favored skill, or remaining in a familiar job.
- Compare progression as ranges and distributions, not one precise completion time. Report the fastest, typical, slow, and outlier experiences where practical.
- Track meaningful milestones, wall duration, time between unlocks, recovery after poor choices, and whether a player can redirect an inefficient build without restarting.
- A valid but non-optimal path must remain enjoyable. It may progress more slowly than an optimized path, but it must not become a sludge, trap, or effectively unrecoverable state.
- Optimization should provide satisfying advantages without being mandatory knowledge. Hidden formulas, external guides, or exact timing must not be required for reasonable progress.
- Avoid balancing by simply slowing every path. Lifetime should come from additional goals, regions, systems, builds, discoveries, and changing priorities—not only larger costs and longer waits.
- Use deterministic runs for regression testing and seeded randomized runs for broader path coverage.
- Preserve simulator scenarios and milestone expectations in automated tests so later changes cannot silently destroy early-, mid-, or late-game pacing.
- Treat simulator results as evidence, not absolute truth. Pair them with the intended player experience and, once available, real playtest feedback.

A progression or economy change is not complete until its effects have been compared across the supported simulation strategies. If only the optimal strategy remains healthy, the change is not balanced.

## Required agent behavior

Before adding any dependency, integration, hosting configuration, workflow, external asset, API, SDK, plugin, or service:

1. Verify that it cannot create a charge under the intended configuration.
2. Prefer a local, dependency-free implementation whenever reasonably possible.
3. Reject the change if billing behavior is uncertain, could change automatically based on usage, or requires payment information.
4. Tell the owner when a requested feature cannot be implemented under this zero-cost rule and offer a fully local alternative.

Before adding a substantial game system or feature:

1. Identify the system boundary and the data it owns.
2. Extend or create a focused module instead of placing the feature in an unrelated existing file.
3. Keep balance/content data separate from behavior where practical.
4. Confirm that existing module contracts and tests still pass.
5. If the feature affects progression, run the relevant multi-strategy lifetime simulations and review the milestone ranges.

## Required build and development verification

- The repository must provide working `npm run build` and `npm run dev` scripts, even when the project uses no third-party packages.
- After every meaningful code, content, configuration, or styling change, run `npm run build` and resolve all failures before declaring the task complete.
- Start `npm run dev` and verify that the local application starts without startup or immediate runtime errors. Stop the development server after verification unless the owner asks to keep it running.
- When UI behavior changes, inspect the running application at the local development URL when browser-testing capability is available.
- Never use a successful development-server startup as a substitute for the build, automated tests, simulator checks, or relevant manual verification.
- If either required script is missing or broken, repair it as part of the current task before continuing feature work.

Do not weaken, bypass, reinterpret, or remove this rule to complete another task. If future instructions conflict with it, stop and identify the conflict. The owner must explicitly edit or revoke this policy before an exception can be made.
