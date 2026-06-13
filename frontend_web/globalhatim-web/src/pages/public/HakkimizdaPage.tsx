// ─────────────────────────────────────────────────────────────────────────────
// Hakkımızda Sayfası — Light/Dark tam uyumlu, a11y-safe
// ─────────────────────────────────────────────────────────────────────────────

const MISSION_ITEMS = [
  {
    id: 'accessibility',
    icon: (
      <svg aria-hidden="true" className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    title: 'Erişilebilirlik Odaklı Arayüz',
    description:
      'Her cihazda, her ekran boyutunda ve her kullanıcı için kusursuz çalışan; WCAG AA standartlarını karşılayan, klavye ve ekran okuyucu dostu bir deneyim sunuyoruz.',
  },
  {
    id: 'backend',
    icon: (
      <svg aria-hidden="true" className="h-6 w-6 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
    badgeBg: 'bg-sky-100 dark:bg-sky-900/30',
    title: 'Güvenilir ve Hızlı Backend Altyapısı',
    description:
      '.NET tabanlı RESTful API ve JWT kimlik doğrulamasıyla güçlendirilmiş platformumuz; yüksek eşzamanlılık altında bile tutarlı, güvenli ve ölçeklenebilir bir hizmet sunar.',
  },
  {
    id: 'community',
    icon: (
      <svg aria-hidden="true" className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    title: 'Topluluk Odaklı Hatim Paylaşımı',
    description:
      'Dünyanın dört bir yanındaki okuyucuları tek bir manevi amaç etrafında buluşturuyor; katılım, ilerleme ve tamamlanma süreçlerini şeffaf ve teşvik edici bir topluluk deneyimiyle destekliyoruz.',
  },
]

export default function HakkimizdaPage() {
  return (
    <main aria-labelledby="about-heading">

      {/* ── Hero bölümü ─────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white dark:bg-dark-bg border-b border-light-outline dark:border-dark-outline">
        <div className="container max-w-3xl">
          {/* Üst etiket */}
          <p className="font-sans text-label-md uppercase tracking-widest text-gold-deep dark:text-gold mb-4">
            Biz Kimiz
          </p>

          {/* Ana başlık */}
          <h1
            id="about-heading"
            className={[
              'font-serif font-normal leading-tight tracking-tight',
              'text-[2rem] md:text-[2.75rem] lg:text-[3.25rem]',
              'text-slate-900 dark:text-dark-text',
              'mb-6',
            ].join(' ')}
          >
            Kur'an'ı Dünyaya
            <br className="hidden sm:block" />
            {' '}Birlikte Hatmetmek
          </h1>

          {/* Vizyon metni */}
          <p className="font-sans text-body-lg text-slate-600 dark:text-dark-text-muted leading-relaxed mb-4 max-w-2xl">
            GlobalHatim, küresel bir manevi birliktelik ve Kur'an-ı Kerim ortak okuma platformudur.
            Farklı kıtalarda, farklı dillerde yaşayan insanları tek bir kutsal amaç etrafında buluşturmak;
            her bir cüzün bir kalbe, her hatmin bir topluluğa dokunmasını sağlamak için yola çıktık.
          </p>
          <p className="font-sans text-body-md text-slate-500 dark:text-dark-text-muted/80 leading-relaxed max-w-2xl">
            Teknoloji burada bir araç — asıl olan, ortak okuma bereketini yaşatmak ve her okuyucunun
            manevi yolculuğunu anlamlı kılmaktır.
          </p>
        </div>
      </section>

      {/* ── Misyon akışı ────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="mission-heading"
        className="py-16 md:py-20 bg-light-bg-dim dark:bg-dark-bg-deep"
        style={{ background: 'var(--section-alt-bg)' }}
      >
        <div className="container">
          <div className="max-w-xl mb-10 md:mb-14">
            <h2
              id="mission-heading"
              className="font-serif text-headline-lg-mobile md:text-headline-md text-slate-900 dark:text-dark-text mb-2"
            >
              Misyonumuz
            </h2>
            <p className="font-sans text-body-md text-slate-500 dark:text-dark-text-muted">
              Üç temel ilke, platformun her satırına işlendi.
            </p>
          </div>

          <ol className="flex flex-col gap-6" role="list">
            {MISSION_ITEMS.map((item, idx) => (
              <li key={item.id}>
                <article
                  className={[
                    'flex gap-5 p-6 rounded-lg border transition-shadow duration-200',
                    'bg-white border-slate-200 hover:shadow-gold-glow',
                    'dark:bg-dark-surface dark:border-dark-outline dark:hover:shadow-gold-glow-md',
                  ].join(' ')}
                >
                  {/* Numara + ikon rozeti */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-0.5">
                    <div
                      className={[
                        'flex h-11 w-11 rounded-full items-center justify-center',
                        item.badgeBg,
                      ].join(' ')}
                    >
                      {item.icon}
                    </div>
                    <span
                      aria-hidden="true"
                      className="font-serif text-2xl text-slate-200 dark:text-dark-outline select-none"
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* İçerik */}
                  <div>
                    <h3 className="font-serif text-lg text-slate-900 dark:text-dark-text mb-1.5 leading-snug">
                      {item.title}
                    </h3>
                    <p className="font-sans text-body-md text-slate-500 dark:text-dark-text-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Alt CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-white dark:bg-dark-bg">
        <div className="container max-w-2xl text-center">
          <p className="font-sans text-label-md uppercase tracking-widest text-gold-deep dark:text-gold mb-4">
            Birlikte Okuyalım
          </p>
          <h2 className="font-serif text-headline-lg-mobile md:text-headline-md text-slate-900 dark:text-dark-text mb-4">
            Siz de Aramıza Katılın
          </h2>
          <p className="font-sans text-body-md text-slate-500 dark:text-dark-text-muted mb-8 leading-relaxed">
            Aktif bir hatme katılın ya da kendi topluluğunuz için yeni bir hatim başlatın.
            Her cüz, küresel bir bütünün parçasıdır.
          </p>
          <a
            href="/hatimler"
            className={[
              'inline-flex items-center gap-2',
              'font-sans font-semibold text-label-md uppercase tracking-widest',
              'px-6 py-3.5 rounded',
              'bg-slate-900 text-white hover:bg-slate-700',
              'dark:bg-gold-dim dark:text-gold-text dark:hover:bg-gold',
              'transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
              'focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg',
            ].join(' ')}
          >
            Hatimlere Göz At
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </section>

    </main>
  )
}
