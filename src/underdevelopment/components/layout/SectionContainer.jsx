export default function SectionContainer({
  children,
  innerClassName,
  id,
  outerClassName,
  innerStyle,
  outerStyle,
  padding = 'clamp(48px,6vw,80px) var(--content-gutter)',
}) {
  return (
    <section id={id} className={outerClassName} style={outerStyle}>
      <div
        className={innerClassName}
        style={{
          width: '100%',
          maxWidth: 'var(--content-width)',
          boxSizing: 'border-box',
          margin: '0 auto',
          padding,
          ...innerStyle,
        }}
      >
        {children}
      </div>
    </section>
  )
}
