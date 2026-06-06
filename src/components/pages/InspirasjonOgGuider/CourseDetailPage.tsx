import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { inspirationCourses } from '../../../data/inspirationCourses'
import { inspirationGuides } from '../../../data/inspirationGuides'
import { inspirationTopics } from '../../../data/inspirationTopics'
import { markModuleComplete, isModuleComplete, getCompletedCount } from '../../../utils/courseProgress'
import { Button } from '../../ui/button'
import NotFoundPage from '../NotFound/NotFoundPage'
import type { GuideSection } from '../../../types/product'

const accentMap: Record<string, string> = {
  beginner: '#16A34A', intermediate: '#EA580C', advanced: '#DC2626',
}
const levelLabel: Record<string, string> = {
  beginner: 'Nybegynner', intermediate: 'Middels', advanced: 'Avansert',
}

function getContent(slug: string, type: 'guide' | 'topic'): { title: string; excerpt: string; sections: GuideSection[] } | null {
  const src = type === 'guide' ? inspirationGuides : inspirationTopics
  const item = src.find((x) => x.slug === slug)
  return item ? { title: item.title, excerpt: item.excerpt, sections: item.sections } : null
}

export default function CourseDetailPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const course = inspirationCourses.find((c) => c.slug === courseSlug)

  const modParam = searchParams.get('modul')
  const initialIdx = modParam ? course?.modules.findIndex((m) => m.slug === modParam) ?? -1 : -1
  const [currentIdx, setCurrentIdx] = useState(initialIdx)
  const [completedCount, setCompletedCount] = useState(getCompletedCount(course?.slug ?? ''))
  const [showBadge, setShowBadge] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  if (!course) return <NotFoundPage />

  const started = currentIdx >= 0
  const currentModule = started ? course.modules[currentIdx] : null
  const content = currentModule ? getContent(currentModule.slug, currentModule.type) : null
  const total = course.modules.length
  const isLast = currentIdx === total - 1
  const isFirst = currentIdx === 0
  const allDone = completedCount >= total
  const accent = accentMap[course.level]

  useEffect(() => {
    if (!started) return
    if (!isModuleComplete(course.slug, currentModule!.slug)) {
      markModuleComplete(course.slug, currentModule!.slug)
      const n = getCompletedCount(course.slug)
      setCompletedCount(n)
      if (n >= total) setShowBadge(true)
    }
  }, [course.slug, currentModule?.slug, total, started])

  useEffect(() => {
    if (!started) return
    setSearchParams({ modul: currentModule!.slug }, { replace: true })
  }, [currentModule?.slug, setSearchParams, started])

  useSEO({
    title: `${course.title} – Treskolen`,
    description: course.description,
  })

  const goTo = (idx: number) => {
    setCurrentIdx(idx)
  }

  const startCourse = () => {
    goTo(0)
  }

  if (started && !content) return <NotFoundPage />

  const pct = Math.round((completedCount / total) * 100)

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="flex flex-col min-h-screen">
          {/* ── Hero ── */}
          <section className="bg-[#202020] text-white text-center px-4 sm:px-8 pt-24 pb-12 sm:pt-28 sm:pb-14">
            <div className="max-w-[1200px] mx-auto">
              <Link
                to="/inspirasjon-og-guider"
                className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-semibold no-underline mb-6 transition-colors"
              >
                <Icon name="faArrowLeft" className="text-[0.6rem]" />
                Tilbake til Treskolen
              </Link>

              <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.08em] text-white px-2.5 py-0.5 rounded-full"
                  style={{ background: accent }}
                >
                  {levelLabel[course.level]}
                </span>
                <span className="text-xs text-white/40">{course.duration}</span>
                <span className="text-xs text-white/40">{course.moduleCount} moduler</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
                {course.title}
              </h1>
              <p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-2xl mx-auto">
                {course.description}
              </p>

              {started && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <span className="text-xs font-medium text-white/40 tabular-nums">
                  {completedCount}/{total} fullført
                </span>
                <div className="w-32 sm:w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, background: pct === 100 ? '#4ade80' : '#fff' }}
                  />
                </div>
              </div>
              )}
            </div>
          </section>

          {/* ── Body ── */}
          <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8">
            {started ? (
              /* ── COURSE MODE ── */
              <>
                {/* Module stepper — desktop horizontal, mobile vertical */}
                <div className="py-6 sm:py-8">
                  {/* Desktop: horizontal stepper */}
                  <div className="hidden sm:flex items-start justify-between gap-0 max-w-3xl mx-auto">
                    {course.modules.map((mod, i) => {
                      const done = isModuleComplete(course.slug, mod.slug)
                      const active = i === currentIdx
                      return (
                        <div key={mod.slug} className="flex-1 flex flex-col items-center relative">
                          {/* Connecting line (before this step) */}
                          {i > 0 && (
                            <div
                              className={`absolute left-[-50%] right-[50%] top-[19px] h-[2px] -z-0
                                ${done ? 'bg-green-200' : 'bg-gray-100'}`}
                              style={{
                                left: 'calc(-50% + 19px)',
                                right: 'calc(50% + 19px)',
                              }}
                            />
                          )}
                          {/* Circle */}
                          <button
                            type="button"
                            onClick={() => goTo(i)}
                            className={`relative z-10 w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 cursor-pointer border-0
                              ${done ? 'text-white shadow-sm' : ''}
                              ${active ? 'text-white shadow-md scale-110' : ''}
                              ${!done && !active ? 'text-gray-400 bg-white border-2 border-gray-200' : ''}`}
                            style={{
                              background: done || active ? accent : undefined,
                            }}
                          >
                            {done ? <Icon name="faCheck" className="text-[0.65rem]" /> : i + 1}
                          </button>
                          {/* Label */}
                          <div className="mt-2 text-center">
                            <div
                              className={`text-[11px] leading-tight transition-all duration-200 max-w-[80px] mx-auto
                                ${active ? 'font-bold text-gray-900' : ''}
                                ${done ? 'text-gray-400 line-through decoration-gray-300' : ''}
                                ${!done && !active ? 'text-gray-400' : ''}`}
                            >
                              {mod.title}
                            </div>
                            <div className="text-[10px] text-gray-300 mt-0.5">{mod.duration}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Mobile: vertical stepper */}
                  <div className="sm:hidden flex flex-col gap-1.5">
                    {course.modules.map((mod, i) => {
                      const done = isModuleComplete(course.slug, mod.slug)
                      const active = i === currentIdx
                      return (
                        <button
                          key={mod.slug}
                          type="button"
                          onClick={() => goTo(i)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer border transition-all duration-200
                            ${active
                              ? 'border-gray-200 bg-white shadow-sm'
                              : 'border-transparent bg-transparent hover:bg-gray-50'}`}
                        >
                          {/* Circle */}
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300
                              ${done || active ? 'text-white' : 'text-gray-400 bg-gray-100'}`}
                            style={{
                              background: done || active ? accent : undefined,
                            }}
                          >
                            {done ? <Icon name="faCheck" className="text-[0.6rem]" /> : i + 1}
                          </div>
                          {/* Label */}
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm leading-snug transition-all duration-200
                                ${active ? 'font-semibold text-gray-900' : ''}
                                ${done ? 'text-gray-400 line-through decoration-gray-300' : ''}
                                ${!done && !active ? 'text-gray-500' : ''}`}
                            >
                              {mod.title}
                            </div>
                            <div className="text-[11px] text-gray-300 mt-0.5">{mod.duration}</div>
                          </div>
                          {active && (
                            <div className="w-1 h-8 rounded-full shrink-0" style={{ background: accent }} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Two-column layout: content + reference image */}
                <div className="flex flex-col lg:flex-row gap-8 pb-8">
                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div key={currentModule!.slug}>
                      <div className="mb-4 flex items-center gap-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white px-3 py-1 rounded-full"
                          style={{ background: accent }}
                        >
                          <Icon name="faBook" className="text-[0.55rem]" />
                          Modul {currentIdx + 1} av {total}
                        </span>
                        <span className="text-xs text-gray-400">{currentModule!.duration}</span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-3">
                        {content!.title}
                      </h1>
                      <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-8 max-w-2xl">
                        {content!.excerpt}
                      </p>

                      <div className="space-y-10">
                        {content!.sections.map((sec, i) => (
                          <div key={i}>
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug mb-3 flex items-center gap-3">
                              <span className="w-1 h-4 rounded-full shrink-0" style={{ background: accent }} />
                              {sec.heading}
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600 leading-[1.8] ml-4">
                              {sec.body}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Navigation */}
                      <div className="mt-12 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isFirst}
                            onClick={() => goTo(currentIdx - 1)}
                          >
                            <Icon name="faArrowLeft" className="text-[0.65rem]" />
                            Forrige
                          </Button>

                          {isLast ? (
                            allDone ? (
                              <Button
                                size="sm"
                                className="shadow-sm"
                                style={{ background: accent }}
                                onClick={() => setShowBadge(true)}
                              >
                                <Icon name="faTrophy" className="text-[0.65rem]" />
                                Fullføringsbevis
                              </Button>
                            ) : (
                              <Button disabled size="sm" className="opacity-60">
                                <Icon name="faSpinner" className="text-[0.65rem] animate-spin" />
                                Fullfører...
                              </Button>
                            )
                          ) : (
                            <Button
                              size="sm"
                              className="shadow-sm"
                              style={{ background: accent }}
                              onClick={() => goTo(currentIdx + 1)}
                            >
                              Neste
                              <Icon name="faArrowRight" className="text-[0.65rem]" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reference image sidebar */}
                  <aside className="lg:w-80 shrink-0">
                    <div className="lg:sticky lg:top-[140px]">
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400 mb-3">
                          Instruksjonstegning
                        </h3>
                        <button
                          type="button"
                          onClick={() => setLightboxImg('/images/minio_instruction_pidestall.webp')}
                          className="w-full p-0 border-0 bg-transparent cursor-pointer"
                        >
                          <img
                            src="/images/minio_instruction_pidestall.webp"
                            alt="Instruksjonstegning med mål og deler"
                            className="w-full rounded-lg"
                          />
                        </button>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                          Klikk for full størrelse · Ferdig oppmålt tegning med mål og deler
                        </p>
                      </div>
                    </div>
                  </aside>
                </div>
              </>
            ) : (
              /* ── ARTICLE MODE ── */
              <article className="py-10 sm:py-14 max-w-[720px] mx-auto">
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white px-3 py-1 rounded-full"
                    style={{ background: accent }}
                  >
                    <Icon name="faSeedling" className="text-[0.55rem]" />
                    {levelLabel[course.level]}
                  </span>
                  <span className="text-xs text-gray-400">{course.duration}</span>
                  <span className="text-xs text-gray-400">{course.moduleCount} moduler</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
                  {course.title}
                </h1>

                <p className="text-base sm:text-lg text-gray-500 leading-[1.8] mb-8">
                  {course.description}
                </p>

                {/* Instruction image */}
                <div className="mb-10 -mx-4 sm:-mx-0">
                  <button
                    type="button"
                    onClick={() => setLightboxImg('/images/minio_instruction_pidestall.webp')}
                    className="w-full p-0 border-0 bg-transparent cursor-pointer"
                  >
                    <img
                      src="/images/minio_instruction_pidestall.webp"
                      alt="Instruksjonstegning med mål og deler"
                      className="w-full rounded-lg"
                    />
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Klikk på bildet for å se i full størrelse
                  </p>
                </div>

                {/* Article sections */}
                <div className="space-y-10">
                  {course.article.map((sec, i) => (
                    <div key={i}>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 leading-snug mb-4 flex items-center gap-3">
                        <span className="w-1 h-5 rounded-full shrink-0" style={{ background: accent }} />
                        {sec.heading}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 leading-[1.8] ml-4">
                        {sec.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Learning objectives */}
                <div className="mt-12 pt-8 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Læringsmål</h3>
                  <ul className="space-y-2 mb-8">
                    {course.learningObjectives.map((obj, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: accent }} />
                        {obj}
                      </li>
                    ))}
                  </ul>

                  <Button
                    size="lg"
                    className="shadow-md gap-2 px-10"
                    style={{ background: accent }}
                    onClick={startCourse}
                  >
                    <Icon name="faPlay" className="text-[0.65rem]" />
                    Start kurset
                  </Button>
                </div>
              </article>
            )}
          </div>

          {/* ── Badge modal ── */}
          {showBadge && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
              onClick={() => setShowBadge(false)}
            >
              <div
                className="bg-white rounded-2xl w-full max-w-sm p-10 text-center shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                  <Icon name="faTrophy" className="text-3xl text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Gratulerer!</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-7">
                  Du har fullført <strong className="text-gray-900">{course.title}</strong>.
                  <br />
                  <span className="text-gray-400 text-xs">{course.moduleCount} moduler · {course.duration}</span>
                </p>
                <Button
                  className="w-full text-sm py-2.5"
                  style={{ background: accent }}
                  onClick={() => setShowBadge(false)}
                >
                  <Icon name="faCheck" className="text-[0.7rem]" /> OK!
                </Button>
              </div>
            </div>
          )}

          {/* ── Image lightbox ── */}
          {lightboxImg && (
            <div
              className="fixed inset-0 bg-black/85 z-[10002] flex items-center justify-center p-4 cursor-zoom-out"
              onClick={() => setLightboxImg(null)}
            >
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center text-lg cursor-pointer border-0 hover:bg-black/60 transition-colors z-10"
              >
                <Icon name="faTimes" />
              </button>
              <img
                src={lightboxImg}
                alt="Instruksjonstegning full størrelse"
                className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
