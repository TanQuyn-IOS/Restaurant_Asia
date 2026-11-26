import { useMemo, useState } from 'react';
import { Activity, CreditCard, PieChart as PieIcon, TrendingUp, Users } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/cn';
import { formatVnd, formatVndCompact } from '@/lib/format';
import { CUISINE_META } from '@/lib/labels';
import { useRestaurantStore, verifyRbacPermission } from '@/store/useRestaurantStore';
import { Card, CardBody, CardFooter, CardHeader, StatCard } from '@/components/ui/Card';
import { Select } from '@/components/ui/Form';
import { EmptyState, ProgressBar } from '@/components/ui/Misc';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { DishImage } from '@/components/domain/badges';
import { OwnerGuardCard } from './components/OwnerGuardCard';
import { calculateRevenueAnalytics, type CustomerGroupSlice } from './financeHelpers';

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: CustomerGroupSlice }>;
}) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2 text-xs shadow-lift">
      <p className="font-medium text-ink">{item.label}</p>
      <p className="num mt-0.5 text-ink-soft">
        {formatVnd(item.revenue)} · {item.sharePct}%
      </p>
      <p className="num text-ink-muted">{item.ordersCount} phiên phục vụ</p>
    </div>
  );
}

export function RevenuePage() {
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const snapshot = useRestaurantStore((s) => s.snapshot);

  const [scope, setScope] = useState<'month' | 'today'>('month');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');

  const accessCheck = verifyRbacPermission(currentRole, 'VIEW_CASHFLOW');

  const analytics = useMemo(
    () => calculateRevenueAnalytics(snapshot, zoneFilter, scope),
    [snapshot, zoneFilter, scope],
  );

  if (!accessCheck.allowed) {
    return <OwnerGuardCard message={accessCheck.message ?? 'Không đủ quyền xem phân tích doanh thu.'} />;
  }

  const nonZeroSlices = analytics.groupSlices.filter((s) => s.revenue > 0);
  const topDish = analytics.topDishes[0] ?? null;

  return (
    <PageBody>
      <PageHeader
        title="Doanh thu"
        description="Cơ cấu doanh thu theo 4 nhóm khách và các món bán chạy."
      />

      {/* 4 KPI Cards (mockup 09) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng doanh thu"
          value={formatVndCompact(analytics.totalRevenue)}
          hint={
            analytics.settledCashflowRevenue > 0
              ? `Sổ quỹ ${formatVndCompact(analytics.settledCashflowRevenue)} + phiên ${formatVndCompact(analytics.liveSessionRevenue)}`
              : 'Tổng món hoàn thành / đã phục vụ'
          }
          hintTone="success"
          tone="success"
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Hóa đơn đã chốt"
          value={String(analytics.closedInvoicesCount).padStart(2, '0')}
          hint={`${analytics.paidInvoicesCount} đã thu · ${analytics.pendingInvoicesCount} chờ thu · TB ${formatVndCompact(analytics.avgCheck)}`}
          tone="neutral"
          icon={<CreditCard size={18} />}
        />
        <StatCard
          label="Doanh thu TB / ngày"
          value={formatVndCompact(analytics.avgDailyRevenue)}
          hint={`trên ${analytics.serviceDays} ngày ghi nhận doanh thu`}
          tone="gold"
          icon={<Activity size={18} />}
        />
        <StatCard
          label="Nhóm khách dẫn đầu"
          value={analytics.topGroup?.label ?? 'Chưa có'}
          hint={
            analytics.topGroup
              ? `${analytics.topGroup.sharePct}% doanh thu theo 4 nhóm khách`
              : 'Chưa phát sinh món hoàn thành'
          }
          tone="primary"
          icon={<Users size={18} />}
        />
      </div>

      {/* Bố cục 2 thẻ chính: Donut 4 nhóm khách (trái) + Top món Châu Á (phải) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Donut chart doanh thu theo 4 nhóm khách */}
        <Card className="flex flex-col xl:col-span-6">
          <CardHeader
            title="Doanh thu theo 4 nhóm khách"
            subtitle={`Đóng góp trên ${formatVnd(analytics.liveSessionRevenue)} doanh thu phiên (chỉ tính món Hoàn thành / Đã phục vụ)`}
            action={
              <Select
                aria-label="Chọn phạm vi thời gian doanh thu"
                value={scope}
                onChange={(e) => setScope(e.target.value as 'month' | 'today')}
                className="h-9 w-36 text-xs"
              >
                <option value="month">Tháng 11/2026</option>
                <option value="today">Phiên 24/11</option>
              </Select>
            }
          />

          <CardBody className="flex-1">
            {nonZeroSlices.length === 0 ? (
              <EmptyState
                icon={<PieIcon size={22} />}
                title="Chưa có doanh thu phiên ở khu vực này"
                description="Khi bếp bấm Hoàn thành món cho các bàn trong khu vực, biểu đồ cơ cấu 4 nhóm khách sẽ cập nhật ngay."
              />
            ) : (
              <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-12">
                {/* Recharts Donut dùng hoàn toàn var(--color-*), không dùng hex thô */}
                <div className="relative mx-auto h-60 w-60 sm:col-span-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={nonZeroSlices}
                        dataKey="revenue"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={104}
                        paddingAngle={2}
                        stroke="var(--color-paper)"
                        strokeWidth={2}
                      >
                        {nonZeroSlices.map((slice) => (
                          <Cell key={slice.group} fill={slice.colorVar} />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Tổng ở tâm biểu đồ */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="t-metric-sm text-ink">
                      {formatVndCompact(analytics.liveSessionRevenue)}
                    </span>
                    <span className="mt-1 text-xs text-ink-muted">Tổng theo nhóm</span>
                  </div>
                </div>

                {/* Chú giải 4 nhóm khách kèm % và số tiền VND */}
                <ul className="space-y-3.5 sm:col-span-6">
                  {analytics.groupSlices.map((slice) => (
                    <li key={slice.group} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className={cn('size-2.5 shrink-0 rounded-full', slice.dotClass)}
                        />
                        <span className="font-medium text-ink">{slice.label}</span>
                        <span className="num text-xs text-ink-muted">{slice.sharePct}%</span>
                      </div>
                      <span className="num font-medium text-ink">
                        {formatVndCompact(slice.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bảng dữ liệu thay thế cho trình đọc màn hình (a11y) */}
            <table className="sr-only">
              <caption>Bảng số liệu doanh thu theo 4 nhóm khách hàng</caption>
              <thead>
                <tr>
                  <th scope="col">Nhóm khách</th>
                  <th scope="col">Số phiên</th>
                  <th scope="col">Tỷ trọng</th>
                  <th scope="col">Doanh thu (VND)</th>
                </tr>
              </thead>
              <tbody>
                {analytics.groupSlices.map((slice) => (
                  <tr key={slice.group}>
                    <td>{slice.label}</td>
                    <td>{slice.ordersCount}</td>
                    <td>{slice.sharePct}%</td>
                    <td>{formatVnd(slice.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>

          <CardFooter className="text-xs text-ink-muted">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full bg-st-empty" />
              Chỉ tính món bếp đã hoàn thành
            </span>
            <span className="num font-medium text-st-empty-ink">4 nhóm khách</span>
          </CardFooter>
        </Card>

        {/* Top món Châu Á bán chạy (mockup 09) */}
        <Card className="flex flex-col xl:col-span-6">
          <CardHeader
            title="Top món Châu Á bán chạy"
            subtitle="Xếp hạng theo doanh thu & số phần hoàn thành · Tháng 11/2026"
            action={
              <Select
                aria-label="Lọc top món theo khu vực"
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="h-9 w-44 text-xs"
              >
                <option value="ALL">Tất cả khu vực</option>
                {snapshot.tbl_khu_vuc.map((kv) => (
                  <option key={kv.ma_khu_vuc} value={kv.ma_khu_vuc}>
                    {kv.ten_khu_vuc.replace(/\s*\([^)]*\)\s*$/, '')}
                  </option>
                ))}
              </Select>
            }
          />

          <CardBody className="flex-1">
            {analytics.topDishes.length === 0 ? (
              <EmptyState
                icon={<TrendingUp size={22} />}
                title="Chưa có món bán chạy ở khu vực này"
                description="Chọn khu vực khác hoặc đợi bếp hoàn thành món để hệ thống thống kê."
              />
            ) : (
              <ol className="space-y-4">
                {analytics.topDishes.map((dish, idx) => (
                  <li key={dish.maMonAn} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="num w-6 shrink-0 text-xs font-medium text-ink-muted">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <DishImage
                        src={dish.hinhAnhUrl}
                        alt={dish.tenMonAn}
                        className="size-10 shrink-0 rounded-md border border-line"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{dish.tenMonAn}</p>
                        <p className="num text-xs text-ink-muted">
                          {CUISINE_META[dish.cuisine].label} · {dish.unitsSold} phần đã bán
                        </p>
                      </div>
                      <span className="num shrink-0 text-sm font-medium text-ink">
                        {formatVndCompact(dish.revenue)}
                      </span>
                    </div>
                    <div className="pl-9">
                      <ProgressBar
                        value={dish.pctOfTop}
                        tone="gold"
                        label={`Doanh thu món ${dish.tenMonAn}`}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>

          <CardFooter className="text-xs text-ink-muted">
            <span>Món dẫn đầu</span>
            <span className="num font-medium text-st-empty-ink">
              {topDish ? `${topDish.tenMonAn} · ${topDish.unitsSold} phần` : 'Chưa có dữ liệu'}
            </span>
          </CardFooter>
        </Card>
      </div>
    </PageBody>
  );
}
