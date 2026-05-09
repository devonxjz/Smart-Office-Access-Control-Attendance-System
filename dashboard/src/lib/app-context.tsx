import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";
type Lang = "vi" | "en";

const dict = {
  vi: {
    "nav.overview": "Tổng quan",
    "nav.attendance": "Chấm công",
    "nav.employees": "Nhân viên",
    "nav.settings": "Cài đặt",
    "nav.management": "Quản lý",
    "nav.logout": "Đăng xuất",
    "system.online": "Hệ thống online",
    "system.sync": "Sync: 2s · 8/8 cửa hoạt động",
    "search.placeholder": "Tìm nhân viên, UID thẻ...",
    "settings.title": "Cài đặt",
    "settings.subtitle": "Tuỳ chỉnh giao diện và ngôn ngữ hệ thống",
    "settings.appearance": "Giao diện",
    "settings.theme": "Chế độ hiển thị",
    "settings.theme.dark": "Tối",
    "settings.theme.light": "Sáng",
    "settings.language": "Ngôn ngữ",
    "settings.language.vi": "Tiếng Việt",
    "settings.language.en": "English",
    "attendance.title": "Chấm công",
    "attendance.subtitle": "Lịch sử quẹt thẻ NFC theo ngày",
    "attendance.date": "Ngày",
    "attendance.uid": "UID",
    "attendance.name": "Nhân viên",
    "attendance.dept": "Phòng ban",
    "attendance.checkin": "Vào",
    "attendance.checkout": "Ra",
    "attendance.status": "Trạng thái",
    "attendance.ontime": "Đúng giờ",
    "attendance.late": "Trễ",
    "attendance.absent": "Vắng",
    "employees.title": "Nhân viên",
    "employees.subtitle": "Danh sách nhân viên công ty",
    "employees.add": "Thêm nhân viên",
    "employees.uid": "UID thẻ NFC",
    "employees.name": "Họ và tên",
    "employees.dept": "Phòng ban",
    "employees.shift": "Giờ vào ca",
    "employees.email": "Email",
    "employees.status": "Trạng thái",
    "employees.active": "Đang làm việc",
    "employees.inactive": "Tạm nghỉ",
    "employees.search": "Tìm theo tên, UID, phòng ban...",
    "employees.actions": "Thao tác",
    "employees.delete": "Xoá",
    "employees.cancel": "Huỷ",
    "employees.save": "Lưu nhân viên",
    "employees.new": "Nhân viên mới",
    "employees.total": "Tổng nhân viên",
    "settings.profile": "Hồ sơ quản trị",
    "settings.profile.name": "Họ tên",
    "settings.profile.email": "Email",
    "settings.profile.role": "Vai trò",
    "settings.notifications": "Thông báo",
    "settings.notif.late": "Cảnh báo nhân viên đi trễ",
    "settings.notif.offline": "Cảnh báo thiết bị offline",
    "settings.notif.daily": "Báo cáo cuối ngày qua email",
    "settings.shift": "Ca làm việc",
    "settings.shift.start": "Giờ bắt đầu ca",
    "settings.shift.late": "Ngưỡng đi trễ (phút)",
    "settings.data": "Dữ liệu",
    "settings.data.export": "Xuất dữ liệu chấm công (CSV)",
    "settings.data.sync": "Đồng bộ Google Sheets ngay",
    "settings.saved": "Đã lưu",
  },
  en: {
    "nav.overview": "Overview",
    "nav.attendance": "Attendance",
    "nav.employees": "Employees",
    "nav.settings": "Settings",
    "nav.management": "Management",
    "nav.logout": "Logout",
    "system.online": "System online",
    "system.sync": "Sync: 2s · 8/8 doors active",
    "search.placeholder": "Search employee, card UID...",
    "settings.title": "Settings",
    "settings.subtitle": "Customize interface and language",
    "settings.appearance": "Appearance",
    "settings.theme": "Theme",
    "settings.theme.dark": "Dark",
    "settings.theme.light": "Light",
    "settings.language": "Language",
    "settings.language.vi": "Vietnamese",
    "settings.language.en": "English",
    "attendance.title": "Attendance",
    "attendance.subtitle": "NFC scan history by date",
    "attendance.date": "Date",
    "attendance.uid": "UID",
    "attendance.name": "Employee",
    "attendance.dept": "Department",
    "attendance.checkin": "Check-in",
    "attendance.checkout": "Check-out",
    "attendance.status": "Status",
    "attendance.ontime": "On time",
    "attendance.late": "Late",
    "attendance.absent": "Absent",
    "employees.title": "Employees",
    "employees.subtitle": "Company employee directory",
    "employees.add": "Add employee",
    "employees.uid": "NFC Card UID",
    "employees.name": "Full name",
    "employees.dept": "Department",
    "employees.shift": "Shift start",
    "employees.email": "Email",
    "employees.status": "Status",
    "employees.active": "Active",
    "employees.inactive": "Inactive",
    "employees.search": "Search by name, UID, department...",
    "employees.actions": "Actions",
    "employees.delete": "Delete",
    "employees.cancel": "Cancel",
    "employees.save": "Save employee",
    "employees.new": "New employee",
    "employees.total": "Total employees",
    "settings.profile": "Admin profile",
    "settings.profile.name": "Full name",
    "settings.profile.email": "Email",
    "settings.profile.role": "Role",
    "settings.notifications": "Notifications",
    "settings.notif.late": "Alert on late arrivals",
    "settings.notif.offline": "Alert on offline devices",
    "settings.notif.daily": "Daily report via email",
    "settings.shift": "Work shift",
    "settings.shift.start": "Shift start time",
    "settings.shift.late": "Late threshold (minutes)",
    "settings.data": "Data",
    "settings.data.export": "Export attendance (CSV)",
    "settings.data.sync": "Sync Google Sheets now",
    "settings.saved": "Saved",
  },
} as const;

type Key = keyof (typeof dict)["vi"];

interface AppCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [lang, setLangState] = useState<Lang>("vi");

  useEffect(() => {
    const t = (localStorage.getItem("theme") as Theme | null) ?? "dark";
    const l = (localStorage.getItem("lang") as Lang | null) ?? "vi";
    setThemeState(t);
    setLangState(l);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const t = (k: Key) => dict[lang][k] ?? k;

  return (
    <Ctx.Provider value={{ theme, setTheme: setThemeState, lang, setLang: setLangState, t }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
}
