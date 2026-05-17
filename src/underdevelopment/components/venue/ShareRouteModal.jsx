import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import ModalFrame from '../layout/ModalFrame'
import { INK, MUTED, RULE } from '../../styles/colors'

const FONT_HEADING = "var(--font-title)"
const FONT_BODY = "var(--font-body)"

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={circleStyle}>
          {children}
        </a>
      ) : (
        <button onClick={onClick} style={circleStyle}>
          {children}
        </button>
      )}
      <span style={{ fontFamily: FONT_BODY, fontSize: 'var(--text-caption)', color: '#64748b' }}>{label}</span>
    </div>
  )
}

export default function ShareRouteModal({ isOpen, onClose, venueId, venueName, routeType, userLocation }) {
  const qrRef = useRef(null)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const base = import.meta.env.VITE_SITE_URL || window.location.origin
  const shareUrl = userLocation
    ? `${base}/venue/${venueId}?share=true&from_lat=${userLocation.lat}&from_lng=${userLocation.lng}`
    : `${base}/venue/${venueId}?share=true`
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
    <ModalFrame
      onClose={onClose}
      panelStyle={{
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--color-paper)',
        borderRadius: 24,
        boxShadow: '0 24px 60px rgba(15,12,9,0.22)',
      }}
      overlayStyle={{
        zIndex: 1100,
        background: 'rgba(15,12,9,0.40)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 20px 0' }}>
          <div>
            <h2 style={{ fontFamily: FONT_HEADING, fontWeight: 'normal', fontSize: 'var(--text-title-xs)', color: INK, margin: 0, letterSpacing: 'var(--tracking-title)', lineHeight: 1.1 }}>
              Share This Route
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 'var(--text-body-sm)', color: MUTED, margin: '8px 0 0', lineHeight: 'var(--leading-body)' }}>
              {venueName} · {routeLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', borderRadius: '50%',
              width: 30, height: 30, color: MUTED, padding: 0, lineHeight: 1, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
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
              border: `1px solid ${RULE}`,
              borderRadius: 12,
              padding: 8,
              background: '#fff',
              lineHeight: 0,
            }}>
              <QRCodeCanvas ref={qrRef} value={shareUrl} size={140} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <p style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 'var(--text-body)', color: INK, margin: 0 }}>
                Scan to open
              </p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 'var(--text-body-sm)', color: MUTED, margin: 0, lineHeight: 'var(--leading-body)' }}>
                Show this code to a family member nearby — it opens this exact page on their phone.
              </p>
              <button
                onClick={handleSaveImage}
                style={{
                  alignSelf: 'flex-start',
                  background: '#fff',
                  border: `1px solid ${RULE}`,
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontFamily: FONT_BODY,
                  fontSize: 'var(--text-button)',
                  fontWeight: 600,
                  color: INK,
                  cursor: 'pointer',
                }}
              >
                Save image
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: RULE }} />
            <span style={{
              fontFamily: FONT_BODY, fontSize: 'var(--text-caption)', fontWeight: 600,
              color: '#B8A898', letterSpacing: '0.08em', whiteSpace: 'nowrap',
            }}>
              OR SEND A LINK
            </span>
            <div style={{ flex: 1, height: 1, background: RULE }} />
          </div>

          {/* App sharing buttons */}
          <div style={{ display: 'flex' }}>
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
              <span style={{ fontSize: 16, letterSpacing: 2 }}>•••</span>
            </AppButton>
          </div>

          {/* Copy link */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', border: `1px solid ${RULE}`,
            borderRadius: 12, padding: '10px 12px',
          }}>
            <input
              readOnly
              value={shareUrl}
              style={{
                flex: 1, minWidth: 0,
                border: 'none', background: 'transparent', outline: 'none',
                fontFamily: FONT_BODY, fontSize: 'var(--text-label)', color: MUTED,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                flexShrink: 0,
                background: copied ? 'var(--color-green)' : INK,
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '7px 16px',
                fontFamily: FONT_BODY, fontSize: 'var(--text-button)', fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s',
                minWidth: 72,
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

        </div>
    </ModalFrame>
  )
}
