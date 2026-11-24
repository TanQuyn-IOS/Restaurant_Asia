import { Building2, Crown, Footprints, UserCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatVnd } from '@/lib/format';
import { CUSTOMER_GROUP_META } from '@/lib/labels';
import type { CustomerGroupType } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import type { CustomerFilterKey } from '../customerHelpers';

interface CustomerGroupBentoProps {
  counts: Record<CustomerFilterKey, number>;
  corporateCount: number;
  totalDeposits: number;
  vipDiamondCount: number;
  vipGoldCount: number;
  activeGroup: CustomerFilterKey;
  onSelectGroup: (group: CustomerFilterKey) => void;
}

/**
 * Thanh tóm tắt Bento bất đối xứng (5 / 4 / 3-xếp tầng) cho 4 nhóm khách hàng chuẩn MOD-02.
 * Bấm vào từng khối để lọc nhanh danh bạ bên dưới.
 */
export function CustomerGroupBento({
  counts,
  corporateCount,
  totalDeposits,
  vipDiamondCount,
  vipGoldCount,
  activeGroup,
  onSelectGroup,
}: CustomerGroupBentoProps) {
  const toggle = (group: CustomerGroupType) => {
    onSelectGroup(activeGroup === group ? 'ALL' : group);
  };

  const doanMeta = CUSTOMER_GROUP_META.Doan;
  const vipMeta = CUSTOMER_GROUP_META.VIP;
  const thuongMeta = CUSTOMER_GROUP_META.Thuong;
  const vangLaiMeta = CUSTOMER_GROUP_META.VangLai;

  return (
    <section aria-label="Phân khúc 4 nhóm khách hàng" className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Khối chính (5/12): Khách Đoàn & Tiệc sự kiện (VAT + Đặt cọc) */}
      <button
        type="button"
        aria-pressed={activeGroup === 'Doan'}
        onClick={() => toggle('Doan')}
        className={cn(
          'flex flex-col justify-between rounded-lg border bg-paper p-5 text-left shadow-card transition-colors hover:bg-paper-warm lg:col-span-5',
          activeGroup === 'Doan' ? 'border-primary ring-2 ring-primary/20' : 'border-line',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <Badge tone={doanMeta.tone} icon={<Building2 size={12} aria-hidden />}>
              {doanMeta.label}
            </Badge>
            <p className="text-sm font-medium text-ink">
              Pháp nhân doanh nghiệp, tiệc ghép bàn & hóa đơn VAT 8%
            </p>
          </div>
          <span className="t-metric text-ink">{String(counts.Doan).padStart(2, '0')}</span>
        </div>

        <p className="mt-3 text-xs text-ink-muted">{doanMeta.hint}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs">
          <span className="text-ink-muted">
            Hồ sơ pháp nhân VAT:{' '}
            <strong className="num font-medium text-ink">{corporateCount} công ty</strong>
          </span>
          <span className="text-ink-muted">
            Tổng tiền cọc giữ bàn:{' '}
            <strong className="num font-medium text-primary">{formatVnd(totalDeposits)}</strong>
          </span>
        </div>
      </button>

      {/* Khối nổi bật (4/12): Khách VIP — Gold / Diamond */}
      <button
        type="button"
        aria-pressed={activeGroup === 'VIP'}
        onClick={() => toggle('VIP')}
        className={cn(
          'flex flex-col justify-between rounded-lg border bg-gold-soft/55 p-5 text-left shadow-card transition-colors hover:bg-gold-soft lg:col-span-4',
          activeGroup === 'VIP' ? 'border-gold ring-2 ring-gold/30' : 'border-gold/40',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <Badge tone={vipMeta.tone} icon={<Crown size={12} aria-hidden />}>
              {vipMeta.label}
            </Badge>
            <p className="text-sm font-medium text-ink">Chiết khấu 10%–15% & ưu tiên KDS</p>
          </div>
          <span className="t-metric text-ink">{String(counts.VIP).padStart(2, '0')}</span>
        </div>

        <p className="mt-3 text-xs text-ink-soft">{vipMeta.hint}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gold/30 pt-3 text-xs text-gold-ink">
          <span className="num font-medium">{vipDiamondCount} Kim cương (15%)</span>
          <span aria-hidden>·</span>
          <span className="num font-medium">{vipGoldCount} Vàng (10%)</span>
        </div>
      </button>

      {/* Cột xếp tầng gọn (3/12): Khách thường + Khách vãng lai */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1">
        <button
          type="button"
          aria-pressed={activeGroup === 'Thuong'}
          onClick={() => toggle('Thuong')}
          className={cn(
            'flex flex-col justify-between rounded-lg border bg-paper px-4 py-3.5 text-left shadow-card transition-colors hover:bg-paper-warm',
            activeGroup === 'Thuong' ? 'border-info ring-2 ring-info/20' : 'border-line',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Badge tone={thuongMeta.tone} size="sm" icon={<UserCheck size={12} aria-hidden />}>
              {thuongMeta.label}
            </Badge>
            <span className="t-metric-sm text-ink">{String(counts.Thuong).padStart(2, '0')}</span>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {thuongMeta.hint} · Silver giảm 5%
          </p>
        </button>

        <button
          type="button"
          aria-pressed={activeGroup === 'VangLai'}
          onClick={() => toggle('VangLai')}
          className={cn(
            'flex flex-col justify-between rounded-lg border bg-paper-warm px-4 py-3.5 text-left shadow-card transition-colors hover:bg-sunken/70',
            activeGroup === 'VangLai' ? 'border-ink ring-2 ring-ink/15' : 'border-line',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Badge tone={vangLaiMeta.tone} size="sm" icon={<Footprints size={12} aria-hidden />}>
              {vangLaiMeta.label}
            </Badge>
            <span className="t-metric-sm text-ink">{String(counts.VangLai).padStart(2, '0')}</span>
          </div>
          <p className="mt-2 text-xs text-ink-muted">{vangLaiMeta.hint}</p>
        </button>
      </div>
    </section>
  );
}
