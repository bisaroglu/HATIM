# GlobalHatim Mobil — Kurulum Kılavuzu

## 1. Ön Gereksinimler

- Node.js (v18+) kurulu olmalı
- Expo CLI: `npm install -g expo-cli`
- Telefonda **Expo Go** uygulaması (App Store / Play Store'dan ücretsiz)

## 2. Kurulum Adımları

```bash
# Proje klasörüne gir
cd GlobalHatim_Mobil

# Bağımlılıkları yükle
npm install

# Uygulamayı başlat
npx expo start
```

## 3. Uygulamayı Çalıştır

Terminalde QR kodu çıkacak. Telefonundaki **Expo Go** uygulamasıyla tara → uygulama açılır.

**Android emülatör için:** `npm run android`  
**iOS simülatör için:** `npm run ios`

## 4. API URL Ayarı

`servisler/apiServisi.js` dosyasını aç ve `BASE_URL` satırını düzenle:

```js
// Gerçek cihazdan test ediyorsan → bilgisayarının yerel IP'si
const BASE_URL = 'http://192.168.1.XXX:5000';

// Android emülatörden → bu adres localhost'a yönlenir
const BASE_URL = 'http://10.0.2.2:5000';

// iOS simülatör veya aynı makinede → doğrudan localhost
const BASE_URL = 'http://localhost:5000';
```

## 5. Klasör Yapısı

```
GlobalHatim_Mobil/
├── App.js                      → Giriş noktası, NavigationContainer
├── package.json
├── navigasyon/
│   └── AltMenuNavigasyon.js   → Bottom Tab Navigator (3 sekme)
├── ekranlar/
│   ├── AnaSayfa.js            → Dashboard (cüz kartı, tamamlandı butonu)
│   ├── HaftalikTakvim.js      → 52 haftalık döngüsel liste
│   └── YapayZekaAsistan.js    → Gemini sohbet ekranı
├── servisler/
│   └── apiServisi.js          → Tüm API çağrıları buradan
└── sabitler/
    ├── renkler.js             → Renk paleti
    └── yaziStilleri.js        → Tipografi stilleri
```

## 6. Backend'in Döndürmesi Gereken Veri Formatları

### `GET /api/hatim/buHafta`
```json
{
  "haftaNo": 12,
  "cuzNo": 17,
  "baslangicTarihi": "10 Haz 2026",
  "bitisTarihi": "16 Haz 2026",
  "sayfaAraligi": "193-212",
  "kalanGun": 5,
  "tamamlandi": false
}
```

### `GET /api/hatim/takvim`
```json
{
  "aktifHaftaNo": 12,
  "takvim": [
    { "haftaNo": 1, "cuzNo": 1, "baslangicTarihi": "...", "bitisTarihi": "...", "tamamlandi": true },
    ...
  ]
}
```

### `POST /api/ai/chat` — Body: `{ "mesaj": "..." }`
```json
{
  "cevap": "Asistanın cevap metni buraya gelir."
}
```
