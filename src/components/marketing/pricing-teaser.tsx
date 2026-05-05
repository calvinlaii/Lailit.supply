// Server Component — no 'use client'
import Link from "next/link";

export function PricingTeaser() {
  return (
    <section className="px-4 sm:px-8 lg:px-12 py-24 lg:py-32">
      <div className="max-w-[640px] mx-auto text-center">
        <h2 className="text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950">
          Satu kali bayar, atau langganan
        </h2>
        <p className="mt-4 text-base font-normal leading-[1.5] text-neutral-950">
          Pilih paket yang cocok buat ritme kerjamu. Cancel kapan saja di paket bulanan.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-block text-base font-semibold text-neutral-950 underline underline-offset-4 hover:text-neutral-700 transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 rounded"
        >
          Lihat semua paket →
        </Link>
      </div>
    </section>
  );
}
