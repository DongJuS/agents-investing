import { FormEvent, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { api } from "@/utils/api";

type LoginResponse = {
  token: string;
  expires_in: number;
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("alpha_token");

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin1234");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectPath = useMemo(() => {
    const fromState = (location.state as { from?: string } | null)?.from;
    return fromState && fromState.startsWith("/") ? fromState : "/dashboard";
  }, [location.state]);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      localStorage.setItem("alpha_token", data.token);
      navigate(redirectPath, { replace: true });
    } catch (err: unknown) {
      const fallback = "로그인에 실패했습니다. 이메일/비밀번호를 확인하세요.";
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : fallback);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-[1.05fr_1fr]">
        <div className="hero-card flex min-h-[360px] flex-col justify-between">
          <div>
            <p className="kpi-label">ALPHA TRADING SYSTEM</p>
            <h1 className="section-title mt-2 leading-tight">
              시장 흐름을
              <br />
              더 빠르고 명확하게
            </h1>
            <p className="section-sub mt-4 max-w-sm">
              토스 스타일의 직관적인 대시보드로 전략, 포지션, 리스크를 한 번에 관리합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/90 bg-white/70 px-3 py-3">
              <p className="text-[11px] font-semibold text-slate-500">Runtime</p>
              <p className="mt-1 text-sm font-bold text-slate-800">Docker Active</p>
            </div>
            <div className="rounded-2xl border border-white/90 bg-white/70 px-3 py-3">
              <p className="text-[11px] font-semibold text-slate-500">Mode</p>
              <p className="mt-1 text-sm font-bold text-slate-800">Paper Trading</p>
            </div>
          </div>
        </div>

        <div className="card w-full max-w-md justify-self-center md:max-w-none">
          <div className="mb-6">
            <p className="kpi-label">WELCOME BACK</p>
            <h2 className="section-title mt-1 text-[30px]">로그인</h2>
            <p className="section-sub mt-2">대시보드 접근을 위해 계정 인증이 필요합니다.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">이메일</label>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">비밀번호</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
              {submitting ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
            <p className="text-xs text-slate-500">기본 테스트 계정</p>
            <p className="mt-1 text-xs font-semibold text-slate-700">admin@example.com / admin1234</p>
          </div>
          <div className="mt-4 text-[11px] text-slate-400">실거래 전환 전 Settings에서 readiness를 반드시 확인하세요.</div>
        </div>
      </div>
    </div>
  );
}
