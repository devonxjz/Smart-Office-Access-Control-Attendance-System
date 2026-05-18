import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Cpu,
  Settings,
  LogOut,
  Bell,
  Search,
  Sun,
  Moon,
  Languages,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useApp } from "../../contexts/app-context";
import { logout } from "../../features/auth/auth";

export function DashboardShell({
  children,
  searchPlaceholder,
}: {
  children: ReactNode;
  /** When set, renders a page-level search bar above the content */
  searchPlaceholder?: string;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t, theme, setTheme, lang, setLang } = useApp();
  const [openNotif, setOpenNotif] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const notifications = [
    { title: lang === "vi" ? "Cửa Engineering offline" : "Engineering door offline", time: "2m", tone: "destructive" },
    { title: lang === "vi" ? "Trần Thị B đi trễ" : "Tran Thi B arrived late", time: "12m", tone: "warning" },
    { title: lang === "vi" ? "Đồng bộ Google Sheets thành công" : "Google Sheets sync OK", time: "1h", tone: "success" },
  ];

  const nav = [
    { to: "/dashboard", label: t("nav.overview"), icon: LayoutDashboard },
    { to: "/dashboard/attendance", label: t("nav.attendance"), icon: ClipboardList },
    { to: "/dashboard/employees", label: t("nav.employees"), icon: Users },
    { to: "/dashboard/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background bg-glow">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl p-5 lg:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-3 transition-transform hover:scale-105">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Cpu className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              IoT · ESP32
            </p>
            <p className="text-sm font-semibold text-sidebar-foreground">SmartOffice</p>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("nav.management")}
          </p>
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground shadow-card"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-xl border border-sidebar-border bg-card/60 backdrop-blur-md p-4 shadow-sm transition-all hover:shadow-glow">
          <div className="mb-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="font-mono text-xs">{t("system.online")}</span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">{t("system.sync")}</p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </button>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Topbar — clean: only notification + avatar pushed to the right */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur-xl">
          <div className="flex-1" />

          {/* Language quick toggle */}
          <button
            onClick={() => setLang(lang === "vi" ? "en" : "vi")}
            className="hidden sm:flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:bg-accent"
            title={t("settings.language")}
          >
            <Languages className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono uppercase">{lang}</span>
          </button>

          {/* Theme quick toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card hover:bg-accent"
            title={t("settings.theme")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setOpenNotif((v) => !v)}
              className="relative grid h-10 w-10 place-items-center rounded-lg border border-border bg-card hover:bg-accent"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </button>
            {openNotif && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setOpenNotif(false)} />
                <div className="absolute right-0 top-12 z-40 w-80 rounded-xl border border-border bg-popover/80 backdrop-blur-2xl p-2 shadow-card animate-in fade-in zoom-in-95 duration-200">
                  <p className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {lang === "vi" ? "Thông báo" : "Notifications"}
                  </p>
                  <div className="space-y-1">
                    {notifications.map((n, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            n.tone === "destructive" ? "bg-destructive"
                            : n.tone === "warning" ? "bg-warning"
                            : "bg-success"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-snug">{n.title}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card/60 backdrop-blur-md pl-3 pr-2 py-1.5 shadow-sm transition-all hover:bg-card/80 cursor-pointer">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold leading-tight">Admin</p>
              <p className="font-mono text-[10px] leading-tight text-muted-foreground">
                admin@office.io
              </p>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-primary text-xs font-bold text-primary-foreground">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          {searchPlaceholder && (
            <div className="mb-6 relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-lg border border-border bg-card/60 backdrop-blur-md pl-10 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-card"
              />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
