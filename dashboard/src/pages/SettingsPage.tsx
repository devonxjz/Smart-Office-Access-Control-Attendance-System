import { useState } from "react";
import { Save, Server, DoorOpen, Bell, Shield, Info, CheckCircle2, Cpu, Key, User, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

type TabId = "connection" | "doors" | "notifications" | "admin" | "about";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("connection");
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = (section: string) => {
    setToast(`Đã lưu cấu hình ${section} thành công`);
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = [
    { id: "connection" as const, label: "Kết nối hệ thống", icon: Server },
    { id: "doors" as const, label: "Cấu hình cửa", icon: DoorOpen },
    { id: "notifications" as const, label: "Thông báo", icon: Bell },
    { id: "admin" as const, label: "Tài khoản Admin", icon: Shield },
    { id: "about" as const, label: "Về hệ thống", icon: Info },
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground px-3 mb-3">
          Cài đặt hệ thống
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
                    ? "bg-primary text-primary-foreground shadow-glow scale-[1.02]"
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
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-lg shadow-card animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <div className="border-b border-border px-6 py-4 bg-background/30 backdrop-blur">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <Server className="h-5 w-5" /> Kết nối hệ thống
              </h2>
              <p className="text-sm text-muted-foreground">Cấu hình kết nối giữa phần cứng ESP32 và server.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL Server (Google Apps Script)</label>
                <input
                  type="text"
                  defaultValue="https://script.google.com/macros/s/AKfycbzKbFvZjt-XGVKX7bJhpv7TP_l4pOUsiox2jq_ffMYxmhW3fBwCiKOGxF97C1rPEJTYMw/exec"
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key Xác Thực</label>
                <input
                  type="password"
                  defaultValue="smart_office_2026_secret"
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none font-mono transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Timeout (ms)</label>
                <input
                  type="number"
                  defaultValue={5000}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={() => handleSave("Kết nối hệ thống")} className="gap-2">
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* DOORS TAB */}
        {activeTab === "doors" && (
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-lg shadow-card animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <div className="border-b border-border px-6 py-4 bg-background/30 backdrop-blur">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <DoorOpen className="h-5 w-5" /> Cấu hình cửa
              </h2>
              <p className="text-sm text-muted-foreground">Thiết lập tham số vật lý cho Servo và khóa điện từ.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Góc Servo Mở (độ)</label>
                  <input
                    type="number"
                    defaultValue={90}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Góc Servo Đóng (độ)</label>
                  <input
                    type="number"
                    defaultValue={0}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Thời gian mở tự động đóng lại (giây)</label>
                <input
                  type="number"
                  defaultValue={5}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={() => handleSave("Cấu hình cửa")} className="gap-2">
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-lg shadow-card animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <div className="border-b border-border px-6 py-4 bg-background/30 backdrop-blur">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <Bell className="h-5 w-5" /> Cấu hình thông báo
              </h2>
              <p className="text-sm text-muted-foreground">Tuỳ chỉnh thông báo cảnh báo và email báo cáo.</p>
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
                  <label htmlFor="notif-late" className="text-sm font-medium cursor-pointer">Cảnh báo nhân viên đi trễ</label>
                  <p className="text-xs text-muted-foreground">Gửi thông báo telegram hoặc email khi nhân viên đi muộn quá 15 phút.</p>
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
                  <label htmlFor="notif-offline" className="text-sm font-medium cursor-pointer">Cảnh báo thiết bị offline</label>
                  <p className="text-xs text-muted-foreground">Gửi cảnh báo tức thời khi thiết bị ESP32 mất kết nối internet quá 5 phút.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="notif-daily"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-primary/20 mt-1 cursor-pointer"
                />
                <div>
                  <label htmlFor="notif-daily" className="text-sm font-medium cursor-pointer">Báo cáo cuối ngày qua email</label>
                  <p className="text-xs text-muted-foreground">Tự động tổng hợp và gửi báo cáo chấm công của toàn công ty lúc 18:00 hàng ngày.</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end border-t border-border/50">
                <Button onClick={() => handleSave("Cấu hình thông báo")} className="gap-2">
                  <Save className="h-4 w-4" />
                  Lưu cấu hình
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN ACCOUNT TAB */}
        {activeTab === "admin" && (
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-lg shadow-card animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <div className="border-b border-border px-6 py-4 bg-background/30 backdrop-blur">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <Shield className="h-5 w-5" /> Tài khoản quản trị
              </h2>
              <p className="text-sm text-muted-foreground">Quản lý tài khoản đăng nhập hệ thống console.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Họ tên quản trị viên</label>
                  <input
                    type="text"
                    defaultValue="Trần Lê Thái"
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email / Username</label>
                  <input
                    type="email"
                    defaultValue="admin@gmail.com"
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="border-t border-border/50 pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Key className="h-4 w-4 text-muted-foreground" /> Đổi mật khẩu đăng nhập</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Mật khẩu mới</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Xác nhận mật khẩu mới</label>
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
                <Button onClick={() => handleSave("Tài khoản Admin")} className="gap-2">
                  <Save className="h-4 w-4" />
                  Cập nhật tài khoản
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === "about" && (
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-lg shadow-card animate-in fade-in-50 slide-in-from-bottom-2 duration-300 p-6 space-y-6">
            <div className="flex flex-col items-center justify-center text-center py-6 border-b border-border/50">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary shadow-glow mb-4">
                <Cpu className="h-8 w-8 text-primary-foreground animate-pulse" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Smart Office Access Control Attendance</h2>
              <p className="text-xs font-mono text-muted-foreground mt-1">Version 1.0.0 · Build 2026-05</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs text-success font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                Hệ thống hoạt động bình thường
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Wifi className="h-4 w-4 text-primary" /> Thông số thiết bị IoT</h4>
                <ul className="text-xs space-y-2 text-muted-foreground font-mono">
                  <li className="flex justify-between"><span>Tên vi điều khiển:</span> <span className="text-foreground">ESP32 DevKit V1</span></li>
                  <li className="flex justify-between"><span>Cảm biến NFC:</span> <span className="text-foreground">MFRC522 (RFID 13.56MHz)</span></li>
                  <li className="flex justify-between"><span>Động cơ khóa:</span> <span className="text-foreground">Servo SG90</span></li>
                  <li className="flex justify-between"><span>Kết nối mạng:</span> <span className="text-success font-medium">WiFi - Connected (98%)</span></li>
                </ul>
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Thông tin phát triển</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hệ thống được phát triển tích hợp hoàn chỉnh giữa phần cứng IoT (ESP32 quẹt thẻ NFC/RFID) và phần mềm điều khiển lưu trữ trực tiếp trên đám mây Google Sheets API thông qua Google Apps Script Web App.
                </p>
                <div className="mt-3 text-[11px] text-primary hover:underline font-mono cursor-pointer">
                  → Xem tài liệu hướng dẫn lắp đặt (ADR.md)
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
