// =====================================================
// sabitler/renkler.js
// Web projesiyle birebir eşleşen renk paleti.
// Kaynak: frontend_web/globalhatim-web/tailwind.config.js
// =====================================================

const RENKLER = {
  // ── Altın / Gold (Primary Accent) ─────────────────
  // Web'deki gold.DEFAULT, gold.dim, gold.deep, gold.light, gold.text
  goldPrimary:  '#e9c176',   // gold.DEFAULT  — vurgu, ikon, aktif sekme
  goldDim:      '#c5a059',   // gold.dim      — CTA buton arka planı
  goldDerin:    '#775a19',   // gold.deep     — light modda yazı üstü koyu ton
  goldAcik:     '#ffdea5',   // gold.light    — hover / highlight
  goldYazi:     '#412d00',   // gold.text     — altın buton üstündeki yazı rengi

  // ── Açık Tema Yüzeyler (Light Theme) ──────────────
  // Web: light.bg, light.bg-dim, light.surface, light.surface-high
  arkaplan:       '#f8f9fb',   // light.bg-dim   — sayfa arka planı
  beyaz:          '#ffffff',   // light.bg       — kart, modal arka planı
  yuzey:          '#f1f3f7',   // light.surface  — input, mesaj balonu bg
  yuzeyYuksek:    '#e8ecf2',   // light.surface-high — hover yüzey

  // ── Metin ─────────────────────────────────────────
  // Web: light.text, light.text-muted
  yaziBirincil:   '#0d1117',   // light.text      — başlık, ana metin
  yaziIkincil:    '#4b5563',   // light.text-muted — açıklama, yardımcı metin
  yaziSoluk:      '#9ca3af',   // slate-400       — placeholder, zaman damgası

  // ── Kenarlık / Border ──────────────────────────────
  // Web: light.outline, light.outline-subtle
  kenarlik:       '#d1d5db',   // light.outline       — kart, input kenarlığı
  kenarlikSoluk:  '#e5e7eb',   // light.outline-subtle — bölücü çizgiler

  // ── Karanlık Yüzey (Dark tema mesaj balonları için) ─
  // Web: dark.surface, dark.surface-high
  karanlikYuzey:  '#122131',
  karanlikYuksek: '#1c2b3c',

  // ── Durum Renkleri ─────────────────────────────────
  basarili: '#16a34a',   // emerald-600
  hata:     '#dc2626',   // red-600
  uyari:    '#d97706',   // amber-600

  // ── Bottom Navigation ─────────────────────────────
  navArka:  '#ffffff',
  navAktif: '#c5a059',   // goldDim — aktif sekme ikonu
  navPasif: '#9ca3af',   // slate-400
};

export default RENKLER;
