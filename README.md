# Mockachino Blog

Personal blog and wiki by [Aryan Alipour](https://github.com/ariusalipour), built with [Astro](https://astro.build) and deployed on [Cloudflare Pages](https://pages.cloudflare.com).

Covers shooting sports, gaming, tech projects, photography, and more.

## Live Site

**[mockachino.app](https://mockachino.app)**

## Features

- **Blog entries** — long-form posts on shooting, gaming, tech, and creative work
- **Wiki** — structured reference pages for shoots, plays, reviews, and tutorials
- **Glossary** — tooltip-linked terminology across all content
- **Browse & filter** — search by category, tag, or topic; random-entry mode
- **Responsive** — optimised for desktop and mobile

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | [Astro](https://astro.build) v5 |
| Language | TypeScript |
| Hosting | Cloudflare Pages |
| Analytics | Google Analytics 4 via Cloudflare Worker |
| Persistence | Cloudflare KV (pageview counts) |

## Prerequisites

- Node.js >= 22
- npm

## Commands

```sh
npm install        # install dependencies
npm run dev        # start dev server at localhost:4321
npm run build      # build static site to dist/
npm run preview    # preview production build locally
```

## Project Structure

```
/
├── public/              # static assets (images, icons, brand)
├── src/
│   ├── components/      # Astro/UI components
│   ├── content/         # all content (wiki, glossary, tags, categories)
│   │   ├── wiki/        # wiki pages (shoots, plays, reviews, tutorials)
│   │   ├── glossary/    # glossary term definitions
│   │   ├── tags/        # tag pages
│   │   └── categories/  # category pages
│   ├── data/            # data helpers (glossary files, etc.)
│   ├── layouts/         # page layouts
│   ├── lib/             # build-time rehype plugins
│   ├── pages/           # route pages
│   └── styles/          # global styles
├── functions/           # Cloudflare Pages Functions
│   └── api/             # API endpoints (popularity data)
├── workers/             # Cloudflare Workers
│   └── ga-sync/         # GA4 → KV sync worker
├── scripts/             # build & migration scripts
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

## Cloudflare Pages Deployment

Required settings in the Cloudflare dashboard:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output | `dist` |
| Node version | 22 |

A `prebuild` script expands shallow git history for content that displays repo activity metadata.

### KV Namespace

A KV namespace named `MOCKACHINO_PAGEVIEWS` must exist and be bound to both the Worker and the Pages Function.

### Secrets

| Secret | Used by | Description |
|---|---|---|
| `GA_SERVICE_ACCOUNT_KEY` | Worker `ga-sync` | JSON key for GA4 service account |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on suggesting changes, submitting pull requests, and adding content.

## License

All Rights Reserved. See [LICENSE.txt](./LICENSE.txt).

Copyright (c) 2025—2026 Aryan Alipour.
