// Chặn các class/giá trị phá hệ thống thiết kế (chạy: npm run lint:ui)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const RULES = [
  {
    name: 'font-weight ngoài 400/500/700',
    re: /\bfont-(thin|extralight|light|semibold|extrabold|black)\b/g,
  },
  {
    name: 'cỡ chữ ngoài thang 12/14/16/20/24/32/48 (dùng text-xs…text-3xl)',
    re: /\btext-(\[\d[^\]]*\]|[4-9]xl)\b/g,
  },
  {
    name: 'màu mặc định Tailwind bị cấm — dùng token (ink, primary, st-*, …)',
    re: /\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|decoration|accent|caret|shadow|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
  },
  {
    name: 'hex màu thô — dùng class token hoặc var(--color-*)',
    re: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-zA-Z-])/g,
    skip: (file) => file.endsWith('index.css') || file.includes('seedData'),
  },
  { name: 'font-family inline', re: /fontFamily\s*:|font-family\s*:/g, skip: (f) => f.endsWith('index.css') },
  { name: 'bg-gradient (cấm gradient trang trí)', re: /\bbg-(gradient|linear|radial|conic)-/g },
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (/\.(tsx?|css)$/.test(name)) yield p;
  }
}

let problems = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (rel.startsWith('data') || rel.startsWith('tests') || rel.startsWith('types')) continue;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.skip?.(file)) continue;
      rule.re.lastIndex = 0;
      const m = rule.re.exec(line);
      if (m) {
        problems++;
        console.log(`${rel}:${i + 1}  ✗ ${rule.name}  →  ${m[0]}`);
      }
    }
  });
}

if (problems) {
  console.log(`\n${problems} vi phạm hệ thống thiết kế.`);
  process.exit(1);
}
console.log('lint:ui — OK, không có vi phạm hệ thống thiết kế.');
