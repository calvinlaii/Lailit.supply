import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {/* Tagline — spans full width on mobile */}
          <div className="col-span-2 lg:col-span-1">
            <p className="text-sm text-neutral-500">
              Komponen kreatif untuk developer Indonesia.
            </p>
          </div>

          {/* Produk */}
          <div>
            <p className="text-sm font-semibold text-neutral-950 mb-3">Produk</p>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/explore"
                  className="text-sm text-neutral-500 hover:text-neutral-950 transition-colors"
                >
                  Komponen
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-neutral-500 hover:text-neutral-950 transition-colors"
                >
                  Harga
                </Link>
              </li>
            </ul>
          </div>

          {/* Akun */}
          <div>
            <p className="text-sm font-semibold text-neutral-950 mb-3">Akun</p>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/login"
                  className="text-sm text-neutral-500 hover:text-neutral-950 transition-colors"
                >
                  Masuk
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-sm font-semibold text-neutral-950 mb-3">Legal</p>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/legal/privacy-policy"
                  className="text-sm text-neutral-500 hover:text-neutral-950 transition-colors"
                >
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms-and-conditions"
                  className="text-sm text-neutral-500 hover:text-neutral-950 transition-colors"
                >
                  Syarat &amp; Ketentuan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-200 pt-8">
          <p className="text-sm text-neutral-500">
            &copy; 2026 lailit.supply. Dibuat di Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
