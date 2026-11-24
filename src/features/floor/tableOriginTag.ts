// ============================================================================
// Tiện ích gắn / tách dấu bàn gọi món trong `ghi_chu_mon` (giữ nguyên 100% schema 27 bảng 3NF)
// Định dạng lưu trữ nội bộ: "[BAN:D-302]" hoặc "[BAN:D-302] Ít hành"
// ============================================================================

const TABLE_ORIGIN_RE = /^\[BAN:([A-Za-z0-9_-]+)\]\s*/;
const MAX_NOTE_LENGTH = 255;

export interface ParsedTableOriginNote {
  originTableId: string | null;
  cleanNote: string | null;
}

/** Tách mã bàn gọi món (nếu có) và phần ghi chú hiển thị cho khách/bếp. */
export function parseTableOriginNote(note: string | null | undefined): ParsedTableOriginNote {
  if (!note) return { originTableId: null, cleanNote: null };
  const trimmed = note.trim();
  if (!trimmed) return { originTableId: null, cleanNote: null };

  const match = trimmed.match(TABLE_ORIGIN_RE);
  if (!match) {
    return { originTableId: null, cleanNote: trimmed };
  }

  const originTableId = match[1];
  const rest = trimmed.slice(match[0].length).trim();
  return {
    originTableId,
    cleanNote: rest.length > 0 ? rest : null,
  };
}

/** Gỡ dấu nguồn bàn khỏi ghi chú (dùng khi trả món về đơn riêng của bàn đó). */
export function stripTableOriginTag(note: string | null | undefined): string | null {
  return parseTableOriginNote(note).cleanNote;
}

/**
 * Gắn dấu `[BAN:<maBan>]` vào đầu `ghi_chu_mon`.
 * Nếu ghi chú đã có sẵn dấu của bàn khác và `preserveExisting = true`, giữ nguyên bàn gốc đó.
 */
export function attachTableOriginTag(
  note: string | null | undefined,
  maBan: string,
  preserveExisting = false,
): string {
  const parsed = parseTableOriginNote(note);
  const targetOrigin = preserveExisting && parsed.originTableId ? parsed.originTableId : maBan;
  const prefix = `[BAN:${targetOrigin}]`;
  const combined = parsed.cleanNote ? `${prefix} ${parsed.cleanNote}` : prefix;
  return combined.slice(0, MAX_NOTE_LENGTH);
}
