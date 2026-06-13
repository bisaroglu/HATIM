// =====================================================
// sabitler/webConfig.js
//
// ⚠️  ÖNEMLİ: Telefon, localhost'a erişemez!
//    Bilgisayarının Wi-Fi IP adresini kullan.
//
//    IP öğrenmek için → PowerShell'de: ipconfig
//    "Wireless LAN adapter Wi-Fi" → "IPv4 Address"
//
// Şu anki IP: 10.34.6.244 (kampüs Wi-Fi)
// =====================================================

const WEB_IP   = '10.34.6.244';   // ← Bağlandığın ağa göre bunu değiştir
const WEB_PORT = '3000';           // Next.js varsayılan portu

export const WEB_BASE = `http://${WEB_IP}:${WEB_PORT}`;

// Her sekme için URL  (web router/index.tsx ile birebir eşleşmeli)
export const WEB_SAYFALARI = {
  anaSayfa:      `${WEB_BASE}/`,
  takvim:        `${WEB_BASE}/hatimler`,
  yapayZeka:     `${WEB_BASE}/ai-asistan`,   // ← /ai → /ai-asistan (404 düzeltmesi)
  profilim:      `${WEB_BASE}/profilim`,     // ← yeni: Profil sekmesi
};
