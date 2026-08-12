---
name: Pack-It
summary: An offline-first packing companion for reusable checklists, repeatable loadouts, and knowing what has actually been packed.
status: Work in progress
startedAt: 2026-05-25T12:32:39.000+01:00
updatedAt: 2026-08-12T09:00:00.000+00:00
repository: https://github.com/ariusalipour/pack-it
repositoryPublic: true
platforms:
  - iOS
  - Android
  - Web
stack:
  - React Native
  - Expo SDK 54
  - Expo Router
  - Zustand
  - AsyncStorage
tags:
  - mobile-apps
  - offline-first
  - productivity
---

Pack-It is a React Native and Expo app for building reusable packing checklists for trips, work kits, family days out, camera bags, gym lockers, and other repeatable loadouts.

The public project repository is [github.com/ariusalipour/pack-it](https://github.com/ariusalipour/pack-it). There is no separate project site yet while the app is being developed.

## The core loop

Pack-It is designed around a simple repeatable flow:

1. Create a pack.
2. Add the things that belong in it.
3. Mark items as packed as they go into the bag.
4. Reuse the saved pack for the next trip.
5. Reset the progress when the loadout is unpacked.

That makes the app useful for anything that is packed repeatedly, from a weekend city break to a road-trip camera bag or a gym locker kit.

## Current MVP

The current build is an offline-first MVP with local persistence and no accounts, backend, or cloud sync yet.

It can create reusable packs, assign categories and notes, seed starter items, set quantities and weights, attach images, duplicate packs, reset packed progress, delete packs, and restore built-in examples.

Packed state is stored as a timestamp rather than a simple yes/no flag. That means a pack can show when an item was actually packed, which gives the checklist a little more useful history without adding unnecessary ceremony.

## Development direction

The app is primarily mobile-first but also builds for the web. The next areas of work include safe-area-aware layouts, shared design tokens, editing existing packs and items, custom grouping, total pack-weight summaries, better camera capture, and local data migration support.

Pack-It is still deliberately small. The interesting question is how much structure a reusable checklist needs before it starts feeling like another task-management system.
