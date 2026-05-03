export const TYPOGRAPHY = {
  // Banner (HeatRiskBanner only — keep large)
  bannerHeading:  "font-serif text-4xl leading-tight tracking-[-2px]",
  bannerSubtitle: "font-sans font-medium text-xl leading-snug",
  bannerBadge:    "font-sans font-bold text-sm uppercase tracking-[3px]",

  // 4-tier type scale: 30 / 22 / 18 / 16
  h1:        "font-serif text-3xl leading-tight text-[#0F0F0F]",
  h2:        "font-serif text-xl leading-snug text-[#0F0F0F]",
  h3:        "font-sans font-bold text-lg leading-snug text-[#0F0F0F]",
  subtitle:  "font-sans font-medium text-lg leading-normal text-[#3A3A3A]",
  label:     "font-sans font-medium text-base uppercase tracking-[0.05em] text-[#5C5C5C]",
  body:      "font-sans font-normal text-lg leading-relaxed text-[#0F0F0F]",
  bodySmall: "font-sans font-normal text-base leading-relaxed text-[#3A3A3A]",
  dataLarge:  "font-mono font-medium text-xl text-[#0F0F0F]",
  dataMedium: "font-mono font-medium text-lg text-[#0F0F0F]",
  dataSmall:  "font-mono font-medium text-base",
}

// Pixel values for inline styles (SVG, style={{ fontSize }}, etc.)
// Always reference these instead of hardcoding numbers in components.
export const FONT_SIZE = {
  heading:    30,
  subheading: 22,
  body:       18,
  small:      16,
}
