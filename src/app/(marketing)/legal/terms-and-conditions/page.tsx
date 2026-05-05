import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — lailit.supply",
};

export default function TermsAndConditionsPage() {
  return (
    <LegalPageLayout>
      <Link
        href="/"
        className="inline-block text-sm font-normal leading-[1.45] text-neutral-500 hover:text-neutral-950 transition-colors duration-150 mb-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 rounded"
      >
        ← Kembali ke beranda
      </Link>

      <h1 className="text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950">
        Syarat &amp; Ketentuan
      </h1>
      <p className="mt-2 text-sm font-normal leading-[1.45] text-neutral-500">
        Terakhir diperbarui: 5 Mei 2026
      </p>

      <article className="mt-8 space-y-8">
        <section>
          <h2 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950 mb-4">
            Pemakaian Layanan
          </h2>
          <p className="text-base font-normal leading-[1.5] text-neutral-950">
            Dengan menggunakan lailit.supply, kamu menyetujui syarat dan ketentuan ini. Layanan ini ditujukan untuk developer dan desainer yang ingin menggunakan komponen kreatif dalam proyek mereka. {/* [TODO: legal review] */}
          </p>
          <p className="mt-3 text-base font-normal leading-[1.5] text-neutral-950">
            Kamu tidak boleh menggunakan layanan ini untuk mendistribusikan ulang, menjual kembali, atau mengklaim komponen sebagai karyamu sendiri kepada pihak lain. {/* [TODO: legal review] */}
          </p>
        </section>

        <section>
          <h2 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950 mb-4">
            Pembayaran
          </h2>
          <p className="text-base font-normal leading-[1.5] text-neutral-950">
            Semua pembayaran diproses melalui Mayar.id. Harga yang tertera sudah termasuk PPN. Kami menerima QRIS, e-wallet, dan transfer bank melalui platform Mayar.id. {/* [TODO: legal review] */}
          </p>
        </section>

        <section>
          <h2 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950 mb-4">
            Pembatalan
          </h2>
          <p className="text-base font-normal leading-[1.5] text-neutral-950">
            Langganan bulanan dapat dibatalkan kapan saja. Akses tetap aktif hingga akhir periode langganan yang sudah dibayar. Tidak ada pengembalian dana untuk periode yang sudah berjalan. {/* [TODO: legal review] */}
          </p>
          <p className="mt-3 text-base font-normal leading-[1.5] text-neutral-950">
            Pembelian lifetime tidak dapat dikembalikan kecuali dalam kondisi yang diwajibkan oleh hukum yang berlaku. {/* [TODO: legal review] */}
          </p>
        </section>

        <section>
          <h2 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950 mb-4">
            Lisensi
          </h2>
          <p className="text-base font-normal leading-[1.5] text-neutral-950">
            Kamu mendapatkan lisensi komersial untuk menggunakan komponen dalam proyek klien dan proyek pribadi. Lisensi ini non-eksklusif dan tidak dapat dipindahtangankan. {/* [TODO: legal review] */}
          </p>
        </section>

        <section>
          <h2 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950 mb-4">
            Kontak
          </h2>
          <p className="text-base font-normal leading-[1.5] text-neutral-950">
            Untuk pertanyaan terkait syarat dan ketentuan ini, hubungi kami di:{" "}
            <a
              href="mailto:hello@lailit.supply"
              className="underline underline-offset-4 hover:text-neutral-700"
            >
              hello@lailit.supply
            </a>
            . {/* [TODO: legal review] */}
          </p>
        </section>
      </article>
    </LegalPageLayout>
  );
}
