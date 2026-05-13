# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWS DOP-C02 (DevOps Engineer Professional) exam study guide — a Docusaurus v3 static site with 360 practice questions (Q1–Q392) and domain-focused synthesis content. Personal/educational tool, not a commercial product.

## Commands

```powershell
npm install        # Install dependencies (Node >=20.0 required)
npm start          # Dev server with hot-reload
npm run build      # Generate static site to /build
npm run serve      # Serve the built site locally
npm run typecheck  # TypeScript type checking
npm run clear      # Clear Docusaurus cache (use when builds behave unexpectedly)
npm run deploy     # Deploy to GitHub Pages (USE_SSH=true npm run deploy for SSH)
```

Use `npm`, not `yarn`.

## Architecture

### Content Layer (`/docs`)

All content lives here as Markdown/MDX files. Two sub-directories:

- `studyguides/` — Six domain synthesis files plus a cross-reference index. Each file uses a numeric prefix (`01-`, `02-`, ...) for ordering; Docusaurus strips the prefix from the URL slug.
- `reader/` — Full 360-question corpus split into six parts (`part-01-q001-064.md` through `part-06-q326-392.md`) plus an index with domain-grouped TOC and checkbox-style self-review tracking.
- `index.md` — Landing page served at `/` (`slug: /`)

The sidebar for `studyguides/` is manually ordered in `sidebars.ts` — add new docs there when creating new pages.

### Cross-Reference Conventions

- Links from `reader/` → `studyguides/` use relative path `../studyguides/<filename>` (never `../synthesis/`)
- Links from `studyguides/` → `reader/` use relative path `../reader/<filename>`
- `docs/studyguides/99-question-cross-reference.md` maps every question number (Q1–Q392) to its domain section

### Content Conventions

- **ASCII only** — no smart quotes (`"`/`"`), em dashes (`—`), or ellipsis (`…`) characters
- **Question citations** inline as `(Q1, Q47, Q142)`
- **AWS documentation URLs** preserved verbatim from source explanations
- **Docusaurus admonitions** used consistently in study guide files:
  - `:::tip` — Learning Objectives block at the top of each section
  - `:::warning` — Exam Tip for must-know gotchas
  - `:::note` — Key Takeaway to close major sections
- Decision tables use plain Markdown pipe tables

### Configuration

- `docusaurus.config.ts` — Main site config: title, navbar, theme (GitHub light / Dracula dark), blog disabled (`blog: false`), docs served at root (`routeBasePath: '/'`), `onBrokenLinks: 'warn'`, `future: { v4: true }`
- `sidebars.ts` — Sidebar manually ordered under the `studyGuide` key
- `tsconfig.json` — Strict TypeScript, Docusaurus preset base
- All config files (`docusaurus.config.ts`, `sidebars.ts`) are TypeScript — keep them typed

### Source (`/src`)

React/TSX components. `src/components/HomepageFeatures/` renders feature cards (largely unused since docs are at root). Content must not be placed in `src/pages/`.

### Planned Feature: Interactive Quiz Mode

A spec exists at `.kiro/specs/interactive-quiz-mode/requirements.md`. Key design decisions already defined:

- Question data: `src/data/questions.ts` — exports `ReadonlyArray<Question>` with fields `id`, `domain`, `stem`, `choices` (A–D), `answer`, `explanation`
- Quiz page: `src/pages/quiz.tsx` served at `/quiz`; navbar link labeled "Practice Quiz" to the right of "Domains"
- Quiz widget: `src/components/QuizWidget/index.tsx` — embeddable in MDX pages, accepts `domain` and optional `maxQuestions` props
- Session persistence via `localStorage` on the quiz page only (not in the widget); guard all `localStorage`/`window` access in `useEffect` to avoid SSR build errors
- Styling via Infima CSS variables only (no hardcoded colors) for dark/light theme compatibility
- Passing threshold: 72% — used for visual distinction in session summary and domain study links
