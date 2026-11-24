import { useMemo } from 'react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import type { DatabaseSnapshot, NhanVien, TaiKhoan, VaiTro } from '@/types/database';
import {
  buildRbacMatrix,
  TABLE_3NF_BY_KEY,
  TABLE_3NF_LIST,
  type RbacMatrixRow,
  type Table3nfMeta,
} from './rbacHelpers';

export interface EnrichedAccountRow {
  account: Omit<TaiKhoan, 'mat_khau_hash'>;
  staff: NhanVien | null;
  role: VaiTro | null;
}

export interface TableBrowserSummary {
  meta: Table3nfMeta;
  rowCount: number;
}

export function useRbacData(): {
  matrixRows: RbacMatrixRow[];
  roles: VaiTro[];
  accounts: EnrichedAccountRow[];
  tableSummaries: TableBrowserSummary[];
  totalRecords: number;
} {
  const snapshot = useRestaurantStore((s) => s.snapshot);

  return useMemo(() => {
    const staffById = new Map(snapshot.tbl_nhan_vien.map((nv) => [nv.ma_nhan_vien, nv]));
    const rolesById = new Map(snapshot.tbl_vai_tro.map((vt) => [vt.ma_vai_tro, vt]));

    // Tách bỏ hoàn toàn trường mat_khau_hash trước khi truyền xuống tầng UI
    const accounts: EnrichedAccountRow[] = snapshot.tbl_tai_khoan.map(
      ({ mat_khau_hash: _hiddenHash, ...safeAccount }) => ({
        account: safeAccount,
        staff: staffById.get(safeAccount.ma_nhan_vien) ?? null,
        role: rolesById.get(safeAccount.ma_vai_tro) ?? null,
      }),
    );

    const snapshotKeys = Object.keys(snapshot) as (keyof DatabaseSnapshot)[];
    const tableSummaries: TableBrowserSummary[] = snapshotKeys.map((key) => {
      const meta = TABLE_3NF_BY_KEY.get(key) ?? {
        key,
        label: key,
        moduleCode: '3NF',
      };
      const rows = snapshot[key] as unknown[];
      return { meta, rowCount: Array.isArray(rows) ? rows.length : 0 };
    });

    // Giữ thứ tự chuẩn theo TABLE_3NF_LIST nếu đủ khóa
    const orderIndex = new Map(TABLE_3NF_LIST.map((t, i) => [t.key, i]));
    tableSummaries.sort(
      (a, b) => (orderIndex.get(a.meta.key) ?? 999) - (orderIndex.get(b.meta.key) ?? 999),
    );

    const totalRecords = tableSummaries.reduce((sum, item) => sum + item.rowCount, 0);

    return {
      matrixRows: buildRbacMatrix(),
      roles: snapshot.tbl_vai_tro,
      accounts,
      tableSummaries,
      totalRecords,
    };
  }, [snapshot]);
}
