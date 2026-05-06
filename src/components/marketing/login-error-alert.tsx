import { AlertCircle } from 'lucide-react'

export function LoginErrorAlert() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mt-4 mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
    >
      <AlertCircle
        size={16}
        className="mt-0.5 flex-shrink-0 text-red-600"
        aria-hidden="true"
      />
      <div>
        <p className="text-base font-normal leading-[1.5] text-red-600">
          Link kamu sudah kedaluwarsa.
        </p>
        <p className="mt-1 text-sm font-normal leading-[1.45] text-neutral-500">
          Minta link baru di bawah.
        </p>
      </div>
    </div>
  )
}
