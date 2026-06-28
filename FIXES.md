# FIXES — txaptfinder-map

Prioritized cleanup plan derived from `.claude/audits/audit-report.md` (read-only recon).
**Nothing here is applied yet.** Execute one at a time.

> Shares structure with houston-apartment-locator-search-engine — same duplicate-bootstrap and DB-pair patterns.

## P1 — Safe (verified intra-repo)
1. **Remove confirmed-unused exports / de-export:**
   - `shared/_core/errors.ts` :: `HttpError`, `BadRequestError`, `UnauthorizedError`, `NotFoundError` — risk low.
   - `server/db.ts:9 :: getDb` — drop `export` only (1 internal ref). Risk low.
   - `server/propertyDatabase.ts:361 :: getPropertyDatabaseStats` — verified 1 ref. Risk low.
   - ⚠️ `AppRouter` (`server/routers.ts:225`) — likely **FALSE POSITIVE** (tRPC client type). Verify `client` import before any action; default = keep.
   - drizzle schema types (`Favorite`, `InsertFavorite`, `Inquiry`, `favorites` table) — likely used by drizzle codegen/migrations. **Low confidence — leave unless confirmed.**

## P2 — Dedup (medium risk)
2. **Resolve duplicate server bootstrap:** `server/_core/index.ts` (49-129, 158-226) ↔ `server/index.ts` (22-100, 106-174), ~848 tokens. One is a stale forked entrypoint.
   - Determine canonical entry from `package.json`, delete/thin the other. Risk: **medium-high**. Verify boot before/after. **AskUserQuestion if ambiguous.**
3. **Extract `propertyDatabase.ts:128-178` ↔ `rentcastDatabase.ts:136-186`** (303 tokens) into shared DB helper. Risk: medium. Test-first.
4. Shared test fixtures (`favorites.test.ts` / `inquiries.test.ts` / `routers.ts`) → common helper. Risk: low.

## P3 — Complexity (test-first)
5. **`client/src/pages/ComponentShowcase.tsx`** (1,437 lines, 1,262-line fn) — confirm if used; **delete if dead**, else decompose.
6. **`client/src/pages/ApartmentSearch.tsx`** (1,055 lines, 813-line fn) — decompose into sub-components/hooks. Tests first. Risk: high.
7. Deep nesting `client/src/components/HomeMapView.tsx:191` (8), `server/routers.ts:163` (8) — flatten. Test-first.

## Hygiene / lower priority
8. Review root one-off script `patch_txaptfinder_contact_form.mjs` — likely a completed one-shot patch; delete if so. Low risk.

## Caveats
- knip "120 unused files / 54 unused deps" are **false positives** (no node_modules → flagged react/App.tsx). Re-run after `pnpm install` for a trustworthy file/dep audit.
- 25/45 jscpd clones are inside `data/rentcast-cache.json` (generated) — ignore.
- `client/src/components/ui/*` vendored shadcn — exclude.
