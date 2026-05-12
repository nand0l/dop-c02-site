# Project Structure

```
dop-c02-site/
├── docs/                        # All study guide content (MDX)
│   ├── 00-index.md              # Overview, domain weights, service frequency table
│   ├── 01-sdlc-automation.md
│   ├── 02-configuration-management-iac.md
│   ├── 03-resilient-cloud-solutions.md
│   ├── 04-monitoring-and-logging.md
│   ├── 05-incident-event-response.md
│   ├── 06-security-compliance.md
│   └── 99-question-cross-reference.md
├── src/
│   ├── components/
│   │   └── HomepageFeatures/    # React component (largely unused — docs at root)
│   ├── css/
│   │   └── custom.css           # Global CSS variable overrides
│   └── pages/                   # Non-docs pages (minimal use)
├── static/
│   └── img/                     # Favicon, logo, static images
├── build/                       # Generated output (gitignored)
├── .docusaurus/                 # Docusaurus cache (gitignored)
├── docusaurus.config.ts         # Site config — title, navbar, presets, theme
├── sidebars.ts                  # Sidebar order for the studyGuide sidebar
├── package.json
└── tsconfig.json
```

## Key Conventions

- **Doc filenames** use a numeric prefix (`01-`, `02-`, …) for ordering; Docusaurus strips the prefix for the URL slug
- **Sidebar** is manually ordered in `sidebars.ts` under the `studyGuide` key — add new docs there when creating new pages
- **No blog** — the blog plugin is disabled; do not add blog posts
- **No homepage hero** — docs are served at `/` directly; `src/pages/index.tsx` is not the entry point
- **Config files** (`docusaurus.config.ts`, `sidebars.ts`) are TypeScript — keep them typed
- **Content lives only in `docs/`** — do not put study content in `src/pages/`
