import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

const FONT_HEADING = "'Public Sans', sans-serif"
const FONT_BODY = "'Lexend', sans-serif"

function AppButton({ label, bg, children, href, onClick }) {
  const circleStyle = {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: '#fff',
    fontFamily: FONT_HEADING,
    fontWeight: 800,
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={circleStyle}>
          {children}
        </a>
      ) : (
        <button onClick={onClick} style={circleStyle}>
          {children}
        </button>
      )}
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#64748b' }}>{label}</span>
    </div>
  )
}

export default function ShareRouteModal({ isOpen, onClose, venueId, venueName, routeType }) {
  const qrRef = useRef(null)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const base = import.meta.env.VITE_SITE_URL || window.location.origin
  const shareUrl = `${base}/venue/${venueId}?route=${routeType}`
  const routeLabel = routeType === 'fastest' ? 'Fastest Route' : 'Coolest Route'

  function handleSaveImage() {
    const canvas = qrRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'coolsafe-route.png'
    a.click()
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleMore() {
    if (navigator.share) {
      try {
        await navigator.share({ url: shareUrl })
      } catch { /* user cancelled */ }
    } else {
      handleCopy()
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.5)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          maxHeight: '90vh', overflowY: 'auto',
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 20px 0' }}>
          <div>
            <h2 style={{ fontFamily: FONT_HEADING, fontWeight: 800, fontSize: 22, color: '#0f172a', margin: 0 }}>
              Share This Route
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              {venueName} · {routeLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', padding: 4, lineHeight: 1, flexShrink: 0,
            }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* QR Code row */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              flexShrink: 0,
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 8,
              background: '#fff',
              lineHeight: 0,
            }}>
              <QRCodeCanvas ref={qrRef} value={shareUrl} size={140} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <p style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>
                Scan to open
              </p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.55 }}>
                Show this code to a family member nearby — it opens this exact page on their phone.
              </p>
              <button
                onClick={handleSaveImage}
                style={{
                  alignSelf: 'flex-start',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Save image
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{
              fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600,
              color: '#94a3b8', letterSpacing: '0.08em', whiteSpace: 'nowrap',
            }}>
              OR SEND A LINK
            </span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* App sharing buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <AppButton label="WhatsApp" bg="#25D366" href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}>
              W
            </AppButton>
            <AppButton label="Messages" bg="#007AFF" href={`sms:?body=${encodeURIComponent(shareUrl)}`}>
              M
            </AppButton>
            <AppButton label="Telegram" bg="#0088cc" href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`}>
              T
            </AppButton>
            <AppButton label="Line" bg="#00C300" href={`https://line.me/R/msg/text/?${encodeURIComponent(shareUrl)}`}>
              L
            </AppButton>
            <AppButton label="More" bg="#64748b" onClick={handleMore}>
              <span style={{ fontSize: 14, letterSpacing: 2 }}>•••</span>
            </AppButton>
          </div>

          {/* Copy link */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 10, padding: '10px 12px',
          }}>
            <input
              readOnly
              value={shareUrl}
              style={{
                flex: 1, minWidth: 0,
                border: 'none', background: 'transparent', outline: 'none',
                fontFamily: FONT_BODY, fontSize: 13, color: '#475569',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                flexShrink: 0,
                background: copied ? '#16a34a' : '#003fa4',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '7px 16px',
                fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s',
                minWidth: 72,
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
