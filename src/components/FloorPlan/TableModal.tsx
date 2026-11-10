import React, { useState, useEffect } from 'react';
import { Table, TableShape, TableStatus } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { X, Plus, Check, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../Common/ConfirmModal';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableToEdit?: Table | null;
  defaultAreaId?: string;
}

export const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  onClose,
  tableToEdit,
  defaultAreaId
}) => {
  const { areas, addTable, updateTable, deleteTable } = useRestaurant();

  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState('');
  const [capacity, setCapacity] = useState<number>(4);
  const [shape, setShape] = useState<TableShape>('square');
  const [status, setStatus] = useState<TableStatus>('available');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (tableToEdit) {
      setName(tableToEdit.name);
      setAreaId(tableToEdit.areaId);
      setCapacity(tableToEdit.capacity);
      setShape(tableToEdit.shape);
      setStatus(tableToEdit.status);
    } else {
      setName('');
      setAreaId(defaultAreaId || areas[0]?.id || '');
      setCapacity(4);
      setShape('square');
      setStatus('available');
    }
  }, [tableToEdit, defaultAreaId, areas, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (tableToEdit) {
      updateTable(tableToEdit.id, {
        name: name.trim(),
        areaId,
        capacity,
        shape,
        status
      });
    } else {
      // Add table (auto-symmetrical alignment handled by context)
      addTable({
        name: name.trim(),
        areaId,
        capacity,
        shape,
        status,
        x: 50,
        y: 50
      });
    }

    onClose();
  };

  const handleConfirmDelete = () => {
    if (!tableToEdit) return;
    deleteTable(tableToEdit.id);
    setShowConfirmDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            {tableToEdit ? 'Chỉnh Sửa Thông Tin Bàn' : 'Thêm Bàn Ăn Mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Tên / Số hiệu bàn *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Bàn 08, VIP 3, Bàn Ngoài Trời 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Khu vực vị trí *
            </label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Sức chứa (Số ghế)
              </label>
              <div className="flex items-center gap-1.5">
                {[2, 4, 6, 8, 12].map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setCapacity(cap)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      capacity === cap
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Hình dáng bàn
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'square', label: 'Vuông' },
                    { id: 'round', label: 'Tròn' },
                    { id: 'rectangle', label: 'Chữ nhật' }
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShape(s.id)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                      shape === s.id
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {tableToEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Trạng thái bàn
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'available', label: 'Bàn trống', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
                  { id: 'occupied', label: 'Có khách', color: 'bg-rose-50 text-rose-700 border-rose-300' },
                  { id: 'reserved', label: 'Đã đặt trước', color: 'bg-amber-50 text-amber-700 border-amber-300' },
                  { id: 'cleaning', label: 'Cần dọn dẹp', color: 'bg-blue-50 text-blue-700 border-blue-300' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatus(st.id as TableStatus)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                      status === st.id
                        ? `${st.color} ring-2 ring-amber-500 ring-offset-1`
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {status === st.id && <Check className="w-3 h-3" />}
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {tableToEdit ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Bàn Này</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                {tableToEdit ? (
                  <>Lưu Thay Đổi</>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Thêm Bàn
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {tableToEdit && (
        <ConfirmModal
          isOpen={showConfirmDelete}
          title={`Xác nhận xóa "${tableToEdit.name}"`}
          message={`Bạn có chắc chắn muốn xóa bàn "${tableToEdit.name}" không? Hệ thống sẽ tự động tính toán và sắp xếp lại các bàn còn lại đối xứng hoàn hảo.`}
          confirmText="Xóa Bàn"
          cancelText="Giữ Lại"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
        />
      )}
    </div>
  );
};
