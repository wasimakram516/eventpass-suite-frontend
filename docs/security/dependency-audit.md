# Frontend dependency security audit

Audited on 2026-09-27 using the npm advisory service and the complete lockfile, including development and optional dependencies. Validation used Node.js 24.20.0 on Windows.

| Audit | Critical | High | Moderate | Low |
| --- | ---: | ---: | ---: | ---: |
| Before | 1 | 14 | 6 | 1 |
| After | 0 | 0 | 4 | 1 |

The full raw reports are [audit-before.json](audit-before.json) and [audit-after.json](audit-after.json). Counts represent vulnerable dependency entries; individual entries may carry multiple advisories.

## Remediated dependencies

| Dependency | Baseline severity | Previous resolved versions | Patched resolved versions |
| --- | --- | --- | --- |
| axios | high | 1.16.1 | 1.18.1 |
| brace-expansion | high | 1.1.12, 5.0.6 | 1.1.21, 5.0.12 |
| browserslist | high | 4.28.2 | 4.29.1 |
| flatted | high | 3.3.3 | 3.4.4 |
| form-data | high | 4.0.5 | 4.0.6 |
| js-yaml | high | 4.1.0 | 4.3.2 |
| lodash | high | 4.17.21 | 4.18.1 |
| minimatch | high | 10.2.5, 3.1.2 | 10.2.6, 3.1.5 |
| nanoid | high | 3.3.11 | 3.3.19 |
| next | critical | 16.2.6 | 16.3.6 |
| postcss | high | 8.4.31 | 8.5.23 |
| sharp | high | 0.34.5 | 0.35.4 |
| socket.io-parser | high | 4.2.4 | 4.2.7 |
| ws | high | 8.17.1 | 8.21.3 |
| xlsx | high | 0.18.5 | 0.20.3 |

Related dependency changes bundled with these upgrades are recorded in package-lock.json. Packages with only low severity findings were not separately targeted.

## Spreadsheet package with no npm fix

The registry release of xlsx (0.18.5) has no patched release on npm. Both repositories now use the maintained SheetJS Community Edition 0.20.3 tarball from its official distribution: https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz. The dependency is pinned to that archive and the lockfile records its SHA-512 integrity. The existing XLS/XLSX imports and export APIs remain available.

Official [installation instructions](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/) identify the CDN as the supported distribution. Version 0.20.3 exceeds the fixes for [prototype pollution (0.19.3)](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6) and [ReDoS (0.20.2)](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9). No advisory suppression or audit exclusion was added.

## Verification

- `npm run audit:security`: passed; no critical or high severity advisory remains.
- `npm ci --dry-run --ignore-scripts --audit=false`: passed; verifies lockfile consistency without replacing installed packages.
- `npm test`: 117 passed, zero failed or skipped. This now includes the existing shared-services .mjs tests, using the VM flag they require.
- `npm run build`: passed on Next.js 16.3.6 using webpack; all 71 static pages generated.
- Started the production server locally and checked /, /auth/login and /quiznest: HTTP 200, rendered HTML and production asset references present. This is an HTTP smoke check, not a browser interaction or external-service test.
- Added a browser-style ArrayBuffer spreadsheet export regression with Arabic data and multiple sheets.
- Existing ESLint 10 peer warnings from the React/import/accessibility plugins remain during installation; npm exited successfully. Lint configuration cleanup is outside this security ticket.

## Remaining findings

The audit still reports the following lower severity dependencies. None has a critical or high severity finding in the final audit. These were not independently migrated as part of this ticket.

| Dependency | Severity |
| --- | --- |
| @babel/core | low |
| @humanfs/node | moderate |
| dompurify | moderate |
| fflate | moderate |
| yaml | moderate |

Advisory data changes over time; rerun npm run audit:security before deployment. No deployment or real SMTP/payment smoke test was performed.
