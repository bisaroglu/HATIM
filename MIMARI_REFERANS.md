# Global Hatim — Mimari Referans Dokümanı

> **Durum:** Onaylı v1.0  
> **Kapsam:** PostgreSQL Şeması + .NET 8 Clean Architecture CLI Komutları

---

## Bölüm 1 — Mimari Kararlar Özeti

| # | Karar | Çözüm |
|---|---|---|
| B | Okuma onay mekanizması | `JuzAllocation` state machine (AVAILABLE→ASSIGNED→COMPLETED) + `ReadingLog` audit tablosu (hibrit) |
| E | Hatim kategorileri | Dinamik `HatimCategory` lookup tablosu (Id, NameTr, NameEn, Icon, IsActive) |
| F | Davet sistemi | `IsPublic` flag + `InviteCode` + `HatimJoinRequest` tablosu (yönetici onay akışı) |
| H | Profil istatistikleri | Denormalize `UserStats` tablosu → Redis cache (event-driven güncelleme) |
| I | Cüz ↔ Sure eşlemesi | Statik `JuzLookup` seed tablosu → Startup'ta tamamen Redis'e yüklenir |
| J | Geri bildirim formu | `ContactMessage` tablosu + `POST /api/contact` endpoint |
| K | Misafir katılım flow'u | `JuzAllocation.GuestToken` (kısa ömürlü JWT) → Web: LocalStorage, Mobil: SecureStorage |
| L | Mevcut döngü sayacı | `Hatim.CurrentCycle` + `Hatim.TotalCycles` + `RotationSchedule` tablosu, Background Worker tarafından artırılır |

**Kaldırılan Planlar:** A (Günde 1 Cüz), C (Günde 1 Hizb), D (Haftalık + Ramazan ivmeli), G (24 saatlik özel)  
**Aktif Planlar:**
- **Plan B** — 2 Günde 1 Cüz
- **Plan E** — Haftada 1 Cüz (Ramazan'da hız değişmez)
- **Plan F** — Uzun Vadeli Karma: Ramazan'da sabit 1 aylık plan, yılın geri kalanında 4 ayda 1 cüz rotasyonu

---

## Bölüm 2 — PostgreSQL Veritabanı Şeması

```sql
-- ================================================================
-- ENUM TANIMLAMALARI
-- ================================================================

CREATE TYPE plan_type AS ENUM (
    'EVERY_2_DAYS_1_JUZ',  -- Plan B: 2 Günde 1 Cüz
    'WEEKLY_NO_ACCEL',     -- Plan E: Haftada 1 Cüz (Ramazan'da sabit)
    'LONG_TERM_HYBRID'     -- Plan F: Karma uzun vadeli rotasyon
);

CREATE TYPE hatim_status AS ENUM (
    'DRAFT',      -- Oluşturuldu, henüz başlamadı
    'ACTIVE',     -- Devam ediyor
    'COMPLETED',  -- Tamamlandı
    'ARCHIVED'    -- Arşivlendi
);

CREATE TYPE juz_allocation_status AS ENUM (
    'AVAILABLE',  -- Boşta, alınabilir
    'ASSIGNED',   -- Atandı / okunuyor
    'COMPLETED'   -- Tamamlandı, okundu
);

CREATE TYPE participant_role AS ENUM (
    'MANAGER',  -- Hatim yöneticisi (oluşturan)
    'READER'    -- Okuyucu katılımcı
);

CREATE TYPE join_request_status AS ENUM (
    'PENDING',   -- Bekliyor
    'APPROVED',  -- Yönetici onayladı
    'REJECTED'   -- Yönetici reddetti
);

-- ================================================================
-- KULLANICI SEVİYE SİSTEMİ (GAMİFİCATION)
-- ================================================================

CREATE TABLE user_levels (
    id           SERIAL       PRIMARY KEY,
    name_tr      VARCHAR(50)  NOT NULL UNIQUE,  -- 'Mücevvid', 'Hafız' vb.
    name_en      VARCHAR(50)  NOT NULL,
    min_juz_read INT          NOT NULL DEFAULT 0,
    badge_icon   VARCHAR(255),
    sort_order   SMALLINT     NOT NULL DEFAULT 0
);

-- Seed data örneği:
-- INSERT INTO user_levels (name_tr, name_en, min_juz_read, sort_order) VALUES
-- ('Başlangıç',  'Beginner',   0,   1),
-- ('Müteallim',  'Learner',    30,  2),
-- ('Mücevvid',   'Mujawwid',   150, 3),
-- ('Hafız',      'Hafiz',      500, 4);

-- ================================================================
-- KULLANICILER
-- ================================================================

CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(500) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    avatar_url    VARCHAR(500),
    level_id      INT          REFERENCES user_levels(id),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Denormalize istatistik tablosu (Redis ile önbelleklenir)
CREATE TABLE user_stats (
    user_id                UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_juz_read         INT  NOT NULL DEFAULT 0,
    total_hatims_joined    INT  NOT NULL DEFAULT 0,
    total_hatims_completed INT  NOT NULL DEFAULT 0,
    total_hatims_created   INT  NOT NULL DEFAULT 0,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_settings (
    user_id              UUID    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    language             VARCHAR(10) NOT NULL DEFAULT 'tr',
    theme                VARCHAR(10) NOT NULL DEFAULT 'dark',
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- CÜZ LOOKUP (STATİK SEED — STARTUP'TA TAMAMEN REDİS'E YÜKLENİR)
-- ================================================================

CREATE TABLE juz_lookup (
    juz_number               SMALLINT PRIMARY KEY CHECK (juz_number BETWEEN 1 AND 30),
    start_page               SMALLINT NOT NULL,
    end_page                 SMALLINT NOT NULL,
    associated_surah_names_tr TEXT    NOT NULL,  -- JSON array: ["el-Bakara","Âl-i İmrân"]
    associated_surah_names_ar TEXT    NOT NULL
);

-- Redis key pattern: "juz:lookup:{juz_number}" → JSON
-- Tüm cüzler ayrıca: "juz:lookup:all" → Hash

-- ================================================================
-- HATİM KATEGORİLERİ (DİNAMİK LOOKUP)
-- ================================================================

CREATE TABLE hatim_categories (
    id        SERIAL       PRIMARY KEY,
    name_tr   VARCHAR(100) NOT NULL UNIQUE,  -- 'Ramazan Hatmi', 'Aile Hatmi' vb.
    name_en   VARCHAR(100) NOT NULL,
    icon      VARCHAR(100),
    is_active BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ================================================================
-- HATİM GRUPLARI
-- ================================================================

CREATE TABLE hatims (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    creator_user_id  UUID         NOT NULL REFERENCES users(id),
    category_id      INT          REFERENCES hatim_categories(id),
    plan_type        plan_type    NOT NULL,
    status           hatim_status NOT NULL DEFAULT 'DRAFT',

    -- Erişim kontrolü
    is_public        BOOLEAN      NOT NULL DEFAULT TRUE,
    invite_code      VARCHAR(20)  UNIQUE,  -- is_public=FALSE ise backend otomatik üretir

    -- Döngü takibi (Dönerli/Rotating hatimler için)
    current_cycle    INT          NOT NULL DEFAULT 1,
    total_cycles     INT          NOT NULL DEFAULT 0,  -- 0 = sınırsız

    -- Zaman
    start_date       DATE         NOT NULL,
    end_date         DATE,  -- Plan F gibi uzun vadeli planlarda hesaplanır

    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ================================================================
-- HATİM KATILIMCILARI
-- ================================================================

CREATE TABLE hatim_participants (
    id        UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    hatim_id  UUID            NOT NULL REFERENCES hatims(id) ON DELETE CASCADE,
    user_id   UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      participant_role NOT NULL DEFAULT 'READER',
    joined_at TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE(hatim_id, user_id)
);

-- ================================================================
-- CÜZ TAHSİSLERİ — ANA DURUM MAKİNESİ
-- State: AVAILABLE → ASSIGNED → COMPLETED
-- ================================================================

CREATE TABLE juz_allocations (
    id               UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
    hatim_id         UUID                  NOT NULL REFERENCES hatims(id) ON DELETE CASCADE,
    cycle_number     INT                   NOT NULL DEFAULT 1,
    juz_number       SMALLINT              NOT NULL REFERENCES juz_lookup(juz_number),

    -- Atanan kişi: Kayıtlı üye XOR Misafir (ikisi aynı anda dolu olamaz)
    assigned_user_id UUID                  REFERENCES users(id) ON DELETE SET NULL,
    guest_first_name VARCHAR(100),
    guest_last_name  VARCHAR(100),
    guest_token      VARCHAR(500) UNIQUE,  -- Kısa ömürlü JWT; misafirin kendi cüzünü yönetmesi için

    status           juz_allocation_status NOT NULL DEFAULT 'AVAILABLE',
    assigned_at      TIMESTAMPTZ,
    deadline_at      TIMESTAMPTZ,    -- Plan tipine göre backend hesaplar
    completed_at     TIMESTAMPTZ,

    CONSTRAINT chk_single_assignee CHECK (
        -- Kayıtlı üye ataması
        (assigned_user_id IS NOT NULL AND guest_first_name IS NULL AND guest_token IS NULL)
        OR
        -- Misafir ataması
        (assigned_user_id IS NULL AND guest_first_name IS NOT NULL AND guest_token IS NOT NULL)
        OR
        -- Boşta (AVAILABLE)
        (assigned_user_id IS NULL AND guest_first_name IS NULL AND guest_token IS NULL)
    ),
    UNIQUE(hatim_id, cycle_number, juz_number)
);

-- ================================================================
-- OKUMA LOG TABLOSU — HİBRİT AUDIT TRAIL
-- Her COMPLETED durumuna geçişte buraya bir satır eklenir.
-- Performans analizi, geçmiş ekranı ve level hesaplaması için kullanılır.
-- ================================================================

CREATE TABLE reading_log (
    id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    hatim_id      UUID     NOT NULL REFERENCES hatims(id) ON DELETE CASCADE,
    allocation_id UUID     NOT NULL REFERENCES juz_allocations(id),
    user_id       UUID     REFERENCES users(id) ON DELETE SET NULL,  -- NULL = misafir
    juz_number    SMALLINT NOT NULL,
    cycle_number  INT      NOT NULL DEFAULT 1,
    confirmed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- ROTASYON TAKVİMİ (Plan B, E, F Background Worker için)
-- Her döngü periyodu tamamlandığında CurrentCycle artırılır
-- ve bir sonraki satır aktif hale gelir.
-- ================================================================

CREATE TABLE rotation_schedule (
    id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    hatim_id             UUID    NOT NULL REFERENCES hatims(id) ON DELETE CASCADE,
    cycle_number         INT     NOT NULL,
    scheduled_date       DATE    NOT NULL,   -- Bu döngünün başlaması gereken tarih
    is_ramadan_period    BOOLEAN NOT NULL DEFAULT FALSE,  -- Plan F için Ramazan bayrağı
    actual_rotation_date DATE,               -- Fiilen gerçekleştiğinde dolar
    UNIQUE(hatim_id, cycle_number)
);

-- ================================================================
-- ÖZEL HATİM KATILIM İSTEKLERİ
-- is_public=FALSE hatimlerde "Davet İste" butonu bu tabloya düşer.
-- Yönetici APPROVED/REJECTED yapana kadar PENDING kalır.
-- InviteCode ile gelen kullanıcılar bu akışı bypass eder.
-- ================================================================

CREATE TABLE hatim_join_requests (
    id           UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    hatim_id     UUID               NOT NULL REFERENCES hatims(id) ON DELETE CASCADE,
    user_id      UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       join_request_status NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    reviewed_at  TIMESTAMPTZ,
    reviewed_by  UUID               REFERENCES users(id),
    UNIQUE(hatim_id, user_id)
);

-- ================================================================
-- İLETİŞİM / GERİ BİLDİRİM MESAJLARI
-- ================================================================

CREATE TABLE contact_messages (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(200) NOT NULL,
    email_or_phone VARCHAR(255),
    message        TEXT         NOT NULL,
    is_read        BOOLEAN      NOT NULL DEFAULT FALSE,
    is_replied     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ================================================================
-- İNDEKSLER
-- ================================================================

-- Hatimler: sık kullanılan filtreler
CREATE INDEX idx_hatims_status     ON hatims(status);
CREATE INDEX idx_hatims_is_public  ON hatims(is_public);
CREATE INDEX idx_hatims_plan_type  ON hatims(plan_type);
CREATE INDEX idx_hatims_creator    ON hatims(creator_user_id);

-- Cüz tahsisleri: hatim bazlı durum sorguları
CREATE INDEX idx_juz_alloc_hatim_status  ON juz_allocations(hatim_id, status);
CREATE INDEX idx_juz_alloc_user          ON juz_allocations(assigned_user_id);
CREATE INDEX idx_juz_alloc_guest_token   ON juz_allocations(guest_token)
    WHERE guest_token IS NOT NULL;

-- Okuma logları: kullanıcı geçmişi ve hatim bazlı raporlar
CREATE INDEX idx_reading_log_user        ON reading_log(user_id);
CREATE INDEX idx_reading_log_hatim       ON reading_log(hatim_id);
CREATE INDEX idx_reading_log_confirmed   ON reading_log(confirmed_at DESC);

-- Katılımcılar: kullanıcının tüm hatimlerini getirme
CREATE INDEX idx_participants_user       ON hatim_participants(user_id);

-- Katılım istekleri: bekleyen istekleri yönetici paneline çekme
CREATE INDEX idx_join_requests_hatim_status ON hatim_join_requests(hatim_id, status);
```

---

## Bölüm 3 — Entity İlişki Özeti (ER Notasyonu)

```
users ──< hatims             (1 kullanıcı N hatim oluşturur)
users ──< hatim_participants (1 kullanıcı N hatimde üye olur)
hatims ──< hatim_participants
hatims ──< juz_allocations   (1 hatimin 30 × N_döngü cüz tahsisi olur)
hatims ──< rotation_schedule
hatims ──< hatim_join_requests
juz_allocations ──< reading_log
users ──< reading_log
user_levels ──< users
hatim_categories ──< hatims
juz_lookup ──< juz_allocations
```

**Redis Cache Haritası:**

| Anahtar Deseni | İçerik | TTL |
|---|---|---|
| `user:stats:{userId}` | UserStats JSON | 5 dk |
| `juz:lookup:all` | Tüm 30 cüz Hash | Sınırsız (startup'ta yüklenir) |
| `hatim:active:{hatimId}` | Doluluk durumu | 30 sn |
| `guest:token:{token}` | AllocationId | 72 saat |

---

## Bölüm 4 — .NET 8 Clean Architecture CLI Komutları

Tüm komutları kopyalayıp terminale yapıştır. Sırayla çalışır.

```bash
# ================================================================
# ADIM 1 — Proje kök klasörü ve Solution
# ================================================================

mkdir GlobalHatim
cd GlobalHatim
dotnet new sln -n GlobalHatim

# ================================================================
# ADIM 2 — Katman projeleri
# ================================================================

dotnet new classlib -n GlobalHatim.Domain         -o src/GlobalHatim.Domain
dotnet new classlib -n GlobalHatim.Application    -o src/GlobalHatim.Application
dotnet new classlib -n GlobalHatim.Infrastructure -o src/GlobalHatim.Infrastructure
dotnet new webapi   -n GlobalHatim.WebAPI         -o src/GlobalHatim.WebAPI

# ================================================================
# ADIM 3 — Solution'a ekle
# ================================================================

dotnet sln add src/GlobalHatim.Domain/GlobalHatim.Domain.csproj
dotnet sln add src/GlobalHatim.Application/GlobalHatim.Application.csproj
dotnet sln add src/GlobalHatim.Infrastructure/GlobalHatim.Infrastructure.csproj
dotnet sln add src/GlobalHatim.WebAPI/GlobalHatim.WebAPI.csproj

# ================================================================
# ADIM 4 — Proje referansları (Bağımlılık yönü: Domain ← App ← Infra ← API)
# ================================================================

dotnet add src/GlobalHatim.Application/GlobalHatim.Application.csproj \
  reference src/GlobalHatim.Domain/GlobalHatim.Domain.csproj

dotnet add src/GlobalHatim.Infrastructure/GlobalHatim.Infrastructure.csproj \
  reference src/GlobalHatim.Application/GlobalHatim.Application.csproj

dotnet add src/GlobalHatim.WebAPI/GlobalHatim.WebAPI.csproj \
  reference src/GlobalHatim.Application/GlobalHatim.Application.csproj

dotnet add src/GlobalHatim.WebAPI/GlobalHatim.WebAPI.csproj \
  reference src/GlobalHatim.Infrastructure/GlobalHatim.Infrastructure.csproj

# ================================================================
# ADIM 5 — NuGet Paketleri: Application
# ================================================================

dotnet add src/GlobalHatim.Application package MediatR
dotnet add src/GlobalHatim.Application package FluentValidation
dotnet add src/GlobalHatim.Application package FluentValidation.DependencyInjectionExtensions
dotnet add src/GlobalHatim.Application package AutoMapper
dotnet add src/GlobalHatim.Application package AutoMapper.Extensions.Microsoft.DependencyInjection

# ================================================================
# ADIM 6 — NuGet Paketleri: Infrastructure
# ================================================================

dotnet add src/GlobalHatim.Infrastructure package Microsoft.EntityFrameworkCore
dotnet add src/GlobalHatim.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add src/GlobalHatim.Infrastructure package Microsoft.EntityFrameworkCore.Tools
dotnet add src/GlobalHatim.Infrastructure package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add src/GlobalHatim.Infrastructure package StackExchange.Redis
dotnet add src/GlobalHatim.Infrastructure package BCrypt.Net-Next

# ================================================================
# ADIM 7 — NuGet Paketleri: WebAPI
# ================================================================

dotnet add src/GlobalHatim.WebAPI package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add src/GlobalHatim.WebAPI package Swashbuckle.AspNetCore
dotnet add src/GlobalHatim.WebAPI package Serilog.AspNetCore

# ================================================================
# ADIM 8 — Domain klasör yapısı
# ================================================================

mkdir -p src/GlobalHatim.Domain/Entities
mkdir -p src/GlobalHatim.Domain/Enums
mkdir -p src/GlobalHatim.Domain/ValueObjects
mkdir -p src/GlobalHatim.Domain/Interfaces
mkdir -p src/GlobalHatim.Domain/Exceptions
mkdir -p src/GlobalHatim.Domain/Events

# ================================================================
# ADIM 9 — Application klasör yapısı
# ================================================================

mkdir -p src/GlobalHatim.Application/Features/Hatims/Commands
mkdir -p src/GlobalHatim.Application/Features/Hatims/Queries
mkdir -p src/GlobalHatim.Application/Features/JuzAllocations/Commands
mkdir -p src/GlobalHatim.Application/Features/JuzAllocations/Queries
mkdir -p src/GlobalHatim.Application/Features/Users/Commands
mkdir -p src/GlobalHatim.Application/Features/Users/Queries
mkdir -p src/GlobalHatim.Application/Features/Auth/Commands
mkdir -p src/GlobalHatim.Application/Features/Contact/Commands
mkdir -p src/GlobalHatim.Application/Common/Interfaces
mkdir -p src/GlobalHatim.Application/Common/Mappings
mkdir -p src/GlobalHatim.Application/Common/Behaviours
mkdir -p src/GlobalHatim.Application/DTOs

# ================================================================
# ADIM 10 — Infrastructure klasör yapısı
# ================================================================

mkdir -p src/GlobalHatim.Infrastructure/Persistence/Configurations
mkdir -p src/GlobalHatim.Infrastructure/Persistence/Migrations
mkdir -p src/GlobalHatim.Infrastructure/Persistence/Seeders
mkdir -p src/GlobalHatim.Infrastructure/Repositories
mkdir -p src/GlobalHatim.Infrastructure/Services/Redis
mkdir -p src/GlobalHatim.Infrastructure/Services/Rotation
mkdir -p src/GlobalHatim.Infrastructure/Services/GuestToken
mkdir -p src/GlobalHatim.Infrastructure/BackgroundWorkers
mkdir -p src/GlobalHatim.Infrastructure/Identity

# ================================================================
# ADIM 11 — WebAPI klasör yapısı
# ================================================================

mkdir -p src/GlobalHatim.WebAPI/Controllers
mkdir -p src/GlobalHatim.WebAPI/Middleware
mkdir -p src/GlobalHatim.WebAPI/Extensions

# ================================================================
# ADIM 12 — Build kontrolü (hata yoksa hazır)
# ================================================================

dotnet build

echo "✅ GlobalHatim backend temeli başarıyla kuruldu."
```

---

## Bölüm 5 — Planlanan Controller Listesi

| Controller | Prefix | Notlar |
|---|---|---|
| `AuthController` | `/api/auth` | Register, Login, RefreshToken |
| `HatimsController` | `/api/hatims` | CRUD + Filtreler |
| `JuzAllocationsController` | `/api/hatims/{id}/allocations` | Cüz alma, tamamlama, misafir flow |
| `UsersController` | `/api/users` | Profil, stats, geçmiş |
| `ContactController` | `/api/contact` | Geri bildirim gönder |
| `AdminController` | `/api/admin` | JoinRequest onay/ret, ContactMessage yönetimi |

---

*Bu doküman projenin mimari temelini oluşturur. Her yeni geliştirme kararı buraya eklenmelidir.*
