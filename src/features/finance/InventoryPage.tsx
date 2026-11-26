import { useMemo, useState } from 'react';
import { Boxes, Check, Package, Plus, ShieldAlert, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDateVi, formatVnd, formatVndCompact } from '@/lib/format';
import { useRestaurantStore, verifyRbacPermission } from '@/store/useRestaurantStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardFooter, CardHeader, StatCard } from '@/components/ui/Card';
import { Select } from '@/components/ui/Form';
import { EmptyState, Table, Td, Th, Tr } from '@/components/ui/Misc';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { CreateImportOrderModal } from './components/CreateImportOrderModal';
import { OwnerGuardCard } from './components/OwnerGuardCard';
import { SupplierBalanceCard } from './components/SupplierBalanceCard';
import { enrichInventoryItems, type IngredientCategory } from './financeHelpers';

type StockStatusFilter = 'ALL' | 'LOW' | 'OK';

export function InventoryPage() {
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const snapshot = useRestaurantStore((s) => s.snapshot);

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | IngredientCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>('ALL');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);

  const viewCheck = verifyRbacPermission(currentRole, 'VIEW_CASHFLOW');
  const importCheck = verifyRbacPermission(currentRole, 'IMPORT_INVENTORY');

  const enrichedItems = useMemo(() => enrichInventoryItems(snapshot), [snapshot]);

  const kpis = useMemo(() => {
    const lowStockCount = enrichedItems.filter((i) => i.isLowStock).length;
    const totalStockValue = enrichedItems.reduce((sum, i) => sum + i.stockValue, 0);
    const totalSupplierDebt = snapshot.tbl_nha_cung_cap.reduce(
      (sum, c) => sum + Number(c.cong_no_hien_tai),
      0,
    );
    const indebtedSuppliers = snapshot.tbl_nha_cung_cap.filter(
      (c) => Number(c.cong_no_hien_tai) > 0,
    ).length;
    const categoriesCount = new Set(enrichedItems.map((i) => i.category)).size;

    return {
      trackedCount: enrichedItems.length,
      categoriesCount,
      lowStockCount,
      totalSupplierDebt,
      indebtedSuppliers,
      totalStockValue,
    };
  }, [enrichedItems, snapshot.tbl_nha_cung_cap]);

  const filteredItems = useMemo(() => {
    return enrichedItems.filter((item) => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (statusFilter === 'LOW' && !item.isLowStock) return false;
      if (statusFilter === 'OK' && item.isLowStock) return false;
      return true;
    });
  }, [enrichedItems, categoryFilter, statusFilter]);

  const latestReceiptBySupplier = useMemo(() => {
    const map = new Map<string, { ma: string; ngay: string }>();
    for (const pn of snapshot.tbl_phieu_nhap_hang) {
      const prev = map.get(pn.ma_nha_cung_cap);
      if (!prev || pn.ngay_nhap >= prev.ngay) {
        map.set(pn.ma_nha_cung_cap, { ma: pn.ma_phieu_nhap, ngay: pn.ngay_nhap });
      }
    }
    return map;
  }, [snapshot.tbl_phieu_nhap_hang]);

  if (!viewCheck.allowed) {
    return <OwnerGuardCard message={viewCheck.message ?? 'Không đủ quyền truy cập kho nguyên liệu.'} />;
  }

  const openImportFor = (ingredientId: string | null = null) => {
    setSelectedIngredientId(ingredientId);
    setImportModalOpen(true);
  };

  return (
    <PageBody>
      <PageHeader
        title="Kho hàng"
        description="Tồn kho nguyên liệu, cảnh báo mức tối thiểu và công nợ nhà cung cấp."
        actions={
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            disabled={!importCheck.allowed}
            onClick={() => openImportFor(null)}
          >
            Lập phiếu nhập
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Nguyên liệu theo dõi"
          value={String(kpis.trackedCount).padStart(2, '0')}
          hint={`trên ${kpis.categoriesCount} nhóm nguyên liệu · gắn BOM`}
          tone="neutral"
          icon={<Package size={18} />}
        />
        <StatCard
          label="Cảnh báo tồn thấp"
          value={String(kpis.lowStockCount).padStart(2, '0')}
          hint={kpis.lowStockCount > 0 ? 'Cần lập phiếu nhập ngay' : 'Toàn bộ kho đủ định mức'}
          hintTone={kpis.lowStockCount > 0 ? 'danger' : 'success'}
          tone="danger"
          icon={<ShieldAlert size={18} />}
        />
        <StatCard
          label="Công nợ NCC"
          value={formatVndCompact(kpis.totalSupplierDebt)}
          hint={`${kpis.indebtedSuppliers} nhà cung cấp còn dư nợ`}
          tone="gold"
          icon={<Wallet size={18} />}
        />
        <StatCard
          label="Giá trị tồn kho"
          value={formatVndCompact(kpis.totalStockValue)}
          hint="tính theo đơn giá bình quân gia quyền"
          tone="neutral"
          icon={<Boxes size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="flex flex-col xl:col-span-8">
          <CardHeader
            title="Tồn kho nguyên liệu"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  aria-label="Lọc theo nhóm nguyên liệu"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | IngredientCategory)}
                  className="h-9 w-40 text-xs"
                >
                  <option value="ALL">Tất cả nhóm</option>
                  <option value="Hải sản tươi">Hải sản tươi</option>
                  <option value="Thịt & Gia cầm">Thịt & Gia cầm</option>
                  <option value="Gia vị & Khác">Gia vị & Khác</option>
                </Select>
                <Select
                  aria-label="Lọc theo trạng thái tồn kho"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StockStatusFilter)}
                  className="h-9 w-36 text-xs"
                >
                  <option value="ALL">Mọi trạng thái</option>
                  <option value="LOW">Sắp hết</option>
                  <option value="OK">Đủ định mức</option>
                </Select>
              </div>
            }
          />

          <div className="mt-4 flex-1">
            {filteredItems.length === 0 ? (
              <EmptyState
                icon={<Package size={22} />}
                title="Không có nguyên liệu khớp bộ lọc"
                description="Đặt lại bộ lọc nhóm hoặc trạng thái để xem đầy đủ danh mục kho."
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setCategoryFilter('ALL');
                      setStatusFilter('ALL');
                    }}
                  >
                    Xem tất cả nguyên liệu
                  </Button>
                }
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Nguyên liệu & NCC</Th>
                    <Th>Tồn kho</Th>
                    <Th className="text-right">Đơn giá</Th>
                    <Th className="text-right">Trạng thái</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <Tr key={item.ma_nguyen_lieu}>
                      <Td>
                        <div className="min-w-0 max-w-64">
                          <p className="truncate font-medium text-ink" title={item.ten_nguyen_lieu}>
                            {item.ten_nguyen_lieu}
                          </p>
                          <p
                            className="num truncate text-xs text-ink-muted"
                            title={`${item.category} · ${item.supplierName} · HSD ${formatDateVi(item.han_su_dung)}`}
                          >
                            {item.supplierName} · HSD {formatDateVi(item.han_su_dung)}
                          </p>
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span
                          className={cn(
                            'num font-medium',
                            item.isLowStock ? 'text-st-serving-ink' : 'text-ink',
                          )}
                        >
                          {item.so_luong_ton_kho} {item.don_vi_tinh}
                        </span>
                        <span className="num block text-xs text-ink-muted">
                          Min {item.nguong_ton_toi_thieu} {item.don_vi_tinh}
                        </span>
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <span className="num text-ink-soft">{formatVnd(item.don_gia_nhap_bq)}</span>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.isLowStock ? (
                            <>
                              <Badge tone="danger" dot>
                                Sắp hết
                              </Badge>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={!importCheck.allowed}
                                onClick={() => openImportFor(item.ma_nguyen_lieu)}
                              >
                                Nhập
                              </Button>
                            </>
                          ) : (
                            <Badge tone="success" icon={<Check size={12} />}>
                              Đủ mức
                            </Badge>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          <CardFooter className="flex-wrap text-xs text-ink-muted">
            <span className="num">
              Hiển thị {filteredItems.length} / {enrichedItems.length} nguyên liệu
            </span>
            <span className="num">
              {snapshot.tbl_phieu_nhap_hang.length} phiếu nhập kho đã ghi nhận
            </span>
          </CardFooter>
        </Card>

        <SupplierBalanceCard
          suppliers={snapshot.tbl_nha_cung_cap}
          totalSupplierDebt={kpis.totalSupplierDebt}
          latestReceiptBySupplier={latestReceiptBySupplier}
        />
      </div>

      <CreateImportOrderModal
        open={importModalOpen}
        initialIngredientId={selectedIngredientId}
        onClose={() => setImportModalOpen(false)}
      />
    </PageBody>
  );
}
