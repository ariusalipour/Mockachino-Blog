# Mockachino Blog

Astro-powered static site for Mockachino content, deployed on Cloudflare Pages.

## Commands

All commands are run from the project root:

```sh
npm install
npm run dev
npm run build
npm run preview
```

## Project Structure

```text
/
├── public/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   └── styles/
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

The homepage lives at `src/pages/index.astro`.

## Cloudflare Pages

Required build settings:

```text
Build command: npm run build
Build output directory: dist
Node version: 22
```

The `prebuild` step expands shallow git checkouts before Astro renders static repo activity metadata.

This repo also includes:

- a Cloudflare Worker at `workers/ga-sync/` that syncs GA4 page view data into KV
- a Pages Function at `functions/api/popular.js` that reads popularity data from KV

Required bindings and secrets:

```text
Pages KV binding: MOCKACHINO_PAGEVIEWS
Worker KV binding: MOCKACHINO_PAGEVIEWS
Worker secret: GA_SERVICE_ACCOUNT_KEY
```
