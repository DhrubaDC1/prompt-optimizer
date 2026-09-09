import './globals.css'

export const metadata = {
  title: 'Sharpen your prompt',
  description: 'Turn rough prompts into clear, useful prompts.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
