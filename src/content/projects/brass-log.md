---
name: Brass Log
summary: A firearms management and logging application for tracking usage, ammunition, storage, components, and reporting.
status: Active development
startedAt: 2025-10-09T13:26:19.000+01:00
updatedAt: 2026-08-12T09:00:00.000+00:00
repository: https://github.com/ariusalipour/brass-log
repositoryPublic: true
platforms:
  - iOS
  - Android
  - Web
stack:
  - React Native
  - Expo
  - Expo Router
  - TypeScript
tags:
  - mobile-apps
  - firearms
---

Brass Log is a private, modern log book app for firearm owners and organisations. The public GitHub repository provides the project's home for documentation and project discussion; the product itself is app-only.

The goal is to make usage history, inventory, storage, maintenance, and reporting easier to manage in one place, without turning a normal range session into an administrative exercise.

## Privacy and the logbook model

Brass Log is designed around an encrypted vault. Entries are encrypted on the device before synchronisation, with client-side AES-256 GCM encryption and secure key handling intended to keep the logbook private while still making it available across devices.

The quick-log flow can use saved range locations, and the records connect firearms, components, ammunition batches, and locations so that a session becomes part of a useful history rather than an isolated note.

## What it is designed to track

### Firearm usage

Brass Log records when a firearm was used, why it was used, and the history that builds up over time.

### Storage and locations

The location model organises firearms by facility, room, or cabinet, while saved locations make repeat logging quicker.

The app also supports geolocation-aware shortcuts for favourite clubs and ranges.

### Ammunition

The ammunition area covers batches, usage, allocation, round tracking, cost management, and budgeting. Components can be linked to firearms so usage history can inform maintenance and replacement decisions.

### Components and maintenance

Components can be tracked alongside inspections, maintenance schedules, replacements, parts inventory, and documentation. Smart alerts are intended to make cleaning and part replacement easier to remember.

## Reporting and accountability

The product includes session timelines, usage statistics, inventory reports, exports, and audit trails that help an organisation understand what has happened without relying on scattered spreadsheets.

Brass Log Plus adds advanced reporting, Excel/CSV/HTML/JSON export and import, smart alerts, default ammunition, and custom tags.

The project is being built as a React Native and Expo application for iOS, Android, and web. Future updates will follow the balance between a fast personal logbook, responsible record keeping, and the security expectations of a sensitive data set.
