import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Lock, User, ArrowRight } from "lucide-react";
import { hashPassword } from "../lib/crypto";
import { sheetsClient } from "../infrastructure/google-sheets.client";
import loginIllustration from "../assets/login-illustration.png";

/* ── Complex Logo ─────────────────────────────────────────────────────────── */
function SmartOfficeLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="SmartOffice logo">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#338BFF"/>
          <stop offset="100%" stopColor="#0047CC"/>
        </linearGradient>
        <linearGradient id="lg2" x1="30" y1="28" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22C55E"/>
          <stop offset="100%" stopColor="#16A34A"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx="22" cy="22" r="20" stroke="url(#lg1)" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5"/>
      <path d="M8 22 Q10 16 14 12" stroke="#338BFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M5 22 Q8 13 14 8" stroke="#338BFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
      <path d="M36 22 Q34 16 30 12" stroke="#338BFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M39 22 Q36 13 30 8" stroke="#338BFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
      <rect x="14" y="14" width="16" height="16" rx="3" fill="url(#lg1)" filter="url(#glow)"/>
      <rect x="17" y="17" width="10" height="10" rx="1.5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
      <line x1="22" y1="17.5" x2="22" y2="26.5" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
      <line x1="17.5" y1="22" x2="26.5" y2="22" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
      <rect x="19" y="12" width="1.5" height="2.5" rx="0.5" fill="#338BFF"/>
      <rect x="23.5" y="12" width="1.5" height="2.5" rx="0.5" fill="#338BFF"/>
      <rect x="19" y="33.5" width="1.5" height="2.5" rx="0.5" fill="#338BFF"/>
      <rect x="23.5" y="33.5" width="1.5" height="2.5" rx="0.5" fill="#338BFF"/>
      <rect x="12" y="19" width="2.5" height="1.5" rx="0.5" fill="#338BFF"/>
      <rect x="12" y="23.5" width="2.5" height="1.5" rx="0.5" fill="#338BFF"/>
      <rect x="33.5" y="19" width="2.5" height="1.5" rx="0.5" fill="#338BFF"/>
      <rect x="33.5" y="23.5" width="2.5" height="1.5" rx="0.5" fill="#338BFF"/>
      <path d="M38 31 L38 37 Q38 41 34 43 Q30 41 30 37 L30 31 L34 29.5 Z" fill="url(#lg2)"/>
      <path d="M32 36.5 L33.8 38.2 L36.5 34" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── LoginPage ────────────────────────────────────────────────────────────── */
export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let t: any;
    if (cooldown > 0) t = setInterval(() => setCooldown(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true); setError(null);
    try {
      const hp = await hashPassword(password);
      const user = await sheetsClient.authenticate(email, hp);
      sessionStorage.setItem('userSession', JSON.stringify(user));
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
      setCooldown(5);
    } finally { setLoading(false); }
  };

  const inputBase: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0F172A' }}>
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0" style={{
        background:
          'radial-gradient(ellipse 55% 45% at 15% 25%, rgba(0,102,255,0.10) 0%, transparent 60%),' +
          'radial-gradient(ellipse 45% 55% at 85% 75%, rgba(0,82,204,0.07) 0%, transparent 60%),' +
          'radial-gradient(ellipse 35% 30% at 50% 50%, rgba(0,102,255,0.04) 0%, transparent 70%)',
      }}/>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">

        {/* ── Left: branding + illustration ──────────────────────────────── */}
        <aside className="hidden flex-col p-12 lg:flex">
          <div className="flex-none">
            <Link to="/" className="flex items-center gap-3">
              <SmartOfficeLogo size={48}/>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">IoT · ESP32 · NFC</p>
                <p className="text-xl font-bold tracking-tight text-white">Smart<span className="text-[#338BFF]">Office</span></p>
              </div>
            </Link>

            <div className="mt-10 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-[#0066ff] opacity-75"/>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0066ff]"/>
                </span>
                <span className="font-mono">3 thiết bị đang online</span>
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
                Chấm công bằng <span className="text-[#338BFF]">thẻ NFC</span>,<br/>
                quản lý theo thời gian thực.
              </h1>
              <p className="max-w-md text-sm text-slate-400">
                Quẹt thẻ — cửa mở — log gửi về dashboard. Theo dõi giờ vào,
                giờ ra và phát hiện đi trễ tự động cho từng phòng ban.
              </p>
            </div>
          </div>

          {/* Illustration */}
          <div className="flex flex-1 items-start pt-4">
            <div className="relative w-full max-w-lg select-none">
              <svg className="absolute -top-6 -right-4 opacity-25" width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                <circle cx="40" cy="40" r="12" stroke="#0066FF" strokeWidth="1.5"/>
                <circle cx="40" cy="40" r="22" stroke="#0066FF" strokeWidth="1" strokeDasharray="3 2"/>
                <circle cx="40" cy="40" r="33" stroke="#0066FF" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.6"/>
                <circle cx="40" cy="40" r="5" fill="#0066FF"/>
              </svg>
              <svg className="absolute -bottom-4 -left-2 opacity-15" width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
                {[0,1,2,3,4,5].map(r => [0,1,2,3,4,5].map(c => (
                  <circle key={`${r}-${c}`} cx={6+c*12} cy={6+r*12} r="2" fill="#0066FF"/>
                )))}
              </svg>
              <img src={loginIllustration} alt="Smart office illustration" className="w-full object-contain" draggable={false}/>
            </div>
          </div>

          <p className="flex-none font-mono text-xs text-slate-600">© 2026 Smart Office IoT — Đề tài tốt nghiệp</p>
        </aside>

        {/* ── Right: glassmorphism form ───────────────────────────────────── */}
        <main className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <SmartOfficeLogo size={40}/>
              <p className="text-lg font-bold text-white">Smart<span className="text-[#338BFF]">Office</span></p>
            </div>

            {/* Glass card */}
            <div className="rounded-2xl p-8" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 0 0 1px rgba(0,102,255,0.08), 0 8px 32px rgba(0,0,0,0.35), 0 0 60px rgba(0,102,255,0.06)',
              backdropFilter: 'blur(20px)',
            }}>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#338BFF]">· Auth Console</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Đăng nhập</h2>
              <p className="mt-1 text-sm text-slate-400">Quản trị viên hệ thống chấm công NFC.</p>

              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-slate-500">Tài khoản</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/>
                    <input
                      id="email" type="text" value={email} onChange={e => setEmail(e.target.value)}
                      autoComplete="username" placeholder="admin"
                      className="h-11 w-full rounded-lg pl-10 pr-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      style={inputBase}
                      onFocus={e => { e.target.style.border='1px solid rgba(0,102,255,0.6)'; e.target.style.boxShadow='0 0 0 3px rgba(0,102,255,0.15)'; }}
                      onBlur={e => { e.target.style.border='1px solid rgba(255,255,255,0.12)'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-slate-500">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/>
                    <input
                      id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password" placeholder="••••••••"
                      className="h-11 w-full rounded-lg pl-10 pr-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      style={inputBase}
                      onFocus={e => { e.target.style.border='1px solid rgba(0,102,255,0.6)'; e.target.style.boxShadow='0 0 0 3px rgba(0,102,255,0.15)'; }}
                      onBlur={e => { e.target.style.border='1px solid rgba(255,255,255,0.12)'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-500">
                    <input type="checkbox" className="h-3.5 w-3.5 accent-[#0066ff]" defaultChecked/>
                    Ghi nhớ phiên
                  </label>
                  <a className="text-[#338BFF] hover:underline" href="#">Quên mật khẩu?</a>
                </div>

                {error && (
                  <div className="rounded-lg p-3 text-sm text-red-400" style={{ background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.20)' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit" disabled={loading || cooldown > 0}
                  className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg font-medium text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
                  style={{ background:'linear-gradient(135deg,#0066ff,#0047cc)', boxShadow:'0 4px 20px rgba(0,102,255,0.40)' }}
                >
                  {loading ? 'Đang xác thực...' : cooldown > 0 ? `Thử lại sau ${cooldown}s` : 'Truy cập dashboard'}
                  {cooldown === 0 && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5"/>}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3 text-xs text-slate-600">
                <div className="h-px flex-1" style={{ background:'rgba(255,255,255,0.08)' }}/>
                <span className="font-mono uppercase tracking-wider">hoặc</span>
                <div className="h-px flex-1" style={{ background:'rgba(255,255,255,0.08)' }}/>
              </div>

              <button
                className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-lg text-sm font-medium text-slate-300 transition-all hover:bg-white/5"
                style={{ border:'1px solid rgba(255,255,255,0.10)' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-[#0066ff]"/>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0066ff]"/>
                </span>
                Quẹt thẻ NFC để đăng nhập
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-600">
              Cần hỗ trợ?{' '}
              <a className="text-[#338BFF] hover:underline" href="#">Liên hệ IT</a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
