# Tech Stack

## Framework

- **Docusaurus 3.10.1** (React-based static site generator)
- Docs-only mode: `blog: false`, `routeBasePath: '/'` — docs are served at the site root
- MDX format enabled for all markdown files (`markdown.format: 'detect'`)
- `future: { v4: true }` flag enabled

## Languages

- **TypeScript** (~6.0.2) for config files (`docusaurus.config.ts`, `sidebars.ts`)
- **MDX/Markdown** for all content in `docs/`
- **TSX** for React components in `src/`

## Key Dependencies

| Package | Version | Purpose |
| --- | --- | --- |
| `@docusaurus/core` | 3.10.1 | Core framework |
| `@docusaurus/preset-classic` | 3.10.1 | Docs + theme preset |
| `@docusaurus/faster` | 3.10.1 | Build performance |
| `react` / `react-dom` | ^19.0.0 | UI runtime |
| `prism-react-renderer` | ^2.3.0 | Syntax highlighting |
| `clsx` | ^2.0.0 | CSS class utilities |

## Runtime Requirement

Node.js >= 20.0

## Package Manager

**npm** (use `npm`, not `yarn`)

## Common Commands

```powershell
# Install dependencies
npm install

# Start local dev server (hot reload)
npm start

# Production build → ./build/
npm run build

# Serve the production build locally
npm run serve

# Type-check TypeScript
npm run typecheck

# Clear Docusaurus cache
npm run clear

# Lint architecture docs
npx markdownlint-cli --config .markdownlint.json architecture/
```

## Deployment

**Primary: AWS Amplify** — push to `main` triggers an automatic build and deploy via `amplify.yml`.

`amplify.yml` at the repository root overrides the Amplify console build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --cache .npm
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - .npm/**/*
```

If the Amplify build fails with an npm integrity error, clear the build cache in the Amplify console (**Hosting → Build settings → Clear cache**) and redeploy.

## Styling

- Infima CSS framework (bundled with Docusaurus)
- Custom CSS variables in `src/css/custom.css`
- Primary color: `#2e8555` (light), `#25c2a0` (dark)
- `colorMode.respectPrefersColorScheme: true` — respects OS dark/light preference
- Prism themes: GitHub (light) / Dracula (dark)

## Favicons and Web Manifest

Configured via `headTags` in `docusaurus.config.ts`. All favicon assets live in `static/img/`:
`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`,
`android-chrome-192x192.png`, `android-chrome-512x512.png`, `site.webmanifest`.

## Broken Links

`onBrokenLinks: 'warn'` — broken internal links produce warnings, not build failures

## Markdownlint

`.markdownlint.json` at the project root configures markdownlint for the `architecture/` docs:

- MD013 (line length) disabled — impractical for tables
- Table separators must use `| --- |` style (MD060)
