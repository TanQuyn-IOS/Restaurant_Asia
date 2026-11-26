import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, QrCode, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { TABLE_STATUS_CARD, TableStatusBadge } from '@/components/domain/badges';
import { QrBrandMark } from './components/QrBrandMark';

/** Trang chọn bàn mô phỏng quét mã QR in tại bàn (/qr) — tách hoàn toàn khỏi khu vực nhân viên. */
export function QrEntryPage() {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const initRealtimeSync = useRestaurantStore((s) => s.initRealtimeSync);

  useEffect(() => {
    void initRealtimeSync();
  }, [initRealtimeSync]);

  const groupedZones = useMemo(() => {
    return snapshot.tbl_khu_vuc
      .map((zone) => ({
        zone,
        tables: snapshot.tbl_ban.filter((b) => b.ma_khu_vuc === zone.ma_khu_vuc),
      }))
      .filter((group) => group.tables.length > 0);
  }, [snapshot.tbl_khu_vuc, snapshot.tbl_ban]);

  const servingCount = useMemo(
    () => snapshot.tbl_ban.filter((b) => b.trang_thai_ban === 'DangPhucVu').length,
    [snapshot.tbl_ban],
  );

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Đầu trang giấy dó kết hợp dải than chì nhấn thương hiệu */}
      <header className="border-b border-chrome-line bg-chrome text-chrome-ink">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <QrBrandMark />
            <div>
              <p className="t-brand text-white">Atelier d&apos;Asie</p>
              <p className="mt-0.5 text-xs text-chrome-muted">Thực đơn QR tại bàn</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-chrome-line bg-chrome-raised px-3.5 py-1.5 text-xs text-chrome-ink">
            <QrCode size={14} aria-hidden className="text-gold-bright" />
            <span className="num">{servingCount}</span> bàn đang phục vụ
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="border-b border-cream-line pb-7">
          <h1 className="t-page text-ink">Chọn bàn để mở thực đơn</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
            Chạm vào một bàn bên dưới để xem thực đơn và gọi món như khách tại bàn.
          </p>
        </section>

        {/* Danh sách bàn nhóm theo khu vực */}
        <div className="mt-8 space-y-8">
          {groupedZones.map(({ zone, tables }) => (
            <section
              key={zone.ma_khu_vuc}
              aria-labelledby={`qr-zone-${zone.ma_khu_vuc}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2
                    id={`qr-zone-${zone.ma_khu_vuc}`}
                    className="t-display text-ink"
                  >
                    {zone.ten_khu_vuc}
                  </h2>
                  {zone.mo_ta && (
                    <p className="mt-1 text-xs text-ink-muted">{zone.mo_ta}</p>
                  )}
                </div>
                <span className="num text-xs text-ink-muted">
                  {tables.length} bàn
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tables.map((ban) => (
                  <Link
                    key={ban.ma_ban}
                    to={`/qr/${encodeURIComponent(ban.ma_ban)}`}
                    className={cn(
                      'group flex min-h-28 flex-col justify-between rounded-xl border border-cream-line border-t-2 bg-paper p-4 shadow-card transition-colors hover:border-line-strong hover:bg-paper-warm',
                      TABLE_STATUS_CARD[ban.trang_thai_ban],
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {ban.ten_ban}
                        </p>
                        <p className="num mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-muted">
                          <Users size={12} aria-hidden />
                          {ban.so_ghe} ghế
                          {ban.ma_ban_chinh && (
                            <span className="text-gold-ink">
                              · Ghép {ban.ma_ban_chinh}
                            </span>
                          )}
                        </p>
                      </div>

                      <TableStatusBadge
                        status={ban.trang_thai_ban}
                        className="shrink-0"
                      />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-cream-line pt-2.5 text-xs">
                      <span className="num inline-flex items-center gap-1.5 text-ink-muted">
                        <QrCode size={13} aria-hidden className="text-gold-ink" />
                        /qr/{ban.ma_ban}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-primary">
                        Mở thực đơn
                        <ArrowRight
                          size={14}
                          aria-hidden
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-cream-line bg-paper-warm">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 px-4 py-5 text-center text-xs text-ink-muted sm:px-6">
          <Lock size={13} aria-hidden className="shrink-0 text-gold-ink" />
          <span>Mỗi mã QR gắn cố định theo một bàn tại Atelier d&apos;Asie.</span>
        </div>
      </footer>
    </div>
  );
}
