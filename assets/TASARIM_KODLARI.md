---
name: Sacred Global Connection (Dark Mode)
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#d1c5b4'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#9a8f80'
  outline-variant: '#4e4639'
  surface-tint: '#e9c176'
  primary: '#e9c176'
  on-primary: '#412d00'
  primary-container: '#c5a059'
  on-primary-container: '#4e3700'
  inverse-primary: '#775a19'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3f465c'
  on-secondary-container: '#adb4ce'
  tertiary: '#bcc7de'
  on-tertiary: '#263143'
  tertiary-container: '#9ba6bd'
  on-tertiary-container: '#313c4e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea5'
  primary-fixed-dim: '#e9c176'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4201'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 28px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Source Sans Three
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Source Sans Three
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Source Sans Three
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
The design system embodies a sense of timeless wisdom, transcendence, and global unity. It is designed to evoke a meditative emotional response—calm, authoritative, and deeply connected. The brand personality balances the weight of tradition with the fluidity of modern connection.

The visual style is a blend of **Minimalism** and **Subtle Glassmorphism**. By utilizing heavy whitespace (or "dark-space") and refined editorial typography, the interface feels like a premium digital manuscript. The use of translucent layers and soft, light-leak blurs mimics the ethereal quality of starlight or candlelight against a night sky, reinforcing the spiritual narrative of the design system.

## Colors
This design system utilizes a "Midnight & Gold" palette to establish high-contrast readability and a premium aesthetic.

*   **Primary (Gold):** Used sparingly for key actions, icons, and accents to represent light and enlightenment.
*   **Secondary (Deep Navy):** The core background foundation, providing a vast, steady environment.
*   **Tertiary (Charcoal):** Used for elevated surface containers and structural elements.
*   **Neutral (Muted Gray):** Reserved for secondary text and borders to ensure the gold accents remain the focal point.

The color hierarchy prioritizes legibility in low-light environments, using slight variations in navy saturation to define depth rather than relying on pure black.

## Typography
The typography strategy centers on the contrast between the historic, literary feel of **Libre Caslon Text** and the functional clarity of **Source Sans Three**.

Headlines should always utilize the serif typeface to ground the design system in tradition and authority. Large display sizes benefit from slight negative letter spacing to create a cohesive "block" of text. For body copy and labels, the sans-serif ensures high legibility against dark backgrounds, particularly at smaller scales. Labels are intentionally set in uppercase with increased letter spacing to provide a modern, rhythmic counterpoint to the classical headlines.

## Layout & Spacing
This design system employs a **Fixed Grid** model for desktop to maintain an editorial, structured feel, while transitioning to a **Fluid Grid** for mobile devices.

*   **Desktop:** A 12-column grid with a maximum width of 1200px. This creates intentional "dead space" on wider monitors, mimicking the margins of a printed book.
*   **Mobile:** A 4-column fluid grid with 16px side margins. 
*   **Rhythm:** An 8px linear scale governs all padding and margin decisions. Significant sections of content should be separated by large vertical gaps (64px+) to allow the design to "breathe" and maintain its meditative quality.

## Elevation & Depth
In this dark theme, depth is conveyed through **Tonal Layering** and **Luminous Accents** rather than traditional shadows.

1.  **Base Layer:** The deepest navy (#0A0F1C) serves as the infinite background.
2.  **Surface Layer:** Modally elevated elements use a slightly lighter navy/charcoal (#161E2E).
3.  **Luminous Outlines:** Instead of drop shadows, elevated cards use a 1px low-opacity gold or light-gray border.
4.  **Backdrop Blurs:** High-priority overlays use a 12px-20px background blur to create a frosted-glass effect, allowing the deep background colors to "glow" through the interface, reinforcing the spiritual aesthetic.

## Shapes
The shape language is **Soft (Level 1)**. This subtle rounding (0.25rem) avoids the coldness of sharp corners while remaining more formal and structured than fully rounded or pill-shaped systems.

This "Soft" approach is applied consistently across buttons, input fields, and cards. It strikes a balance between the organic nature of the brand's spiritual themes and the digital precision required for a high-end UI.

## Components
Components are styled to emphasize the contrast between the dark environment and the gold light.

*   **Buttons:** Primary buttons are solid Gold (#C5A059) with Deep Navy text for maximum prominence. Secondary buttons use a "Ghost" style with a 1px gold border and gold text.
*   **Cards:** Use the `surface` color with a very subtle 1px border. On hover, the border opacity should increase to simulate a "glow" effect.
*   **Input Fields:** Minimalist design—only a bottom border (1px) in light gray, which turns gold upon focus. Labels should sit above the field in the uppercase `label-md` style.
*   **Chips/Tags:** Small, charcoal-filled capsules with light gray text, used for categorizing global topics or spiritual themes.
*   **Lists:** Items are separated by low-contrast thin lines (#1E293B) to maintain a clean, uncluttered flow.
*   **Navigation:** Use high-transparency glassmorphism for top navigation bars to ensure the "spiritual" background blurs are always visible as the user scrolls.