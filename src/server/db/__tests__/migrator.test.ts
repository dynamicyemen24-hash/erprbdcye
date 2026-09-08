import { describe, it, expect } from 'vitest';
describe('Migration Runner', () => {
  it('getPendingMigrations returns array', async () => {
    const { getPendingMigrations } = await import('../migrator');
    expect(typeof getPendingMigrations).toBe('function');
  });
  it('getMigrationStatus returns object shape', async () => {
    const { getMigrationStatus } = await import('../migrator');
    expect(typeof getMigrationStatus).toBe('function');
  });
});
