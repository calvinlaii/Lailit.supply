// Server Component — no 'use client'
export function HeroAnimatedDemo() {
  return (
    <div
      role="img"
      aria-label="Demo animasi tombol magnetic hover"
      className="relative w-full max-w-[960px] mx-auto aspect-video border border-neutral-200 rounded-[12px] bg-white overflow-hidden flex items-center justify-center"
      style={{ padding: "64px" }}
    >
      {/* Orbiting cursor dot */}
      <div
        className="hero-demo-cursor absolute w-3 h-3 rounded-full bg-neutral-950 pointer-events-none"
        style={{ top: "50%", left: "50%", marginTop: "-6px", marginLeft: "-6px" }}
        aria-hidden="true"
      />

      {/* Scaling pill button */}
      <div
        className="hero-demo-button relative z-10 bg-neutral-950 text-white text-sm font-semibold px-6 py-3 rounded-full select-none pointer-events-none"
        aria-hidden="true"
      >
        Hover me
      </div>

      {/* Caption — visible at all times; reduced-motion CSS stops animation but keeps caption */}
      <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-neutral-500 leading-[1.45]">
        Live demo — salin kode dalam satu klik
      </p>
    </div>
  );
}
