import { useState } from "react";
import { Save, Server, DoorOpen, Bell, Shield, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Settings() {
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = (section: string) => {
    setToast(`Đã lưu cấu hình ${section} thành công`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0">
        <nav className="flex flex-col space-y-1">
          <button className="flex items-center gap-3 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground transition-colors">
            <Server className="h-4 w-4" />
            Kết nối hệ thống
          </button>
          <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
            <DoorOpen className="h-4 w-4" />
            Cấu hình cửa
          </button>
          <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
            <Bell className="h-4 w-4" />
            Thông báo
          </button>
          <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
            <Shield className="h-4 w-4" />
            Tài khoản Admin
          </button>
          <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
            <Info className="h-4 w-4" />
            Về hệ thống
          </button>
        </nav>
      </div>

      {/* Content Panel */}
      <div className="flex-1 space-y-6">
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-primary">Kết nối hệ thống</h2>
            <p className="text-sm text-muted-foreground">Cấu hình kết nối giữa phần cứng ESP32 và server.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL Server (Google Apps Script)</label>
              <input
                type="text"
                defaultValue="https://script.google.com/macros/s/..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key Xác Thực</label>
              <input
                type="password"
                defaultValue="smart_office_2026_secret"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Timeout (ms)</label>
              <input
                type="number"
                defaultValue={5000}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={() => handleSave('Kết nối hệ thống')} className="gap-2">
                <Save className="h-4 w-4" />
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-primary">Cấu hình cửa</h2>
            <p className="text-sm text-muted-foreground">Thiết lập tham số vật lý cho Servo và khóa.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Góc Servo Mở</label>
                <input
                  type="number"
                  defaultValue={90}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Góc Servo Đóng</label>
                <input
                  type="number"
                  defaultValue={0}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Thời gian mở tự động đóng lại (giây)</label>
              <input
                type="number"
                defaultValue={5}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={() => handleSave('Cấu hình cửa')} className="gap-2">
                <Save className="h-4 w-4" />
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
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
