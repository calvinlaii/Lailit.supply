import type { Metadata } from "next";
import { PricingCardGrid } from "@/components/marketing/pricing-card-grid";

export const metadata: Metadata = {
  title: "Harga — lailit.supply",
  description: "Akses penuh ke seluruh komponen. Pilih bulanan atau lifetime — tidak ada tier tersembunyi.",
};

export default function PricingPage() {
  return (
    <div className="px-4 sm:px-8 lg:px-12 py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto">
        {/* Page header */}
        <header className="text-center mb-12">
          <h1 className="text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950">
            Harga
          </h1>
          <p className="mt-3 text-base font-normal leading-[1.5] text-neutral-500 max-w-[52ch] mx-auto">
            Akses penuh ke seluruh komponen. Pilih bulanan atau lifetime — tidak ada tier tersembunyi.
          </p>
        </header>

        {/* Pricing cards */}
        <PricingCardGrid />

        {/* PPN note */}
        <p className="mt-8 text-center text-sm font-normal leading-[1.45] text-neutral-500">
          Harga sudah termasuk PPN. Pembayaran diproses oleh Mayar.id.
        </p>
      </div>
    </div>
  );
}
