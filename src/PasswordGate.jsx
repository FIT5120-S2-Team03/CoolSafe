import { useState } from 'react'

const CORRECT_PASSWORD = 'tp03'

export default function PasswordGate({ children, storageKey }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(storageKey) === 'true'
  )

  if (unlocked) return children

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input === CORRECT_PASSWORD) {
      sessionStorage.setItem(storageKey, 'true')
      setUnlocked(true)
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9f9fc',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #e8e8ea',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 900,
          fontSize: '24px',
          color: '#0056d2',
          marginBottom: '4px',
          letterSpacing: '-0.6px',
        }}>
          CoolSafe
        </div>
        <p style={{
          fontFamily: "'Lexend', sans-serif",
          fontSize: '13px',
          color: '#94a3b8',
          marginBottom: '4px',
        }}>
          {storageKey === 'auth_v1' ? 'Iteration 1 Archive' : 'Under Development'}
        </p>
        <p style={{
          fontFamily: "'Lexend', sans-serif",
          fontSize: '14px',
          color: '#64748b',
          marginBottom: '28px',
        }}>
          Enter password to access
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: error ? '1.5px solid #dc2626' : '1.5px solid #e8e8ea',
              fontFamily: "'Lexend', sans-serif",
              fontSize: '15px',
              color: '#1a1c1e',
              outline: 'none',
              marginBottom: '8px',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{
              fontFamily: "'Lexend', sans-serif",
              fontSize: '13px',
              color: '#dc2626',
              marginBottom: '8px',
            }}>
              Incorrect password. Please try again.
            </p>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#0056d2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
