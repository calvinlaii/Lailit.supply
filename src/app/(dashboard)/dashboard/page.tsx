import type { Metadata } from 'next'
import { getUser } from '@/lib/dal'
import { DashboardStubCard } from '@/components/dashboard/dashboard-stub-card'

export const metadata: Metadata = {
  title: 'Dashboard — lailit.supply',
}

export default async function DashboardPage() {
  const user = await getUser()

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-16">
      <h1 className="text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950">
        Dashboard
      </h1>
      <p className="mt-2 text-base font-normal leading-[1.5] text-neutral-500">
        Selamat datang, {user?.email}. Komponen segera hadir.
      </p>
      <div className="mt-12">
        <DashboardStubCard />
      </div>
    </div>
  )
}
