import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, session } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await login(email, password);

      // Role-based routing after login
      switch (user.role) {
        case "COORDINATOR":
          navigate({ to: "/dieu-phoi" });
          break;
        case "TEAM_MEMBER":
          navigate({ to: "/doi-cuu-ho" });
          break;
        case "RELIEF_STAFF":
          navigate({ to: "/cuu-tro" });
          break;
        case "ADMIN":
          navigate({ to: "/quan-tri" });
          break;
        default:
          navigate({ to: "/" });
      }
    } catch (err: any) {
      setError(err.message || "Email hoặc mật khẩu không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError(null);
  };

  return (
    <div className="mx-auto max-w-md py-12 px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-2xl font-bold shadow-2xs">
            🔒
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Đăng nhập Workspace
          </h1>
          <p className="text-xs text-slate-500">
            Hệ thống quản lý phân quyền cứu hộ lũ lụt nội bộ
          </p>
        </div>

        {session.isAuthenticated && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 space-y-2 text-center">
            <p>
              Bạn đang đăng nhập với tư cách: <strong>{session.user?.name}</strong> ({session.user?.role})
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email công vụ / tài khoản</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhap-email@demo.local"
              required
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập ngay"}
          </button>
        </form>

        {/* DEMO ACCOUNTS HELPER PANEL */}
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Tài khoản Demo hệ thống
            </p>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              ENABLE_DEMO_ACCOUNTS=true
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemoAccount("coordinator@demo.local")}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all"
            >
              <p className="font-bold text-slate-800">Điều phối viên</p>
              <p className="text-[10px] text-slate-500 font-mono">coordinator@demo.local</p>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount("team@demo.local")}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all"
            >
              <p className="font-bold text-slate-800">Đội cứu hộ</p>
              <p className="text-[10px] text-slate-500 font-mono">team@demo.local</p>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount("relief@demo.local")}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all"
            >
              <p className="font-bold text-slate-800">Cán bộ cứu trợ</p>
              <p className="text-[10px] text-slate-500 font-mono">relief@demo.local</p>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount("admin@demo.local")}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all"
            >
              <p className="font-bold text-slate-800">Quản trị viên</p>
              <p className="text-[10px] text-slate-500 font-mono">admin@demo.local</p>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            Mật khẩu demo chung: <code className="text-slate-600 font-bold">Password123!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
