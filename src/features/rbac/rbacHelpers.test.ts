import { describe, expect, it } from 'vitest';
import { INITIAL_DATABASE_SNAPSHOT } from '@/data/seedData';
import type { DatabaseSnapshot } from '@/types/database';
import {
  buildRbacMatrix,
  canResetSeedData,
  formatSchemaCell,
  isResetConfirmValid,
  isTableRestrictedForRole,
  MASKED_SECRET,
  paginateRecords,
  TABLE_3NF_LIST,
} from './rbacHelpers';

describe('MOD-10 rbacHelpers', () => {
  it('covers all 27 3NF tables in TABLE_3NF_LIST matching DatabaseSnapshot keys', () => {
    const snapshotKeys = Object.keys(INITIAL_DATABASE_SNAPSHOT) as (keyof DatabaseSnapshot)[];
    expect(TABLE_3NF_LIST).toHaveLength(27);
    expect(new Set(TABLE_3NF_LIST.map((t) => t.key))).toEqual(new Set(snapshotKeys));
  });

  it('derives FR-17 (Cashier Read-Only) and FR-19 (Manager blocked from Cashflow/Inventory) in matrix', () => {
    const matrix = buildRbacMatrix();

    const cashierEditRow = matrix.find((r) => r.id === 'mod-06-edit');
    expect(cashierEditRow?.cells.Cashier.access).toBe('blocked403');
    expect(cashierEditRow?.cells.Cashier.ruleTag).toBe('FR-17');

    const cashflowRow = matrix.find((r) => r.id === 'mod-08-cashflow');
    expect(cashflowRow?.cells.Owner.access).toBe('full');
    expect(cashflowRow?.cells.Manager.access).toBe('blocked403');
    expect(cashflowRow?.cells.Manager.ruleTag).toBe('FR-19');

    const inventoryRow = matrix.find((r) => r.id === 'mod-08-inventory');
    expect(inventoryRow?.cells.Owner.access).toBe('full');
    expect(inventoryRow?.cells.Manager.access).toBe('blocked403');
  });

  it('restricts resetAllDataToSeed strictly to Owner and requires exact XOA confirmation', () => {
    expect(canResetSeedData('Owner')).toBe(true);
    expect(canResetSeedData('Manager')).toBe(false);
    expect(canResetSeedData('Waitstaff')).toBe(false);
    expect(canResetSeedData('Cashier')).toBe(false);
    expect(canResetSeedData('Kitchen')).toBe(false);
    expect(canResetSeedData('HR')).toBe(false);

    expect(isResetConfirmValid('XOA')).toBe(true);
    expect(isResetConfirmValid('  XOA  ')).toBe(true);
    expect(isResetConfirmValid('xoa')).toBe(false);
    expect(isResetConfirmValid('XO')).toBe(false);
    expect(isResetConfirmValid('')).toBe(false);
  });

  it('always masks mat_khau_hash for every role including Owner, and masks COGS for non-Owner', () => {
    const ownerHashCell = formatSchemaCell(
      'tbl_tai_khoan',
      'mat_khau_hash',
      '$2b$12$acrmsOwnerHash2026',
      'Owner',
    );
    expect(ownerHashCell.masked).toBe(true);
    expect(ownerHashCell.display).toBe(MASKED_SECRET);
    expect(ownerHashCell.tooltip).not.toContain('$2b$');

    const managerCogsCell = formatSchemaCell('tbl_nguyen_lieu', 'don_gia_nhap_bq', 1850000, 'Manager');
    expect(managerCogsCell.masked).toBe(true);

    const ownerCogsCell = formatSchemaCell('tbl_nguyen_lieu', 'don_gia_nhap_bq', 1850000, 'Owner');
    expect(ownerCogsCell.masked).toBe(false);
    expect(ownerCogsCell.display).toBe('1850000');

    expect(isTableRestrictedForRole('tbl_so_quy_dong_tien', 'Manager')).toBe(true);
    expect(isTableRestrictedForRole('tbl_so_quy_dong_tien', 'Owner')).toBe(false);
    expect(isTableRestrictedForRole('tbl_ban', 'Manager')).toBe(false);
  });

  it('paginates records safely at 10 rows per page including empty and out-of-range pages', () => {
    const rows = Array.from({ length: 23 }, (_, i) => i + 1);

    const p1 = paginateRecords(rows, 1, 10);
    expect(p1.items).toHaveLength(10);
    expect(p1.totalPages).toBe(3);
    expect(p1.startIndex).toBe(1);
    expect(p1.endIndex).toBe(10);

    const p3 = paginateRecords(rows, 99, 10);
    expect(p3.page).toBe(3);
    expect(p3.items).toEqual([21, 22, 23]);
    expect(p3.startIndex).toBe(21);
    expect(p3.endIndex).toBe(23);

    const empty = paginateRecords([], 1, 10);
    expect(empty.items).toEqual([]);
    expect(empty.totalPages).toBe(1);
    expect(empty.startIndex).toBe(0);
    expect(empty.endIndex).toBe(0);
  });
});
