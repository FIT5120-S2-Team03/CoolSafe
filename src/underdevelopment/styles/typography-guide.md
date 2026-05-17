# CoolSafer Typography Guide

CoolSafer is designed for older adults, so the type system should feel calm, legible, and predictable. Use one system sans-serif family for almost everything. Use the mono/data face only for compact data labels such as dates, temperature tags, AQI labels, or short uppercase badges.

## Font Roles

- Product logo: brand serif or logo-specific styling only.
- Slogan and page titles: `var(--font-display)`.
- Section headings and card headings: `var(--font-display)`.
- Body copy, controls, navigation, buttons: `var(--font-body)`.
- Data labels: `var(--font-data)`, only when the text is short.

## Type Scale

- Slogan: `var(--text-slogan)`, `var(--leading-display)`.
- Page title: `var(--text-page-title)`, `var(--leading-display)`.
- Section title: `var(--text-section)`, `var(--leading-title)`.
- Large card title: `var(--text-card-title-lg)`, `var(--leading-heading)`.
- Card title: `var(--text-card-title)`, `var(--leading-heading)`.
- Small card title: `var(--text-card-title-sm)`, `var(--leading-heading)`.
- Body: `var(--text-body)`, `var(--leading-body)`.
- Secondary body: `var(--text-body-sm)`, `var(--leading-body)`.
- Button and compact label: `var(--text-button)` / `var(--text-label)`.
- Caption: `var(--text-caption)`.
- Data value: `var(--text-data-lg)` or `var(--text-data)`.
- Score: `var(--text-score)`.

## Usage Rules

- Do not add more font families for content. More fonts reduce clarity here.
- Keep body copy at 18px on desktop and 17px on mobile.
- Keep actionable text at 16px or larger. Reserve 13-15px for very short metadata only.
- Use uppercase letter spacing only for very short labels.
- Avoid negative tracking except display/page titles, where the token already handles it.
- Prefer semantic tokens over raw values such as `1rem`, `0.9375rem`, or one-off `clamp(...)`.
- For older users, prioritize line height and contrast over decorative typography.
