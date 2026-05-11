// Server Component — no 'use client'
import Link from "next/link";
import { HeroAnimatedDemo } from "@/components/marketing/hero-animated-demo";

export function HeroSection() {
  return (
    <section className="px-4 sm:px-8 lg:px-12 pt-24 pb-24 lg:pt-32 lg:pb-32">
      <div className="max-w-[1200px] mx-auto">
        {/* Headline + CTAs */}
        <div className="max-w-[840px]">
          <h1 className="text-[3rem] lg:text-[6rem] font-semibold leading-[1.05] tracking-[-0.03em] text-neutral-950">
            Komponen kreatif untuk developer Indonesia
          </h1>
          <p className="mt-6 text-base font-normal leading-[1.5] text-neutral-950 max-w-[52ch]">
            Animasi siap pakai, lima format kode, satu langganan. Buat developer yang nggak mau bikin ulang interaksi yang sama tiap project.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Primary CTA — new customers, routes through payment */}
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center bg-neutral-950 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-neutral-800 active:bg-neutral-900 transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              Join
            </Link>
            {/* Secondary CTA — existing customers */}
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-transparent text-neutral-950 border border-neutral-200 px-6 py-3 rounded-lg text-base font-semibold hover:border-neutral-950 active:bg-neutral-50 transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Animated demo */}
        <div className="mt-12">
          <HeroAnimatedDemo />
        </div>
      </div>
    </section>
  );
}
