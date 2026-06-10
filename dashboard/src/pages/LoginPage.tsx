import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { gsap } from "gsap";
import { Lock, User, ArrowRight } from "lucide-react";
import { hashPassword } from "../lib/crypto";
import { sheetsClient } from "../infrastructure/google-sheets.client";
import loginIllustration from "../assets/login-illustration.png";
import loginBackground from "../assets/login-background.png";

import { SmartOfficeLogo } from "../components/ui/SmartOfficeLogo";


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

  useEffect(() => {
    // Continuous animations (hover/floating background decorations)
    const floatAnim = gsap.to(".animate-svg-dots", {
      y: "+=12",
      x: "-=8",
      duration: 6,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });

    const rotateAnim = gsap.to(".animate-svg-radial", {
      rotate: 360,
      duration: 40,
      ease: "none",
      repeat: -1
    });

    return () => {
      floatAnim.kill();
      rotateAnim.kill();
    };
  }, []);

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


  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 lg:p-8 bg-background text-foreground font-sans overflow-hidden">
      {/* Background Image Overlay */}
      <div 
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-90 dark:opacity-80" 
        style={{ backgroundImage: `url(${loginBackground})` }}
      />
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 bg-radial-[circle_at_15%_15%,rgba(204,120,92,0.03),transparent_50%] bg-radial-[circle_at_80%_75%,rgba(108,106,100,0.04),transparent_50%]" />

      {/* Dynamic Background Network Lasers */}
      <svg className="absolute inset-0 pointer-events-none z-0 w-full h-full hidden md:block" viewBox="0 0 1920 1080" fill="none">
        <style>{`
          @keyframes bgNfcFlow {
            to {
              stroke-dashoffset: -80;
            }
          }
          @keyframes bgNfcPulse {
            0%, 100% {
              opacity: 0.04;
            }
            50% {
              opacity: 0.12;
            }
          }
          .bg-laser-dash-1 {
            stroke-dasharray: 12 20;
            animation: bgNfcFlow 5s linear infinite;
          }
          .bg-laser-dash-2 {
            stroke-dasharray: 10 24;
            animation: bgNfcFlow 7s linear infinite;
          }
          .bg-laser-dash-3 {
            stroke-dasharray: 15 25;
            animation: bgNfcFlow 6s linear infinite;
          }
          .bg-laser-dash-4 {
            stroke-dasharray: 8 18;
            animation: bgNfcFlow 8s linear infinite;
          }
          .bg-laser-glow {
            animation: bgNfcPulse 3s ease-in-out infinite;
          }
        `}</style>
        
        {/* Top Left Path */}
        <path 
          className="bg-laser-glow"
          d="M 100,-50 Q 350,200 150,450" 
          stroke="var(--primary)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          opacity="0.08"
          style={{ filter: "blur(3px)" }}
        />
        <path 
          className="bg-laser-dash-1"
          d="M 100,-50 Q 350,200 150,450" 
          stroke="var(--primary)" 
          strokeWidth="1" 
          strokeLinecap="round" 
          opacity="0.12"
        />

        {/* Bottom Left Path */}
        <path 
          className="bg-laser-glow"
          d="M -50,800 Q 300,700 450,950" 
          stroke="var(--primary)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          opacity="0.06"
          style={{ filter: "blur(3px)" }}
        />
        <path 
          className="bg-laser-dash-2"
          d="M -50,800 Q 300,700 450,950" 
          stroke="var(--primary)" 
          strokeWidth="1" 
          strokeLinecap="round" 
          opacity="0.1"
        />

        {/* Top Right Path */}
        <path 
          className="bg-laser-glow"
          d="M 1500,-50 Q 1350,300 1700,500" 
          stroke="var(--primary)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          opacity="0.07"
          style={{ filter: "blur(3px)" }}
        />
        <path 
          className="bg-laser-dash-3"
          d="M 1500,-50 Q 1350,300 1700,500" 
          stroke="var(--primary)" 
          strokeWidth="1" 
          strokeLinecap="round" 
          opacity="0.12"
        />

        {/* Bottom Right Path */}
        <path 
          className="bg-laser-glow"
          d="M 1400,1130 Q 1600,800 1970,900" 
          stroke="var(--primary)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          opacity="0.05"
          style={{ filter: "blur(3px)" }}
        />
        <path 
          className="bg-laser-dash-4"
          d="M 1400,1130 Q 1600,800 1970,900" 
          stroke="var(--primary)" 
          strokeWidth="1" 
          strokeLinecap="round" 
          opacity="0.09"
        />
      </svg>

      {/* Main Consolidated Portal Box */}
      <div className="relative z-10 w-full max-w-5xl bg-card/75 backdrop-blur-md rounded-2xl border border-border shadow-2xl overflow-hidden min-h-[620px] flex flex-col lg:flex-row">
        
        {/* ── Left Pane: branding + illustration ─────────────────────────── */}
        <div  className="hidden lg:flex flex-col justify-between p-12 lg:w-7/12 relative">
          <div className="flex-none">
            <Link to="/" className="flex items-center gap-3 animate-left-item">
              <SmartOfficeLogo size={48}/>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">IoT · ESP32 · NFC</p>
                <p className="text-xl font-serif font-bold tracking-tight text-foreground">Smart<span className="text-primary">Office</span></p>
              </div>
            </Link>

            <div className="mt-8 space-y-3.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-card animate-left-item">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-success opacity-75"/>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success"/>
                </span>
                <span className="font-mono">3 thiết bị đang online</span>
              </div>
              <h1 className="text-3xl font-serif font-bold leading-tight tracking-tight text-foreground animate-left-item">
                Chấm công bằng <span className="text-primary">thẻ NFC</span>,<br/>
                quản lý theo thời gian thực.
              </h1>
              <p className="max-w-md text-xs text-muted-foreground leading-relaxed animate-left-item">
                Quẹt thẻ — cửa mở — log gửi về dashboard. Theo dõi giờ vào,
                giờ ra và phát hiện đi trễ tự động cho từng phòng ban.
              </p>
            </div>
          </div>

          {/* Illustration aligned on the same horizontal level */}
          <div className="flex-1 flex items-center justify-center py-6">
            <div className="relative w-full max-w-sm select-none">
              <svg className="absolute -top-6 -right-4 animate-svg-radial opacity-25" width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                <circle cx="40" cy="40" r="12" stroke="var(--primary)" strokeWidth="1.5"/>
                <circle cx="40" cy="40" r="22" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3 2"/>
                <circle cx="40" cy="40" r="33" stroke="var(--primary)" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.6"/>
                <circle cx="40" cy="40" r="5" fill="var(--primary)"/>
              </svg>
              <svg className="absolute -bottom-4 -left-2 animate-svg-dots opacity-15" width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
                {[0,1,2,3,4,5].map(r => [0,1,2,3,4,5].map(c => (
                  <circle key={`${r}-${c}`} cx={6+c*12} cy={6+r*12} r="2" fill="var(--primary)"/>
                )))}
              </svg>
              <img src={loginIllustration} alt="Smart office illustration" className="animate-illustration w-full object-contain mix-blend-multiply dark:mix-blend-normal opacity-90 dark:opacity-85" draggable={false}/>
            </div>
          </div>

          <p className="flex-none font-mono text-[10px] text-muted-foreground/50 animate-left-item">© 2026 Smart Office IoT</p>
        </div>

        {/* ── Right Pane: form ───────────────────────────────────────────── */}
        <div className="flex flex-col justify-center p-8 lg:p-12 lg:w-5/12 bg-transparent relative">
          <div  className="w-full">
            {/* Mobile logo */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <SmartOfficeLogo size={40}/>
              <p className="text-lg font-serif font-bold text-foreground">Smart<span className="text-primary">Office</span></p>
            </div>

            {/* Editorial Header */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">· Auth Console</p>
              <h2 className="mt-2 text-2xl font-serif font-bold text-foreground">Đăng nhập</h2>
              <p className="mt-1 text-sm text-muted-foreground">Quản trị viên hệ thống chấm công NFC.</p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Tài khoản</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"/>
                  <input
                    id="email" type="text" value={email} onChange={e => setEmail(e.target.value)}
                    autoComplete="username" placeholder="admin"
                    className="h-11 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/45 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Mật khẩu</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"/>
                  <input
                    id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password" placeholder="••••••••"
                    className="h-11 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/45 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" className="h-3.5 w-3.5 accent-primary rounded border-border" defaultChecked/>
                  Ghi nhớ phiên
                </label>
                <a className="text-primary hover:underline" href="#">Quên mật khẩu?</a>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading || cooldown > 0}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-serif font-bold text-base transition-all hover:bg-primary/95 active:scale-[0.99] disabled:opacity-50 shadow-card cursor-pointer"
              >
                {loading ? 'Đang xác thực...' : cooldown > 0 ? `Thử lại sau ${cooldown}s` : 'Truy cập dashboard'}
                {cooldown === 0 && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5"/>}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground/50">
              <div className="h-px flex-1 bg-border/60"/>
              <span className="font-mono uppercase tracking-wider">hoặc</span>
              <div className="h-px flex-1 bg-border/60"/>
            </div>

            <button
              className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-md border border-border bg-background text-sm font-medium text-foreground transition-all hover:bg-muted/40 cursor-pointer shadow-card"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"/>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"/>
              </span>
              Quẹt thẻ NFC để đăng nhập
            </button>

            <p className="mt-6 text-center text-xs text-muted-foreground/60">
              Cần hỗ trợ?{' '}
              <a className="text-primary hover:underline" href="#">Liên hệ IT</a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
