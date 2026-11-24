// ============================================================================
// Định dạng hiển thị (tiếng Việt). Không chứa nghiệp vụ.
// ============================================================================

const vndFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

/** 285000 → "285.000 ₫" */
export function formatVnd(value: number | null | undefined): string {
  const n = Number.isFinite(value as number) ? Number(value) : 0;
  const sign = n < 0 ? '−' : '';
  return `${sign}${vndFormatter.format(Math.abs(Math.round(n)))} ₫`;
}

/** 285000 → "285.000" (không kèm ký hiệu — dùng khi ₫ đã nằm ở nhãn cột) */
export function formatNumber(value: number | null | undefined): string {
  return vndFormatter.format(Math.round(Number.isFinite(value as number) ? Number(value) : 0));
}

/**
 * Rút gọn tiền cho KPI: 438_500_000 → "438,5 tr ₫", 1_250_000_000 → "1,25 tỷ ₫", 48_000 → "48 nghìn ₫".
 */
export function formatVndCompact(value: number | null | undefined): string {
  const n = Number.isFinite(value as number) ? Number(value) : 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  const fmt = (x: number, digits = 1) =>
    new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(x);
  if (abs >= 1_000_000_000) return `${sign}${fmt(abs / 1_000_000_000, 2)} tỷ ₫`;
  if (abs >= 1_000_000) return `${sign}${fmt(abs / 1_000_000, 1)} tr ₫`;
  if (abs >= 1_000) return `${sign}${fmt(abs / 1_000, 0)} nghìn ₫`;
  return `${sign}${fmt(abs, 0)} ₫`;
}

/** "2026-11-24T19:42:00" | "19:42" → "19:42" */
export function formatClock(input: string | Date | null | undefined): string {
  if (!input) return '—';
  if (typeof input === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(input)) return input.slice(0, 5);
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return typeof input === 'string' ? input : '—';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** "2026-11-24" → "24/11/2026" */
export function formatDateVi(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return typeof input === 'string' ? input : '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** "2026-11-24" → "24/11" */
export function formatDayMonth(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return typeof input === 'string' ? input : '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Date → "T2, 24/11/2026" */
export function formatWeekdayDate(d: Date): string {
  return `${WEEKDAY_SHORT[d.getDay()]}, ${formatDateVi(d)}`;
}

/** Số phút đã trôi qua kể từ mốc ISO (>= 0). */
export function minutesSince(iso: string | null | undefined, now: number = Date.now()): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((now - t) / 60000));
}

/** 75 → "1g 15p" ; 42 → "42p" */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m}p`;
  return `${Math.floor(m / 60)}g ${String(m % 60).padStart(2, '0')}p`;
}

/** Lấy 1–2 chữ cái đầu của tên người Việt: "Nguyễn Thị Mai" → "NM" (họ + tên). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
