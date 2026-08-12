---
name: Terminus
summary: A narrative card game about surviving strange worlds, built as an evolving React Native and Expo project.
status: Active development
updatedAt: 2026-08-12T09:00:00.000+00:00
repository: https://github.com/ariusalipour/terminus-game
tags:
  - mobile-apps
  - game-development
---

Terminus is a narrative card game built around short decisions with persistent consequences.

Each world has its own rules and pressures. The player moves through a sequence of cards, choosing what to accept or reject while trying to keep the run alive.

## The current shape of the game

The first world is built around a last-exodus premise: the old world has ended, the player has limited context, and the journey towards Eden unfolds through narration and card choices.

The game tracks a run across several systems, including milestones, trinkets, settings, and the state of the current world.

Completing a world is intended to unlock the next part of the journey.

## Technical direction

Terminus is currently an iOS and Android project using React Native and Expo.

The game engine is being separated from the interface so it can also support headless tests, command-line play, JSON-driven runs, and development tooling for authoring world content.

That separation is useful for a narrative game because the rules of a card result can be tested without having to drive the whole mobile interface.
