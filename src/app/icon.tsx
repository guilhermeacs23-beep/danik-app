import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: '#F0E4E4',
      }}
    >
      <span
        style={{
          fontSize: 22,
          fontWeight: 900,
          fontFamily: 'serif',
          color: '#C4956A',
          lineHeight: 1,
          letterSpacing: '-1px',
        }}
      >
        K
      </span>
    </div>,
    { ...size }
  )
}
