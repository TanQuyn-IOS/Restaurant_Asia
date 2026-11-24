import { CreditCard, ShieldCheck, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDateVi, formatVnd, formatVndCompact } from '@/lib/format';
import type { NhaCungCap } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardFooter } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Misc';
import { shortSupplierName } from '../financeHelpers';

interface SupplierBalanceCardProps {
  suppliers: NhaCungCap[];
  totalSupplierDebt: number;
  latestReceiptBySupplier: Map<string, { ma: string; ngay: string }>;
}

export function SupplierBalanceCard({
  suppliers,
  totalSupplierDebt,
  latestReceiptBySupplier,
}: SupplierBalanceCardProps) {
  return (
    <Card className="flex flex-col xl:col-span-4">
      <CardBody className="flex-1 space-y-5">
        <div className="flex items-start gap-3.5">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-lg bg-gold-soft text-gold-ink"
          >
            <Wallet size={20} />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">Công nợ nhà cung cấp</p>
            <p className="t-metric-sm mt-1 text-ink">{formatVnd(totalSupplierDebt)}</p>
          </div>
        </div>

        <p className="text-xs text-ink-muted">
          Dư nợ hiện tại phát sinh từ các phiếu nhập nguyên liệu chưa thanh toán đủ.
        </p>

        <ul className="divide-y divide-line border-y border-line">
          {suppliers.map((ncc) => {
            const shortName = shortSupplierName(ncc.ten_nha_cung_cap);
            const latestReceipt = latestReceiptBySupplier.get(ncc.ma_nha_cung_cap);
            return (
              <li
                key={ncc.ma_nha_cung_cap}
                className="flex items-start justify-between gap-3 py-3.5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar name={shortName} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{shortName}</p>
                    <p className="num mt-0.5 text-xs text-ink-muted">
                      {latestReceipt
                        ? `Phiếu ${latestReceipt.ma} · ${formatDateVi(latestReceipt.ngay)}`
                        : ncc.nguoi_lien_he}
                    </p>
                    {ncc.so_tai_khoan && (
                      <p className="num truncate text-xs text-ink-muted">{ncc.so_tai_khoan}</p>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    'num shrink-0 text-sm font-medium',
                    Number(ncc.cong_no_hien_tai) > 0 ? 'text-ink' : 'text-st-empty-ink',
                  )}
                >
                  {formatVndCompact(ncc.cong_no_hien_tai)}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="space-y-2">
          <Button
            variant="secondary"
            block
            disabled
            icon={<CreditCard size={15} />}
            aria-describedby="pay-debt-disabled-note"
          >
            Ghi nhận thanh toán công nợ
          </Button>
          <p id="pay-debt-disabled-note" className="text-xs text-ink-muted">
            Nghiệp vụ tất toán công nợ tách rời chưa được mở ở phiên bản store hiện tại — vui lòng
            ghi nhận số tiền trả ngay khi lập phiếu nhập hàng mới.
          </p>
        </div>
      </CardBody>

      <CardFooter className="text-xs text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck size={14} aria-hidden className="text-st-empty-ink" />
          Tự động cập nhật từ phiếu nhập hàng (UC-12)
        </span>
      </CardFooter>
    </Card>
  );
}
