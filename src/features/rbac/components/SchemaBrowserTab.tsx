import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Database, Lock, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import type { DatabaseSnapshot, RoleCode } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Form';
import { EmptyState, Table, Td, Th, Tr } from '@/components/ui/Misc';
import {
  formatSchemaCell,
  isTableRestrictedForRole,
  paginateRecords,
  SCHEMA_PAGE_SIZE,
} from '../rbacHelpers';
import type { TableBrowserSummary } from '../useRbacData';

interface SchemaBrowserTabProps {
  tableSummaries: TableBrowserSummary[];
  totalRecords: number;
  currentRole: RoleCode;
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/** Tab 03: Trình duyệt trực tiếp 27 bảng 3NF (trái: tìm kiếm danh sách bảng · phải: bảng phân trang 10 dòng/trang). */
export function SchemaBrowserTab({
  tableSummaries,
  totalRecords,
  currentRole,
}: SchemaBrowserTabProps) {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const [tableQuery, setTableQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<keyof DatabaseSnapshot>('tbl_ban');
  const [page, setPage] = useState(1);

  const filteredTables = useMemo(() => {
    const q = normalizeSearch(tableQuery);
    if (!q) return tableSummaries;
    return tableSummaries.filter(({ meta }) => {
      const haystack = normalizeSearch(`${meta.key} ${meta.label} ${meta.moduleCode}`);
      return haystack.includes(q);
    });
  }, [tableSummaries, tableQuery]);

  const activeSummary = useMemo(
    () =>
      tableSummaries.find((t) => t.meta.key === selectedTable) ?? tableSummaries[0] ?? null,
    [tableSummaries, selectedTable],
  );

  const restricted = isTableRestrictedForRole(selectedTable, currentRole);

  const rawRows = useMemo(() => {
    if (restricted) return [];
    return snapshot[selectedTable] as unknown as Record<string, unknown>[];
  }, [snapshot, selectedTable, restricted]);

  const columns = useMemo(
    () => (rawRows.length > 0 ? Object.keys(rawRows[0]) : []),
    [rawRows],
  );

  const pagination = useMemo(
    () => paginateRecords(rawRows, page, SCHEMA_PAGE_SIZE),
    [rawRows, page],
  );

  const handleSelectTable = (key: keyof DatabaseSnapshot) => {
    setSelectedTable(key);
    setPage(1);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Cột trái (4/12): Danh sách tìm kiếm 27 bảng 3NF */}
      <Card className="flex flex-col lg:col-span-4 xl:col-span-3">
        <CardHeader
          title="27 bảng 3NF"
          subtitle={`Tổng ${totalRecords} bản ghi đang lưu`}
        />
        <CardBody className="space-y-3 pt-3">
          <div className="relative">
            <Search
              size={15}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
            />
            <Input
              type="search"
              aria-label="Tìm tên bảng dữ liệu 3NF"
              placeholder="Tìm bảng tbl_..."
              value={tableQuery}
              onChange={(e) => setTableQuery(e.target.value)}
              className="h-9 pl-9"
            />
          </div>

          <div
            role="listbox"
            aria-label="Danh sách 27 bảng cơ sở dữ liệu 3NF"
            className="scroll-quiet max-h-[540px] space-y-1 overflow-y-auto pr-1"
          >
            {filteredTables.length === 0 ? (
              <p className="py-8 text-center text-xs text-ink-muted">
                Không tìm thấy bảng phù hợp.
              </p>
            ) : (
              filteredTables.map(({ meta, rowCount }) => {
                const isSelected = meta.key === selectedTable;
                const isLocked = isTableRestrictedForRole(meta.key, currentRole);
                return (
                  <button
                    key={meta.key}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectTable(meta.key)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors',
                      isSelected
                        ? 'border-primary bg-primary-soft/65 text-primary'
                        : 'border-transparent bg-paper text-ink hover:bg-paper-warm',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="num truncate text-xs font-medium">{meta.key}</span>
                        {isLocked && (
                          <Lock
                            size={11}
                            aria-label="Ẩn theo FR-19"
                            className="shrink-0 text-st-serving-ink"
                          />
                        )}
                      </div>
                      <p
                        className={cn(
                          'truncate text-xs',
                          isSelected ? 'text-primary/80' : 'text-ink-muted',
                        )}
                      >
                        {meta.label}
                      </p>
                    </div>
                    <Badge
                      tone={isSelected ? 'primary' : 'neutral'}
                      size="sm"
                      className="num shrink-0"
                    >
                      {rowCount}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </CardBody>
      </Card>

      {/* Cột phải (8/12): Bảng dữ liệu phân trang 10 dòng/trang */}
      <Card className="flex flex-col lg:col-span-8 xl:col-span-9">
        <CardHeader
          title={
            <span className="flex flex-wrap items-center gap-2">
              <Database size={16} aria-hidden className="text-primary" />
              <span className="num">{selectedTable}</span>
              {activeSummary && (
                <Badge tone="neutral" size="sm">
                  {activeSummary.meta.moduleCode}
                </Badge>
              )}
            </span>
          }
          subtitle={
            activeSummary
              ? `${activeSummary.meta.label} · ${activeSummary.rowCount} bản ghi${
                  columns.length > 0 ? ` · ${columns.length} cột` : ''
                }`
              : undefined
          }
          action={
            !restricted && pagination.totalItems > 0 && (
              <span className="num text-xs text-ink-muted">
                Dòng {pagination.startIndex}–{pagination.endIndex} / {pagination.totalItems}
              </span>
            )
          }
        />

        <div className="mt-4 flex-1">
          {restricted ? (
            <EmptyState
              icon={<Lock size={22} />}
              title="Bản ghi tài chính được bảo vệ theo quy tắc FR-19"
              description={`Bảng ${selectedTable} chứa dữ liệu doanh thu, dòng tiền hoặc giá vốn nhập kho. Chỉ Chủ nhà hàng (Owner) được xem chi tiết các bản ghi này.`}
            />
          ) : rawRows.length === 0 ? (
            <EmptyState
              icon={<Database size={22} />}
              title={`Bảng ${selectedTable} chưa có bản ghi`}
              description="Khi phát sinh nghiệp vụ liên quan (ví dụ thanh toán hóa đơn), bản ghi mới sẽ xuất hiện tức thì tại đây."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th className="w-12">#</Th>
                  {columns.map((col) => (
                    <Th key={col} className="normal-case tracking-normal">
                      {col}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((row, idx) => {
                  const rowNum = pagination.startIndex + idx;
                  return (
                    <Tr key={`${selectedTable}-${rowNum}`}>
                      <Td className="num text-xs text-ink-muted">{rowNum}</Td>
                      {columns.map((col) => {
                        const cell = formatSchemaCell(selectedTable, col, row[col], currentRole);
                        return (
                          <Td key={col} className="py-3">
                            {cell.masked ? (
                              <Badge
                                tone="neutral"
                                size="sm"
                                icon={<Lock size={11} aria-hidden />}
                                title={cell.tooltip}
                              >
                                {cell.display}
                              </Badge>
                            ) : (
                              <span
                                title={cell.tooltip}
                                className={cn(
                                  'num block max-w-[220px] truncate text-xs',
                                  cell.isNull ? 'text-ink-faint italic' : 'text-ink-soft',
                                )}
                              >
                                {cell.display}
                              </span>
                            )}
                          </Td>
                        );
                      })}
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>

        <CardFooter>
          <span className="num text-xs text-ink-muted">
            Trang {pagination.page} / {pagination.totalPages} · Tối đa {SCHEMA_PAGE_SIZE} bản ghi / trang
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<ChevronLeft size={14} />}
              disabled={restricted || pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trang trước
            </Button>
            <Button
              size="sm"
              variant="secondary"
              iconRight={<ChevronRight size={14} />}
              disabled={restricted || pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              Trang sau
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
