import React from 'react';
import { Bell, CheckCircle2, Clock, Trash2, UserCheck, AlertTriangle } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({ isOpen, onClose }) => {
  const { serviceRequests, updateServiceRequestStatus, deleteServiceRequest } = useRestaurant();

  if (!isOpen) return null;

  const pendingList = serviceRequests.filter((r) => r.status !== 'resolved');
  const resolvedList = serviceRequests.filter((r) => r.status === 'resolved');

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Yêu Cầu Hỗ Trợ Từ Khách Hàng</h3>
              <p className="text-xs text-slate-400">
                {pendingList.length} yêu cầu đang chờ phục vụ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Request List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Pending Requests Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span>Đang Chờ Xử Lý ({pendingList.length})</span>
            </div>

            {pendingList.length > 0 ? (
              pendingList.map((req) => (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    req.status === 'attending'
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-rose-50/80 border-rose-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-slate-950 text-amber-400">
                        {req.tableName}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{req.title}</h4>
                    </div>

                    {req.note && (
                      <p className="text-xs text-slate-600 italic bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/60 inline-block">
                        Ghi chú: "{req.note}"
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Thời gian: {new Date(req.createdAt).toLocaleTimeString('vi-VN')}</span>
                      {req.staffName && (
                        <span className="font-semibold text-amber-700">Phụ trách: {req.staffName}</span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Buttons for Staff */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {req.status === 'pending' && (
                      <button
                        onClick={() => updateServiceRequestStatus(req.id, 'attending', 'Phục vụ ca')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Đang Đến</span>
                      </button>
                    )}

                    <button
                      onClick={() => updateServiceRequestStatus(req.id, 'resolved', 'Phục vụ ca')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xong</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                Hiện không có yêu cầu hỗ trợ nào đang chờ xử lý!
              </div>
            )}
          </div>

          {/* Resolved History Section */}
          {resolvedList.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Đã Hoàn Thành Gần Đây ({resolvedList.length})</span>
              </div>

              <div className="space-y-2 opacity-75">
                {resolvedList.slice(0, 5).map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-bold text-slate-800">{req.tableName}:</span>
                      <span className="text-slate-600">{req.title}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <span>{new Date(req.resolvedAt || req.createdAt).toLocaleTimeString('vi-VN')}</span>
                      <button
                        onClick={() => deleteServiceRequest(req.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        title="Xóa yêu cầu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
