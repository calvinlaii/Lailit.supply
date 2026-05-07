import { Play } from 'lucide-react'

export function VideoPlaceholder({ title }: { title: string }) {
  return (
    <div
      role="img"
      aria-label="Pratinjau video belum tersedia"
      className="w-full aspect-video rounded-xl bg-neutral-100 flex flex-col items-center justify-center gap-3"
    >
      <Play className="w-8 h-8 text-neutral-400" aria-hidden="true" />
      <p className="text-sm text-neutral-500 leading-[1.45]">
        <span className="sr-only">{title} — </span>
        Video segera hadir
      </p>
    </div>
  )
}
