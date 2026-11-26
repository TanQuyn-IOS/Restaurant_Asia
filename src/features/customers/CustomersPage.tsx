import { useMemo, useState } from 'react';
import { Building2, ChevronRight, Search, Users } from 'lucide-react';
import { formatDateVi, formatNumber, formatVnd } from '@/lib/format';
import { CUSTOMER_GROUP_META } from '@/lib/labels';
import type { CustomerGroupType } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Form';
import { Avatar, EmptyState, Table, Td, Th, Tr } from '@/components/ui/Misc';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Tabs';
import { CustomerGroupBadge } from '@/components/domain/badges';
import { CorporateAndReservations } from './components/CorporateAndReservations';
import { CustomerDetailSheet } from './components/CustomerDetailSheet';
import { CustomerGroupBento } from './components/CustomerGroupBento';
import {
  CARD_TIER_RULES,
  filterCustomerRows,
  type CustomerFilterKey,
} from './customerHelpers';
import { useCustomersData } from './useCustomersData';

const GROUP_ORDER: CustomerGroupType[] = ['VangLai', 'Thuong', 'VIP', 'Doan'];

export function CustomersPage() {
  const {
    rows,
    corporates,
    reservations,
    groupCounts,
    totalDeposits,
    vipDiamondCount,
    vipGoldCount,
  } = useCustomersData();

  const [groupFilter, setGroupFilter] = useState<CustomerFilterKey>('ALL');
  const [query, setQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const filteredRows = useMemo(
    () => filterCustomerRows(rows, groupFilter, query),
    [rows, groupFilter, query],
  );

  const selectedRecord = useMemo(
    () => rows.find((r) => r.customer.ma_khach_hang === selectedCustomerId) ?? null,
    [rows, selectedCustomerId],
  );

  const segmentedItems = useMemo(
    () => [
      { id: 'ALL' as const, label: 'Tất cả', count: groupCounts.ALL },
      ...GROUP_ORDER.map((group) => ({
        id: group as CustomerFilterKey,
        label: CUSTOMER_GROUP_META[group].label,
        count: groupCounts[group],
      })),
    ],
    [groupCounts],
  );

  return (
    <PageBody>
      <PageHeader
        title="Khách hàng & VAT"
        description="Hội viên, chiết khấu hạng thẻ, pháp nhân VAT và tiền đặt cọc."
      />

      {/* Thanh tóm tắt Bento bất đối xứng cho 4 nhóm khách */}
      <CustomerGroupBento
        counts={groupCounts}
        corporateCount={corporates.length}
        totalDeposits={totalDeposits}
        vipDiamondCount={vipDiamondCount}
        vipGoldCount={vipGoldCount}
        activeGroup={groupFilter}
        onSelectGroup={setGroupFilter}
      />

      {/* Danh bạ khách hàng chính */}
      <Card>
        <CardHeader
          title="Danh bạ khách hàng"
          subtitle="Chọn một khách hàng để xem ưu đãi, thông tin VAT và lịch sử đặt bàn"
        />
        <CardBody className="pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Segmented
              label="Lọc theo 4 nhóm khách hàng"
              items={segmentedItems}
              value={groupFilter}
              onChange={setGroupFilter}
            />

            <div className="relative w-full lg:w-80">
              <Search
                size={15}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
              />
              <Input
                type="search"
                aria-label="Tìm khách hàng theo tên, số điện thoại, công ty hoặc mã số thuế"
                placeholder="Tìm tên, SĐT, công ty, MST..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
          </div>
        </CardBody>

        {filteredRows.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="Không tìm thấy khách hàng phù hợp"
            description="Thử chọn nhóm khách khác hoặc điều chỉnh từ khóa tìm kiếm."
            action={
              (groupFilter !== 'ALL' || query) && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setGroupFilter('ALL');
                    setQuery('');
                  }}
                >
                  Đặt lại bộ lọc
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Khách hàng</Th>
                <Th>Số điện thoại</Th>
                <Th>Nhóm khách</Th>
                <Th>Hạng thẻ & điểm</Th>
                <Th>Pháp nhân / Đặt cọc</Th>
                <Th>Ngày tham gia</Th>
                <Th>
                  <span className="sr-only">Chi tiết</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(({ customer, corporate, totalDeposit }) => {
                const tierRule = CARD_TIER_RULES[customer.hang_the];
                return (
                  <Tr
                    key={customer.ma_khach_hang}
                    onClick={() => setSelectedCustomerId(customer.ma_khach_hang)}
                    className="cursor-pointer"
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.ho_ten} size="md" />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomerId(customer.ma_khach_hang);
                            }}
                            className="text-left font-medium text-ink hover:text-primary"
                          >
                            {customer.ho_ten}
                          </button>
                          <p className="num truncate text-xs text-ink-muted">
                            {customer.ma_khach_hang}
                            {customer.email ? ` · ${customer.email}` : ''}
                          </p>
                        </div>
                      </div>
                    </Td>

                    <Td>
                      <span className="num text-sm text-ink-soft">
                        {customer.so_dien_thoai || '—'}
                      </span>
                    </Td>

                    <Td>
                      <CustomerGroupBadge group={customer.loai_khach} />
                    </Td>

                    <Td>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={tierRule.tone} size="sm">
                          {customer.hang_the}
                          {tierRule.discountPercent > 0 ? ` −${tierRule.discountPercent}%` : ''}
                        </Badge>
                        <span className="num text-xs text-ink-muted">
                          {formatNumber(customer.diem_tich_luy)} điểm
                        </span>
                      </div>
                    </Td>

                    <Td>
                      <div className="space-y-1">
                        {corporate ? (
                          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                            <Building2 size={12} aria-hidden className="shrink-0 text-primary" />
                            <span className="num font-medium">MST: {corporate.ma_so_thue}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-muted">Cá nhân</span>
                        )}
                        {totalDeposit > 0 && (
                          <Badge tone="warning" size="sm">
                            Cọc <span className="num">{formatVnd(totalDeposit)}</span>
                          </Badge>
                        )}
                      </div>
                    </Td>

                    <Td>
                      <span className="num text-xs text-ink-muted">
                        {formatDateVi(customer.ngay_tao)}
                      </span>
                    </Td>

                    <Td className="w-10 text-right">
                      <button
                        type="button"
                        aria-label={`Mở chi tiết khách hàng ${customer.ho_ten}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(customer.ma_khach_hang);
                        }}
                        className="grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}

        <CardFooter>
          <span className="text-xs text-ink-muted">
            Hiển thị <span className="num font-medium text-ink">{filteredRows.length}</span> /{' '}
            <span className="num">{rows.length}</span> hồ sơ khách hàng
          </span>
          <span className="text-xs text-ink-muted">
            Chiết khấu thẻ: Silver 5% · Gold 10% · Diamond 15%
          </span>
        </CardFooter>
      </Card>

      {/* Khối chuyên biệt: Pháp nhân Khách đoàn (VAT) & Phiếu đặt bàn/cọc */}
      <CorporateAndReservations
        corporates={corporates}
        reservations={reservations}
        onSelectCustomerId={setSelectedCustomerId}
      />

      {/* Ngăn kéo bên phải chi tiết khách hàng */}
      <CustomerDetailSheet
        record={selectedRecord}
        onClose={() => setSelectedCustomerId(null)}
      />
    </PageBody>
  );
}
