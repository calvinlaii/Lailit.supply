import { PricingCard } from "@/components/marketing/pricing-card";

export function PricingCardGrid() {
  return (
    <div className="max-w-[840px] mx-auto grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-6">
      <PricingCard variant="monthly" />
      <PricingCard variant="lifetime" />
    </div>
  );
}
