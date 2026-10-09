# Vendored schema snapshot

This directory is a vendored snapshot of the two schema files used by the
verification scripts, copied from the live source of truth at
`D:/projects26/NexoraOS/src/server/database/`:

- `initial_schema.ts` — base tables for the 15 NEB domains
- `enterprise_schema_completion.ts` — enterprise completion layer (sync, funding, revenue, procurement)

Keeping them in-repo makes every verification script (`verify:final`,
`verify:detailed`, `db:indexes`, `schema:compare`, ...) run fully offline and
reproducibly in CI, with no dependency on the external project path.

Path resolution order (see `config.js`): an explicit env var
(`LOCAL_SCHEMA_PATH` / `COMPLETION_SCHEMA_PATH`) always wins; otherwise the
vendored copy here is used; the legacy absolute path is the last-resort
fallback. Refresh this snapshot whenever the upstream schemas change.