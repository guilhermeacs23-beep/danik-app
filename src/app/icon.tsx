import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
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
        background: '#EDD5D5',
      }}
    >
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        {/* K - haste vertical */}
        <rect x="8" y="6" width="7" height="32" rx="1.5"
              fill="url(#rg1)" />
        {/* K - braço superior */}
        <path d="M14 22 L34 7 L36 7 L36 10 L18 24 Z"
              fill="url(#rg2)" />
        {/* K - braço inferior */}
        <path d="M14 22 L34 37 L36 37 L36 34 L18 21 Z"
              fill="url(#rg3)" />
        <defs>
          <linearGradient id="rg1" x1="8" y1="6" x2="15" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#D4A882" />
            <stop offset="50%"  stopColor="#C4956A" />
            <stop offset="100%" stopColor="#A07040" />
          </linearGradient>
          <linearGradient id="rg2" x1="14" y1="7" x2="36" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#DDB898" />
            <stop offset="100%" stopColor="#B07848" />
          </linearGradient>
          <linearGradient id="rg3" x1="14" y1="22" x2="36" y2="37" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#C8A070" />
            <stop offset="100%" stopColor="#9A6838" />
          </linearGradient>
        </defs>
      </svg>
    </div>,
    { ...size }
  )
}
