/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind'in dark mode'u class stratejisiyle yönetiyoruz.
  // <html class="dark"> eklendiğinde dark: prefixi devreye girer.
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    // --- Mobile-First Container ---
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',   // 16px — mobile margin
        md: '1.5rem',
        lg: '3rem',        // 48px — desktop margin
      },
      screens: {
        xl: '1200px',      // Editorial max-width (12-col grid)
      },
    },

    extend: {
      // ─── Renk Paleti (Figma Token → Tailwind) ───────────────────────────
      colors: {
        // --- Dark Tema: "Midnight & Gold" ---
        dark: {
          bg:               '#051424',   // surface / background
          'bg-deep':        '#010f1f',   // surface-container-lowest
          'surface-low':    '#0d1c2d',   // surface-container-low
          surface:          '#122131',   // surface-container
          'surface-high':   '#1c2b3c',   // surface-container-high
          'surface-higher': '#273647',   // surface-container-highest
          text:             '#d4e4fa',   // on-surface
          'text-muted':     '#d1c5b4',   // on-surface-variant
          outline:          '#9a8f80',
          'outline-subtle': '#4e4639',
        },

        // --- Light Tema: "Clean Editorial" ---
        light: {
          bg:               '#ffffff',
          'bg-dim':         '#f8f9fb',
          surface:          '#f1f3f7',
          'surface-high':   '#e8ecf2',
          text:             '#0d1117',
          'text-muted':     '#4b5563',
          outline:          '#d1d5db',
          'outline-subtle': '#e5e7eb',
        },

        // --- Primary: Altın / Gold ---
        gold: {
          DEFAULT: '#e9c176',   // primary (dark accent)
          dim:     '#c5a059',   // primary-container / CTA button bg
          deep:    '#775a19',   // inverse-primary (light mode accent)
          light:   '#ffdea5',   // primary-fixed (hover highlight)
          text:    '#412d00',   // on-primary (dark text on gold btn)
        },

        // --- Secondary ---
        secondary: {
          DEFAULT: '#bec6e0',
          container: '#3f465c',
          text:    '#283044',
        },

        // --- Semantic ---
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        },
      },

      // ─── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        serif: ['"Libre Caslon Text"', 'Georgia', 'serif'],
        sans:  ['"Source Sans Three"', '"Source Sans Pro"', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        // Display
        'display-lg': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],   // 64px

        // Headlines (mobile ilk, lg: override ile desktop'a)
        'headline-lg-mobile': ['2rem', { lineHeight: '1.2' }],   // 32px
        'headline-lg':        ['2.5rem', { lineHeight: '1.2' }], // 40px
        'headline-md':        ['1.75rem', { lineHeight: '1.3' }],// 28px

        // Body
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],  // 18px
        'body-md': ['1rem',     { lineHeight: '1.6' }],  // 16px

        // Label (uppercase + tracking)
        'label-md': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.05em' }], // 14px
      },

      // ─── Spacing (8px scale) ─────────────────────────────────────────────
      spacing: {
        'section': '4rem',    // 64px — büyük bölüm boşlukları
        'gutter':  '1.5rem',  // 24px
      },

      // ─── Border Radius (Soft Level 1) ────────────────────────────────────
      borderRadius: {
        DEFAULT: '0.25rem',   // 4px — tüm kartlar, butonlar, inputlar
        sm:  '0.125rem',
        md:  '0.375rem',
        lg:  '0.5rem',
        xl:  '0.75rem',
        full:'9999px',
      },

      // ─── Box Shadow (Tonal Elevation / Luminous Outlines) ────────────────
      boxShadow: {
        // Gold glow — hover'da kartlarda
        'gold-glow':    '0 0 0 1px rgba(233,193,118,0.35)',
        'gold-glow-md': '0 0 0 1px rgba(233,193,118,0.6)',
        // Glassmorphism overlay
        'glass':        'inset 0 1px 0 rgba(255,255,255,0.06)',
        // a11y focus ring (gold)
        'focus-gold':   '0 0 0 2px #051424, 0 0 0 4px #e9c176',
      },

      // ─── Backdrop Blur ───────────────────────────────────────────────────
      backdropBlur: {
        nav: '16px',  // glassmorphism navbar
        modal: '20px',
      },

      // ─── Keyframe Animasyonlar ───────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'dot-pulse': {
          '0%, 100%': { opacity: '0.3' },
          '50%':      { opacity: '1' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.35s ease-out both',
        'dot-pulse':  'dot-pulse 1.4s ease-in-out infinite',
      },
    },
  },

  plugins: [
    // ─── a11y: Global focus-visible ring ──────────────────────────────────
    // Tailwind'in varsayılan focus ring'ini kaldırıp
    // focus-visible:ring-* utility'lerini kullanıyoruz.
    // Komponentlerde her zaman focus-visible:ring-2 focus-visible:ring-gold
    // class'larını ekle; bu plugin global default'u kuruyor.
    ({ addBase, theme }) => {
      addBase({
        // Tarayıcı default outline'ını kaldır — kendi focus stilimiz var
        '*:focus': { outline: 'none' },
        // Sadece klavye navigasyonunda göster (WCAG 2.4.7)
        '*:focus-visible': {
          outline: `2px solid ${theme('colors.gold.DEFAULT')}`,
          outlineOffset: '2px',
        },
      })
    },
  ],
}
