/**
 * ui/src/pages/Dashboard.tsx
 * Mobile-first Toss-style dashboard page.
 */
import TossTradingDashboard from "@/components/TossTradingDashboard";
import { usePortfolio } from "@/hooks/usePortfolio";

export default function Dashboard() {
  const { data: portfolio, isLoading } = usePortfolio();

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <TossTradingDashboard totalAsset={isLoading ? null : (portfolio?.total_value ?? 0)} />
    </div>
  );
}
