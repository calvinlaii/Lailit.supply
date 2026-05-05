import type { Metadata } from "next";
import { HeroSection } from "@/components/marketing/hero-section";
import { ValuePropsGrid } from "@/components/marketing/value-props-grid";
import { PricingTeaser } from "@/components/marketing/pricing-teaser";

export const metadata: Metadata = {
  title: "lailit.supply — Komponen kreatif untuk developer Indonesia",
  description:
    "Animasi siap pakai, lima format kode, satu langganan. Buat developer yang nggak mau bikin ulang interaksi yang sama tiap project.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValuePropsGrid />
      <PricingTeaser />
    </>
  );
}
