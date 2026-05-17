import { useState } from 'react'
import { INK, MUTED, RULE } from '../../styles/colors'
import ModalFrame from '../layout/ModalFrame'

const FONT_BODY = "var(--font-body)"
const FONT_SERIF = "var(--font-title)"

function ChannelButton({ label, bg, children, href, onClick }) {
  const circleStyle = {
    width: 52, height: 52, borderRadius: '50%',
    background: bg, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 20,
    color: '#fff', fontFamily: FONT_BODY, fontWeight: 800,
    textDecoration: 'none', border: 'none',
    cursor: 'pointer', flexShrink: 0,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={circleStyle}>{children}</a>
      ) : (
        <button type="button" onClick={onClick} style={circleStyle}>{children}</button>
      )}
      <span style={{ fontFamily: FONT_BODY, fontSize: 'var(--text-caption)', color: MUTED }}>{label}</span>
    </div>
  )
}

export default function SafetyShareModal({ isOpen, onClose, shareText, maxSeverity }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const encoded = encodeURIComponent(shareText)

  function handleCopy() {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }

  async function handleMore() {
    if (navigator.share) {
      try { await navigator.share({ title: 'My condition — CoolSafer', text: shareText }) }
      catch { /* cancelled */ }
    } else {
      handleCopy()
    }
  }

  const isEmergency = maxSeverity === '000'

  return (
    <ModalFrame
      onClose={onClose}
      overlayStyle={{
        zIndex: 1100,
        background: 'rgba(15,12,9,0.40)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      panelStyle={{
        width: '100%',
        maxWidth: 480,
        background: 'var(--color-paper)',
        borderRadius: 24,
        boxShadow: '0 24px 60px rgba(15,12,9,0.22)',
        overflow: 'hidden',
      }}
    >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '22px 22px 0' }}>
          <div>
            <h2 style={{ fontFamily: FONT_SERIF, fontSize: 'var(--text-title-xs)', fontWeight: 'normal', letterSpacing: '-0.02em', color: INK, margin: 0, lineHeight: 1.1 }}>
              Alert a family member or carer.
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 'var(--text-body-sm)', color: MUTED, margin: '8px 0 0', lineHeight: 'var(--leading-body)' }}>
              This sends your current symptoms{' '}
              {maxSeverity ? 'and medication details ' : ''}
              so they know what's happening and can help.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer',
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginLeft: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: MUTED,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Message preview */}
          <div style={{
            background: '#fff', border: `1px solid ${RULE}`,
            borderRadius: 14, padding: '12px 14px',
            fontFamily: FONT_BODY, fontSize: 'var(--text-body-sm)', color: MUTED,
            lineHeight: 1.6, whiteSpace: 'pre-wrap',
            maxHeight: 120, overflowY: 'auto',
          }}>
            {shareText}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: RULE }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 'var(--text-caption)', fontWeight: 700, color: '#B8A898', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              SEND VIA
            </span>
            <div style={{ flex: 1, height: 1, background: RULE }} />
          </div>

          {/* Channel buttons */}
          <div style={{ display: 'flex' }}>
            <ChannelButton label="WhatsApp" bg="#25D366" href={`https://wa.me/?text=${encoded}`}>
              W
            </ChannelButton>
            <ChannelButton label="Messages" bg="#007AFF" href={`sms:?body=${encoded}`}>
              M
            </ChannelButton>
            <ChannelButton label="Telegram" bg="#0088cc" href={`https://t.me/share/url?url=coolsafer.app&text=${encoded}`}>
              T
            </ChannelButton>
            <ChannelButton label="Line" bg="#00C300" href={`https://line.me/R/msg/text/?${encoded}`}>
              L
            </ChannelButton>
            <ChannelButton label="More" bg="#8A7A6A" onClick={handleMore}>
              <span style={{ fontSize: 16, letterSpacing: 2 }}>•••</span>
            </ChannelButton>
          </div>

          {/* Copy row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', border: `1px solid ${RULE}`,
            borderRadius: 12, padding: '10px 12px',
          }}>
            <span style={{ flex: 1, minWidth: 0, fontFamily: FONT_BODY, fontSize: 'var(--text-label)', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Copy message text
            </span>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                flexShrink: 0,
                background: copied ? '#2A7D4F' : INK,
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '7px 16px',
                fontFamily: FONT_BODY, fontSize: 'var(--text-button)', fontWeight: 700,
                cursor: 'pointer', transition: 'background 0.15s',
                minWidth: 72,
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {isEmergency && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 'var(--text-body-sm)', color: '#C94B1A', textAlign: 'center', margin: 0, fontWeight: 600 }}>
              If it's an emergency — call 000 first.
            </p>
          )}
        </div>
    </ModalFrame>
  )
}
