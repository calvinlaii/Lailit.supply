import { redirect } from 'next/navigation'
import { getUser } from '@/lib/dal'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-neutral-950 focus:border focus:border-neutral-200 focus:rounded-lg"
      >
        Lewati ke konten utama
      </a>
      <DashboardNav email={user.email ?? ''} />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  )
}
