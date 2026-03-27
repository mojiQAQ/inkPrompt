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
    <div className="app-page min-h-screen">
      <div className="app-page-grid pointer-events-none fixed inset-0 opacity-60" />
      <div className="app-page-orb app-page-orb-primary pointer-events-none fixed left-[-8rem] top-[4rem] h-[24rem] w-[24rem] rounded-full blur-3xl" />
      <div className="app-page-orb app-page-orb-secondary pointer-events-none fixed right-[-7rem] top-[15rem] h-[22rem] w-[22rem] rounded-full blur-3xl" />
      <Navbar />
      <main className="relative z-10 mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 page-transition">
        {children}
      </main>
    </div>
  )
}
