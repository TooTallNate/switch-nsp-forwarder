---
"nsp-forwarder": patch
---

Update dependencies to address security advisories. Bumps `@nx.js/*`
to 0.0.69, `react-router-dom` to ^6.30.2 (fixes XSS via open redirects,
[GHSA-7g68-fr34-x4cf](https://github.com/advisories/GHSA-7g68-fr34-x4cf)
and [GHSA-cpj6-fhp6-mr6j](https://github.com/advisories/GHSA-cpj6-fhp6-mr6j)),
and `esbuild` to ^0.28.0 (build tooling). Adds pnpm overrides to pull
in patched versions of `terminal-image`, `@xmldom/xmldom`, and force
`jimp` to 1.6.0 (1.6.1 has a broken browser bundle).
