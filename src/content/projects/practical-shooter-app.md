---
name: Practical Shooter App
summary: A cross-platform companion for IPSC shooters, bringing rulebooks, match discovery, learning tools, and scoring utilities into one place.
status: Active development
startedAt: 2025-12-02T23:09:35.000+00:00
updatedAt: 2026-08-12T09:00:00.000+00:00
repository: https://github.com/ariusalipour/practical-shooter-app
repositoryPublic: true
liveUrl: https://practicalshooter.app
platforms:
  - iOS
  - Android
  - Web
stack:
  - React Native
  - Expo
  - TypeScript
  - Firebase
tags:
  - ipsc
  - mobile-apps
---

The Practical Shooter App is a cross-platform companion for people involved in IPSC competition, built by competitive shooters for competitive shooters.

The public project home is [practicalshooter.app](https://practicalshooter.app/). The app is being built to put the things a shooter repeatedly needs in one place: the rules, the match calendar, learning material, and practical scoring tools.

## What the app is for

The app is intended to make the rules and supporting information easier to access during normal training, match preparation, and competition.

The current direction covers iOS, Android, and web, with offline access where it is useful on mobile. The public GitHub repository is the project's home for documentation, issues, discussions, and release notes; the application source remains in its private development repository.

## Current areas

### Rules

The rules section brings together rulebooks across disciplines including Handgun, Rifle, Shotgun, and Action Air.

It supports chapter and section browsing, full-text search, glossary terms, cross-references, favourites, and deep links to individual rules.

Rulebooks can be downloaded and cached locally on native platforms, while the web version streams the content as required. The app also exposes adjustable text sizing, shareable rule deep links, and favourites that sync for signed-in users.

### Calendar

The calendar collects IPSC matches into a monthly view with search and filters for discipline, level, and country.

Events can be favourited so they remain easy to find even while other filters are active.

Calendar data is cached locally and refreshed in the background so the match view remains useful away from a reliable connection.

### Learn and calculate

The learning area includes articles, quizzes, a hit factor calculator, revision comparisons, and a match verifier for building multi-stage matches and reviewing totals.

There is also a rules assistant that answers natural-language questions with citations back to the official rulebooks.

The application is backed by Firebase for authentication and user data, with dedicated Rules and Events APIs supporting the rulebook and match-calendar surfaces.

## Development direction

The app sits at the intersection of reference material and practical match preparation.

Future updates on this page will cover feature work, rulebook ingestion, API changes, testing, and the decisions involved in making a specialist tool useful without making it cumbersome.
