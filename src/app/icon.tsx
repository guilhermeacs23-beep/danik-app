import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #C4956A, #D4A882)',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
      }}
    >
      <span
        style={{
          color: '#FAF5F0',
          fontSize: 22,
          fontWeight: 900,
          fontFamily: 'serif',
          letterSpacing: '-1px',
          lineHeight: 1,
        }}
      >
        K
      </span>
    </div>,
    { ...size }
  )
}
