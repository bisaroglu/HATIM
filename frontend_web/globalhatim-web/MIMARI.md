# GlobalHatim Web Frontend — Mimari Rehberi

## Kurulum

```bash
cd frontend_web/globalhatim-web
cp .env.example .env
npm install
npm run dev        # → http://localhost:3000
```

---

## Klasör Yapısı

```
src/
├── components/
│   ├── common/          # Yeniden kullanılabilir atomik bileşenler
│   │   ├── Button.tsx   # variant: primary | secondary | ghost | danger
│   │   ├── Input.tsx    # a11y label + error + hint
│   │   ├── ThemeToggle.tsx
│   │   └── index.ts     # Barrel export
│   └── layout/          # Sayfa iskelet bileşenleri
│       ├── MainLayout.tsx    # Navbar + <main> + Footer
│       ├── AuthLayout.tsx    # Dot-grid + glassmorphism card
│       ├── Navbar.tsx        # Glassmorphism, mobile hamburger
│       ├── ProtectedRoute.tsx
│       └── index.ts
│
├── pages/
│   ├── public/          # Kimlik doğrulama gerektirmeyen
│   │   ├── HomePage.tsx
│   │   ├── HakkimizdaPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── hatim/
│   │   ├── HatimlerPage.tsx
│   │   └── HatimDetayPage.tsx
│   ├── profile/
│   │   └── ProfilPage.tsx
│   └── auth/            # AuthLayout içinde render edilir
│       ├── GirisPage.tsx
│       └── KayitPage.tsx
│
├── services/            # Tüm API çağrıları burada
│   ├── api.ts           # Axios instance, JWT interceptor, token refresh
│   ├── auth.service.ts
│   └── hatim.service.ts
│
├── store/               # Zustand global state
│   ├── auth.store.ts    # user, isAuthenticated, login/logout/register
│   └── theme.store.ts   # light/dark, DOM sınıf yönetimi
│
├── types/
│   └── index.ts         # Tüm TS interface'leri merkezi
│
├── router/
│   └── index.tsx        # createBrowserRouter, lazy loading, Suspense
│
├── App.tsx              # Skip-link + AppRouter + token hydration
├── main.tsx
└── index.css            # @tailwind + dot-grid + skip-link + base
```

---

## Mimari Prensipler

### 1. Mobile-First (Tailwind)
Tüm class'lar mobil baz alınarak yazılır, geniş ekranlar `md:` ve `lg:` ile genişler.
```tsx
// ✅ Doğru
<h1 className="text-headline-lg-mobile lg:text-headline-lg">

// ❌ Yanlış
<h1 className="text-headline-lg lg:text-headline-lg-mobile">
```

### 2. Erişilebilirlik (a11y / WCAG 2.1 AA)
Her interaktif element klavye ile ulaşılabilir ve focus-visible ring alır:
```tsx
// Tüm interaktif elementlerde zorunlu
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
```
- Semantik HTML: `<main>`, `<nav>`, `<header>`, `<footer>`, `<button>`, `<form>`
- ARIA: `aria-label`, `aria-expanded`, `aria-selected`, `aria-invalid`, `aria-describedby`
- Skip-link: `<a href="#main-content">` — App.tsx'in en tepesinde

### 3. Dark / Light Tema
`useThemeStore` tema değiştirdiğinde `<html>` elementine `dark` class'ı ekler/kaldırır.
Tailwind `darkMode: 'class'` stratejisi ile `dark:` prefix'i devreye girer.
```tsx
<div className="bg-light-bg dark:bg-dark-bg text-dark-text dark:text-dark-text">
```

---

## Renk Paleti Referansı

| Token                  | Light           | Dark            | Kullanım         |
|------------------------|-----------------|-----------------|------------------|
| `bg-light-bg`          | #ffffff         | —               | Sayfa zemini     |
| `bg-dark-bg`           | —               | #051424         | Sayfa zemini     |
| `text-dark-text`       | #0d1117         | #d4e4fa         | Ana metin        |
| `bg-gold-dim`          | —               | #c5a059         | Primary buton    |
| `text-gold`            | —               | #e9c176         | Vurgu, link      |
| `text-gold-deep`       | #775a19         | —               | Light mod vurgu  |

---

## API İstemcisi Notları

- Base URL: `http://localhost:5000/api` (`.env` → `VITE_API_BASE_URL`)
- Her istek: `Authorization: Bearer <token>` header'ı otomatik eklenir
- 401 response: refresh token ile otomatik yenileme, başarısızsa `/giris`'e yönlendirme
- Token storage: `localStorage` → `gh_access_token` / `gh_refresh_token`

---

## Yeni Sayfa / Bileşen Ekleme Kontrol Listesi

- [ ] Semantic HTML tag'leri kullanıldı mı? (`<section>`, `<article>`, vb.)
- [ ] Her interaktif element `focus-visible:ring-2 focus-visible:ring-gold` alıyor mu?
- [ ] `aria-label` / `aria-describedby` gerekli yerlerde eklendi mi?
- [ ] Tüm class'lar mobile-first yazıldı mı?
- [ ] Dark mode `dark:` prefix'leri tüm renk class'larında var mı?
- [ ] Figma referansı: `assets/web/<sayfa_adi>_web.png` ve `_web_dark.png` incelendi mi?
