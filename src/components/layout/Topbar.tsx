import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BellRing, LogOut, Menu, QrCode, Search, ShieldCheck, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/clock';
import { formatClock, formatWeekdayDate } from '@/lib/format';
import { GUEST_REQUEST_META, ROLE_META } from '@/lib/labels';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useOverlayBehavior } from '@/components/ui/Overlay';
import { ALL_NAV_ITEMS, canAccess, findNavItem } from '@/app/nav.config';

/* ───────── helpers ───────── */

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();

function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}

/* ───────── Command search (Ctrl/⌘ + K) ───────── */

function CommandSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const role = useRestaurantStore((s) => s.currentRole);
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const { panelRef, trapTab } = useOverlayBehavior(open, onClose);

  const results = useMemo(() => {
    const needle = fold(q.trim());
    return ALL_NAV_ITEMS.filter((i) => canAccess(role, i)).filter(
      (i) => !needle || fold(`${i.label} ${i.keywords ?? ''}`).includes(needle),
    );
  }, [q, role]);

  useEffect(() => {
    if (open) {
      setQ('');
      setCursor(0);
    }
  }, [open]);

  if (!open) return null;

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[14vh]">
      <div aria-hidden onClick={onClose} className="absolute inset-0 animate-fade-in bg-ink/45 backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tìm nhanh màn hình"
        tabIndex={-1}
        onKeyDown={trapTab}
        className="relative w-full max-w-lg animate-rise overflow-hidden rounded-xl bg-paper shadow-pop outline-none"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} aria-hidden className="text-ink-muted" />
          <input
            data-autofocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              } else if (e.key === 'Enter' && results[cursor]) {
                go(results[cursor].to);
              }
            }}
            placeholder="Tìm màn hình: bàn, bếp, thu ngân, nghỉ phép…"
            aria-label="Tìm màn hình"
            className="h-14 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-xs text-ink-muted">Esc</kbd>
        </div>
        <ul className="scroll-quiet max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Kết quả">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-ink-muted">Không có màn hình phù hợp với vai trò hiện tại.</li>
          )}
          {results.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.id} role="option" aria-selected={i === cursor}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(item.to)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm',
                    i === cursor ? 'bg-primary-soft text-primary' : 'text-ink-soft',
                  )}
                >
                  <Icon size={17} aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  {i === cursor && <CornerDownLeft size={14} aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}

/* ───────── Notification bell ───────── */

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const tings = useRestaurantStore((s) => s.tingNotifications).filter((n) => !n.da_doc);
  const requests = useRestaurantStore((s) => s.snapshot.tbl_yeu_cau_khach_hang).filter(
    (r) => r.trang_thai_xu_ly !== 'DaHoanTat',
  );
  const tables = useRestaurantStore((s) => s.snapshot.tbl_ban);
  const dismissTing = useRestaurantStore((s) => s.dismissTingNotification);
  const resolveRequest = useRestaurantStore((s) => s.resolveGuestQrRequest);
  const total = tings.length + requests.length;

  return (
    <div ref={ref} className="relative">
      <IconButton
        label={total ? `Thông báo (${total} chưa xử lý)` : 'Thông báo'}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative"
      >
        {total > 0 ? <BellRing size={19} /> : <Bell size={19} />}
        {total > 0 && (
          <span
            aria-hidden
            className="num absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-xs leading-4 font-medium text-white"
          >
            {total}
          </span>
        )}
      </IconButton>

      {open && (
        <div
          role="dialog"
          aria-label="Thông báo"
          className="absolute top-full right-0 z-40 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] animate-rise overflow-hidden rounded-xl border border-line bg-paper shadow-pop"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="t-card-title">Thông báo</p>
            <Badge tone={total ? 'primary' : 'neutral'} size="sm">
              {total} chưa xử lý
            </Badge>
          </div>
          <div className="scroll-quiet max-h-96 overflow-y-auto">
            {total === 0 && <p className="px-4 py-10 text-center text-sm text-ink-muted">Không có thông báo mới.</p>}

            {tings.map((n) => (
              <div key={n.id} className="flex items-start gap-3 border-b border-line px-4 py-3">
                <span aria-hidden className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-ink">
                  <BellRing size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">
                    <span className="font-medium">Ting!</span> {n.ten_mon_an} đã xong
                  </p>
                  <p className="num mt-0.5 text-xs text-ink-muted">
                    {n.ten_ban} · {formatClock(n.thoi_gian)}
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => dismissTing(n.id)}>
                  Đã bưng
                </Button>
              </div>
            ))}

            {requests.map((r) => {
              const ban = tables.find((b) => b.ma_ban === r.ma_ban);
              return (
                <div key={r.ma_yeu_cau} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <span aria-hidden className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                    <QrCode size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">
                      <span className="font-medium">{ban?.ten_ban ?? r.ma_ban}</span> · {GUEST_REQUEST_META[r.loai_yeu_cau].label}
                    </p>
                    <p className="num mt-0.5 text-xs text-ink-muted">
                      Khách quét QR · {formatClock(r.thoi_gian_gui)}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => resolveRequest(r.ma_yeu_cau)}>
                    Đã xử lý
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Topbar ───────── */

export function Topbar({
  onOpenNav,
  onLogout,
  right,
}: {
  onOpenNav: () => void;
  onLogout: () => void;
  right?: ReactNode;
}) {
  const { pathname } = useLocation();
  const role = useRestaurantStore((s) => s.currentRole);
  const authUser = useRestaurantStore((s) => s.authUser);
  const selectedTableId = useRestaurantStore((s) => s.selectedTableId);
  const now = useNow(20_000);
  const [searchOpen, setSearchOpen] = useState(false);

  const current = findNavItem(pathname);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-8">
      <IconButton label="Mở menu điều hướng" onClick={onOpenNav} className="-ml-2 lg:hidden">
        <Menu size={20} />
      </IconButton>

      <nav aria-label="Vị trí hiện tại" className="min-w-0 flex-1 text-sm">
        <ol className="flex items-center gap-2 whitespace-nowrap">
          <li className="hidden text-ink-muted sm:block">Atelier d'Asie</li>
          <li aria-hidden className="hidden text-ink-faint sm:block">/</li>
          <li className="truncate font-medium text-ink" aria-current="page">
            {current?.label ?? 'AC-RMS'}
          </li>
        </ol>
      </nav>

      <Badge tone="success" dot className="hidden md:inline-flex">
        Đang phục vụ
      </Badge>

      <IconButton label="Tìm nhanh màn hình (Ctrl + K)" onClick={() => setSearchOpen(true)}>
        <Search size={19} />
      </IconButton>
      <NotificationBell />

      <Link
        to={`/qr/${selectedTableId}`}
        target="_blank"
        rel="noopener"
        title="Mở cổng khách quét QR tại bàn đang chọn (tab mới, đồng bộ realtime)"
        className="hidden h-10 items-center gap-2 rounded-md border border-gold/50 bg-gold-soft px-3 text-sm font-medium text-gold-ink transition-colors hover:bg-gold/15 xl:inline-flex"
      >
        <QrCode size={16} aria-hidden />
        Cổng khách QR
      </Link>

      {/* Huy hiệu vai trò đã xác thực (chỉ đọc — muốn đổi vai trò phải Đăng xuất) */}
      <Badge
        tone={role === 'Owner' ? 'gold' : 'neutral'}
        icon={<ShieldCheck size={13} aria-hidden />}
        title={authUser ? `Đang đăng nhập: ${authUser.ho_ten} (@${authUser.ten_dang_nhap})` : ROLE_META[role].label}
        className="hidden sm:inline-flex"
      >
        {ROLE_META[role].label}
      </Badge>

      <IconButton label="Đăng xuất khỏi phiên làm việc" onClick={onLogout}>
        <LogOut size={18} />
      </IconButton>

      {right}

      <div className="hidden border-l border-line pl-4 text-right lg:block" aria-label="Thời gian hiện tại">
        <p className="eyebrow">{formatWeekdayDate(now)}</p>
        <p className="num text-sm font-medium text-ink">{formatClock(now)}</p>
      </div>

      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

