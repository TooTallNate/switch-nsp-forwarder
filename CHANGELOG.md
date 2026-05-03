# nsp-forwarder

## 0.0.9

### Patch Changes

- [`8458115`](https://github.com/TooTallNate/switch-nsp-forwarder/commit/845811585e0b0d8881745afd50eca25d203957fd) Thanks [@TooTallNate](https://github.com/TooTallNate)! - Update dependencies to address security advisories. Bumps `@nx.js/*`
  to 0.0.69, `react-router-dom` to ^6.30.2 (fixes XSS via open redirects,
  [GHSA-7g68-fr34-x4cf](https://github.com/advisories/GHSA-7g68-fr34-x4cf)
  and [GHSA-cpj6-fhp6-mr6j](https://github.com/advisories/GHSA-cpj6-fhp6-mr6j)),
  and `esbuild` to ^0.28.0 (build tooling). Adds pnpm overrides to pull
  in patched versions of `terminal-image`, `@xmldom/xmldom`, and force
  `jimp` to 1.6.0 (1.6.1 has a broken browser bundle).

## 0.0.8

### Patch Changes

- [`0bcb144`](https://github.com/TooTallNate/switch-nsp-forwarder/commit/0bcb14428d59f77ab08f1ac0f9191a8a8521a6f3) Thanks [@TooTallNate](https://github.com/TooTallNate)! - Rebuild forwarder ROM with NRO exit fix. Pressing **+** in a forwarded
  NRO now cleanly returns to the HOME menu instead of reloading the NRO
  in an infinite loop. Fixes [#29](https://github.com/TooTallNate/switch-nsp-forwarder/issues/29).
