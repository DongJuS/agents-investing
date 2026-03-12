/**
 * ui/src/components/Layout.tsx — 사이드바 + 메인 영역 레이아웃
 */
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "대시보드",
    paths: ["M3 12h18", "M6 7h12", "M8 17h8"],
  },
  {
    to: "/strategy",
    label: "전략 현황",
    paths: [
      "M12 4a4 4 0 100 8 4 4 0 000-8z",
      "M6.5 20a5.5 5.5 0 0111 0",
    ],
  },
  {
    to: "/portfolio",
    label: "포트폴리오",
    paths: [
      "M4 8h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z",
      "M9 8V6a3 3 0 016 0v2",
    ],
  },
  {
    to: "/market",
    label: "시장 데이터",
    paths: ["M4 16l4-4 3 3 5-7", "M4 20h16"],
  },
  {
    to: "/settings",
    label: "설정",
    paths: [
      "M12 8a4 4 0 100 8 4 4 0 000-8z",
      "M3 12h2m14 0h2M12 3v2m0 14v2m-6.5-3.5l1.4-1.4m8.2-8.2l1.4-1.4m0 11l-1.4-1.4m-8.2-8.2L5.5 5.5",
    ],
  },
];

export default function Layout() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("alpha_token");
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={`
          ${sidebarOpen ? "w-[278px]" : "w-[94px]"}
          shrink-0 px-3 py-4 transition-all duration-300 ease-out md:px-4
        `}
      >
        <div className="flex h-full flex-col rounded-[30px] border border-white/80 bg-white/85 shadow-[0_20px_40px_rgba(15,23,42,0.11)] backdrop-blur-xl">
          <div className="border-b border-slate-100/80 px-4 pb-4 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 text-white shadow-[0_8px_18px_rgba(49,130,246,0.35)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]">
                  <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
                </svg>
              </div>
              {sidebarOpen && (
                <div>
                  <p className="text-[17px] font-extrabold tracking-[-0.02em] text-slate-900">Alpha Trade</p>
                  <p className="text-[11px] font-medium text-slate-500">Autonomous Ops</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 space-y-1.5 px-2 py-4">
            {NAV_ITEMS.map(({ to, label, paths }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#EAF3FF] text-[#205ECF] shadow-[inset_0_0_0_1px_rgba(49,130,246,0.22)]"
                      : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-[0_4px_10px_rgba(15,23,42,0.08)]">
                      <svg
                        viewBox="0 0 24 24"
                        className={`h-[18px] w-[18px] fill-none stroke-[2] ${
                          isActive ? "stroke-[#205ECF]" : "stroke-slate-500 group-hover:stroke-slate-800"
                        }`}
                      >
                        {paths.map((path) => (
                          <path key={path} d={path} strokeLinecap="round" strokeLinejoin="round" />
                        ))}
                      </svg>
                    </span>
                    {sidebarOpen && <span className="tracking-[-0.01em]">{label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-1.5 px-2 pb-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-900"
            >
              <span className="text-base">↩</span>
              {sidebarOpen && <span>로그아웃</span>}
            </button>
            <button
              onClick={toggleSidebar}
              className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100/80 hover:text-slate-800"
            >
              <span className="text-base">{sidebarOpen ? "⟨" : "⟩"}</span>
              {sidebarOpen && <span>사이드바 접기</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
