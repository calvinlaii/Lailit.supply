import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — lailit.supply",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout>
      <Link
        href="/"
        className="inline-block text-sm font-normal leading-[1.45] text-neutral-500 hover:text-neutral-950 transition-colors duration-150 mb-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 rounded"
      >
        ← Kembali ke beranda
      </Link>

      <h1 className="text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950">
        Kebijakan Privasi
      </h1>
      <p className="mt-2 text-sm font-normal leading-[1.45] text-neutral-500">
        Terakhir diperbarui: 5 Mei 2026
      </p>

      <article className="mt-8 space-y-8">
        <section>
          <h2 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950 mb-4">
            Pengumpulan Data
          </h2>
          <p className="text-base font-normal leading-[1.5] text-neutral-950">
            Kami mengumpulkan alamat email yang kamu berikan saat mendaftar atau login. Data ini digunakan untuk mengirim magic link autentikasi dan informasi akun. {/* [TODO: legal review] */}
          </p>
          <p className="mt-3 text-base font-normal leading-[1.5] text-neutral-950">
            Informasi pembayaran diproses sepenuhnya oleh Mayar.id dan tidak disimpan di server kami. Kami hanya menerima konfirmasi status pembayaran melalui webhook. {/* [TODO: legal review] */}
          </p>
        </section>

        <section>
          <h2 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950 mb-4">
            Penggunaan Data
          </h2>
          <p className="text-base font-normal leading-[1.5] text-neutral-950">
            Data yang kami kumpulkan digunakan untuk: memberikan akses ke layanan lailit.supply, mengirim notifikasi penting terkait akun dan langganan kamu, dan meningkatkan layanan kami. {/* [TODO: legal review] */}
          </p>
          <p className="mt-3 text-base font-normal leading-[1.5] text-neutral-950">
            Kami tidak menjual atau berbagi data pribadi kamu dengan pihak ketiga untuk tujuan pemasaran. {/* [TODO: legal review] */}
          </p>
        </section>

        <section>
          <h2 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950 mb-4">
            Cookie
          </h2>
          <p className="text-base font-normal leading-[1.5] text-neutral-950">
            lailit.supply menggunakan cookie sesi untuk menjaga status login kamu. Cookie ini diperlukan untuk fungsi dasar layanan dan tidak dapat dinonaktifkan jika kamu ingin menggunakan layanan. {/* [TODO: legal review] */}
          </p>
        </section>

        <section>
          <h2 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950 mb-4">
            Kontak
          </h2>
          <p className="text-base font-normal leading-[1.5] text-neutral-950">
            Untuk pertanyaan terkait privasi data kamu, hubungi kami di:{" "}
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
