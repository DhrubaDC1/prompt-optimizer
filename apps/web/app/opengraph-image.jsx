import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          background: '#0f0f10',
          color: '#f5f5f5',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 28, color: '#9a9a9a', marginBottom: 24, display: 'flex' }}>
          Prompt sharpener
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.15, display: 'flex' }}>
          Sharpen your prompt
        </div>
        <div style={{ fontSize: 32, color: '#c9c9c9', marginTop: 24, display: 'flex' }}>
          Turn rough prompts into clear, useful prompts.
        </div>
      </div>
    ),
    { ...size },
  )
}
