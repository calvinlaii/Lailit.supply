import { cn } from '@/lib/utils'

type ThumbnailPlaceholderProps = {
  category: 'animation' | 'ui-components' | 'layout' | 'interactions'
  title: string
  className?: string
  thumbnailKey?: string | null
}

function AnimationThumb() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="320" height="180" fill="url(#anim-bg)" />
      <defs>
        <linearGradient id="anim-bg" x1="0" y1="0" x2="320" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4C1D95" />
          <stop offset="1" stopColor="#1E1B4B" />
        </linearGradient>
      </defs>
      {/* Wavy motion lines */}
      <path d="M20 90 Q60 60 100 90 Q140 120 180 90 Q220 60 260 90 Q300 120 320 90" stroke="#7C3AED" strokeWidth="2" strokeOpacity="0.6" fill="none" />
      <path d="M20 105 Q60 75 100 105 Q140 135 180 105 Q220 75 260 105 Q300 135 320 105" stroke="#8B5CF6" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
      <path d="M20 75 Q60 45 100 75 Q140 105 180 75 Q220 45 260 75 Q300 105 320 75" stroke="#6D28D9" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
      {/* Center orb */}
      <circle cx="160" cy="90" r="18" fill="#7C3AED" fillOpacity="0.3" />
      <circle cx="160" cy="90" r="10" fill="#A78BFA" fillOpacity="0.5" />
      <circle cx="160" cy="90" r="4" fill="#DDD6FE" fillOpacity="0.9" />
    </svg>
  )
}

function UIComponentsThumb() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="320" height="180" fill="url(#ui-bg)" />
      <defs>
        <linearGradient id="ui-bg" x1="0" y1="0" x2="320" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E3A5F" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      {/* Mock card */}
      <rect x="60" y="30" width="200" height="120" rx="10" fill="#1E40AF" fillOpacity="0.2" stroke="#3B82F6" strokeOpacity="0.3" strokeWidth="1" />
      {/* Button */}
      <rect x="100" y="110" width="120" height="26" rx="6" fill="#3B82F6" fillOpacity="0.7" />
      <rect x="130" y="118" width="60" height="10" rx="3" fill="white" fillOpacity="0.8" />
      {/* Input */}
      <rect x="90" y="70" width="140" height="26" rx="6" fill="white" fillOpacity="0.05" stroke="#60A5FA" strokeOpacity="0.3" strokeWidth="1" />
      {/* Avatar */}
      <circle cx="100" cy="50" r="12" fill="#2563EB" fillOpacity="0.5" />
      {/* Text lines */}
      <rect x="118" y="44" width="60" height="7" rx="2" fill="white" fillOpacity="0.3" />
      <rect x="118" y="55" width="40" height="5" rx="2" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

function LayoutThumb() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="320" height="180" fill="url(#layout-bg)" />
      <defs>
        <linearGradient id="layout-bg" x1="0" y1="0" x2="320" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#064E3B" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      {/* Grid boxes */}
      <rect x="30" y="25" width="120" height="70" rx="6" fill="#065F46" fillOpacity="0.5" stroke="#10B981" strokeOpacity="0.3" strokeWidth="1" />
      <rect x="165" y="25" width="125" height="30" rx="6" fill="#065F46" fillOpacity="0.4" stroke="#10B981" strokeOpacity="0.25" strokeWidth="1" />
      <rect x="165" y="65" width="55" height="30" rx="6" fill="#065F46" fillOpacity="0.3" stroke="#10B981" strokeOpacity="0.2" strokeWidth="1" />
      <rect x="235" y="65" width="55" height="30" rx="6" fill="#065F46" fillOpacity="0.3" stroke="#10B981" strokeOpacity="0.2" strokeWidth="1" />
      <rect x="30" y="110" width="260" height="44" rx="6" fill="#065F46" fillOpacity="0.35" stroke="#10B981" strokeOpacity="0.2" strokeWidth="1" />
      {/* Content lines inside boxes */}
      <rect x="40" y="40" width="50" height="8" rx="2" fill="#34D399" fillOpacity="0.4" />
      <rect x="40" y="54" width="80" height="5" rx="2" fill="#34D399" fillOpacity="0.2" />
      <rect x="40" y="63" width="60" height="5" rx="2" fill="#34D399" fillOpacity="0.2" />
    </svg>
  )
}

function InteractionsThumb() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="320" height="180" fill="url(#int-bg)" />
      <defs>
        <linearGradient id="int-bg" x1="0" y1="0" x2="320" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C2D12" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      {/* Ripple circles */}
      <circle cx="160" cy="90" r="55" stroke="#F97316" strokeOpacity="0.15" strokeWidth="1.5" fill="none" />
      <circle cx="160" cy="90" r="38" stroke="#F97316" strokeOpacity="0.25" strokeWidth="1.5" fill="none" />
      <circle cx="160" cy="90" r="22" stroke="#F97316" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />
      {/* Cursor */}
      <path d="M148 78 L148 102 L153 97 L157 106 L160 105 L156 96 L163 96 Z" fill="#FED7AA" fillOpacity="0.9" />
      {/* Click dot */}
      <circle cx="160" cy="90" r="4" fill="#F97316" />
    </svg>
  )
}

const THUMBS = {
  animation: AnimationThumb,
  'ui-components': UIComponentsThumb,
  layout: LayoutThumb,
  interactions: InteractionsThumb,
}

export function ThumbnailPlaceholder({ category, title, className, thumbnailKey }: ThumbnailPlaceholderProps) {
  if (thumbnailKey) {
    return (
      <div className={cn('w-full aspect-[4/3] overflow-hidden', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/media/${thumbnailKey}`}
          alt={`${title} thumbnail`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  const Thumb = THUMBS[category]
  return (
    <div
      role="img"
      aria-label={`${title} thumbnail`}
      className={cn('w-full aspect-[4/3] overflow-hidden', className)}
    >
      {Thumb ? <Thumb /> : (
        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10" />
      )}
    </div>
  )
}
