import { useEffect, useState } from 'react';

/**
 * Ngày "hôm nay" của bộ dữ liệu mẫu (seed). Store dùng cùng mốc này để phân loại nghỉ phép
 * Đã nghỉ / Đang nghỉ / Sắp nghỉ (classifyLeaveThreeState). Các màn hình Nhân sự lọc theo mốc này.
 */
export const DEMO_TODAY = '2026-11-24';

/** Đồng hồ sống — cập nhật mỗi `intervalMs` (mặc định 30s). */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
