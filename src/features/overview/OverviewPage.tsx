import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Boxes,
  CalendarClock,
  ChefHat,
  CreditCard,
  LayoutGrid,
  Lock,
  QrCode,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { DEMO_TODAY } from '@/lib/clock';
import { formatClock, formatVnd, formatVndCompact } from '@/lib/format';
import {
  CASHFLOW_META,
  GUEST_REQUEST_META,
  ROLE_META,
  TABLE_STATUS_META,
} from '@/lib/labels';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardFooter, CardHeader, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ProgressBar } from '@/components/ui/Misc';
import { TONE } from '@/components/ui/tone';

/** Trang Tổng quan (/tong-quan) — thích ứng theo vai trò RBAC, tuyệt đối ẩn tài chính khi không phải Chủ (FR-19). */
export function OverviewPage() {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const selectedTableId = useRestaurantStore((s) => s.selectedTableId);
  const tingNotifications = useRestaurantStore((s) => s.tingNotifications);
  const dismissTingNotification = useRestaurantStore((s) => s.dismissTingNotification);
  const resolveGuestQrRequest = useRestaurantStore((s) => s.resolveGuestQrRequest);

  const isOwner = currentRole === 'Owner';

  const stats = useMemo(() => {
    const tables = snapshot.tbl_ban;
    const empty = tables.filter((b) => b.trang_thai_ban === 'Trong').length;
    const booked = tables.filter((b) => b.trang_thai_ban === 'DaDat').length;
    const serving = tables.filter((b) => b.trang_thai_ban === 'DangPhucVu').length;
    const billing = tables.filter((b) => b.trang_thai_ban === 'ChoThanhToan').length;
    const totalSeats = tables.reduce((sum, b) => sum + b.so_ghe, 0);
    const activeSeats = tables
      .filter((b) => b.trang_thai_ban === 'DangPhucVu' || b.trang_thai_ban === 'ChoThanhToan')
      .reduce((sum, b) => sum + b.so_ghe, 0);

    const kdsWaiting = snapshot.tbl_chi_tiet_don_goi.filter(
      (i) => i.trang_thai_mon === 'ChoCheBien',
    ).length;
    const kdsCooking = snapshot.tbl_chi_tiet_don_goi.filter(
      (i) => i.trang_thai_mon === 'DangCheBien',
    ).length;
    const soldOutDishes = snapshot.tbl_mon_an.filter((m) => m.trang_thai_mon !== 'ConMon');

    const shiftsToday = snapshot.tbl_phan_cong_ca.filter((p) => p.ngay_lam_viec === DEMO_TODAY);
    const onShiftNow = shiftsToday.filter((p) => p.trang_thai_ca === 'DangTruc').length;
    const leavesToday = snapshot.tbl_don_nghi_phep.filter((d) => d.ngay_nghi === DEMO_TODAY);

    const pendingRequests = snapshot.tbl_yeu_cau_khach_hang.filter(
      (r) => r.trang_thai_xu_ly !== 'DaHoanTat',
    );
    const unreadTings = tingNotifications.filter((n) => !n.da_doc);

    // Chỉ tính toán các chỉ số tài chính khi là Chủ nhà hàng (FR-19)
    const paidRevenue = isOwner
      ? snapshot.tbl_hoa_don
          .filter((h) => h.trang_thai_tt === 'DaThanhToan')
          .reduce((sum, h) => sum + Number(h.tong_tien_phai_tra), 0)
      : 0;
    const cashflowEntries = isOwner ? snapshot.tbl_so_quy_dong_tien : [];
    const totalInflow = cashflowEntries
      .filter((c) => CASHFLOW_META[c.loai_thu_chi].direction === 'in')
      .reduce((sum, c) => sum + Number(c.so_tien), 0);
    const totalOutflow = cashflowEntries
      .filter((c) => CASHFLOW_META[c.loai_thu_chi].direction === 'out')
      .reduce((sum, c) => sum + Number(c.so_tien), 0);
    const lowStock = isOwner
      ? snapshot.tbl_nguyen_lieu.filter((n) => n.so_luong_ton_kho < n.nguong_ton_toi_thieu)
      : [];

    return {
      totalTables: tables.length,
      empty,
      booked,
      serving,
      billing,
      totalSeats,
      activeSeats,
      kdsWaiting,
      kdsCooking,
      soldOutDishes,
      shiftsToday,
      onShiftNow,
      leavesToday,
      pendingRequests,
      unreadTings,
      paidRevenue,
      netCashflow: totalInflow - totalOutflow,
      recentCashflow: cashflowEntries.slice(0, 4),
      lowStock,
    };
  }, [snapshot, tingNotifications, isOwner]);

  const tableMap = useMemo(
    () => new Map(snapshot.tbl_ban.map((b) => [b.ma_ban, b])),
    [snapshot.tbl_ban],
  );

  const occupancyPct = stats.totalTables
    ? Math.round(((stats.serving + stats.billing) / stats.totalTables) * 100)
    : 0;

  return (
    <PageBody>
      <PageHeader
        title="Tổng quan"
        description={
          isOwner
            ? 'Tình hình sảnh, bếp, dòng tiền và kho hàng hôm nay.'
            : 'Tình hình bàn, bếp, yêu cầu QR và ca trực hôm nay.'
        }
        actions={
          <>
            <Link
              to={`/qr/${selectedTableId}`}
              target="_blank"
              rel="noopener"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-paper px-4 text-sm font-medium text-ink transition-colors hover:bg-paper-warm"
            >
              <QrCode size={16} aria-hidden />
              Cổng QR
            </Link>
            <Link
              to="/so-do-ban"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <LayoutGrid size={16} aria-hidden />
              Sơ đồ bàn
            </Link>
          </>
        }
      />

      {/* 4 thẻ KPI: Chủ thấy tài chính, các vai trò khác CHỈ thấy vận hành (FR-19) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Bàn đang phục vụ"
          value={`${stats.serving + stats.billing}/${stats.totalTables}`}
          hint={`Lấp đầy ${occupancyPct}% · ${stats.empty} bàn trống, ${stats.booked} đã đặt`}
          tone="danger"
          icon={<LayoutGrid size={18} />}
        />
        <StatCard
          label="Món bếp đang xử lý"
          value={String(stats.kdsWaiting + stats.kdsCooking).padStart(2, '0')}
          hint={`${stats.kdsWaiting} chờ chế biến · ${stats.kdsCooking} đang nấu`}
          tone="warning"
          icon={<ChefHat size={18} />}
        />
        {isOwner ? (
          <>
            <StatCard
              label="Hóa đơn đã thu"
              value={formatVndCompact(stats.paidRevenue)}
              hint={`${stats.billing} bàn đang chờ thanh toán`}
              tone="success"
              icon={<CreditCard size={18} />}
            />
            <StatCard
              label="Dòng tiền ròng"
              value={formatVndCompact(stats.netCashflow)}
              hint={
                stats.lowStock.length > 0
                  ? `${stats.lowStock.length} nguyên liệu dưới ngưỡng tối thiểu`
                  : 'Tồn kho nguyên liệu ổn định'
              }
              hintTone={stats.lowStock.length > 0 ? 'danger' : 'success'}
              tone="gold"
              icon={<Wallet size={18} />}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Chờ thanh toán"
              value={String(stats.billing).padStart(2, '0')}
              hint="Thu ngân ở chế độ chỉ đọc"
              tone="billing"
              icon={<CreditCard size={18} />}
            />
            <StatCard
              label="Nhân sự đang trực"
              value={`${stats.onShiftNow}/${stats.shiftsToday.length}`}
              hint={
                stats.leavesToday.length > 0
                  ? `${stats.leavesToday.length} nhân sự nghỉ hôm nay (đã bố trí thay)`
                  : 'Đủ quân số theo lịch phân ca'
              }
              tone="info"
              icon={<Users size={18} />}
            />
          </>
        )}
      </div>

      {/* Bố cục bất đối xứng 60 / 40 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Cột trái (7/12): Trạng thái sảnh + Tín hiệu Realtime (Ting & QR) */}
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <CardHeader
              title="Trạng thái bàn"
              action={
                <Link
                  to="/so-do-ban"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Xem sảnh <ArrowRight size={14} aria-hidden />
                </Link>
              }
            />
            <CardBody className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    { key: 'Trong', count: stats.empty },
                    { key: 'DaDat', count: stats.booked },
                    { key: 'DangPhucVu', count: stats.serving },
                    { key: 'ChoThanhToan', count: stats.billing },
                  ] as const
                ).map(({ key, count }) => {
                  const meta = TABLE_STATUS_META[key];
                  return (
                    <div
                      key={key}
                      className={cn(
                        'rounded-lg border border-line bg-paper-warm p-3.5',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span aria-hidden className={cn('size-2 rounded-full', TONE[meta.tone].dot)} />
                        <span className="text-xs font-medium text-ink-soft">{meta.short}</span>
                      </div>
                      <p className="t-metric-sm mt-2 text-ink">
                        {String(count).padStart(2, '0')}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs text-ink-muted">
                  <span>Tỷ lệ sử dụng bàn hiện tại</span>
                  <span className="num font-medium text-ink">
                    {stats.activeSeats}/{stats.totalSeats} ghế · {occupancyPct}%
                  </span>
                </div>
                <ProgressBar value={occupancyPct} tone="primary" label="Tỷ lệ lấp đầy bàn" />
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <Link
                  to="/so-do-ban"
                  className="flex items-center justify-between rounded-lg border border-line px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper-warm"
                >
                  <span className="flex items-center gap-2">
                    <LayoutGrid size={16} aria-hidden className="text-primary" />
                    Sơ đồ bàn
                  </span>
                  <ArrowRight size={14} aria-hidden className="text-ink-muted" />
                </Link>
                <Link
                  to="/bep"
                  className="flex items-center justify-between rounded-lg border border-line px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper-warm"
                >
                  <span className="flex items-center gap-2">
                    <ChefHat size={16} aria-hidden className="text-gold-ink" />
                    Bếp KDS
                  </span>
                  <Badge tone="warning" size="sm">
                    {stats.kdsWaiting + stats.kdsCooking}
                  </Badge>
                </Link>
                <Link
                  to="/thu-ngan"
                  className="flex items-center justify-between rounded-lg border border-line px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper-warm"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard size={16} aria-hidden className="text-st-billing-ink" />
                    Thu ngân
                  </span>
                  <Badge tone="billing" size="sm">
                    {stats.billing}
                  </Badge>
                </Link>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Cần phục vụ ngay"
              subtitle="Món bếp vừa xong và yêu cầu từ khách QR"
              action={
                <Badge
                  tone={stats.unreadTings.length + stats.pendingRequests.length > 0 ? 'primary' : 'neutral'}
                  dot
                >
                  {stats.unreadTings.length + stats.pendingRequests.length} mục chờ
                </Badge>
              }
            />
            <CardBody className="p-0">
              {stats.unreadTings.length === 0 && stats.pendingRequests.length === 0 ? (
                <EmptyState
                  icon={<BellRing size={22} />}
                  title="Không còn yêu cầu chờ"
                  description="Món bếp hoàn thành và yêu cầu từ QR sẽ hiện ngay tại đây."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {stats.unreadTings.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-ink"
                        >
                          <BellRing size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">
                            Ting! {t.ten_mon_an} đã xong
                          </p>
                          <p className="num text-xs text-ink-muted">
                            {t.ten_ban} · {formatClock(t.thoi_gian)}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => dismissTingNotification(t.id)}>
                        Đã bưng món
                      </Button>
                    </li>
                  ))}
                  {stats.pendingRequests.map((req) => {
                    const ban = tableMap.get(req.ma_ban);
                    return (
                      <li
                        key={req.ma_yeu_cau}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"
                          >
                            <QrCode size={16} />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-ink">
                              {ban?.ten_ban ?? req.ma_ban} · {GUEST_REQUEST_META[req.loai_yeu_cau].label}
                            </p>
                            <p className="num text-xs text-ink-muted">
                              {req.ghi_chu_yeu_cau || GUEST_REQUEST_META[req.loai_yeu_cau].hint} ·{' '}
                              {formatClock(req.thoi_gian_gui)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => resolveGuestQrRequest(req.ma_yeu_cau)}
                        >
                          Đánh dấu xong
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Cột phải (5/12): Chủ thấy Tài chính & Kho; Vai trò khác thấy Nhân sự & Món hết + Bảo mật FR-19 */}
        <div className="space-y-6 lg:col-span-5">
          {isOwner ? (
            <>
              <Card>
                <CardHeader
                  title="Nguyên liệu sắp hết"
                  action={
                    <Link
                      to="/tai-chinh/kho"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Mở kho <ArrowRight size={14} aria-hidden />
                    </Link>
                  }
                />
                <CardBody className="p-0">
                  {stats.lowStock.length === 0 ? (
                    <EmptyState
                      icon={<Boxes size={22} />}
                      title="Kho đủ định mức"
                      description="Chưa có nguyên liệu nào dưới mức tối thiểu."
                    />
                  ) : (
                    <ul className="divide-y divide-line">
                      {stats.lowStock.map((ing) => (
                        <li key={ing.ma_nguyen_lieu} className="flex items-center justify-between gap-3 px-5 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{ing.ten_nguyen_lieu}</p>
                            <p className="num text-xs text-ink-muted">
                              Tối thiểu: {ing.nguong_ton_toi_thieu} {ing.don_vi_tinh}
                            </p>
                          </div>
                          <Badge tone="danger" dot>
                            <span className="num">
                              Còn {ing.so_luong_ton_kho} {ing.don_vi_tinh}
                            </span>
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="Sổ quỹ gần nhất"
                  action={
                    <Link
                      to="/tai-chinh/so-quy"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Sổ quỹ <ArrowRight size={14} aria-hidden />
                    </Link>
                  }
                />
                <CardBody className="p-0">
                  <ul className="divide-y divide-line">
                    {stats.recentCashflow.map((tx) => {
                      const meta = CASHFLOW_META[tx.loai_thu_chi];
                      return (
                        <li key={tx.ma_giao_dich_quy} className="flex items-center justify-between gap-3 px-5 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">
                              {tx.dien_giai || meta.label}
                            </p>
                            <p className="text-xs text-ink-muted">
                              {meta.label} · {tx.hinh_thuc_quy === 'TienMat' ? 'Tiền mặt' : 'Ngân hàng'}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'num shrink-0 text-sm font-medium',
                              meta.direction === 'in' ? 'text-st-empty-ink' : 'text-st-serving-ink',
                            )}
                          >
                            {meta.direction === 'in' ? '+' : '−'}
                            {formatVnd(tx.so_tien)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardBody>
                <CardFooter>
                  <span className="text-xs text-ink-muted">Đã tự động đồng bộ từ hóa đơn & phiếu nhập</span>
                  <Link
                    to="/tai-chinh/doanh-thu"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Biểu đồ doanh thu →
                  </Link>
                </CardFooter>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader
                  title="Món hết / tạm ngưng"
                  action={
                    <Link
                      to="/thuc-don"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Thực đơn <ArrowRight size={14} aria-hidden />
                    </Link>
                  }
                />
                <CardBody className="p-0">
                  {stats.soldOutDishes.length === 0 ? (
                    <div className="px-5 py-6 text-center text-sm text-ink-muted">
                      Tất cả món đang sẵn sàng phục vụ.
                    </div>
                  ) : (
                    <ul className="divide-y divide-line">
                      {stats.soldOutDishes.map((dish) => (
                        <li key={dish.ma_mon_an} className="flex items-center justify-between gap-3 px-5 py-3">
                          <p className="truncate text-sm font-medium text-ink">{dish.ten_mon_an}</p>
                          <Badge tone="danger" dot>
                            {dish.trang_thai_mon === 'HetMon' ? 'Hết món' : 'Tạm ngưng'}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="Ca trực hôm nay"
                  action={
                    (currentRole === 'Manager' || currentRole === 'HR') && (
                      <Link
                        to="/nhan-su/ca-lam"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Lịch ca <ArrowRight size={14} aria-hidden />
                      </Link>
                    )
                  }
                />
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-line bg-paper-warm px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <CalendarClock size={18} aria-hidden className="text-info-ink" />
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {stats.onShiftNow} nhân viên đang trực
                        </p>
                        <p className="text-xs text-ink-muted">
                          {stats.shiftsToday.length} ca phân công ngày 24/11/2026
                        </p>
                      </div>
                    </div>
                    <Badge tone="success" dot>
                      Ổn định
                    </Badge>
                  </div>

                  {stats.leavesToday.length > 0 && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-st-booked/40 bg-st-booked-soft px-4 py-3 text-xs text-st-booked-ink">
                      <AlertTriangle size={15} aria-hidden className="mt-0.5 shrink-0" />
                      <span>
                        Có <strong>{stats.leavesToday.length}</strong> nhân sự nghỉ hôm nay. Kiểm tra người trực thay ở mục Nghỉ phép.
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5 rounded-lg border border-line bg-sunken px-4 py-3 text-xs text-ink-muted">
                    <Lock size={14} aria-hidden className="mt-0.5 shrink-0 text-gold-ink" />
                    <span>
                      Doanh thu, sổ quỹ và giá nhập kho được ẩn với vai trò{' '}
                      <strong className="font-medium text-ink">{ROLE_META[currentRole].label}</strong>.
                    </span>
                  </div>
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageBody>
  );
}
