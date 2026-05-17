export const TYPOGRAPHY = {
  headline: "font-headline",
  bodyFace: "font-body",
  monoFace: "font-mono",

  slogan:    "font-headline text-[var(--text-slogan)] leading-[var(--leading-display)] tracking-[var(--tracking-display)] text-[#0F0F0F]",
  display:   "font-headline text-[var(--text-page-title)] leading-[var(--leading-display)] tracking-[var(--tracking-display)] text-[#0F0F0F]",
  section:   "font-headline text-[var(--text-section)] leading-[var(--leading-title)] tracking-[var(--tracking-title)] text-[#0F0F0F]",
  titleSm:   "font-headline text-[var(--text-card-title-sm)] leading-[var(--leading-heading)] tracking-[var(--tracking-title)] text-[#0F0F0F]",
  titleMd:   "font-headline text-[var(--text-card-title)] leading-[var(--leading-heading)] tracking-[var(--tracking-title)] text-[#0F0F0F]",
  body:      "font-body text-[var(--text-body)] leading-[var(--leading-body)] text-[#5A5048]",
  bodySmall: "font-body text-[var(--text-body-sm)] leading-[var(--leading-body)] text-[#5A5048]",
  label:     "font-body text-[var(--text-label)] leading-[var(--leading-compact)] font-bold tracking-[var(--tracking-label)] text-[#0F0F0F]",
  eyebrow:   "font-mono text-[var(--text-caption)] uppercase tracking-[var(--tracking-data)] text-[#6E6358]",
  caption:   "font-body text-[var(--text-caption)] leading-[var(--leading-compact)] text-[#6E6358]",
  score:     "font-headline text-[var(--text-score)] leading-[0.8] tracking-normal",
}

// Pixel values for inline styles (SVG, style={{ fontSize }}, etc.)
// Always reference these instead of hardcoding numbers in components.
export const FONT_SIZE = {
  caption: 15,
  label: 16,
  bodySmall: 17,
  body: 18,
  titleXs: 24,
  titleSm: 28,
  titleMd: 32,
  titleLg: 36,
  displaySm: 40,
  score: 72,
}
