---
project: pack-it
slug: first-offline-first-mvp
title: Pack-It starts with a local-first packing loop
summary: The first Pack-It MVP focuses on reusable packs, timestamped packed state, and reliable offline use before accounts or sync.
createdAt: 2026-08-12T09:00:00.000+00:00
updatedAt: 2026-08-12T09:00:00.000+00:00
tags:
  - mobile-apps
  - offline-first
  - productivity
---

Pack-It is the newest project to join the projects section, and it starts with a deliberately modest promise: help people stop forgetting the same things.

The first build treats a pack as a reusable template. A user can create one for a trip, camera bag, work kit, family day out, or gym locker, then add items, quantities, weights, notes, and images.

The app records `packedAt` timestamps instead of keeping only a boolean. That small choice means the checklist can tell you what has actually been packed and when, while still staying quick to use.

For now, the data stays on-device. That keeps the MVP useful without an account or network connection, and leaves the harder questions around sync and migrations for a later stage.
