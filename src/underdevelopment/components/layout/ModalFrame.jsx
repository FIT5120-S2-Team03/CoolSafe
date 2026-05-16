export default function ModalFrame({
  children,
  closeOnBackdrop = true,
  onClose,
  overlayStyle,
  panelStyle,
}) {
  return (
    <div
      onClick={() => {
        if (closeOnBackdrop) onClose?.()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.5)',
        ...overlayStyle,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={panelStyle}>
        {children}
      </div>
    </div>
  )
}
