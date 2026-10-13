# VMAX Atlas — source code

Copyright (c) 2026 VMAX オープンソース開発チーム

VMAX Atlas is the source code for a web app that visualizes a generated map of VMAX modules and their static relationships. It is an explorer/documentation tool, **not the VMAX game/runtime itself**.

## Requirements

- Node.js compatible with the versions used by the lockfile
- npm (or Bun, if preferred)

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Common checks:

```bash
npm test
npm run lint
npm run build
```

## Graph data

`public/data/vmax-graph.json` is a generated snapshot extracted from the VMAX Python source available during preparation of this archive. It is application data, not the canonical VMAX source code. Its `source.sha256`, `source.file`, and `source.lines` fields identify the input snapshot used to generate it.

Regenerate it from the intended source file when the VMAX source changes:

```bash
python3 tools/extract_vmax.py path/to/VMAX.py public/data/vmax-graph.json
```

The extractor uses Python's AST and comment-banner sections. `verified` means a static reference to a uniquely defined top-level symbol; it does **not** mean the referenced behavior was runtime-tested. `inferred` edges are ambiguous or based on string matches. Categories are keyword heuristics. Treat the graph as an aid for navigation, not as proof of runtime behavior, completeness, security, or correctness.

## Project layout

- `src/lib/vmax/` — graph types, validation, filtering, statistics, import/export, layout
- `src/components/vmax/` — graph canvas, module detail, data menu
- `src/routes/` — app pages
- `tools/extract_vmax.py` — graph generator
- `public/data/vmax-graph.json` — generated graph snapshot

## License and open-source release

This project is released under the MIT License. The copyright notice is:

`Copyright (c) 2026 VMAX オープンソース開発チーム`

Review `OPEN_SOURCE_RELEASE_REVIEW.md` for remaining release checks, especially
third-party dependency notices and clean-environment build/test results. The MIT
license for this project does not override licenses that apply to third-party
components or assets.
