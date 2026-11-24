// ============================================================================
// BỘ PHÁT CHUÔNG BÁO ÂM THANH 'TING' (FR-12) & STRUCTURED LOGGER
// Sử dụng Web Audio API để phát tiếng chuông bếp Ting thật mà không cần file MP3 ngoài
// ============================================================================

export function playKitchenTingSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tạo âm chuông bàn bếp cao cấp (2 tần số cộng hưởng: 1318.5Hz E6 + 1975.5Hz B6)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(1318.5, now);
    osc2.frequency.setValueAtTime(1975.5, now + 0.06);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.32, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.06);
    osc1.stop(now + 1.1);
    osc2.stop(now + 1.1);
  } catch {
    // Trình duyệt chặn autoplay trước khi user click
  }
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));
}

export function getSpicyLabel(level: number): string {
  switch (level) {
    case 0:
      return '0 • Không cay';
    case 1:
      return '1 • Cay nhẹ 🌶️';
    case 2:
      return '2 • Cay vừa 🌶️🌶️';
    case 3:
      return '3 • Cay nồng 🌶️🌶️🌶️';
    default:
      return '0 • Không cay';
  }
}
