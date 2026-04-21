export const TYPOGRAPHY = {
  // Banner (HeatRiskBanner only — keep large)
  bannerHeading:  "font-['Public_Sans'] font-black text-[72px] leading-tight tracking-[-2px]",
  bannerSubtitle: "font-['Public_Sans'] font-medium text-[22px] leading-snug",
  bannerBadge:    "font-['Public_Sans'] font-bold text-[13px] uppercase tracking-[3px]",

  // 4-tier type scale: 30 / 22 / 18 / 16
  h1:        "font-['Public_Sans'] font-black text-[30px] leading-tight text-[#1a1c1e]",
  h2:        "font-['Public_Sans'] font-bold text-[22px] leading-snug text-[#1a1c1e]",
  h3:        "font-['Public_Sans'] font-bold text-[18px] leading-snug text-[#1a1c1e]",
  subtitle:  "font-['Lexend'] font-medium text-[18px] leading-normal text-[#424654]",
  label:     "font-['Lexend'] font-medium text-[16px] uppercase tracking-[0.05em] text-[#64748b]",
  body:      "font-['Lexend'] font-normal text-[18px] leading-relaxed text-[#1a1c1e]",
  bodySmall: "font-['Lexend'] font-normal text-[16px] leading-relaxed text-[#424654]",
  dataLarge:  "font-['Inter'] font-semibold text-[22px] text-[#1a1c1e]",
  dataMedium: "font-['Inter'] font-semibold text-[18px] text-[#1a1c1e]",
  dataSmall:  "font-['Inter'] font-semibold text-[16px]",
}

// Pixel values for inline styles (SVG, style={{ fontSize }}, etc.)
// Always reference these instead of hardcoding numbers in components.
export const FONT_SIZE = {
  heading:    30,
  subheading: 22,
  body:       18,
  small:      16,
}
