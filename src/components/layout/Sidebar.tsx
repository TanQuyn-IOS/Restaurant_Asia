import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronsUpDown, KeyRound, Lock, LogOut } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/clock';
import { ROLE_META } from '@/lib/labels';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Avatar, ProgressBar } from '@/components/ui/Misc';
import { StatusDot } from '@/components/ui/Badge';
import { NAV_GROUPS, canAccess } from '@/app/nav.config';

/** Logo AC-RMS: bát + đũa trên nền chu sa. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-white', className)}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12.5h16a8 8 0 0 1-16 0Z" />
        <path d="M8 3.5 12.5 10M12 3l5 6.5" />
      </svg>
    </span>
  );
}

/** Ca đang diễn ra theo giờ máy: chọn ca bắt đầu muộn nhất đang chứa thời điểm hiện tại. */
function useCurrentShift() {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const now = useNow(30_000);
  return useMemo(() => {
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };
    const active = snapshot.tbl_ca_lam_viec
      .map((c) => ({ c, start: toMin(c.gio_bat_dau), end: toMin(c.gio_ket_thuc) }))
      .filter((x) => minutesNow >= x.start && minutesNow < x.end)
      .sort((a, b) => b.start - a.start)[0];
    if (!active) return null;
    const onDuty = snapshot.tbl_phan_cong_ca.filter(
      (p) => p.ma_ca === active.c.ma_ca && p.trang_thai_ca === 'DangTruc',
    ).length;
    const total = active.end - active.start;
    const left = active.end - minutesNow;
    return {
      name: active.c.ten_ca.replace(/\s*\(.*\)\s*$/, ''),
      range: `${active.c.gio_bat_dau.slice(0, 5)} – ${active.c.gio_ket_thuc.slice(0, 5)}`,
      left,
      pct: ((total - left) / total) * 100,
      onDuty,
    };
  }, [snapshot, now]);
}

function ShiftCard() {
  const shift = useCurrentShift();
  return (
    <div className="rounded-lg border border-chrome-line bg-chrome-raised p-3.5">
      <p className="flex items-center gap-2 text-xs font-medium tracking-[0.12em] text-chrome-muted uppercase">
        <StatusDot tone={shift ? 'success' : 'neutral'} pulse={Boolean(shift)} />
        Ca đang diễn ra
      </p>
      {shift ? (
        <>
          <p className="mt-2 text-sm font-medium text-chrome-ink">{shift.name}</p>
          <p className="num mt-0.5 text-xs text-chrome-muted">
            {shift.range} · còn {Math.floor(shift.left / 60)}g {String(shift.left % 60).padStart(2, '0')}p
          </p>
          <ProgressBar value={shift.pct} tone="gold" label="Tiến độ ca" className="mt-3 bg-chrome-line" />
          <p className="num mt-2.5 text-right text-xs text-chrome-muted">{shift.onDuty} nhân viên đang trực</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-chrome-muted">Ngoài giờ phục vụ</p>
      )}
    </div>
  );
}

function UserCard({
  onChangePassword,
  onLogout,
}: {
  onChangePassword?: () => void;
  onLogout?: () => void;
}) {
  const authUser = useRestaurantStore((s) => s.authUser);
  const role = useRestaurantStore((s) => s.currentRole);
  const name = authUser?.ho_ten ?? ROLE_META[role].label;
  const sub = authUser ? `${ROLE_META[role].label} · @${authUser.ten_dang_nhap}` : ROLE_META[role].label;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <Avatar name={name} className="bg-chrome-line text-chrome-ink" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-chrome-ink">{name}</p>
          <p className="truncate text-xs text-chrome-muted">{sub}</p>
        </div>
      </div>

      {(onChangePassword || onLogout) && (
        <div className="grid grid-cols-2 gap-1.5">
          {onChangePassword && (
            <button
              type="button"
              onClick={onChangePassword}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-chrome-line bg-chrome-raised px-2 text-xs font-medium text-chrome-ink transition-colors hover:border-gold-bright/50 hover:text-white"
            >
              <KeyRound size={13} aria-hidden />
              Đổi MK
            </button>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-chrome-line bg-chrome-raised px-2 text-xs font-medium text-chrome-ink transition-colors hover:border-primary hover:bg-primary/20 hover:text-white"
            >
              <LogOut size={13} aria-hidden />
              Đăng xuất
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function SidebarContent({
  onNavigate,
  onChangePassword,
  onLogout,
}: {
  onNavigate?: () => void;
  onChangePassword?: () => void;
  onLogout?: () => void;
}) {
  const role = useRestaurantStore((s) => s.currentRole);
  const snapshot = useRestaurantStore((s) => s.snapshot);

  return (
    <div className="on-chrome flex h-full flex-col bg-chrome text-chrome-ink">
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <BrandMark />
        <div>
          <p className="text-base font-bold tracking-[0.14em]">AC-RMS</p>
          <p className="text-xs tracking-[0.14em] text-chrome-muted uppercase">Bộ điều hành</p>
        </div>
      </div>

      <div className="mx-4 flex items-center gap-3 rounded-lg border border-chrome-line bg-chrome-raised p-3">
        <span aria-hidden className="grid size-9 place-items-center rounded-md bg-gold-bright text-sm font-bold text-chrome">
          A
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">Atelier d'Asie</p>
          <p className="truncate text-xs text-chrome-muted">Chi nhánh Q.1 · Sài Gòn</p>
        </div>
        <ChevronsUpDown size={16} aria-hidden className="shrink-0 text-chrome-muted" />
      </div>

      <nav aria-label="Điều hướng chính" className="scroll-quiet mt-5 flex-1 space-y-6 overflow-y-auto px-4 pb-4">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter((i) => canAccess(role, i));

          if (group.ownerOnly && role !== 'Owner') {
            return (
              <div key={group.id}>
                <p className="mb-2 px-3 text-xs font-medium tracking-[0.14em] text-chrome-muted uppercase">
                  {group.label}
                </p>
                <div className="flex items-start gap-2.5 rounded-lg border border-chrome-line px-3 py-2.5 text-xs leading-relaxed text-chrome-muted">
                  <Lock size={14} aria-hidden className="mt-0.5 shrink-0 text-gold-bright" />
                  Phân hệ tài chính chỉ dành cho Chủ nhà hàng
                </div>
              </div>
            );
          }
          if (visible.length === 0) return null;

          return (
            <div key={group.id}>
              <p className="mb-2 px-3 text-xs font-medium tracking-[0.14em] text-chrome-muted uppercase">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {visible.map((item) => {
                  const badge = item.badge?.(snapshot);
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.to}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            'group flex h-10 items-center gap-3 rounded-md border-l-2 px-3 text-sm transition-colors',
                            isActive
                              ? 'border-primary bg-primary/20 font-medium text-white'
                              : 'border-transparent text-chrome-ink/80 hover:bg-chrome-raised hover:text-white',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon size={17} aria-hidden className={cn(isActive ? 'text-gold-bright' : 'text-chrome-muted group-hover:text-chrome-ink')} />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {badge && (
                              <span
                                className={cn(
                                  'num rounded px-1.5 py-px text-xs font-medium',
                                  badge.alert ? 'bg-primary text-white' : 'bg-chrome-line text-chrome-ink',
                                )}
                              >
                                {badge.value}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="space-y-4 border-t border-chrome-line px-4 py-4">
        <ShiftCard />
        <UserCard onChangePassword={onChangePassword} onLogout={onLogout} />
      </div>
    </div>
  );
}
