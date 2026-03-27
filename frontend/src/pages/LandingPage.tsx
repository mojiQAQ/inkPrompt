import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { persistPostAuthRedirect } from '@/utils/authRedirect'

type FeatureItem = {
  id: 'management' | 'versioning' | 'optimization' | 'testing'
  title: string
  description: string
  badge: string
  items: string[]
  target: string
}

type StepItem = {
  step: string
  title: string
  description: string
  items: string[]
}

type TestimonialItem = {
  quote: string
  name: string
  role: string
}

type FooterGroup = {
  title: string
  links: Array<{
    label: string
    href: string
    external?: boolean
  }>
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 13.8 8.2 19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="M19.5 3.5 20 5l1.5.5L20 6l-.5 1.5L19 6l-1.5-.5L19 5l.5-1.5Z" />
      <path d="M5 15.5 5.7 17.3 7.5 18l-1.8.7L5 20.5l-.7-1.8L2.5 18l1.8-.7L5 15.5Z" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3.75 7.5h5l2 2h9.5v7.75A1.75 1.75 0 0 1 18.5 19H5.5a1.75 1.75 0 0 1-1.75-1.75V7.5Z" />
      <path d="M3.75 7.5V6.75A1.75 1.75 0 0 1 5.5 5h3.25l2 2h7.75a1.75 1.75 0 0 1 1.75 1.75V9.5" />
    </svg>
  )
}

function BranchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 4.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm10 10a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM7 9.5v4a5 5 0 0 0 5 5h2.5" />
      <path d="M17 14.5V8a3.5 3.5 0 0 0-3.5-3.5H9.5" />
    </svg>
  )
}

function WandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m4 20 9.5-9.5" />
      <path d="m11.5 5.5 1-2.5 1 2.5L16 6.5l-2.5 1-1 2.5-1-2.5L9 6.5l2.5-1Z" />
      <path d="m17 12 1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" />
      <path d="M3.5 20.5 7 17" />
    </svg>
  )
}

function LabIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 3v5.25L5.6 16.2A2 2 0 0 0 7.34 19h9.32a2 2 0 0 0 1.74-2.8L14 8.25V3" />
      <path d="M8 3h8" />
      <path d="M8.25 13h7.5" />
    </svg>
  )
}

function QuoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M8.25 6A4.25 4.25 0 0 0 4 10.25V18h7v-7H8.3a2.3 2.3 0 0 1 2.2-2A2.5 2.5 0 0 0 8.25 6Zm9 0A4.25 4.25 0 0 0 13 10.25V18h7v-7h-2.7a2.3 2.3 0 0 1 2.2-2A2.5 2.5 0 0 0 17.25 6Z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

const featureIcons: Record<FeatureItem['id'], ReactNode> = {
  management: <FolderIcon />,
  versioning: <BranchIcon />,
  optimization: <WandIcon />,
  testing: <LabIcon />,
}

const featureAccents: Record<FeatureItem['id'], string> = {
  management: 'from-[#f4ebd9] via-[#fffdfa] to-white',
  versioning: 'from-[#ebedf8] via-white to-[#f6f5ff]',
  optimization: 'from-[#e9f7f1] via-white to-[#f8fefb]',
  testing: 'from-[#eef3fb] via-white to-[#fbfcff]',
}

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, language } = useI18n()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const heroPills = t('landing.hero.pills', { returnObjects: true }) as string[]
  const heroStats = t('landing.hero.stats', { returnObjects: true }) as Array<{
    value: string
    label: string
  }>
  const features = t('landing.features.items', { returnObjects: true }) as FeatureItem[]
  const steps = t('landing.steps.items', { returnObjects: true }) as StepItem[]
  const testimonials = t(
    'landing.testimonials.items',
    { returnObjects: true },
  ) as TestimonialItem[]
  const footerGroups = t('landing.footer.groups', { returnObjects: true }) as FooterGroup[]

  const primaryTarget = useMemo(() => '/prompts', [])

  useEffect(() => {
    document.title = t('landing.meta.title')

    const descriptionTag = document.querySelector('meta[name="description"]')
    if (descriptionTag) {
      descriptionTag.setAttribute('content', t('landing.meta.description'))
    }
  }, [language, t])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal="landing"]'))

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -8% 0px',
      },
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [language])

  const openAuthFlow = (target: string) => {
    if (user) {
      navigate(target)
      return
    }

    persistPostAuthRedirect(target)
    navigate('/login')
  }

  const handlePrimaryCta = () => {
    openAuthFlow(primaryTarget)
  }

  const handleSecondaryCta = () => {
    document.getElementById('features')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const goToHome = () => {
    setMobileMenuOpen(false)
    navigate('/')
  }

  const goToPrompts = () => {
    setMobileMenuOpen(false)
    openAuthFlow('/prompts')
  }

  const goToLogin = () => {
    setMobileMenuOpen(false)
    openAuthFlow('/prompts')
  }

  return (
    <div className="landing-page relative min-h-screen overflow-x-hidden text-ink-900">
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="landing-orb landing-orb-primary pointer-events-none absolute left-[-8rem] top-[-5rem] h-[26rem] w-[26rem] rounded-full blur-3xl" />
      <div className="landing-orb landing-orb-secondary pointer-events-none absolute right-[-6rem] top-[18rem] h-[24rem] w-[24rem] rounded-full blur-3xl" />

      <header className="sticky top-0 z-50 border-b border-white/40 bg-[rgba(247,241,230,0.74)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={goToHome}
            className="flex items-center gap-3 text-left transition-opacity hover:opacity-80"
            title={t('landing.nav.logoTitle')}
          >
            <img src="/logo.svg" alt="Ink & Prompt" className="h-9 w-9" />
            <div>
              <div className="text-sm font-semibold tracking-[0.26em] text-ink-500">
                INK &amp; PROMPT
              </div>
              <div className="text-sm text-ink-700">{t('landing.nav.brandSubtitle')}</div>
            </div>
          </button>

          <nav
            aria-label={t('landing.nav.ariaLabel')}
            className="hidden items-center gap-2 lg:flex"
          >
            {user ? (
              <button
                type="button"
                onClick={goToPrompts}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:text-ink-900"
              >
                {t('landing.nav.prompts')}
              </button>
            ) : null}
            <a
              href="/docs"
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:text-ink-900"
            >
              {t('landing.nav.docs')}
            </a>
            <LanguageSwitcher variant="landing" className="ml-2" />
            <button
              type="button"
              onClick={goToLogin}
              className="landing-nav-cta ml-2 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            >
              {user ? t('landing.nav.workspace') : t('landing.nav.login')}
            </button>
          </nav>

          <div className="flex items-center gap-3 lg:hidden">
            <LanguageSwitcher variant="landing" className="hidden sm:flex" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="icon-button h-11 w-11"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? t('landing.nav.closeMenu') : t('landing.nav.openMenu')}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-white/40 bg-[rgba(250,247,242,0.92)] px-4 py-4 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              <LanguageSwitcher variant="landing" className="sm:hidden" />
              {user ? (
                <button
                  type="button"
                  onClick={goToPrompts}
                  className="landing-mobile-link"
                >
                  {t('landing.nav.prompts')}
                </button>
              ) : null}
              <a href="/docs" className="landing-mobile-link">
                {t('landing.nav.docs')}
              </a>
              <button
                type="button"
                onClick={goToLogin}
                className="landing-nav-cta inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white"
              >
                {user ? t('landing.nav.workspace') : t('landing.nav.login')}
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative">
          <div className="mx-auto grid max-w-7xl gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:px-8 lg:pb-28 lg:pt-24">
            <div className="landing-reveal space-y-8" data-reveal="landing">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm text-ink-700 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.45)] backdrop-blur-xl">
                <SparkIcon />
                <span>{t('landing.hero.kicker')}</span>
              </div>

              <div className="space-y-5">
                <h1 className="landing-display-title max-w-4xl text-5xl font-semibold leading-[1.02] text-ink-900 sm:text-6xl lg:text-7xl">
                  {t('landing.hero.title')}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-ink-600 sm:text-xl">
                  {t('landing.hero.subtitle')}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {heroPills.map((pill) => (
                  <div
                    key={pill}
                    className="landing-pill inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-ink-700"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ece7ff] text-[#4f46e5]">
                      <CheckIcon />
                    </span>
                    <span>{pill}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="landing-hero-primary inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-base font-semibold text-white"
                >
                  {user ? t('landing.hero.primaryLoggedIn') : t('landing.hero.primary')}
                  <ArrowRightIcon />
                </button>
                <button
                  type="button"
                  onClick={handleSecondaryCta}
                  className="landing-hero-secondary inline-flex items-center justify-center gap-3 rounded-full px-7 py-4 text-base font-semibold text-ink-700"
                >
                  {t('landing.hero.secondary')}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <div key={item.label} className="landing-stat rounded-[24px] px-5 py-4">
                    <div className="text-2xl font-semibold text-ink-900">{item.value}</div>
                    <div className="mt-1 text-sm text-ink-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-reveal relative" data-reveal="landing">
              <div className="landing-preview-shell relative overflow-hidden rounded-[32px] border border-white/60 bg-[rgba(255,255,255,0.74)] p-5 shadow-[0_32px_100px_-46px_rgba(31,41,55,0.6)] backdrop-blur-xl">
                <div className="landing-preview-glow pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[radial-gradient(circle,rgba(91,91,214,0.24),transparent_72%)] blur-2xl" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-500">
                        {t('landing.hero.preview.label')}
                      </div>
                      <div className="mt-2 text-xl font-semibold text-ink-900">
                        {t('landing.hero.preview.title')}
                      </div>
                    </div>
                    <div className="rounded-full border border-[#d6d0f6] bg-[#f0edff] px-3 py-1 text-xs font-medium text-[#544cb6]">
                      {t('landing.hero.preview.badge')}
                    </div>
                  </div>

                  <div className="landing-preview-panel rounded-[28px] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-ink-900">
                          {t('landing.hero.preview.promptTitle')}
                        </div>
                        <div className="mt-1 text-sm text-ink-500">
                          {t('landing.hero.preview.promptMeta')}
                        </div>
                      </div>
                      <div className="rounded-full bg-[#111827] px-3 py-1 text-xs font-semibold text-white">
                        {t('landing.hero.preview.version')}
                      </div>
                    </div>
                    <div className="mt-4 rounded-[24px] border border-[#e8e1d6] bg-[#fcfaf6] p-4 text-sm leading-7 text-ink-700">
                      {t('landing.hero.preview.promptBody')}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-500">
                      {(t('landing.hero.preview.tags', { returnObjects: true }) as string[]).map((tag) => (
                        <span key={tag} className="rounded-full bg-white px-3 py-1.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="landing-preview-subpanel rounded-[24px] p-4">
                      <div className="text-sm font-semibold text-ink-900">
                        {t('landing.hero.preview.optimizeTitle')}
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-ink-600">
                        {(t('landing.hero.preview.optimizeItems', { returnObjects: true }) as string[]).map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-[#4f46e5]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="landing-preview-subpanel rounded-[24px] p-4">
                      <div className="text-sm font-semibold text-ink-900">
                        {t('landing.hero.preview.testTitle')}
                      </div>
                      <div className="mt-4 space-y-3">
                        {(t(
                          'landing.hero.preview.models',
                          { returnObjects: true },
                        ) as Array<{ name: string; score: string }>).map((model) => (
                          <div key={model.name} className="rounded-[18px] bg-white/85 px-3 py-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-ink-800">{model.name}</span>
                              <span className="text-ink-500">{model.score}</span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-[#ece7dd]">
                              <div
                                className="h-2 rounded-full bg-[linear-gradient(90deg,#5b5bd6_0%,#3ca985_100%)]"
                                style={{ width: model.score }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative py-10 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="landing-reveal mx-auto max-w-3xl text-center" data-reveal="landing">
              <p className="landing-section-kicker">{t('landing.features.kicker')}</p>
              <h2 className="mt-4 text-3xl font-semibold text-ink-900 sm:text-4xl">
                {t('landing.features.title')}
              </h2>
              <p className="mt-4 text-lg leading-8 text-ink-600">
                {t('landing.features.subtitle')}
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {features.map((feature, index) => (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => openAuthFlow(feature.target)}
                  className="landing-reveal landing-surface-card group relative overflow-hidden rounded-[30px] border border-white/70 bg-white/70 p-6 text-left shadow-[0_28px_80px_-52px_rgba(31,41,55,0.48)] transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-[0_36px_90px_-48px_rgba(31,41,55,0.6)]"
                  data-reveal="landing"
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <div className={`absolute inset-x-5 top-5 h-28 rounded-[26px] bg-gradient-to-br ${featureAccents[feature.id]} opacity-90`} />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/60 bg-white/82 text-ink-900 shadow-sm">
                        {featureIcons[feature.id]}
                      </div>
                      <span className="rounded-full border border-white/75 bg-white/86 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
                        {feature.badge}
                      </span>
                    </div>
                    <div className="mt-16">
                      <h3 className="text-2xl font-semibold text-ink-900">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-ink-600">{feature.description}</p>
                    </div>
                    <ul className="mt-5 space-y-3 text-sm text-ink-600">
                      {feature.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ede9fe] text-[#4f46e5]">
                            <CheckIcon />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
                      <span>{t('landing.features.explore')}</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        <ArrowRightIcon />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="landing-reveal mx-auto max-w-3xl text-center" data-reveal="landing">
              <p className="landing-section-kicker">{t('landing.steps.kicker')}</p>
              <h2 className="mt-4 text-3xl font-semibold text-ink-900 sm:text-4xl">
                {t('landing.steps.title')}
              </h2>
              <p className="mt-4 text-lg leading-8 text-ink-600">
                {t('landing.steps.subtitle')}
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.step} className="landing-reveal relative" data-reveal="landing">
                  {index < steps.length - 1 ? (
                    <div className="absolute left-[2.35rem] top-[4.4rem] hidden h-[calc(100%-2rem)] border-l border-dashed border-[rgba(122,102,82,0.22)] lg:block" />
                  ) : null}
                  <article className="landing-surface-card relative rounded-[30px] border border-white/70 bg-white/68 p-6 shadow-[0_28px_80px_-56px_rgba(31,41,55,0.42)]">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#5b5bd6_0%,#3ca985_100%)] text-2xl font-semibold text-white shadow-[0_18px_40px_-18px_rgba(79,70,229,0.6)]">
                      {step.step}
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold text-ink-900">{step.title}</h3>
                    <p className="mt-4 rounded-[24px] border border-[#ebe5dc] bg-[#fcfaf6] px-5 py-4 text-sm leading-7 text-ink-700">
                      {step.description}
                    </p>
                    <ul className="mt-5 space-y-3 text-sm text-ink-600">
                      {step.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f6ef] text-[#23956f]">
                            <CheckIcon />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="landing-reveal mx-auto max-w-3xl text-center" data-reveal="landing">
              <p className="landing-section-kicker">{t('landing.testimonials.kicker')}</p>
              <h2 className="mt-4 text-3xl font-semibold text-ink-900 sm:text-4xl">
                {t('landing.testimonials.title')}
              </h2>
              <p className="mt-4 text-lg leading-8 text-ink-600">
                {t('landing.testimonials.subtitle')}
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {testimonials.map((item, index) => (
                <article
                  key={`${item.name}-${item.role}`}
                  className="landing-reveal rounded-[30px] border border-white/70 bg-white/72 p-6 shadow-[0_24px_70px_-50px_rgba(31,41,55,0.45)]"
                  data-reveal="landing"
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <div className="flex items-center gap-3 text-[#5b5bd6]">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#efeaff]">
                      <QuoteIcon />
                    </div>
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-ink-500">
                      {t('landing.testimonials.cardLabel')}
                    </div>
                  </div>
                  <p className="mt-5 text-lg leading-8 text-ink-800">“{item.quote}”</p>
                  <div className="mt-6 border-t border-[rgba(122,102,82,0.16)] pt-4">
                    <div className="font-semibold text-ink-900">{item.name}</div>
                    <div className="mt-1 text-sm text-ink-500">{item.role}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[rgba(122,102,82,0.16)] bg-[#171717] text-[#f3efe8]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div>
              <div className="flex items-center gap-4">
                <img src="/logo.svg" alt="Ink & Prompt" className="h-12 w-12 rounded-2xl bg-white/90 p-2" />
                <div>
                  <div className="text-lg font-semibold">{t('common.appName')}</div>
                  <div className="mt-1 text-sm text-white/60">{t('landing.footer.brandKicker')}</div>
                </div>
              </div>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/68">
                {t('landing.footer.description')}
              </p>
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="mt-6 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink-900 transition-transform duration-300 hover:-translate-y-0.5"
              >
                {user ? t('landing.hero.primaryLoggedIn') : t('landing.hero.primary')}
                <ArrowRightIcon />
              </button>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/42">
                    {group.title}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {group.links.map((link) => (
                      <li key={`${group.title}-${link.label}`}>
                        {link.external ? (
                          <a
                            href={link.href}
                            className="text-sm text-white/72 transition-colors hover:text-white"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {link.label}
                          </a>
                        ) : link.href.startsWith('#') ? (
                          <button
                            type="button"
                            onClick={() => {
                              document.querySelector(link.href)?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              })
                            }}
                            className="text-sm text-white/72 transition-colors hover:text-white"
                          >
                            {link.label}
                          </button>
                        ) : (
                          <a href={link.href} className="text-sm text-white/72 transition-colors hover:text-white">
                            {link.label}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-sm text-white/45">
            {t('landing.footer.copyright')}
          </div>
        </div>
      </footer>
    </div>
  )
}
