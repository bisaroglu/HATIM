# Hatim  - Proje Gereksinim Dokümanı

## 1. Genel Bakış
Bu proje; kullanıcıların bireysel veya toplu olarak Hatim etkinlikleri oluşturabileceği, yönetebileceği ve katılabileceği; web ve mobil senkronizasyonlu premium bir dijital platformdur. Referans iş mantığı `cuzoku.com` sitesinden ilham almıştır.

---

## 2. Teknoloji Yığını (Tech Stack)
Proje üç ana katmandan oluşacak ve tamamen ortak bir API üzerinden haberleşecektir:
- **Backend:** C# .NET 8 Web API (Clean / N-Tier Architecture, EF Core)
- **Veritabanı:** PostgreSQL (İlişkisel veriler, kullanıcılar, gruplar) + Redis (Aktif cüz takip, anlık doluluk durumu ve önbellekleme)
- **Frontend Web:** Next.js (React) & Tailwind CSS & Framer Motion (Mikro-Animasyonlar) & GSAP (Lüks imleç/cursor efektleri)
- **Frontend Mobil:** Flutter (Dart) - Android & iOS ortak kod tabanı

---

## 3. Rol Yönetimi ve Kullanıcı İzinleri
- **Hatim Oluşturan (Yönetici/Manager):** Sisteme Kaydolmak ve Giriş Yapmak (JWT Auth) zorundadır. Hatim grupları oluşturabilir, ayarlarını yapılandırabilir ve takibini yapar.
- **Hatim Katılımcısı (Okuyucu/Reader):** Üye olmak zorunda DEĞİLDİR. Misafir (Guest) modu aktiftir. Sadece İsim ve Soyisim girerek boşta olan bir cüzü, sayfayı veya hizbi üzerine alabilir.

---

## 4. Hatim Rotasyon Matrisi (İş Mantığı & Kurallar)
Sistem, aşağıda belirtilen dönerli ve sabit planları esnek ve dinamik bir veritabanı şemasıyla desteklemelidir:
- **Plan A:** Günde 1 Cüz (Her gün otomatik olarak bir sonraki cüze kayar)
- **Plan B:** 2 Günde 1 Cüz
- **Plan C:** Günde 1 Hizb
- **Plan D:** Haftada 1 Cüz -> Ramazan ayında sistem otomatik olarak "Günde 1 Cüz" hızına ivmelenir.
- **Plan E:** Haftada 1 Cüz -> Ramazan ayında da hızı değişmez, haftalık kalır.
- **Plan F (Uzun Vadeli Karma Sabit):** Ramazan ayında 1 aylık sabit cüz planı; yılın geri kalanında ise her 4 ayda bir, bir sonraki cüze geçecek şekilde (yıl boyu haftada 1 cüz mantığıyla) dönen rotasyonel yapı.
- **Plan G (Özel Zamanlar / Kısa Vadeli):** Kadir Gecesi, Kandiller veya Merhum Hayrına gibi durumlar için oluşturulan, toplam operasyonel süresi tam 1 gün (24 saat) olan hızlı hatimler.
