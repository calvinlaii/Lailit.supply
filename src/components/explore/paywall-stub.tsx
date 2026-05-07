import { Lock } from 'lucide-react'

export function PaywallStub() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="max-w-[400px] flex flex-col items-center gap-6">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
          <Lock className="w-6 h-6 text-neutral-400" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold leading-[1.45] text-neutral-950">
            Konten Premium
          </h2>
          <p className="text-sm font-normal leading-[1.5] text-neutral-500">
            Berlangganan untuk mengakses semua format kode premium.
          </p>
        </div>
        <a
          href="/pricing"
          className="inline-flex items-center justify-center bg-neutral-950 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 w-full sm:w-auto"
        >
          Lihat Paket Harga
        </a>
      </div>
    </div>
  )
}
