# Open-source release review — VMAX Atlas

Copyright (c) 2026 VMAX オープンソース開発チーム

## Current status: MIT notice finalized; remaining release checks documented

The project `LICENSE` file now contains the MIT license text and the requested
2026 VMAX copyright notice. This document tracks technical and third-party
release checks that have not been verified by this archive inspection.

## Changes in this review copy

- `package.json` now has `private: false` so the package is no longer explicitly
  blocked from publication by npm's private-package guard.
- Finalized the project's MIT `LICENSE` notice with the requested copyright holder.
- Updated the README to describe the project's MIT license and remaining checks.

## Items that must be resolved before public release

1. **Copyright ownership and authority**
   - The project maintainer should ensure the named copyright holder is accurate
     and has authority to license the project code.
   - If code was generated, commissioned, copied, or contributed by others, check
     the applicable terms and permissions rather than assuming ownership.

2. **Third-party code and assets**
   - Review UI components and copied/generated files, including shadcn-style UI
     components, icons, and any code or assets supplied by tools or templates.
   - Produce a dependency license report from the resolved dependency tree after
     installing dependencies (the archive does not contain `node_modules`).
   - Include required license texts, copyright notices, attribution, and source
     offers where the relevant licenses require them.
   - Do not relicense third-party components under MIT merely by adding this
     project's license.

3. **Generated graph data**
   - `public/data/vmax-graph.json` is a generated snapshot of VMAX source structure.
     Confirm the owner permits distribution of this derived data and check that
     it does not expose secrets or material that should not be public.

4. **Build and test**
   - In a clean environment, install from the lockfile and run `npm test`,
     `npm run lint`, and `npm run build`.
   - Record results before describing the release as tested.

## Checks performed on this ZIP

- ZIP integrity and member extraction were checked.
- `package.json` parses as valid JSON.
- The package's `private` field is now `false`.
- This does not verify runtime behavior, ownership, or third-party license compliance.

## Important

The project's MIT notice is no longer a placeholder. Before distribution, review
third-party code/assets and dependency licenses, and run the documented build and
test commands. The project MIT license does not relicense third-party material.
