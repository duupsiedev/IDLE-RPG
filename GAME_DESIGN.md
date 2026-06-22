# Increment Kingdom — Game Specification

## Direction

Increment Kingdom is a challenging but fair idle RPG. Jobs and skills build the economy and improve efficiency; automatic combat is the primary source of permanent character stats. Optimization should help, but a valid imperfect path must remain recoverable and enjoyable.

## Character

### Classes — medium impact

- Warrior: Strength, Vitality, Constitution
- Mage: Intelligence, Mind, Spirit
- Hunter: Dexterity, Agility, Luck

### Origins — small impact

- Commoner: global experience
- Scholar: skill experience
- Nomad: job experience
- Ranger: monster stat rewards
- Fallen Noble: money income

### Starter stats

Strength, Vitality, Constitution, Intelligence, Mind, Spirit, Dexterity, Agility, and Luck. Additional stats may unlock later.

## Progression layers

### Jobs

Three categories with five tiers each: Construction, Army, and Royal. Unlocks can require both a related job level and skill level. Later categories have stronger starting income than the ending tiers of earlier categories.

### Skills

Three categories with three skills each: Physique, Commerce, and Prestige. Skills improve related systems such as stat rewards, income, experience, and Morale.

### Combat

Combat is automatic and enemies fight back. Five regions are planned with six monsters each. Stronger monsters grant better permanent stats; repeated farming has diminishing returns.

### Shop

Money purchases access and playthrough infrastructure. Five regions and ten housing tiers are planned. Housing raises Morale, which directly multiplies experience and monster-stat rewards.

## Interface

- Persistent character sheet at the left, including practical explanations of stat effects.
- Header showing money, current region, Morale, and current activities.
- Primary tabs for Jobs, Skills, Combat, and Shop.
- Contextual main screen for the selected tab.

## Current implementation boundary

Batch one establishes character creation, the application shell, versioned state, all planned job/skill/housing slots, and a small working Jobs/Skills/Shop slice. Combat progression and saving are intentionally reserved for later batches.
