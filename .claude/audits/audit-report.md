# Audit Report — txaptfinder-map
_Generated 2026-06-28. Read-only reconnaissance. Tools: jscpd, knip, custom complexity heuristic._

## Summary
- Lines of source scanned: ~18,559 (`.ts/.tsx/.js/.jsx` across `client/`, `server/`, `shared/`, `drizzle/`, excluding `*.d.ts` and `node_modules`)
- Duplication: 6.7% overall (45 clones / 1,437 dup lines per jscpd over all formats); **12 TS + 1 JS + 7 TSX = 20 code clones** (the remaining 25 clones are repetition inside `data/rentcast-cache.json` data, not code)
- Dead code: knip's "unused files" (120) and "unused dependencies" (54) lists are **unreliable** here because `node_modules` is absent (knip flagged `react`, `react-dom`, `App.tsx`, `main.tsx` etc.). The trustworthy signals are **~6 confirmed unused exports** and **11 unused exported types** (verified intra-repo).
- Complexity hotspots: 20+ functions/files over threshold; worst is a single 1,262-line component function.
- Top 3 highest-impact cleanups:
  1. Eliminate the `server/_core/index.ts` ↔ `server/index.ts` duplication (two ~80-line bootstrap blocks, 453+395 tokens) — appears to be a stale duplicate entry point.
  2. Break up `client/src/pages/ComponentShowcase.tsx` (1,437 lines, one 1,262-line function) and `ApartmentSearch.tsx` (1,055 lines, one 813-line function).
  3. Remove confirmed dead exports/types in `shared/_core/errors.ts`, `server/db.ts`, `server/propertyDatabase.ts`, and the `manusTypes.ts` interfaces.

## Duplication (jscpd)

Top code clone pairs (worst first; JSON-data clones excluded):

| Tokens | File A (lines) | File B (lines) |
|-------:|----------------|----------------|
| 453 | `server/_core/index.ts` 49–129 | `server/index.ts` 22–100 |
| 395 | `server/_core/index.ts` 158–226 | `server/index.ts` 106–174 |
| 303 | `server/propertyDatabase.ts` 128–178 | `server/rentcastDatabase.ts` 136–186 |
| 123 | `server/favorites.test.ts` 69–80 | `server/routers.ts` 87–98 |
| 117 | `server/favorites.test.ts` 68–79 | `server/inquiries.test.ts` 59–74 |
| 113 | `server/favorites.test.ts` 68–79 | `server/inquiries.test.ts` 82–96 |
| 113 | `server/favorites.test.ts` 70–81 | `server/routers.ts` 88–99 |
| 100 | `server/favorites.test.ts` 68–78 | `server/inquiries.test.ts` 36–47 |
| 86 | `client/src/pages/ComponentShowcase.tsx` 566–576 | `client/src/pages/ComponentShowcase.tsx` 605–614 |
| 78 | `client/src/components/ui/input.tsx` 29–53 | `client/src/components/ui/textarea.tsx` 29–53 |

Notable patterns:
- **Duplicate server bootstrap**: `server/_core/index.ts` and `server/index.ts` share two large near-identical blocks (~848 tokens combined). Strongly suggests one is a stale/forked copy.
- **DB layer duplication**: `propertyDatabase.ts` and `rentcastDatabase.ts` share a ~50-line block (303 tokens) — extractable into a shared helper.
- **Test setup duplication**: repeated auth/seed boilerplate across `favorites.test.ts`, `inquiries.test.ts`, and `routers.ts` — candidate for a shared test fixture.
- Raw jscpd JSON: `.claude/audits/jscpd/jscpd-report.json`.

## Dead Code (knip)

Raw knip output: `.claude/audits/knip-raw.txt`.

### Unused files
**Low confidence — likely false positives.** knip reported 120 "unused files," but with `node_modules` absent it could not resolve the module graph and flagged genuine entry points and live code (`client/src/App.tsx`, `client/src/main.tsx`, `react`, `react-dom`). This list should NOT be acted on without re-running knip after `pnpm install`. One plausibly-real item worth manual review: `patch_txaptfinder_contact_form.mjs` (a one-off patch script at repo root) and `client/public/__manus__/debug-collector.js` (vendored debug tooling, 821 lines).

### Unused exports / types
**Medium–high confidence** (intra-repo symbol resolution; a sample was re-verified with ripgrep showing single-file references = definition only):

Unused exports:
- `getDb` (`db`) — `server/db.ts:9` — verified (1 ref)
- `getPropertyDatabaseStats` — `server/propertyDatabase.ts:361` — verified (1 ref)
- `HttpError` — `shared/_core/errors.ts:5`
- `BadRequestError` — `shared/_core/errors.ts:16` — verified (1 ref)
- `UnauthorizedError` — `shared/_core/errors.ts:17`
- `NotFoundError` — `shared/_core/errors.ts:19` — verified (1 ref)
- `favorites` — `drizzle/schema.ts:29`
- `queryPropertyDatabase` — `server/propertyDatabase.ts:366` (lower confidence: 2 file refs)
- `protectedProcedure` — `server/_core/trpc.ts:28` (lower confidence: 2 file refs)

Unused exported types/interfaces:
- `Favorite`, `InsertFavorite` — `drizzle/schema.ts:40–41`
- `Inquiry` — `drizzle/schema.ts:59`
- `SessionPayload`, `AuthenticatedUser` — `server/_core/sdk.ts:21, 316`
- `AuthorizeRequest`, `AuthorizeResponse`, `GetUserInfoRequest`, `CanAccessRequest`, `CanAccessResponse` — `server/_core/types/manusTypes.ts:5–53`
- `AppRouter` — `server/routers.ts:225` (likely a false positive — `AppRouter` is the standard tRPC client type, typically imported by the client via type-only import; verify before removing)

### Unused dependencies
**Low confidence — discard.** knip listed 54 "unused dependencies" and 13 "unused devDependencies" including `react`, `react-dom`, `@tanstack/react-query`, `vite`, `tailwindcss`, `tsx`. These are obviously in use; the result is an artifact of the missing `node_modules` / no knip config. Re-run after install for a real dependency audit.

## Complexity

Worst offenders (`path:line — metric`):

- `client/src/pages/ComponentShowcase.tsx:1` — file is 1,437 lines (>400)
- `client/src/pages/ComponentShowcase.tsx:176` — function spans 1,262 lines (>60)
- `client/src/pages/ApartmentSearch.tsx:1` — file is 1,055 lines (>400)
- `client/src/pages/ApartmentSearch.tsx:243` — function spans 813 lines (>60)
- `client/public/__manus__/debug-collector.js:1` — file is 821 lines (>400) (vendored)
- `client/src/components/HomeMapView.tsx:191` — brace-nesting depth 8 (>5)
- `server/routers.ts:163` — brace-nesting depth 8 (>5)
- `client/src/components/ui/sidebar.tsx:1` — file is 734 lines (>400) (shadcn-generated)
- `client/src/components/ui/chart.tsx:206` — brace-nesting depth 7 (>5) (shadcn-generated)
- `client/src/pages/ApartmentSearch.tsx:1037` — brace-nesting depth 6 (>5)
- `server/rentcastDatabase.ts:1` — file is 588 lines (>400)
- `client/src/components/QualificationPrompt.tsx:62` — function spans 303 lines (>60)
- `client/src/components/ContactForm.tsx:38` — function spans 289 lines (>60)
- `client/src/components/InquiryForm.tsx:16` — function spans 253 lines (>60)
- `client/src/components/AIChatBox.tsx:113` — function spans 223 lines (>60)
- `server/_core/index.ts:31` — function spans 196 lines (>60)
- `client/src/components/HomeMapView.tsx:73` — function spans 195 lines (>60)

(Heuristic script: `.claude/audits/complexity.py`. The large "function spans" counts for page components reflect a single top-level component returning a very large JSX tree; nesting depth uses brace counting so JSX-heavy and module-wrapper files read 1–2 deeper than logical control-flow nesting.)

## Caveats
- **No `node_modules` / no install performed** (per spec). This crippled knip's module-graph resolution, making its "unused files" and "unused dependencies" outputs unreliable. Only unused-exports/types were treated as actionable, and a sample was cross-checked with ripgrep. Re-run `npx knip` after `pnpm install` for a dependable file/dependency audit.
- jscpd's default scan included the data file `data/rentcast-cache.json`; 25 of the 45 reported clones are internal JSON-data repetition, not source code. The 6.7% headline figure includes those; code-only duplication is lower. Code clone pairs in the table exclude JSON.
- Complexity scanner is a brace/regex heuristic, not an AST parser: function-boundary detection can over-count lines for big-JSX React components and nesting depth is brace-based, so treat the numbers as relative severity ranking rather than exact cyclomatic complexity.
- `client/src/components/ui/*` and similar are largely generated shadcn/ui components; flagged size/nesting there is expected and low-priority.
- knip flagged its own raw stderr cleanup noise on the first `npx` invocation (ENOTEMPTY); a clean re-run via `npx --yes knip@latest` produced the parsed results used here.
