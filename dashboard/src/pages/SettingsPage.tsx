import { useState } from "react";
import { Save, Server, DoorOpen, Bell, Shield, Info, CheckCircle2, Cpu, Key, User, Wifi, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearCache } from "../lib/dataCache";
import { useApp } from "../contexts/app-context";

type TabId = "connection" | "doors" | "notifications" | "admin" | "about";

export function SettingsPage() {
  const { t, lang } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>("connection");
  const [toast, setToast] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      return localStorage.getItem("smartoffice:settings:serverUrl") || import.meta.env.VITE_GAS_URL || "";
    }
    return import.meta.env.VITE_GAS_URL || "";
  });

  const handleSave = (sectionName: string) => {
    setToast(lang === "vi" ? `Đã lưu cấu hình ${sectionName} thành công` : `Saved ${sectionName} configuration successfully`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveConnection = () => {
    const trimmedUrl = serverUrl.trim();
    if (!trimmedUrl) {
      setToast(lang === "vi" ? "Lỗi: URL không được để trống" : "Error: URL cannot be empty");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (!trimmedUrl.startsWith("https://script.google.com/")) {
      setToast(lang === "vi" ? "Lỗi: URL phải bắt đầu bằng https://script.google.com/" : "Error: URL must start with https://script.google.com/");
      setTimeout(() => setToast(null), 4000);
      return;
    }

    try {
      localStorage.setItem("smartoffice:settings:serverUrl", trimmedUrl);
      clearCache();
      setToast(lang === "vi" ? "Đã lưu cấu hình kết nối hệ thống thành công và làm mới bộ nhớ đệm!" : "System connection configuration saved successfully and cache refreshed!");
    } catch (err: any) {
      setToast((lang === "vi" ? "Lỗi khi lưu cấu hình: " : "Error saving configuration: ") + err.message);
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const { sheetsClient } = await import("../infrastructure/google-sheets.client");
      const res = await sheetsClient.seed();
      if (res.success) {
        setToast(lang === "vi" ? "Đã khởi tạo thành công dữ liệu chấm công 7 ngày trên Google Sheets!" : "Successfully initialized 7 days of mock attendance data on Google Sheets!");
      } else {
        setToast((lang === "vi" ? "Lỗi khởi tạo: " : "Initialization error: ") + res.message);
      }
    } catch (err: any) {
      setToast((lang === "vi" ? "Lỗi kết nối: " : "Connection error: ") + err.message);
    } finally {
      setSeeding(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const tabs = [
    { id: "connection" as const, label: t("settings.nav.connection"), icon: Server },
    { id: "doors" as const, label: t("settings.nav.doors"), icon: DoorOpen },
    { id: "notifications" as const, label: t("settings.notifications"), icon: Bell },
    { id: "admin" as const, label: t("settings.nav.admin"), icon: Shield },
    { id: "about" as const, label: t("settings.nav.about"), icon: Info },
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground px-3 mb-3">
          {t("settings.sidebar.title")}
        </h3>
        <nav className="flex flex-col space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Panel */}
      <div className="flex-1 space-y-6">
        {/* CONNECTION TAB */}
        {activeTab === "connection" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card shadow-card animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <div className="border-b border-border px-6 py-4 bg-background/50">
                <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                  <Server className="h-5 w-5" /> {t("settings.nav.connection")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("settings.connection.subtitle")}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("settings.connection.serverUrl")}</label>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("settings.connection.apiKey")}</label>
                  <input
                    type="password"
                    defaultValue="smart_office_2026_secret"
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none font-mono transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("settings.connection.timeout")}</label>
                  <input
                    type="number"
                    defaultValue={5000}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSaveConnection} className="gap-2">
                    <Save className="h-4 w-4" />
                    {t("settings.saveChanges")}
                  </Button>
                </div>
              </div>
            </div>

            {/* MOCK DATA SEEDING CARD */}
            <div className="rounded-lg border border-border bg-card shadow-card animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <div className="border-b border-border px-6 py-4 bg-background/50">
                <h2 className="font-serif text-lg font-semibold text-primary flex items-center gap-2">
                  <Database className="h-5 w-5" /> {t("settings.seed.title")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("settings.seed.subtitle")}</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("settings.seed.description")}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <span className="font-mono text-xs text-muted-foreground">Action: action=seed</span>
                  <Button 
                    onClick={handleSeedData} 
                    disabled={seeding}
                    variant="outline"
                    className="gap-2 border-primary/30 hover:border-primary text-primary hover:bg-primary/10"
                  >
                    <Cpu className="h-4 w-4" />
                    {seeding ? t("settings.seed.loading") : t("settings.seed.title")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOORS TAB */}
        {activeTab === "doors" && (
          <div className="rounded-lg border border-border bg-card shadow-card animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <div className="border-b border-border px-6 py-4 bg-background/50">
              <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                <DoorOpen className="h-5 w-5" /> {t("settings.nav.doors")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("settings.doors.subtitle")}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("settings.doors.servoOpen")}</label>
                  <input
                    type="number"
                    defaultValue={90}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("settings.doors.servoClose")}</label>
                  <input
                    type="number"
                    defaultValue={0}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("settings.doors.autoCloseTime")}</label>
                <input
                  type="number"
                  defaultValue={5}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={() => handleSave(t("settings.nav.doors"))} className="gap-2">
                  <Save className="h-4 w-4" />
                  {t("settings.saveChanges")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div className="rounded-lg border border-border bg-card shadow-card animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <div className="border-b border-border px-6 py-4 bg-background/50">
              <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                <Bell className="h-5 w-5" /> {t("settings.notifications.title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("settings.notifications.subtitle")}</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <input
                  id="notif-late"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-primary/20 mt-1 cursor-pointer"
                />
                <div>
                  <label htmlFor="notif-late" className="text-sm font-medium cursor-pointer">{t("settings.notif.late")}</label>
                  <p className="text-xs text-muted-foreground">{t("settings.notif.late.desc")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="notif-offline"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-primary/20 mt-1 cursor-pointer"
                />
                <div>
                  <label htmlFor="notif-offline" className="text-sm font-medium cursor-pointer">{t("settings.notif.offline")}</label>
                  <p className="text-xs text-muted-foreground">{t("settings.notif.offline.desc")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="notif-daily"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-primary/20 mt-1 cursor-pointer"
                />
                <div>
                  <label htmlFor="notif-daily" className="text-sm font-medium cursor-pointer">{t("settings.notif.daily")}</label>
                  <p className="text-xs text-muted-foreground">{t("settings.notif.daily.desc")}</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end border-t border-border/50">
                <Button onClick={() => handleSave(t("settings.notifications.title"))} className="gap-2">
                  <Save className="h-4 w-4" />
                  {t("settings.saveChanges")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN ACCOUNT TAB */}
        {activeTab === "admin" && (
          <div className="rounded-lg border border-border bg-card shadow-card animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <div className="border-b border-border px-6 py-4 bg-background/50">
              <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                <Shield className="h-5 w-5" /> {t("settings.admin.title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("settings.admin.subtitle")}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("settings.admin.fullname")}</label>
                  <input
                    type="text"
                    defaultValue="Trần Lê Thái"
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("settings.admin.email")}</label>
                  <input
                    type="email"
                    defaultValue="admin@gmail.com"
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="border-t border-border/50 pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Key className="h-4 w-4 text-muted-foreground" /> {t("settings.admin.changePassword")}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">{t("settings.admin.currentPassword")}</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">{t("settings.admin.newPassword")}</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">{t("settings.admin.confirmPassword")}</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end border-t border-border/50">
                <Button onClick={() => handleSave(t("settings.nav.admin"))} className="gap-2">
                  <Save className="h-4 w-4" />
                  {t("settings.admin.updateAccount")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === "about" && (
          <div className="rounded-lg border border-border bg-card shadow-card animate-in fade-in-50 slide-in-from-bottom-2 duration-300 p-6 space-y-6">
            <div className="flex flex-col items-center justify-center text-center py-6 border-b border-border/50">
              <div className="grid h-16 w-16 place-items-center rounded-lg bg-gradient-primary mb-4">
                <Cpu className="h-8 w-8 text-primary-foreground animate-pulse" />
              </div>
              <h2 className="font-serif text-xl font-bold tracking-tight">Smart Office Access Control Attendance</h2>
              <p className="text-xs font-mono text-muted-foreground mt-1">Version 1.0.0 · Build 2026-05</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs text-success font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                {t("settings.about.statusOk")}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Wifi className="h-4 w-4 text-primary" /> {t("settings.about.iotSpecs")}</h4>
                <ul className="text-xs space-y-2 text-muted-foreground font-mono">
                  <li className="flex justify-between"><span>{t("settings.about.mcuName")}</span> <span className="text-foreground">ESP32 DevKit V1</span></li>
                  <li className="flex justify-between"><span>{t("settings.about.nfcSensor")}</span> <span className="text-foreground">MFRC522 (RFID 13.56MHz)</span></li>
                  <li className="flex justify-between"><span>{t("settings.about.lockMotor")}</span> <span className="text-foreground">Servo SG90</span></li>
                  <li className="flex justify-between"><span>{t("settings.about.networkConnection")}</span> <span className="text-success font-medium">WiFi - Connected (98%)</span></li>
                </ul>
              </div>

              <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> {t("settings.about.devInfo")}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("settings.about.devDescription")}
                </p>
                <div className="mt-3 text-[11px] text-primary hover:underline font-mono cursor-pointer">
                  → {t("settings.about.viewDocs")}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex animate-in slide-in-from-bottom-5 items-center gap-3 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success shadow-card">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}
    </div>
  );
}
