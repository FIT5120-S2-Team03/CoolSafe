export const TYPOGRAPHY = {
  headline: "font-headline",
  bodyFace: "font-body",
  monoFace: "font-mono",

  display:   "font-headline text-[clamp(48px,6vw,76px)] leading-[0.98] tracking-normal text-[#0F0F0F]",
  section:   "font-headline text-[var(--text-section)] leading-[1.05] tracking-normal text-[#0F0F0F]",
  titleSm:   "font-headline text-[var(--text-title-sm)] leading-[1.15] tracking-normal text-[#0F0F0F]",
  titleMd:   "font-headline text-[var(--text-title-md)] leading-[1.1] tracking-normal text-[#0F0F0F]",
  body:      "font-body text-[var(--text-body)] leading-[1.55] text-[#5A5048]",
  bodySmall: "font-body text-[var(--text-body-sm)] leading-[1.5] text-[#5A5048]",
  label:     "font-body text-[var(--text-label)] font-medium text-[#0F0F0F]",
  eyebrow:   "font-mono text-[var(--text-caption)] uppercase tracking-[0.12em] text-[#6E6358]",
  caption:   "font-mono text-[var(--text-caption)] text-[#6E6358]",
  score:     "font-headline text-[var(--text-score)] leading-[0.8] tracking-normal",
}

// Pixel values for inline styles (SVG, style={{ fontSize }}, etc.)
// Always reference these instead of hardcoding numbers in components.
export const FONT_SIZE = {
  caption: 14,
  label: 16,
  bodySmall: 18,
  body: 18,
  titleXs: 22,
  titleSm: 26,
  titleMd: 30,
  titleLg: 32,
  displaySm: 40,
  score: 72,
}
