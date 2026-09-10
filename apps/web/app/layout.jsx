import './globals.css'

export const metadata = {
  title: 'Sharpen your prompt',
  description: 'Turn rough prompts into clear, useful prompts.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
