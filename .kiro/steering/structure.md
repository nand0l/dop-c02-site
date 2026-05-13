# Project Structure

```
dop-c02-site/
├── docs/
│   ├── studyguides/             # Domain synthesis study guide content
│   │   ├── 00-index.md          # Overview, domain weights, service frequency table
│   │   ├── 01-sdlc-automation.md
│   │   ├── 02-configuration-management-iac.md
│   │   ├── 03-resilient-cloud-solutions.md
│   │   ├── 04-monitoring-and-logging.md
│   │   ├── 05-incident-event-response.md
│   │   ├── 06-security-compliance.md
│   │   └── 99-question-cross-reference.md
│   └── reader/                  # Full question corpus with stems, options, answers
│       ├── index.md             # Master index with TOC by domain and checkboxes
│       ├── part-01-q001-064.md
│       ├── part-02-q065-130.md
│       ├── part-03-q131-194.md
│       ├── part-04-q195-263.md
│       ├── part-05-q264-325.md
│       └── part-06-q326-392.md
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

- **Doc filenames** use a numeric prefix (`01-`, `02-`, ...) for ordering; Docusaurus strips the prefix for the URL slug
- **Sidebar** is manually ordered in `sidebars.ts` under the `studyGuide` key — add new docs there when creating new pages
- **Cross-references from `reader/` to `studyguides/`** use relative path `../studyguides/<filename>` — never `../synthesis/`
- **Cross-references from `studyguides/` to `reader/`** use relative path `../reader/<filename>`
- **No blog** — the blog plugin is disabled; do not add blog posts
- **No homepage hero** — docs are served at `/` directly; `src/pages/index.tsx` is not the entry point
- **Config files** (`docusaurus.config.ts`, `sidebars.ts`) are TypeScript — keep them typed
- **Content lives only in `docs/`** — do not put study content in `src/pages/`
