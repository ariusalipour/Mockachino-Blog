# Contributing to Mockachino Blog

Thanks for your interest! Contributions — suggestions, bug reports, content ideas, and pull requests — are welcome.

## How to Contribute

### Report Issues

Open a [GitHub issue](https://github.com/ariusalipour/Mockachino-Blog/issues) for:

- bugs or broken links
- content suggestions or corrections
- feature requests

### Suggest Content

If you have an idea for a blog post, wiki page, or glossary term, open an issue with the label `content-idea`. Be as specific as possible — include a title, outline, and any reference material.

### Submit Pull Requests

PRs for fixes, improvements, and new content are encouraged.

1. Fork the repo and create a branch from `main`.
2. Make your changes.
3. Test locally with `npm run dev` and `npm run build`.
4. Open a PR with a clear title and description.

### Style Guidelines

- Content is written in Markdown.
- Wiki pages follow the existing frontmatter schema (see `src/content/wiki/` for examples).
- Tag and category references use existing taxonomies where possible.
- Code changes should match the existing patterns — no new frameworks or tooling without discussion.

## Content Structure

| Directory | Purpose |
|---|---|
| `src/content/wiki/` | Wiki entries organised by category (shoots, plays, etc.) |
| `src/content/glossary/` | Glossary term definitions |
| `src/content/tags/` | Tag taxonomy |
| `src/content/categories/` | Category pages |

### Third-Party Content

Do not submit images, code, or other assets you do not own or have
explicit permission to use. If your contribution includes third-party
material, note the source and license in your PR description.

#### Editorial Use of Images

This site uses third-party images for news reporting, commentary,
criticism, and educational purposes — e.g. product photos in reviews,
screenshots in tutorials, event coverage. These are believed to be
fair use (US) / fair dealing (UK) under copyright law.

When contributing editorial content that includes third-party images:

- Always credit the original source (website, publication, photographer).
- Only use what's necessary to illustrate the point — no full galleries.
- Do not alter or misrepresent the original context of the image.
- Note the source and your rationale for including it in the PR
  description.
- If unsure whether use qualifies as fair dealing, ask first.

## License

By submitting a contribution, you retain your copyright but grant the
repository owner a nonexclusive, worldwide, irrevocable license to use,
modify, and distribute your contribution as part of this project under
the [All Rights Reserved license](./LICENSE.txt). You represent that
you have the right to grant this license and that your contribution
does not infringe on any third-party rights.

## Questions

Open a discussion or issue if you need clarity on anything.
