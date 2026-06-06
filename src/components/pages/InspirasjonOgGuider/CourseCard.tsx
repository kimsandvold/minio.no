import { Link } from 'react-router-dom'
import Icon from '../../shared/Icon'
import { Card, CardContent } from '../../ui/card'
import type { Course } from '../../../types/product'

const cardColors: Record<string, { bg: string; accent: string; label: string }> = {
  beginner: { bg: '#1a4a2e', accent: '#16A34A', label: 'Nybegynner' },
  intermediate: { bg: '#5c3a1a', accent: '#EA580C', label: 'Middels' },
  advanced: { bg: '#4a1a1a', accent: '#DC2626', label: 'Avansert' },
}

interface Props {
  course: Course
}

export default function CourseCard({ course }: Props) {
  const colors = cardColors[course.level]

  return (
    <Link to={`/inspirasjon-og-guider/kurs/${course.slug}`} className="block no-underline group">
      <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border border-gray-100 bg-white rounded-xl">
        {/* Project image */}
        <div className="relative aspect-video overflow-hidden bg-gray-50">
          <img
            src={course.cardImage}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <span
            className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-[0.08em] text-white px-2.5 py-1 rounded-full z-10"
            style={{ background: colors.accent }}
          >
            {colors.label}
          </span>
          <div className="absolute bottom-3 left-4 right-4 z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/60 mb-0.5">
              {course.subtitle}
            </p>
            <h3 className="text-base font-bold text-white leading-snug">
              {course.title}
            </h3>
          </div>
        </div>

        {/* Body */}
        <CardContent className="p-5">
          <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
            {course.description}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1.5">
              <Icon name="faClock" className="text-[0.6rem]" />
              {course.duration}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1.5">
              <Icon name="faLayerGroup" className="text-[0.6rem]" />
              {course.moduleCount} moduler
            </span>
          </div>

          <ul className="space-y-2 mb-5">
            {course.learningObjectives.map((obj, i) => (
              <li key={i} className="text-xs text-gray-500 flex items-start gap-2 leading-relaxed">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: colors.accent }}
                />
                {obj}
              </li>
            ))}
          </ul>

          <div
            className="block w-full text-center py-2.5 text-white rounded-lg text-xs font-bold uppercase tracking-[0.06em] transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: colors.bg }}
          >
            Start kurset
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
