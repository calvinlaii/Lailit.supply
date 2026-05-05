type PricingCardProps = {
  variant: "monthly" | "lifetime";
};

const MONTHLY_DATA = {
  planName: "Bulanan",
  badge: "Paling Populer",
  price: "Rp 449.000",
  priceUnit: "/bulan",
  reassurance: "Batalkan kapan saja",
  features: [
    "Akses semua komponen premium",
    "5 format kode (Framer, Webflow, HTML, JSX, TSX)",
    "Update komponen baru tiap minggu",
    "Discord member-only",
    "Lisensi pemakaian komersial",
  ],
  ctaLabel: "Berlangganan Bulanan",
};

const LIFETIME_DATA = {
  planName: "Lifetime",
  badge: null,
  price: "Rp 13.500.000",
  priceUnit: "sekali bayar",
  reassurance: "Akses selamanya, tanpa langganan",
  features: [
    "Semua fitur paket Bulanan",
    "Akses seumur hidup ke semua komponen",
    "Prioritas request komponen baru",
    "Tanpa biaya berulang",
  ],
  ctaLabel: "Beli Lifetime",
};

export function PricingCard({ variant }: PricingCardProps) {
  const data = variant === "monthly" ? MONTHLY_DATA : LIFETIME_DATA;

  return (
    <div className="relative bg-white border border-neutral-200 rounded-[12px] p-8 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_4px_12px_rgba(10,10,10,0.04)] hover:border-neutral-950 transition-colors duration-150 ease-out flex flex-col">
      {/* Badge — monthly only */}
      {data.badge && (
        <div className="absolute top-6 right-6">
          <span className="inline-flex items-center rounded-full bg-neutral-950 px-3 py-1 text-sm font-semibold text-white leading-[1.45]">
            {data.badge}
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3 className="text-base font-semibold leading-[1.5] text-neutral-950">
        {data.planName}
      </h3>

      {/* Price block */}
      <div className="mt-6">
        <div className="flex items-baseline gap-1">
          <span
            className="text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {data.price}
          </span>
          <span className="text-sm font-normal leading-[1.45] text-neutral-500">
            {data.priceUnit}
          </span>
        </div>
        <p className="mt-1 text-sm font-normal leading-[1.45] text-neutral-500">
          {data.reassurance}
        </p>
      </div>

      {/* Feature list */}
      <ul className="mt-8 flex flex-col gap-3 flex-1" aria-label={`Fitur paket ${data.planName}`}>
        {data.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm font-normal leading-[1.45] text-neutral-950">
            <span className="mt-0.5 flex-shrink-0 text-neutral-950" aria-hidden="true">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* Stubbed CTA — per D-12: aria-disabled, data-stub, cursor-not-allowed */}
      <div className="mt-8">
        <a
          href="#"
          aria-disabled="true"
          data-stub="true"
          title="Segera hadir"
          tabIndex={-1}
          className="inline-flex w-full items-center justify-center bg-neutral-950 text-white px-6 py-3 rounded-lg text-base font-semibold cursor-not-allowed opacity-50 pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
        >
          {data.ctaLabel}
        </a>
      </div>
    </div>
  );
}
