import React, { useState, useRef } from 'react';
import {
  Table,
  TableStatus
} from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableModal } from './TableModal';
import { ReservationModal } from './ReservationModal';
import { TransferTableModal } from './TransferTableModal';
import { ConfirmModal } from '../Common/ConfirmModal';
import {
  Plus,
  Move,
  Clock,
  User,
  Users,
  Edit2,
  Trash2,
  Receipt,
  ArrowRightLeft,
  CalendarClock,
  Sparkles,
  Layers,
  HelpCircle,
  ShoppingBag,
  RotateCcw,
  LayoutGrid,
  Grid3X3,
  AlignJustify,
  CheckCircle2
} from 'lucide-react';

interface FloorPlanViewProps {
  onOpenPOSForTable: (tableId: string) => void;
}

export const FloorPlanView: React.FC<FloorPlanViewProps> = ({ onOpenPOSForTable }) => {
  const {
    areas,
    tables,
    selectedAreaId,
    setSelectedAreaId,
    updateTablePosition,
    alignTablesSymmetrically,
    updateTableStatus,
    deleteTable,
    activeOrders,
    addArea
  } = useRestaurant();

  const [isDesignMode, setIsDesignMode] = useState<boolean>(false);
  const [viewLayoutMode, setViewLayoutMode] = useState<'canvas' | 'grid'>('canvas');
  const [filterStatus, setFilterStatus] = useState<TableStatus | 'all'>('all');
  const [selectedTableForModal, setSelectedTableForModal] = useState<Table | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [activeTableDetails, setActiveTableDetails] = useState<Table | null>(null);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  // New Area Modal state
  const [isNewAreaOpen, setIsNewAreaOpen] = useState<boolean>(false);
  const [newAreaName, setNewAreaName] = useState<string>('');

  // Dragging state
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const floorPlanRef = useRef<HTMLDivElement>(null);

  const currentAreaTables = tables.filter((t) => t.areaId === selectedAreaId);
  const filteredTables = currentAreaTables.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  // Calculate stats for current area
  const areaOccupied = currentAreaTables.filter((t) => t.status === 'occupied').length;
  const areaAvailable = currentAreaTables.filter((t) => t.status === 'available').length;
  const areaReserved = currentAreaTables.filter((t) => t.status === 'reserved').length;
  const areaCleaning = currentAreaTables.filter((t) => t.status === 'cleaning').length;

  // Drag handling with Snap-to-Grid for symmetry (snaps to nearest 5%)
  const handleMouseDown = (tableId: string, e: React.MouseEvent) => {
    if (!isDesignMode) return;
    e.preventDefault();
    setDraggingTableId(tableId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTableId || !floorPlanRef.current) return;
    const rect = floorPlanRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Snap to 5% increments for precision alignment
    const snapGridStep = 5;
    const snappedX = Math.round(rawX / snapGridStep) * snapGridStep;
    const snappedY = Math.round(rawY / snapGridStep) * snapGridStep;
    
    updateTablePosition(draggingTableId, snappedX, snappedY);
  };

  const handleMouseUp = () => {
    setDraggingTableId(null);
  };

  // Format elapsed time for occupied tables
  const getElapsedMinutes = (occupiedSince?: string) => {
    if (!occupiedSince) return 0;
    const diffMs = Date.now() - new Date(occupiedSince).getTime();
    return Math.floor(diffMs / 60000);
  };

  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    addArea(newAreaName.trim());
    setNewAreaName('');
    setIsNewAreaOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar: Area Tabs, Layout View Switcher, Design Switcher, Status Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Area Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {areas.map((area) => {
                const count = tables.filter((t) => t.areaId === area.id).length;
                const isSelected = selectedAreaId === area.id;
                return (
                  <button
                    key={area.id}
                    onClick={() => {
                      setSelectedAreaId(area.id);
                      setActiveTableDetails(null);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <span>{area.name}</span>
                    <span
                      className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => setIsNewAreaOpen(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                title="Thêm khu vực / Tầng mới"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switchers: View Mode, Auto-Align Symmetry, Design Mode, Add Table */}
          <div className="flex items-center flex-wrap gap-2.5 self-start xl:self-auto">
            {/* View Mode Toggle: 2D Spatial Canvas vs Symmetrical Grid Matrix */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewLayoutMode('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewLayoutMode === 'canvas'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Sơ đồ 2D Không gian"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Sơ đồ 2D</span>
              </button>
              <button
                onClick={() => setViewLayoutMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewLayoutMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Danh sách Lưới đối xứng"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Lưới Đối Xứng</span>
              </button>
            </div>

            {/* Auto-Align Symmetry Indicator (Automated, no click needed) */}
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs select-none"
              title="Sơ đồ bàn luôn tự động căn chỉnh đối xứng đa trục khi thêm hoặc xóa bàn"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Tự Động Căn Đối Xứng</span>
            </div>

            {/* Design Mode Toggle */}
            <button
              onClick={() => setIsDesignMode(!isDesignMode)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                isDesignMode
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/30'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Move className="w-4 h-4" />
              <span>{isDesignMode ? 'Đang Thiết Kế' : 'Thiết Kế Mặt Bằng'}</span>
            </button>

            {/* Add Table Button */}
            <button
              onClick={() => {
                setSelectedTableForModal(null);
                setIsTableModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Bàn Mới</span>
            </button>
          </div>
        </div>

        {/* Status Filters & Quick Area Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-medium mr-1">Bộ lọc:</span>
            {[
              { id: 'all', label: `Tất cả (${currentAreaTables.length})`, color: 'bg-slate-100 text-slate-700' },
              { id: 'available', label: `Bàn trống (${areaAvailable})`, color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
              { id: 'occupied', label: `Có khách (${areaOccupied})`, color: 'bg-rose-50 text-rose-700 border border-rose-200' },
              { id: 'reserved', label: `Đã đặt (${areaReserved})`, color: 'bg-amber-50 text-amber-700 border border-amber-200' },
              { id: 'cleaning', label: `Cần dọn (${areaCleaning})`, color: 'bg-blue-50 text-blue-700 border border-blue-200' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id as TableStatus | 'all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterStatus === f.id
                    ? `${f.color} ring-2 ring-slate-900 ring-offset-1`
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isDesignMode ? (
            <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Chế độ thiết kế: Kéo thả bàn để di chuyển vị trí theo ý muốn</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> Trống: {areaAvailable}
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 ml-2"></span> Có khách: {areaOccupied}
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-2"></span> Đã đặt: {areaReserved}
            </div>
          )}
        </div>
      </div>

      {/* Main Floor Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: 2D Interactive Floor Canvas OR Symmetrical Grid Matrix */}
        <div className="lg:col-span-3">
          {viewLayoutMode === 'canvas' ? (
            /* 2D Floor Plan Canvas with Symmetrical Blueprint Grid */
            <div
              ref={floorPlanRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`relative w-full h-[600px] bg-slate-950 rounded-2xl border-2 overflow-hidden shadow-inner select-none transition-colors ${
                isDesignMode
                  ? 'border-amber-500/80 bg-[radial-gradient(#475569_1.5px,transparent_1.5px)] [background-size:28px_28px]'
                  : 'border-slate-800 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:28px_28px]'
              }`}
            >
              {/* Symmetrical Guide Lines (Subtle Crosshairs) */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                {/* Center Horizontal & Vertical Symmetry Axes */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-amber-400/40 -translate-x-1/2 border-r border-dashed border-amber-400"></div>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-400/40 -translate-y-1/2 border-b border-dashed border-amber-400"></div>
                {/* Quarter guidelines */}
                <div className="absolute left-1/4 top-0 bottom-0 w-px border-r border-dotted border-slate-600"></div>
                <div className="absolute left-3/4 top-0 bottom-0 w-px border-r border-dotted border-slate-600"></div>
                <div className="absolute top-1/4 left-0 right-0 h-px border-b border-dotted border-slate-600"></div>
                <div className="absolute top-3/4 left-0 right-0 h-px border-b border-dotted border-slate-600"></div>
              </div>

              {/* Floor Map Header Overlay */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/70 text-xs text-slate-200 shadow-md">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">{areas.find((a) => a.id === selectedAreaId)?.name}</span>
                <span className="text-slate-500">•</span>
                <span>{filteredTables.length} bàn</span>
              </div>

              {/* Quick Add Table Action on Canvas */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedTableForModal(null);
                    setIsTableModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-400 hover:text-amber-300 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-bold shadow-md transition-all"
                  title="Thêm bàn mới vào khu vực này"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Bàn</span>
                </button>
              </div>

              {/* Tables on the Floor Plan - Standardized Equal Sizes */}
              {filteredTables.map((table) => {
                const order = activeOrders.find((o) => o.tableId === table.id && o.status === 'active');
                const elapsedMinutes = table.occupiedSince ? getElapsedMinutes(table.occupiedSince) : 0;
                const isSelected = activeTableDetails?.id === table.id;

                // Color styles according to status
                let statusBorder = 'border-emerald-500/70 bg-emerald-950/60 text-emerald-300 hover:border-emerald-400 shadow-emerald-950/40';
                let statusBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                let statusText = 'Bàn Trống';

                if (table.status === 'occupied') {
                  statusBorder = 'border-rose-500/80 bg-rose-950/70 text-rose-200 hover:border-rose-400 shadow-rose-950/60';
                  statusBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                  statusText = 'Có Khách';
                } else if (table.status === 'reserved') {
                  statusBorder = 'border-amber-500/80 bg-amber-950/70 text-amber-200 hover:border-amber-400 shadow-amber-950/60';
                  statusBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  statusText = 'Đã Đặt';
                } else if (table.status === 'cleaning') {
                  statusBorder = 'border-blue-500/80 bg-blue-950/70 text-blue-200 hover:border-blue-400 shadow-blue-950/60';
                  statusBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
                  statusText = 'Cần Dọn';
                }

                // Standardized Equal Sizing for ALL tables (w-36 h-36 = 144px x 144px)
                const shapeRounding = table.shape === 'round' ? 'rounded-full' : 'rounded-2xl';

                return (
                  <div
                    key={table.id}
                    style={{
                      left: `${table.x}%`,
                      top: `${table.y}%`,
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      cursor: isDesignMode ? 'grab' : 'pointer'
                    }}
                    onMouseDown={(e) => handleMouseDown(table.id, e)}
                    onClick={() => {
                      if (!isDesignMode) {
                        setActiveTableDetails(table);
                      }
                    }}
                    className={`group transition-all select-none ${
                      draggingTableId === table.id ? 'opacity-80 scale-105 z-30' : 'z-20'
                    }`}
                  >
                    {/* Symmetrical Surrounding Chairs Simulation */}
                    <div className="absolute inset-0 -m-3 pointer-events-none">
                      {Array.from({ length: Math.min(table.capacity, 8) }).map((_, idx) => {
                        const count = Math.min(table.capacity, 8);
                        const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
                        const radius = 54; // Symmetrical uniform radius
                        const chairX = 50 + Math.cos(angle) * radius;
                        const chairY = 50 + Math.sin(angle) * radius;
                        return (
                          <div
                            key={idx}
                            style={{ left: `${chairX}%`, top: `${chairY}%` }}
                            className={`absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${
                              table.status === 'occupied'
                                ? 'bg-rose-500/80 border-rose-400 shadow-xs shadow-rose-500/50'
                                : table.status === 'reserved'
                                ? 'bg-amber-500/80 border-amber-400'
                                : 'bg-slate-700 border-slate-600'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Standardized Equal Table Body (w-36 h-36) */}
                    <div
                      className={`w-36 h-36 ${shapeRounding} border-2 ${statusBorder} flex flex-col items-center justify-center p-2.5 text-center shadow-lg transition-all ${
                        isSelected ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-950 scale-105' : 'hover:scale-102'
                      }`}
                    >
                      {/* Table Name */}
                      <div className="font-extrabold text-sm text-white tracking-wide truncate max-w-[120px]">
                        {table.name}
                      </div>

                      {/* Status Pill */}
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${statusBadge}`}>
                        {statusText}
                      </div>

                      {/* Capacity & Live Info */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-300 mt-1 font-medium">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{table.capacity} chỗ</span>
                      </div>

                      {/* Live Details */}
                      {table.status === 'occupied' && (
                        <div className="flex items-center gap-1 text-[10px] text-rose-300 font-semibold mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{elapsedMinutes} ph</span>
                          {order && order.finalTotal > 0 && (
                            <span className="text-amber-400 font-bold ml-0.5">
                              • {(order.finalTotal / 1000).toFixed(0)}k
                            </span>
                          )}
                        </div>
                      )}

                      {table.status === 'reserved' && table.reservation && (
                        <div className="text-[10px] text-amber-300 font-semibold truncate max-w-[110px] mt-0.5">
                          {table.reservation.reservationTime} • {table.reservation.customerName}
                        </div>
                      )}

                      {/* Quick Controls on Table (Always accessible on hover or in design mode) */}
                      <div className={`absolute -top-2.5 -right-2.5 flex items-center gap-1 bg-slate-900/95 rounded-lg p-1 border border-slate-700 shadow-xl transition-all ${
                        isDesignMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTableForModal(table);
                            setIsTableModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                          title="Sửa bàn"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTableToDelete(table);
                          }}
                          className="p-1 hover:bg-rose-900/60 rounded text-rose-400 hover:text-rose-200 transition-colors"
                          title="Xóa bàn này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTables.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <Layers className="w-12 h-12 mb-2 stroke-1 text-slate-600" />
                  <p className="text-sm font-medium">Chưa có bàn nào trong khu vực này</p>
                  <button
                    onClick={() => {
                      setSelectedTableForModal(null);
                      setIsTableModalOpen(true);
                    }}
                    className="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Bàn Ăn Ngay</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Symmetrical Grid Matrix View: Uniform Cards */
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 min-h-[600px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <LayoutGrid className="w-4 h-4 text-amber-600" />
                  <span>Danh Sách Lưới Đối Xứng ({filteredTables.length} bàn)</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedTableForModal(null);
                    setIsTableModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Bàn Mới</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTables.map((table) => {
                  const order = activeOrders.find((o) => o.tableId === table.id && o.status === 'active');
                  const elapsedMinutes = table.occupiedSince ? getElapsedMinutes(table.occupiedSince) : 0;
                  const isSelected = activeTableDetails?.id === table.id;

                  let borderClass = 'border-slate-200 bg-white hover:border-slate-300';
                  let statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  let statusText = 'Bàn Trống';

                  if (table.status === 'occupied') {
                    borderClass = 'border-rose-200 bg-rose-50/30 hover:border-rose-300';
                    statusBadge = 'bg-rose-100 text-rose-800 border-rose-200';
                    statusText = 'Có Khách';
                  } else if (table.status === 'reserved') {
                    borderClass = 'border-amber-200 bg-amber-50/30 hover:border-amber-300';
                    statusBadge = 'bg-amber-100 text-amber-800 border-amber-200';
                    statusText = 'Đã Đặt';
                  } else if (table.status === 'cleaning') {
                    borderClass = 'border-blue-200 bg-blue-50/30 hover:border-blue-300';
                    statusBadge = 'bg-blue-100 text-blue-800 border-blue-200';
                    statusText = 'Cần Dọn';
                  }

                  return (
                    <div
                      key={table.id}
                      onClick={() => setActiveTableDetails(table)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between h-[180px] shadow-xs ${borderClass} ${
                        isSelected ? 'ring-2 ring-amber-500 border-amber-500 shadow-md' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-extrabold text-base text-slate-900">{table.name}</div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>{table.capacity} chỗ</span>
                            <span>•</span>
                            <span className="capitalize">
                              {table.shape === 'square' ? 'Vuông' : table.shape === 'round' ? 'Tròn' : 'Chữ nhật'}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge}`}>
                          {statusText}
                        </span>
                      </div>

                      {/* Content Area */}
                      <div className="my-auto py-2">
                        {table.status === 'occupied' && order ? (
                          <div className="flex items-center justify-between text-xs bg-rose-100/60 px-2.5 py-1.5 rounded-lg border border-rose-200">
                            <span className="font-bold text-rose-900">{order.code} ({elapsedMinutes} ph)</span>
                            <span className="font-extrabold text-amber-800">
                              {order.finalTotal.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        ) : table.status === 'reserved' && table.reservation ? (
                          <div className="text-xs text-amber-800 bg-amber-100/60 px-2.5 py-1.5 rounded-lg border border-amber-200 truncate">
                            <span className="font-bold">{table.reservation.reservationTime}</span> - {table.reservation.customerName}
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sẵn sàng đón khách</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Actions */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPOSForTable(table.id);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{table.status === 'occupied' ? 'Xem đơn / Thu ngân' : 'Mở bàn & Gọi món'}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTableForModal(table);
                            setIsTableModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Sửa bàn"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTableToDelete(table);
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa bàn này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Table Detail & Instant Action Panel */}
        <div className="lg:col-span-1">
          {activeTableDetails ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{activeTableDetails.name}</h3>
                    <p className="text-xs text-slate-500">
                      {areas.find((a) => a.id === activeTableDetails.areaId)?.name}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      activeTableDetails.status === 'occupied'
                        ? 'bg-rose-100 text-rose-800'
                        : activeTableDetails.status === 'reserved'
                        ? 'bg-amber-100 text-amber-800'
                        : activeTableDetails.status === 'cleaning'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {activeTableDetails.status === 'occupied'
                      ? 'Có khách'
                      : activeTableDetails.status === 'reserved'
                      ? 'Đã đặt'
                      : activeTableDetails.status === 'cleaning'
                      ? 'Cần dọn dẹp'
                      : 'Bàn trống'}
                  </span>
                </div>

                {/* Table Metrics */}
                <div className="grid grid-cols-2 gap-2 py-3">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Sức chứa</span>
                    <span className="font-bold text-sm text-slate-800">
                      {activeTableDetails.capacity} khách
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Kiểu dáng</span>
                    <span className="font-bold text-sm text-slate-800 capitalize">
                      {activeTableDetails.shape === 'square'
                        ? 'Hình vuông'
                        : activeTableDetails.shape === 'round'
                        ? 'Hình tròn'
                        : 'Hình chữ nhật'}
                    </span>
                  </div>
                </div>

                {/* Occupied State Details */}
                {activeTableDetails.status === 'occupied' && (
                  <div className="space-y-3 pt-2">
                    {(() => {
                      const order = activeOrders.find((o) => o.tableId === activeTableDetails.id);
                      if (!order) return null;
                      return (
                        <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/70 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-900">{order.code}</span>
                            <span className="text-amber-700">
                              {order.customerName} ({order.customerCount} khách)
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 divide-y divide-amber-200/50 max-h-36 overflow-y-auto pr-1">
                            {order.items.map((it) => (
                              <div key={it.id} className="py-1 flex items-center justify-between">
                                <span>
                                  {it.quantity}x {it.name}
                                </span>
                                <span className="font-semibold text-slate-700">
                                  {(it.price * it.quantity).toLocaleString('vi-VN')} ₫
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-amber-200 flex items-center justify-between font-bold text-sm text-slate-900">
                            <span>Tạm tính:</span>
                            <span className="text-amber-600">
                              {order.finalTotal.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Reserved Details */}
                {activeTableDetails.status === 'reserved' && activeTableDetails.reservation && (
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <User className="w-3.5 h-3.5" />
                      <span>{activeTableDetails.reservation.customerName}</span>
                    </div>
                    <div className="text-slate-600">SĐT: {activeTableDetails.reservation.phone}</div>
                    <div className="text-slate-600">
                      Giờ đến: <span className="font-bold">{activeTableDetails.reservation.reservationTime}</span> ({activeTableDetails.reservation.guestCount} người)
                    </div>
                    {activeTableDetails.reservation.notes && (
                      <div className="text-amber-800 italic pt-1 border-t border-amber-200/60">
                        "{activeTableDetails.reservation.notes}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                {/* Primary Action Button */}
                {activeTableDetails.status === 'available' ? (
                  <button
                    onClick={() => onOpenPOSForTable(activeTableDetails.id)}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Mở Bàn & Đặt Món
                  </button>
                ) : activeTableDetails.status === 'occupied' ? (
                  <button
                    onClick={() => onOpenPOSForTable(activeTableDetails.id)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4 text-amber-400" />
                    Xem Đơn & Thu Ngân
                  </button>
                ) : activeTableDetails.status === 'reserved' ? (
                  <button
                    onClick={() => onOpenPOSForTable(activeTableDetails.id)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Nhận Khách & Gọi Món
                  </button>
                ) : (
                  <button
                    onClick={() => updateTableStatus(activeTableDetails.id, 'available')}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Đã Dọn Xong (Mở Lại Bàn)
                  </button>
                )}

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsReserveModalOpen(true)}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                    Đặt bàn
                  </button>

                  <button
                    disabled={activeTableDetails.status !== 'occupied'}
                    onClick={() => setIsTransferModalOpen(true)}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
                    Chuyển bàn
                  </button>
                </div>

                {/* Table Management Actions: Edit & Delete */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedTableForModal(activeTableDetails);
                      setIsTableModalOpen(true);
                    }}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Sửa bàn</span>
                  </button>

                  <button
                    onClick={() => {
                      setTableToDelete(activeTableDetails);
                    }}
                    className="py-2 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Xóa bàn này</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-300 stroke-1" />
              <div>
                <p className="font-semibold text-slate-700 text-sm">Chưa chọn bàn nào</p>
                <p className="text-xs text-slate-400 mt-1">
                  Nhấp vào một bàn trên sơ đồ để xem chi tiết, gọi món hoặc thanh toán
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Table Modal */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => {
          setIsTableModalOpen(false);
          setSelectedTableForModal(null);
        }}
        tableToEdit={selectedTableForModal}
        defaultAreaId={selectedAreaId}
      />

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        table={activeTableDetails}
      />

      {/* Transfer Table Modal */}
      <TransferTableModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        sourceTable={activeTableDetails}
      />

      {/* Create New Area Modal */}
      {isNewAreaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-3">Thêm Khu Vực / Tầng Mới</h3>
            <form onSubmit={handleAddArea} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tên khu vực *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="VD: Tầng 3 - Sân Thượng, Khu Bar..."
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewAreaOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                >
                  Tạo Khu Vực
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Table In-App Confirm Modal */}
      <ConfirmModal
        isOpen={!!tableToDelete}
        title={`Xác nhận xóa bàn "${tableToDelete?.name}"`}
        message={`Bạn có chắc chắn muốn xóa bàn "${tableToDelete?.name}" không? Toàn bộ sơ đồ các bàn còn lại trong khu vực sẽ tự động được căn chỉnh lại đối xứng hoàn hảo.`}
        confirmText="Xác Nhận Xóa"
        cancelText="Hủy Bỏ"
        variant="danger"
        onConfirm={() => {
          if (tableToDelete) {
            deleteTable(tableToDelete.id);
            if (activeTableDetails?.id === tableToDelete.id) {
              setActiveTableDetails(null);
            }
            setTableToDelete(null);
          }
        }}
        onClose={() => setTableToDelete(null)}
      />
    </div>
  );
};
