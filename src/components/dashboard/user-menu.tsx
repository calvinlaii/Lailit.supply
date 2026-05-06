'use client'

import { ChevronDown, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { signOut } from '@/app/(dashboard)/dashboard/actions'

type UserMenuProps = { email: string }

export function UserMenu({ email }: UserMenuProps) {
  const initial = email.charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Buka menu akun"
        className="flex h-11 items-center gap-2 rounded-lg px-2 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 transition-colors duration-150"
      >
        {/* Email — hidden on mobile, visible from sm breakpoint */}
        <span className="hidden sm:block max-w-[140px] truncate text-sm font-normal leading-[1.45] text-neutral-500">
          {email}
        </span>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-neutral-950 text-white text-base font-semibold">
            {initial || <User size={16} className="text-white" />}
          </AvatarFallback>
        </Avatar>
        <ChevronDown
          size={16}
          className="text-neutral-500 transition-transform duration-150 data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem asChild>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Keluar dari akun"
              className="w-full text-left text-base font-normal text-neutral-950"
            >
              Keluar
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
