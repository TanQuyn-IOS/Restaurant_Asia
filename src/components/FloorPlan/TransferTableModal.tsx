import React, { useState } from 'react';
import { Table } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { X, ArrowRightLeft, Check } from 'lucide-react';

interface TransferTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTable: Table | null;
}

export const TransferTableModal: React.FC<TransferTableModalProps> = ({
  isOpen,
  onClose,
  sourceTable
}) => {
  const { tables, areas, transferTable } = useRestaurant();
  const [selectedTargetTableId, setSelectedTargetTableId] = useState<string>('');

  if (!isOpen || !sourceTable) return null;

  // Only tables that are not the current source table and not currently occupied
  const availableTargetTables = tables.filter(
    (t) => t.id !== sourceTable.id && t.status !== 'occupied'
  );

  const handleConfirm = () => {
    if (!selectedTargetTableId) return;
    transferTable(sourceTable.id, selectedTargetTableId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
            <ArrowRightLeft className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Chuyển Bàn / Đổi Bàn</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200/60 text-xs text-amber-900">
            <p className="font-semibold mb-0.5">Bàn hiện tại: <span className="font-bold text-amber-700">{sourceTable.name}</span></p>
            <p className="text-amber-800/80">
              Đơn hàng và các món đang phục vụ sẽ tự động chuyển sang bàn mới.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Chọn bàn trống muốn chuyển tới:
            </label>
            {availableTargetTables.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center italic bg-slate-50 rounded-xl border border-slate-200">
                Không còn bàn trống nào trong hệ thống!
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {availableTargetTables.map((t) => {
                  const area = areas.find((a) => a.id === t.areaId);
                  const isSelected = selectedTargetTableId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTargetTableId(t.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-3" />
                        </div>
                      )}
                      <div className="font-bold text-sm text-slate-800">{t.name}</div>
                      <div className="text-xs text-slate-500">{area?.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{t.capacity} chỗ ngồi</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!selectedTargetTableId}
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Xác Nhận Chuyển Bàn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
