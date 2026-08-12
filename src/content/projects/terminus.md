---
name: Terminus
summary: A narrative card game about surviving strange worlds, built as an evolving React Native and Expo project.
status: Active development
startedAt: 2026-01-16T21:44:28.000+00:00
updatedAt: 2026-08-12T09:00:00.000+00:00
repositoryPublic: false
platforms:
  - iOS
  - Android
stack:
  - React Native
  - Expo
  - Headless game engine
  - CLI tooling
tags:
  - mobile-apps
  - game-development
---

Terminus is a narrative card game built around short decisions with persistent consequences. It is currently a private development project, so there is no public repository or live project site to link yet.

Each world has its own rules and pressures. The player moves through a sequence of cards, choosing what to accept or reject while trying to keep the run alive.

## The current shape of the game

The first world is built around a last-exodus premise: the old world has ended, the player has limited context, and the journey towards Eden unfolds through narration and card choices.

The game tracks a run across several systems, including milestones, trinkets, settings, and the state of the current world.

Completing a world is intended to unlock the next part of the journey.

The current codebase treats the first world as an authorable sequence rather than a one-off screen, leaving room for new worlds, card effects, and longer-running progression to grow from the same model.

## What is being built

The current work is less about adding a large number of cards and more about giving the game a dependable spine: a persisted session, data-driven narration, milestone and trinket state, and a rules engine that can be exercised outside the mobile interface.

That makes it possible to test a run from the command line, author world data as structured content, and keep the interface focused on the atmosphere of each decision.

## Technical direction

Terminus is currently an iOS and Android project using React Native and Expo.

The game engine is being separated from the interface so it can also support headless tests, command-line play, JSON-driven runs, and development tooling for authoring world content.

That separation is useful for a narrative game because the rules of a card result can be tested without having to drive the whole mobile interface.
