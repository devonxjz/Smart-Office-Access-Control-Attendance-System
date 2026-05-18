import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Cpu, Lock, User, ArrowRight, Wifi } from "lucide-react";
import { hashPassword } from "../lib/crypto";
import { sheetsClient } from "../infrastructure/google-sheets.client";

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const hashedPassword = await hashPassword(password);
      const user = await sheetsClient.authenticate(email, hashedPassword);

      sessionStorage.setItem('userSession', JSON.stringify(user));
      navigate("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Invalid credentials');
      setCooldown(5); // 5-second cooldown
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background bg-glow">
      {/* Grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* Left — brand */}
        <aside className="hidden flex-col justify-between p-12 lg:flex">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Cpu className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                IoT · ESP32
              </p>
              <p className="text-lg font-semibold">SmartOffice</p>
            </div>
          </Link>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="font-mono">3 thiết bị đang online</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Chấm công bằng <span className="text-primary">thẻ NFC</span>,
              <br />
              quản lý theo thời gian thực.
            </h1>
            <p className="max-w-md text-base text-muted-foreground">
              Quẹt thẻ — cửa mở — log gửi về dashboard. Theo dõi giờ vào, giờ ra
              và phát hiện đi trễ tự động cho từng phòng ban.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-6">
              {[
                { k: "Cửa kết nối", v: "08", icon: Wifi },
                { k: "Phòng ban", v: "12", icon: Cpu },
                { k: "Nhân viên", v: "164", icon: User },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-xl border border-border bg-card/40 p-4 backdrop-blur"
                >
                  <s.icon className="mb-2 h-4 w-4 text-primary" />
                  <p className="font-mono text-2xl font-bold">{s.v}</p>
                  <p className="text-xs text-muted-foreground">{s.k}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="font-mono text-xs text-muted-foreground">
            © 2026 Smart Office IoT — Đề tài tốt nghiệp
          </p>
        </aside>

        {/* Right — form */}
        <main className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
                <Cpu className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-card backdrop-blur-xl">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                · Auth Console
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Đăng nhập</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Quản trị viên hệ thống chấm công NFC.
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Tài khoản
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      className="h-11 w-full rounded-lg border border-border bg-input pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="admin"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-11 w-full rounded-lg border border-border bg-input pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input type="checkbox" className="h-3.5 w-3.5 accent-primary" defaultChecked />
                    Ghi nhớ phiên
                  </label>
                  <a className="text-primary hover:underline" href="#">
                    Quên mật khẩu?
                  </a>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
                >
                  {loading 
                    ? "Đang xác thực..." 
                    : cooldown > 0 
                      ? `Thử lại sau ${cooldown}s`
                      : "Truy cập dashboard"}
                  {cooldown === 0 && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span className="font-mono uppercase tracking-wider">hoặc</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <button className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-secondary text-sm font-medium hover:bg-accent">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-primary" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Quẹt thẻ NFC để đăng nhập
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Cần hỗ trợ?{" "}
              <a className="text-primary hover:underline" href="#">
                Liên hệ IT
              </a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
