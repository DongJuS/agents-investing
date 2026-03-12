/**
 * ui/src/components/TossTradingDashboard.tsx
 * Toss Securities-inspired mobile-first dashboard component.
 */

type WatchItem = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  positive: boolean;
  icon: string;
  iconBg: string;
};

type TrendingItem = {
  title: string;
  subtitle: string;
  tone: "blue" | "mint" | "purple" | "amber";
};

interface TossTradingDashboardProps {
  totalAsset: number | null;
}

const WATCHLIST: WatchItem[] = [
  {
    symbol: "AAPL",
    name: "Apple",
    price: "$213.75",
    change: "+1.84%",
    positive: true,
    icon: "A",
    iconBg: "from-sky-400 to-blue-600",
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    price: "$248.11",
    change: "-0.73%",
    positive: false,
    icon: "T",
    iconBg: "from-fuchsia-400 to-pink-500",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    price: "$984.09",
    change: "+3.12%",
    positive: true,
    icon: "N",
    iconBg: "from-emerald-400 to-green-600",
  },
];

const TRENDING: TrendingItem[] = [
  {
    title: "AI 반도체 랠리",
    subtitle: "NVIDIA · AMD",
    tone: "blue",
  },
  {
    title: "2차전지 반등",
    subtitle: "KR Sector",
    tone: "mint",
  },
  {
    title: "금리 민감주",
    subtitle: "미국 CPI 주간",
    tone: "purple",
  },
  {
    title: "원자재 모멘텀",
    subtitle: "원유 · 구리",
    tone: "amber",
  },
];

function toneClass(tone: TrendingItem["tone"]): string {
  if (tone === "mint") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (tone === "purple") return "bg-violet-50 text-violet-700 border-violet-100";
  if (tone === "amber") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-blue-50 text-blue-700 border-blue-100";
}

function formatAsset(value: number | null): string {
  if (value == null) return "₩ --";
  return `₩ ${value.toLocaleString("ko-KR")}`;
}

export default function TossTradingDashboard({ totalAsset }: TossTradingDashboardProps) {
  return (
    <div className="mx-auto w-full max-w-sm space-y-5 px-4 pb-10 pt-5 font-sans">
      <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:scale-105">
        <p className="text-xs font-semibold tracking-wide text-slate-400">Total Asset</p>
        <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.03em] text-[#191F28]">{formatAsset(totalAsset)}</h1>
        <p className="mt-2 text-sm font-semibold text-[#3182F6]">Today +1.28%</p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#191F28]">Stock Watchlist</h2>
          <button className="text-xs font-semibold text-slate-400">See all</button>
        </div>
        <div className="space-y-2.5">
          {WATCHLIST.map((item) => (
            <article
              key={item.symbol}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:scale-105"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.iconBg} text-sm font-bold text-white`}
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-400">{item.symbol}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{item.price}</p>
                <p className={`text-xs font-semibold ${item.positive ? "text-emerald-600" : "text-rose-500"}`}>
                  {item.change}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#191F28]">Trending</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <article className="col-span-2 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-4 shadow-[0_8px_20px_rgba(37,99,235,0.08)] transition-transform duration-200 hover:scale-105">
            <p className="text-sm font-bold text-blue-800">{TRENDING[0].title}</p>
            <p className="mt-1 text-xs font-semibold text-blue-600">{TRENDING[0].subtitle}</p>
          </article>

          {TRENDING.slice(1).map((item) => (
            <article
              key={item.title}
              className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:scale-105 ${toneClass(
                item.tone
              )}`}
            >
              <p className="text-sm font-bold">{item.title}</p>
              <p className="mt-1 text-xs font-semibold opacity-80">{item.subtitle}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
