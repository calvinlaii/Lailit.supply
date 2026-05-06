import Link from 'next/link'
import { UserMenu } from './user-menu'

type DashboardNavProps = { email: string }

export function DashboardNav({ email }: DashboardNavProps) {
  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-neutral-200 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 h-full flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-base font-semibold text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 rounded"
        >
          lailit.supply
        </Link>
        <UserMenu email={email} />
      </div>
    </nav>
  )
}
