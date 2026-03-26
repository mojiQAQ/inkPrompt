/**
 * Main layout component with navigation
 */
import { ReactNode } from 'react'
import { Navbar } from './Navbar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-[1560px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 page-transition">
        {children}
      </main>
    </div>
  )
}
