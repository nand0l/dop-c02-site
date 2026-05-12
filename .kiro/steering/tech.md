# Tech Stack

## Framework

- **Docusaurus 3.10.1** (React-based static site generator)
- Docs-only mode: `blog: false`, `routeBasePath: '/'` — docs are served at the site root
- MDX format enabled for all markdown files (`markdown.format: 'mdx'`)
- `future: { v4: true }` flag enabled

## Languages

- **TypeScript** (~6.0.2) for config files (`docusaurus.config.ts`, `sidebars.ts`)
- **MDX/Markdown** for all content in `docs/`
- **TSX** for React components in `src/`

## Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@docusaurus/core` | 3.10.1 | Core framework |
| `@docusaurus/preset-classic` | 3.10.1 | Docs + theme preset |
| `@docusaurus/faster` | 3.10.1 | Build performance |
| `react` / `react-dom` | ^19.0.0 | UI runtime |
| `prism-react-renderer` | ^2.3.0 | Syntax highlighting |
| `clsx` | ^2.0.0 | CSS class utilities |

## Runtime Requirement

Node.js >= 20.0

## Package Manager

**Yarn** (see README — all commands use `yarn`, not `npm`)

## Common Commands

```bash
# Install dependencies
yarn

# Start local dev server (hot reload)
yarn start

# Production build → ./build/
yarn build

# Serve the production build locally
yarn serve

# Type-check TypeScript
yarn typecheck

# Clear Docusaurus cache
yarn clear

# Deploy to GitHub Pages
GIT_USER=<username> yarn deploy
# or with SSH:
USE_SSH=true yarn deploy
```

## Styling

- Infima CSS framework (bundled with Docusaurus)
- Custom CSS variables in `src/css/custom.css`
- Primary color: `#2e8555` (light), `#25c2a0` (dark)
- `colorMode.respectPrefersColorScheme: true` — respects OS dark/light preference
- Prism themes: GitHub (light) / Dracula (dark)

## Broken Links

`onBrokenLinks: 'warn'` — broken internal links produce warnings, not build failures
