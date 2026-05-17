export default function ModalFrame({
  children,
  closeOnBackdrop = true,
  onClose,
  overlayClassName,
  overlayStyle,
  panelClassName,
  panelStyle,
}) {
  return (
    <div
      className={overlayClassName}
      onClick={() => {
        if (closeOnBackdrop) onClose?.()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.5)',
        ...overlayStyle,
      }}
    >
      <div className={panelClassName} onClick={(e) => e.stopPropagation()} style={panelStyle}>
        {children}
      </div>
    </div>
  )
}
