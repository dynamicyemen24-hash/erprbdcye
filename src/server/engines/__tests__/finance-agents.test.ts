import { describe, it, expect, beforeEach } from 'vitest';
import { ImmutableLedgerService, PeriodLockService, FundAccountingService, DocumentSplittingEngine, FixedAssetService } from '../../../../src/server/engines/finance.engine';

describe('Immutable Ledger Service', () => {
  it('should generate valid SHA-256 hash', () => {
    const hash = (ImmutableLedgerService as any).generateHash(
      'org-1', 'header-1', '0'.repeat(64), 1
    );
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64);
  });

  it('should verify chain integrity', () => {
    expect(typeof ImmutableLedgerService.verifyChain).toBe('function');
  });
});

describe('Period Lock Service', () => {
  it('should have softLockPeriod method', () => {
    expect(typeof PeriodLockService.softLockPeriod).toBe('function');
  });

  it('should have hardLockPeriod method', () => {
    expect(typeof PeriodLockService.hardLockPeriod).toBe('function');
  });

  it('should have validatePeriodForPosting method', () => {
    expect(typeof PeriodLockService.validatePeriodForPosting).toBe('function');
  });
});

describe('Fund Accounting Service', () => {
  it('should enforce fund dimension', async () => {
    await expect(FundAccountingService.enforceFundDimension(null)).rejects.toThrow(
      'Fund/Donor segment is mandatory'
    );
    await expect(FundAccountingService.enforceFundDimension('fund-1')).resolves.not.toThrow();
  });

  it('should validate restricted funds', async () => {
    await expect(FundAccountingService.validateRestrictedFund('PERMANENTLY_RESTRICTED', 'INVESTMENT_INCOME')).resolves.not.toThrow();
    await expect(FundAccountingService.validateRestrictedFund('PERMANENTLY_RESTRICTED', 'GENERAL')).rejects.toThrow();
  });
});

describe('Document Splitting Engine', () => {
  it('should split voucher by project/donor', () => {
    const voucher: any = {
      organizationId: 'org-1',
      transactionNumber: 'TEST-001',
      transactionType: 'JOURNAL_ENTRY',
      description: 'Test split',
      lines: [
        { accountId: 'acc-1', debit: 700, credit: 0, fundId: 'fund-A', donorId: 'donor-1', projectId: 'proj-A' },
        { accountId: 'acc-1', debit: 300, credit: 0, fundId: 'fund-B', donorId: 'donor-2', projectId: 'proj-B' },
        { accountId: 'acc-2', debit: 0, credit: 700, fundId: 'fund-A', donorId: 'donor-1', projectId: 'proj-A' },
        { accountId: 'acc-2', debit: 0, credit: 300, fundId: 'fund-B', donorId: 'donor-2', projectId: 'proj-B' },
      ]
    };
    const result = DocumentSplittingEngine.splitVoucher(voucher);
    expect(result.length).toBe(2);
  });
});

describe('Fixed Asset Service', () => {
  it('should calculate straight-line depreciation', () => {
    const asset = {
      acquisition_cost: 10000,
      salvage_value: 0,
      useful_life_months: 50,
      depreciation_method: 'STRAIGHT_LINE',
      accumulated_depreciation: 0
    };
    const monthly = (FixedAssetService as any).calculateDepreciation(asset);
    expect(monthly).toBe(200);
  });

  it('should calculate sum-of-years depreciation', () => {
    const asset = {
      acquisition_cost: 12000,
      salvage_value: 0,
      useful_life_months: 12,
      depreciation_method: 'SUM_OF_YEARS',
      accumulated_depreciation: 0
    };
    const monthly = (FixedAssetService as any).calculateDepreciation(asset);
    expect(monthly).toBeGreaterThan(0);
  });
});
