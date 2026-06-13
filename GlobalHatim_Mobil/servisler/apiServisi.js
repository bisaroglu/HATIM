// =====================================================
// servisler/apiServisi.js
// Tüm backend API çağrıları buradan yapılır.
// =====================================================

import { Alert } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  IP DEĞİŞİKLİĞİ UYARISI
//
// Kampüs Wi-Fi'sinden telefon hotspot'una geçtiysen bilgisayarın IP adresi
// değişmiş olabilir. Yeni IP'yi öğrenmek için PowerShell'de şunu çalıştır:
//
//   ipconfig
//
// "Wireless LAN adapter Wi-Fi" bölümündeki "IPv4 Address" satırını bul ve
// aşağıdaki BASE_URL satırını güncelle.
//
// Şu anki IP → 10.168.93.244 (kampüs Wi-Fi)
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = 'http://10.34.6.244:5000'; // ← BURAYA yeni IP'yi yaz

// ─────────────────────────────────────────────────────────────────────────────
// 🧪 TEST KULLANICI ID'Sİ
//
// Henüz oturum açma (auth) ekranı olmadığı için test aşamasında kullanılacak
// geçici bir kullanıcı ID'si. Veritabanında gerçekten var olan bir kullanıcının
// GUID'ini buraya yaz. (Swagger veya DB'den bulabilirsin.)
//
// Nasıl bulunur?
//   → Swagger UI: GET /api/users → mevcut kullanıcıların ID'lerini listeler
//   → SQL: SELECT TOP 1 Id FROM Users
// ─────────────────────────────────────────────────────────────────────────────
export const TEST_KULLANICI_ID = '90c01502-57d9-44f4-8730-b79ed714396d';
// Örnek format: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

// ─────────────────────────────────────────────────────────────────────────────
// Genel fetch yardımcı fonksiyonu
// Hata durumunda hem konsola yazar hem ekranda Alert gösterir.
// ─────────────────────────────────────────────────────────────────────────────
async function apiFetch(endpoint, secenekler = {}) {
  const tamUrl = `${BASE_URL}${endpoint}`;

  try {
    const yanit = await fetch(tamUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...secenekler.headers,
      },
      ...secenekler,
    });

    // Sunucu 2xx dışı kod döndürdüyse hata fırlat
    if (!yanit.ok) {
      // Sunucu hata gövdesini de almaya çalış (500 mesajları için)
      let sunucuMesaji = '';
      try {
        const govde = await yanit.text();
        sunucuMesaji = govde ? `\n\nSunucu yanıtı:\n${govde.slice(0, 300)}` : '';
      } catch (_) { }

      throw new Error(`HTTP ${yanit.status} — ${yanit.statusText}${sunucuMesaji}`);
    }

    return await yanit.json();

  } catch (hata) {
    // Konsola detaylı log
    console.error(`❌ API Hatası [${endpoint}]`, {
      url: tamUrl,
      mesaj: hata.message,
    });

    // Telefon ekranında pop-up göster — hatayı canlı görmen için
    Alert.alert(
      '🔴 API Hatası Detayı',
      `Endpoint: ${endpoint}\n\nHata: ${hata.message}\n\nIP: ${BASE_URL}`,
      [{ text: 'Tamam' }]
    );

    // Hatayı yukarı fırlat — ekran kendi hata state'ini yönetsin
    throw hata;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hatim / Cüz Servisi
// ─────────────────────────────────────────────────────────────────────────────

// Kullanıcının bu haftaki aktif cüz bilgisini getir
// GET /api/hatims/buHafta?kullaniciId={guid}
export async function buHaftakiCuzu(kullaniciId) {
  return apiFetch(`/api/hatims/buHafta?kullaniciId=${kullaniciId}`);
}

// Kullanıcının 52 haftalık tüm takvimini getir
// GET /api/hatims/takvim?kullaniciId={guid}
export async function haftalikTakvimi(kullaniciId) {
  return apiFetch(`/api/hatims/takvim?kullaniciId=${kullaniciId}`);
}

// Belirtilen JuzAllocation'ı tamamlandı olarak işaretle
// POST /api/juzallocations/{allocationId}/complete
export async function cuzuTamamla(allocationId, requesterUserId) {
  return apiFetch(`/api/juzallocations/${allocationId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ RequesterUserId: requesterUserId, GuestToken: null }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Yapay Zeka Servisi
// ─────────────────────────────────────────────────────────────────────────────

// Gemini asistanına mesaj gönder, yanıt al
// POST /api/ai/chat  →  body: { Message }  →  yanıt: { Reply }
export async function asistanaGonder(mesaj) {
  const yanit = await apiFetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ Message: mesaj }),
  });
  return { cevap: yanit.Reply ?? yanit.reply ?? '' };
}
