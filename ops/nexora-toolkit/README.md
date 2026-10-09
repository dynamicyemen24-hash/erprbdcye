# NexoraOps — DB verification & production readiness toolkit

Env-based ops scripts for checking a cloud Postgres database and the
offline-first schema. No hardcoded secrets: copy `.env.example` to `.env`.

## Setup

```sh
cp .env.example .env   # then set DATABASE_URL
npm install
```

Requires Node >= 18.

## Scripts

| Script                    | Needs            | Purpose                                   |
| ------------------------- | ---------------- | ----------------------------------------- |
| `npm test`                | nothing          | offline regression guard (no secrets)     |
| `npm run db:check`        | `DATABASE_URL`   | test connection, list cloud tables        |
| `npm run db:critical`     | `DATABASE_URL`   | columns of critical offline/sync tables   |
| `npm run db:indexes`      | schema files     | required performance indexes present      |
| `npm run schema:compare`  | both             | cloud vs local schema drift               |
| `npm run verify:quick`    | schema files     | offline-first columns (4 checks)          |
| `npm run verify:detailed` | schema files     | index + constraint coverage               |
| `npm run verify:final`    | schema files     | NEB domains + production readiness        |
| `npm run verify:production` | schema files   | full readiness report with score          |
| `npm run health:live`     | network          | probe production site (no DB needed)      |
| `npm run security:scan`   | nothing          | fail on hardcoded secrets                 |
| `npm run ci`              | schema files     | `security:scan && verify:final`           |

All verification scripts exit non-zero when any check fails, so they are
safe to use in CI.

## Schema paths

The two schema files used by the verification scripts are vendored in
[`schemas/`](schemas/) (`initial_schema.ts` and
`enterprise_schema_completion.ts`), so every check runs fully offline and
reproducibly in CI — no dependency on an external project path.

Resolution order (in `config.js`):

1. `LOCAL_SCHEMA_PATH` / `COMPLETION_SCHEMA_PATH` env var, if set (see
   `.env.example`) — live source of truth wins;
2. vendored copy in `schemas/` (default for offline/CI runs);
3. legacy absolute path `D:/projects26/NexoraOS/src/server/database/...`
   as last-resort fallback.

If an env var is set but the file is missing, the script exits non-zero.
If no candidate exists at all, the script exits non-zero.
