import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'Track your daily expenses with ease',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        // Light Mode Tab Icon (Dark Blue Circle with White Rupee Text)
        url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%230f172a"/><text x="16" y="22" font-family="sans-serif" font-weight="bold" font-size="16" fill="%23ffffff" text-anchor="middle">₹</text></svg>',
        media: '(prefers-color-scheme: light)',
      },
      {
        // Dark Mode Tab Icon (Bright Emerald Circle with White Rupee Text)
        url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%2310b981"/><text x="16" y="22" font-family="sans-serif" font-weight="bold" font-size="16" fill="%23ffffff" text-anchor="middle">₹</text></svg>',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    // Fallback standard icon rule
    apple: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%2310b981"/><text x="16" y="22" font-family="sans-serif" font-weight="bold" font-size="16" fill="%23ffffff" text-anchor="middle">₹</text></svg>',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}