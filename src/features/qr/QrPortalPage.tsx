import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BellRing, ChevronRight, Crown, Search, Utensils, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Misc';
import type { MonAn } from '@/types/database';
import {
  countDishInCart,
  CUISINE_FILTERS,
  filterQrMenuDishes,
  type QrCuisineFilter,
} from './qrHelpers';
import { useQrSession } from './useQrSession';
import { QrToast } from './components/QrBrandMark';
import { QrPortalHeader, QrUnknownTableView } from './components/QrPortalHeader';
import { QrBottomBar } from './components/QrBottomBar';
import { DishCard } from './components/DishCard';
import { DishDetailSheet } from './components/DishDetailSheet';
import { CartReviewSheet } from './components/CartReviewSheet';
import {
  OrderTrackingSheet,
  type OrderTrackingTab,
} from './components/OrderTrackingSheet';
import { CallWaiterSheet } from './components/CallWaiterSheet';
import { QrHelpSheet } from './components/QrHelpSheet';
import { MemberLookupSheet } from './components/MemberLookupSheet';

/** Cổng khách hàng quét mã QR tại bàn (/qr/:maBan) — tách hoàn toàn khỏi khung nhân viên (FR-25). */
export function QrPortalPage() {
  const { maBan } = useParams<{ maBan: string }>();
  const {
    snapshot,
    table,
    shortAreaName,
    parentTable,
    linkedMember,
    identifyMemberByPhone,
    canSubmitOrder,
    sessionBlockReason,
    enrichedOrderItems,
    activeKitchenCount,
    billSummary,
    cart,
    cartTotals,
    soldOutCartKeys,
    toast,
    dismissToast,
    addToCart,
    quickAddDish,
    setCartItemQuantity,
    removeItemFromCart,
    removeSoldOutItems,
    submitCartToKitchen,
    sendSupportRequest,
    requestStaffOpenTable,
    getCooldownSeconds,
    lastSentMessage,
  } = useQrSession(maBan);

  const [cuisineFilter, setCuisineFilter] = useState<QrCuisineFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [trackingSheet, setTrackingSheet] = useState<{
    open: boolean;
    tab: OrderTrackingTab;
  }>({ open: false, tab: 'kitchen' });
  const [waiterOpen, setWaiterOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

  const filteredDishes = useMemo(
    () =>
      filterQrMenuDishes(
        snapshot.tbl_mon_an,
        snapshot.tbl_danh_muc_mon,
        cuisineFilter,
        searchQuery,
      ),
    [snapshot.tbl_mon_an, snapshot.tbl_danh_muc_mon, cuisineFilter, searchQuery],
  );

  const selectedDish: MonAn | null = useMemo(() => {
    if (!selectedDishId) return null;
    return snapshot.tbl_mon_an.find((d) => d.ma_mon_an === selectedDishId) ?? null;
  }, [snapshot.tbl_mon_an, selectedDishId]);

  const selectedDishCategory = useMemo(() => {
    if (!selectedDish) return undefined;
    return snapshot.tbl_danh_muc_mon.find(
      (c) => c.ma_danh_muc === selectedDish.ma_danh_muc,
    );
  }, [snapshot.tbl_danh_muc_mon, selectedDish]);

  const handleSubmitOrder = () => {
    const submitted = submitCartToKitchen();
    if (submitted) {
      setCartOpen(false);
      setTrackingSheet({ open: true, tab: 'kitchen' });
    }
  };

  if (!table) {
    return <QrUnknownTableView maBan={maBan} />;
  }

  const staffCooldown = getCooldownSeconds('GapPhucVu');

  return (
    <div className="min-h-screen bg-chrome sm:flex sm:items-center sm:justify-center sm:px-4 sm:py-6">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-cream sm:h-[min(860px,calc(100vh-3rem))] sm:max-w-[430px] sm:rounded-2xl sm:border sm:border-cream-line sm:shadow-pop">
        <QrPortalHeader
          tableLabel={table.ten_ban}
          areaLabel={shortAreaName}
          parentTableLabel={parentTable?.ten_ban}
          onOpenHelp={() => setHelpOpen(true)}
        />

        <QrToast toast={toast} onDismiss={dismissToast} />

        {/* Nội dung cuộn chính: Hero + Thực đơn */}
        <main className="scroll-quiet flex-1 overflow-y-auto">
          {/* Editorial Hero (mockup 11) */}
          <section className="relative overflow-hidden border-b border-cream-line px-4 pt-6 pb-7">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-8 -right-24 size-60 rounded-full border border-cream-line"
            />
            <p className="eyebrow relative text-gold-ink">
              BÀN ĂN CHO HƯƠNG VỊ TINH TẾ
            </p>
            <h1 className="t-hero relative mt-3 text-ink">
              Một chút hương vị <em className="italic">Á Châu</em>.
            </h1>
            <p className="relative mt-3 max-w-xs text-sm text-ink-muted">
              Chế biến tươi ngon, phục vụ ngay tại bàn của bạn.
            </p>

            {/* Thanh nhận diện thành viên tùy chọn bằng SĐT — khách vãng lai không cần đăng nhập */}
            <button
              type="button"
              onClick={() => setMemberOpen(true)}
              className="relative mt-4 flex min-h-11 w-full items-center justify-between gap-2.5 rounded-xl border border-cream-line bg-paper px-3.5 py-2.5 text-left shadow-card transition-colors hover:border-gold/60"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-ink"
                >
                  <Crown size={15} />
                </span>
                <span className="min-w-0">
                  {linkedMember ? (
                    <>
                      <span className="block truncate text-xs font-medium text-ink">
                        {linkedMember.ho_ten}
                      </span>
                      <span className="num block text-xs text-gold-ink">
                        Hạng {linkedMember.hang_the}
                        {linkedMember.discountPercent > 0 ? ` · Giảm ${linkedMember.discountPercent}%` : ''} ·{' '}
                        {linkedMember.diem_tich_luy} điểm
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block text-xs font-medium text-ink">
                        Thành viên / VIP? Nhập SĐT tích điểm
                      </span>
                      <span className="block text-xs text-ink-muted">
                        Tùy chọn · Khách vãng lai gọi món ngay không cần đăng nhập
                      </span>
                    </>
                  )}
                </span>
              </span>
              {linkedMember ? (
                <Badge tone="gold" size="sm">
                  {linkedMember.hang_the}
                </Badge>
              ) : (
                <ChevronRight size={16} aria-hidden className="shrink-0 text-ink-muted" />
              )}
            </button>
          </section>

          {/* Lưu ý nhẹ khi bàn chưa mở phiên hoặc đã chốt bill */}
          {!canSubmitOrder && (
            <div className="px-4 pt-4">
              <div className="flex flex-col gap-2.5 rounded-xl border border-st-booked/35 bg-st-booked-soft p-3.5 text-xs text-st-booked-ink">
                <p className="leading-relaxed">
                  {sessionBlockReason === 'BILL_LOCKED'
                    ? 'Hóa đơn bàn này đã được chốt để thanh toán. Bạn vẫn có thể xem lại Tiến độ bếp và Tạm tính bên dưới.'
                    : 'Bàn này chưa mở phiên phục vụ. Bạn có thể chọn trước món vào giỏ và gọi nhân viên mở bàn để gửi bếp.'}
                </p>
                {sessionBlockReason === 'NO_SESSION' && (
                  <Button
                    variant="gold"
                    size="md"
                    disabled={staffCooldown > 0}
                    icon={<BellRing size={15} />}
                    onClick={requestStaffOpenTable}
                    className="min-h-11 self-start rounded-lg"
                  >
                    {staffCooldown > 0
                      ? `Đã gọi nhân viên · chờ ${staffCooldown}s`
                      : 'Gọi nhân viên mở bàn'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Khu vực Thực đơn hôm nay (mockups 11–13) */}
          <section aria-labelledby="qr-menu-heading" className="px-4 pt-6 pb-24">
            <p className="eyebrow text-gold-ink">THỰC ĐƠN CỦA CHÚNG TÔI</p>

            <div className="mt-1.5 flex items-center justify-between gap-3">
              <h2 id="qr-menu-heading" className="t-display text-ink">
                Thực đơn hôm nay
              </h2>

              <div className="relative flex h-11 w-40 shrink-0 items-center rounded-full border border-cream-line bg-paper px-3 shadow-card focus-within:border-primary">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm món..."
                  aria-label="Tìm món trong thực đơn"
                  className="w-full min-w-0 bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    aria-label="Xóa từ khóa tìm kiếm"
                    onClick={() => setSearchQuery('')}
                    className="grid size-7 shrink-0 place-items-center rounded-full text-ink-muted hover:text-ink"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <Search size={15} aria-hidden className="shrink-0 text-ink-muted" />
                )}
              </div>
            </div>

            {/* Thanh lọc trường phái ẩm thực cuộn ngang */}
            <div
              role="tablist"
              aria-label="Lọc theo trường phái ẩm thực"
              className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1"
            >
              {CUISINE_FILTERS.map((filter) => {
                const active = cuisineFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCuisineFilter(filter.id)}
                    className={cn(
                      'min-h-11 shrink-0 rounded-full border px-4 text-xs font-medium whitespace-nowrap transition-colors',
                      active
                        ? 'border-primary bg-primary text-white'
                        : 'border-cream-line bg-paper text-ink-soft hover:bg-paper-warm',
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {/* Lưới món ăn 2 cột */}
            {filteredDishes.length === 0 ? (
              <EmptyState
                icon={<Utensils size={24} />}
                title="Không tìm thấy món phù hợp"
                description="Thử tìm với từ khóa khác hoặc chuyển về mục Tất cả để xem trọn thực đơn hôm nay."
                action={
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setCuisineFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="min-h-11"
                  >
                    Xem tất cả thực đơn
                  </Button>
                }
              />
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {filteredDishes.map((dish) => (
                  <DishCard
                    key={dish.ma_mon_an}
                    dish={dish}
                    qtyInCart={countDishInCart(cart, dish.ma_mon_an)}
                    onSelect={(picked) => setSelectedDishId(picked.ma_mon_an)}
                    onQuickAdd={quickAddDish}
                  />
                ))}
              </div>
            )}

            {/* Lời nhắn cuối thực đơn (mockup 13) */}
            <footer className="mt-10 text-center">
              <Utensils size={20} aria-hidden className="mx-auto text-gold" />
              <p className="mt-3 text-sm italic text-ink-muted">
                Món ngon cần thời gian.
                <br />
                Mỗi món đều được nấu tươi theo yêu cầu.
              </p>
            </footer>
          </section>
        </main>

        <QrBottomBar
          cartItemCount={cartTotals.totalItems}
          cartTotalAmount={cartTotals.totalAmount}
          activeKitchenCount={activeKitchenCount}
          billPreviewTotal={billSummary.currentPreviewTotal}
          onOpenCart={() => setCartOpen(true)}
          onOpenKitchenStatus={() =>
            setTrackingSheet({ open: true, tab: 'kitchen' })
          }
          onOpenBillPreview={() => setTrackingSheet({ open: true, tab: 'bill' })}
          onOpenCallWaiter={() => setWaiterOpen(true)}
        />

        <DishDetailSheet
          dish={selectedDish}
          category={selectedDishCategory}
          onClose={() => setSelectedDishId(null)}
          onAddToCart={addToCart}
        />

        <CartReviewSheet
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          tableLabel={table.ten_ban}
          areaLabel={shortAreaName}
          cart={cart}
          totalItems={cartTotals.totalItems}
          totalAmount={cartTotals.totalAmount}
          soldOutCartKeys={soldOutCartKeys}
          canSubmitOrder={canSubmitOrder}
          sessionBlockReason={sessionBlockReason}
          callStaffCooldown={staffCooldown}
          onChangeQty={setCartItemQuantity}
          onRemoveItem={removeItemFromCart}
          onRemoveSoldOut={removeSoldOutItems}
          onSubmitOrder={handleSubmitOrder}
          onRequestOpenTable={requestStaffOpenTable}
        />

        <OrderTrackingSheet
          open={trackingSheet.open}
          activeTab={trackingSheet.tab}
          onTabChange={(tab) => setTrackingSheet((prev) => ({ ...prev, tab }))}
          onClose={() => setTrackingSheet((prev) => ({ ...prev, open: false }))}
          tableLabel={table.ten_ban}
          areaLabel={shortAreaName}
          orderItems={enrichedOrderItems}
          activeKitchenCount={activeKitchenCount}
          billSummary={billSummary}
        />

        <CallWaiterSheet
          open={waiterOpen}
          onClose={() => setWaiterOpen(false)}
          tableLabel={table.ten_ban}
          getCooldownSeconds={getCooldownSeconds}
          lastSentMessage={lastSentMessage}
          onSendRequest={(type) => sendSupportRequest(type)}
        />

        <QrHelpSheet
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          tableLabel={table.ten_ban}
          areaLabel={shortAreaName}
        />

        <MemberLookupSheet
          open={memberOpen}
          onClose={() => setMemberOpen(false)}
          tableLabel={table.ten_ban}
          linkedMember={linkedMember}
          canLinkOrder={canSubmitOrder}
          onIdentify={identifyMemberByPhone}
        />
      </div>
    </div>
  );
}
