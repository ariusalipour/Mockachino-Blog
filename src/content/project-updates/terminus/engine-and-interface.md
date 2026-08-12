---
project: terminus
slug: engine-and-interface
title: Separating the game engine from the interface
summary: Terminus is being developed with a headless engine so the game rules can be tested and played without driving the mobile UI.
createdAt: 2026-08-12T09:00:00.000+00:00
updatedAt: 2026-08-12T09:00:00.000+00:00
tags:
  - mobile-apps
  - game-development
---

Terminus is a narrative game, but the important rules do not need to live inside the screens.

Separating the engine makes it possible to test card results directly, run headless simulations, and use command-line or JSON-driven play modes while the mobile interface continues to evolve.

It also creates a cleaner boundary for the world and card data, which should make the content easier to author as the game grows.
