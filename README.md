# GlobalHatim Backend

GlobalHatim, Clean Architecture ve CQRS prensipleriyle geliştirilmiş, Docker (PostgreSQL & Redis) destekli, kurumsal düzeyde bir topluluk hatim yönetim sistemi REST API'sidir. Proje, yüksek performanslı önbellekleme (caching) mekanizmaları ve otomatik arka plan işçileri (background workers) ile donatılmıştır.

---

## 🏗️ Mimari Yapı (Clean Architecture)

Proje, bağımlılıkların içeriye doğru aktığı (Inversion of Control) 4 ana katmandan oluşmaktadır:

* **Domain:** İş kuralları (Entities, Enums, Exceptions). Hiçbir dış kütüphaneye bağımlılığı yoktur.
* **Application:** CQRS pattern (MediatR), FluentValidation, AutoMapper ve servis arayüzleri (Interfaces).
* **Infrastructure:** EF Core veri erişim katmanı, PostgreSQL konfigürasyonları, Redis Cache yönetimi, JWT Token üretimi ve Background Job (HatimRotationWorker) mekanizmaları.
* **WebAPI:** Sunum katmanı. Controller'lar, Swagger entegrasyonu, Serilog loglama altyapısı ve middleware boru hatları.

---

## 🛠️ Teknoloji Yığını

| Teknoloji / Kütüphane | Sürüm | Açıklama |
| :--- | :--- | :--- |
| **.NET SDK** | 8.0 | Uygulama Çalışma Zamanı |
| **Entity Framework Core** | 8.0.11 | ORM ve Veritabanı Yönetimi |
| **PostgreSQL** | Canlı | İlişkisel Veritabanı (Docker) |
| **Redis** | Canlı | Dağıtık Önbellekleme (Docker) |
| **MediatR** | Güncel | CQRS & In-Memory Messaging |
| **BCrypt.Net-Next** | 4.2.0 | Güvenli Şifre Hashleme |
| **Serilog** | Güncel | Yapılandırılmış Loglama Altyapısı |

---

## ⚡ Öne Çıkan Özellikler

* **Güvenli Kimlik Doğrulama:** JWT (JSON Web Token) tabanlı, `Bearer` şemalı yetkilendirme ve BCrypt şifre güvenliği.
* **Otomatik Veri Besleme (Auto-Seeding):** Sistem ilk kez ayağa kalktığında `juz_lookup` tablosunu otomatik olarak kontrol eder, 30 cüz verisini PostgreSQL'e yazar ve anında Redis cache hattını ısıtır.
* **Akıllı Arka Plan İşçisi (HatimRotationWorker):** Hafızada saatlik periyotlarla dönerek süresi dolan, teslim edilmeyen veya durumu değişen cüz tahsislerini (allocations) otomatik olarak revize eder.
* **Gelişmiş Validasyon:** FluentValidation ile tüm istekler (Requests) daha veritabanına ulaşmadan kapıda doğrulanır.