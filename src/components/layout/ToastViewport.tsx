import { useEffect } from 'react';
import { Bell, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { IconButton } from '@/components/ui/Button';

const TONE_STYLE = {
  success: { box: 'border-st-empty/40', icon: 'bg-st-empty-soft text-st-empty-ink', Icon: CheckCircle2 },
  warning: { box: 'border-st-booked/40', icon: 'bg-st-booked-soft text-st-booked-ink', Icon: TriangleAlert },
  error: { box: 'border-st-serving/40', icon: 'bg-st-serving-soft text-st-serving-ink', Icon: Info },
} as const;

/**
 * Thông báo nổi góc phải dưới:
 *  - lastBannerAlert của store (tự tắt sau 6 giây; lỗi RBAC 403 giữ 9 giây)
 *  - Chuông "Ting" từ bếp (giữ đến khi bấm "Đã bưng")
 */
export function ToastViewport() {
  const alert = useRestaurantStore((s) => s.lastBannerAlert);
  const clearAlert = useRestaurantStore((s) => s.clearAlert);
  const tings = useRestaurantStore((s) => s.tingNotifications).filter((n) => !n.da_doc);
  const dismissTing = useRestaurantStore((s) => s.dismissTingNotification);

  useEffect(() => {
    if (!alert) return;
    const id = window.setTimeout(clearAlert, alert.type === 'error' ? 9000 : 6000);
    return () => window.clearTimeout(id);
  }, [alert, clearAlert]);

  const style = alert ? TONE_STYLE[alert.type] : null;

  return (
    <div
      className="no-print pointer-events-none fixed top-20 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
      aria-live="polite"
    >
      {alert && style && (
        <div
          role={alert.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex animate-rise items-start gap-3 rounded-lg border bg-paper p-3.5 shadow-pop',
            style.box,
          )}
        >
          <span aria-hidden className={cn('grid size-8 shrink-0 place-items-center rounded-full', style.icon)}>
            <style.Icon size={16} />
          </span>
          <p className="min-w-0 flex-1 pt-1 text-sm leading-snug text-ink">{alert.text}</p>
          <IconButton label="Đóng thông báo" onClick={clearAlert} className="-mt-1 -mr-1 size-8">
            <X size={15} />
          </IconButton>
        </div>
      )}

      {tings.slice(0, 3).map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto flex animate-rise items-start gap-3 rounded-lg border border-gold/50 bg-paper p-3.5 shadow-pop"
        >
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-ink">
            <Bell size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug text-ink">
              <span className="font-medium">Ting!</span> {n.ten_mon_an} đã xong · {n.ten_ban}
            </p>
            <button
              type="button"
              onClick={() => dismissTing(n.id)}
              className="mt-1.5 text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              Đã bưng ra bàn
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
