import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Etsy Print Sizer',
  description: 'AI-powered image upscaling and print size generation for Etsy sellers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4 py-8">
            <header className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Etsy Print Sizer
              </h1>
              <p className="text-lg text-gray-600">
                Upload an image and get perfectly sized prints for your Etsy shop
              </p>
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
