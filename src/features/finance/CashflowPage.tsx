import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Download,
  Landmark,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatClock, formatDateVi, formatVnd, formatVndCompact } from '@/lib/format';
import { CASHFLOW_META } from '@/lib/labels';
import { useRestaurantStore, verifyRbacPermission } from '@/store/useRestaurantStore';
import type { CashflowType } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardFooter, CardHeader, StatCard } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Form';
import { EmptyState, Table, Td, Th, Tr } from '@/components/ui/Misc';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { OwnerGuardCard } from './components/OwnerGuardCard';
import {
  buildFinanceCsv,
  calculateCashflowSummary,
  downloadFinanceCsv,
} from './financeHelpers';

const CASHFLOW_TYPES = Object.keys(CASHFLOW_META) as CashflowType[];

export function CashflowPage() {
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const ledger = useRestaurantStore((s) => s.snapshot.tbl_so_quy_dong_tien);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CashflowType | 'ALL'>('ALL');
  const [fundFilter, setFundFilter] = useState<'ALL' | 'TienMat' | 'TaiKhoanNganHang'>('ALL');

  const accessCheck = verifyRbacPermission(currentRole, 'VIEW_CASHFLOW');

  const summary = useMemo(() => calculateCashflowSummary(ledger), [ledger]);

  const filteredLedger = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...ledger]
      .sort((a, b) => b.ngay_ghi_so.localeCompare(a.ngay_ghi_so))
      .filter((tx) => {
        if (typeFilter !== 'ALL' && tx.loai_thu_chi !== typeFilter) return false;
        if (fundFilter !== 'ALL' && tx.hinh_thuc_quy !== fundFilter) return false;
        if (!q) return true;
        const meta = CASHFLOW_META[tx.loai_thu_chi];
        return (
          tx.ma_giao_dich_quy.toLowerCase().includes(q) ||
          (tx.dien_giai ?? '').toLowerCase().includes(q) ||
          (tx.ma_chung_tu_goc ?? '').toLowerCase().includes(q) ||
          meta.label.toLowerCase().includes(q)
        );
      });
  }, [ledger, searchQuery, typeFilter, fundFilter]);

  const filteredNet = useMemo(
    () =>
      filteredLedger.reduce((sum, tx) => {
        const dir = CASHFLOW_META[tx.loai_thu_chi].direction;
        return sum + (dir === 'in' ? Number(tx.so_tien) : -Number(tx.so_tien));
      }, 0),
    [filteredLedger],
  );

  if (!accessCheck.allowed) {
    return <OwnerGuardCard message={accessCheck.message ?? 'Không đủ quyền truy cập sổ quỹ.'} />;
  }

  const handleExportCsv = () => {
    const headers = [
      'Mã giao dịch',
      'Thời gian',
      'Loại thu / chi',
      'Hình thức quỹ',
      'Chứng từ gốc',
      'Diễn giải',
      'Số tiền (VND)',
      'Số dư sau GD (VND)',
    ];
    const rows = filteredLedger.map((tx) => {
      const meta = CASHFLOW_META[tx.loai_thu_chi];
      const signed = meta.direction === 'in' ? tx.so_tien : -tx.so_tien;
      return [
        tx.ma_giao_dich_quy,
        tx.ngay_ghi_so,
        meta.label,
        tx.hinh_thuc_quy === 'TienMat' ? 'Tiền mặt' : 'Tài khoản ngân hàng',
        tx.ma_chung_tu_goc ?? '',
        tx.dien_giai ?? '',
        signed,
        tx.so_du_quy_sau_gd,
      ];
    });
    downloadFinanceCsv('so-quy-dong-tien-2026-11.csv', buildFinanceCsv(headers, rows));
  };

  const hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'ALL' || fundFilter !== 'ALL';

  return (
    <PageBody>
      <PageHeader
        eyebrow="CHỦ NHÀ HÀNG · MOD-08"
        title="Sổ quỹ dòng tiền"
        description="Giám sát toàn bộ dòng tiền thu vào, chi ra, số dư tiền mặt – ngân hàng và lãi/lỗ ròng theo thời gian thực."
        actions={
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            onClick={handleExportCsv}
            disabled={filteredLedger.length === 0}
          >
            Xuất sổ quỹ CSV
          </Button>
        }
      />

      {/* 4 KPI Cards (mockup 08) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Số dư tiền mặt"
          value={formatVndCompact(summary.cashBalance)}
          hint={`Thu ${formatVndCompact(summary.cashIn)} · Chi ${formatVndCompact(summary.cashOut)}`}
          hintTone={summary.cashBalance >= 0 ? 'success' : 'danger'}
          tone="success"
          icon={<Wallet size={18} />}
        />
        <StatCard
          label="Số dư ngân hàng"
          value={formatVndCompact(summary.bankBalance)}
          hint={
            summary.lastRecordedAt
              ? `Cập nhật ${formatClock(summary.lastRecordedAt)} · Tổng quỹ ${formatVndCompact(summary.totalBalance)}`
              : 'Chưa có giao dịch'
          }
          tone="neutral"
          icon={<Landmark size={18} />}
        />
        <StatCard
          label="Dòng tiền ròng"
          value={`${summary.netCashflow >= 0 ? '+' : ''}${formatVndCompact(summary.netCashflow)}`}
          hint={`Thu ${formatVndCompact(summary.totalInflow)} · Chi ${formatVndCompact(summary.totalOutflow)}`}
          hintTone={summary.netCashflow >= 0 ? 'success' : 'danger'}
          tone="success"
          icon={<Activity size={18} />}
        />
        <StatCard
          label="Lãi / Lỗ ròng"
          value={`${summary.netProfit >= 0 ? '+' : ''}${formatVndCompact(summary.netProfit)}`}
          hint={`Biên LN ${summary.profitMarginPct}% · không gồm tiền cọc giữ chỗ`}
          hintTone={summary.netProfit >= 0 ? 'gold' : 'danger'}
          tone="gold"
          icon={<TrendingUp size={18} />}
        />
      </div>

      {/* Sổ cái dòng tiền (mockup 08) */}
      <Card>
        <CardHeader
          title="Sổ cái dòng tiền"
          subtitle="Toàn bộ giao dịch đã ghi nhận · Đơn vị VND"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search
                  size={15}
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
                />
                <Input
                  aria-label="Tìm giao dịch sổ quỹ"
                  placeholder="Tìm giao dịch, mã chứng từ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-xs"
                />
              </div>

              <Select
                aria-label="Lọc theo loại thu chi"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as CashflowType | 'ALL')}
                className="h-9 w-44 text-xs"
              >
                <option value="ALL">Tất cả giao dịch</option>
                {CASHFLOW_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {CASHFLOW_META[type].label}
                  </option>
                ))}
              </Select>

              <Select
                aria-label="Lọc theo hình thức quỹ"
                value={fundFilter}
                onChange={(e) =>
                  setFundFilter(e.target.value as 'ALL' | 'TienMat' | 'TaiKhoanNganHang')
                }
                className="h-9 w-36 text-xs"
              >
                <option value="ALL">Mọi nguồn quỹ</option>
                <option value="TienMat">Tiền mặt</option>
                <option value="TaiKhoanNganHang">Ngân hàng</option>
              </Select>

              <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-paper-warm px-3 text-xs font-medium text-ink-soft">
                <Calendar size={14} aria-hidden className="text-ink-muted" />
                Tháng 11/2026
              </span>
            </div>
          }
        />

        {/* Chú giải 4 chấm theo mockup 08 */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-line px-5 py-3 text-xs text-ink-muted">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full bg-st-empty" />
              Thu tiền cọc
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full bg-st-empty" />
              Thu hóa đơn
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full bg-st-billing" />
              Chi nhập hàng
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full bg-st-serving" />
              Lương & chi phí vận hành
            </span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setFundFilter('ALL');
              }}
              className="font-medium text-primary hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {filteredLedger.length === 0 ? (
          <EmptyState
            icon={<Wallet size={22} />}
            title="Không tìm thấy giao dịch phù hợp"
            description="Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc loại giao dịch."
            action={
              hasActiveFilters ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('ALL');
                    setFundFilter('ALL');
                  }}
                >
                  Đặt lại bộ lọc
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Giao dịch</Th>
                <Th>Loại</Th>
                <Th>Thời gian</Th>
                <Th>Hình thức</Th>
                <Th className="text-right">Số tiền</Th>
                <Th className="text-right">Số dư sau GD</Th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.map((tx) => {
                const meta = CASHFLOW_META[tx.loai_thu_chi];
                const isIn = meta.direction === 'in';

                return (
                  <Tr key={tx.ma_giao_dich_quy}>
                    <Td>
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden
                          className={cn(
                            'mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg',
                            isIn
                              ? 'bg-st-empty-soft text-st-empty-ink'
                              : 'bg-st-serving-soft text-st-serving-ink',
                          )}
                        >
                          {isIn ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{tx.dien_giai || meta.label}</p>
                          <p className="num mt-0.5 text-xs text-ink-muted">
                            {tx.ma_giao_dich_quy}
                            {tx.ma_chung_tu_goc ? ` · Chứng từ: ${tx.ma_chung_tu_goc}` : ''}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={meta.tone} size="sm">
                        {meta.label}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="num text-ink-soft">
                        {formatDateVi(tx.ngay_ghi_so)} · {formatClock(tx.ngay_ghi_so)}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-ink-soft">
                        {tx.hinh_thuc_quy === 'TienMat' ? 'Tiền mặt' : 'Chuyển khoản NH'}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <span
                        className={cn(
                          'num font-medium',
                          isIn ? 'text-st-empty-ink' : 'text-st-serving-ink',
                        )}
                      >
                        {isIn ? '+' : '−'}
                        {formatVnd(tx.so_tien)}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <span className="num text-ink-muted">{formatVnd(tx.so_du_quy_sau_gd)}</span>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}

        <CardFooter className="flex-wrap text-xs text-ink-muted">
          <span className="num">
            Hiển thị {filteredLedger.length} / {ledger.length} bút toán sổ quỹ
          </span>
          <span className="num font-medium text-ink">
            Chênh lệch bộ lọc: {filteredNet >= 0 ? '+' : '−'}
            {formatVnd(Math.abs(filteredNet))}
          </span>
        </CardFooter>
      </Card>
    </PageBody>
  );
}
