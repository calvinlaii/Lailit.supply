// Server Component — no 'use client'
export function ValuePropsGrid() {
  const props = [
    {
      heading: "Lima format, satu sumber",
      body: "Framer, Webflow, HTML, JSX, TSX. Pilih sesuai stack-mu. Kode-nya konsisten di semua format.",
    },
    {
      heading: "Bayar pakai Rupiah",
      body: "QRIS, e-wallet, transfer bank. Tanpa kartu kredit internasional. Tanpa konversi mata uang.",
    },
    {
      heading: "Dirancang buat copy-paste",
      body: "Setiap komponen sudah teruji. Tinggal salin, tempel, dan sesuaikan. nggak ada vendor lock-in.",
    },
  ];

  return (
    <section className="px-4 sm:px-8 lg:px-12 py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8">
          {props.map((prop) => (
            <div key={prop.heading} className="p-6">
              <h3 className="text-base font-semibold leading-[1.5] text-neutral-950 mb-3">
                {prop.heading}
              </h3>
              <p className="text-base font-normal leading-[1.5] text-neutral-950">
                {prop.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
