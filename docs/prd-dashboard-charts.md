# PRD: Dashboard Overview — Chart Visualizations
**Project:** SmartOffice — IoT ESP32 Attendance System
**Version:** 1.1.0
**Status:** Ready for Development
**Last Updated:** 2026-05-13

---

## 1. Problem Statement

Dashboard overview lacks visual context. Current setup only shows raw numbers (4 stat cards). Admin cannot quickly see peak check-in times, overall punctuality health, weekly trends, or real-time hardware status. The lower half of the Overview page is completely empty, wasting prime screen real estate.

**Impact:** Admin must navigate to the "Chấm công" table and manually scan rows to extract insights that should be immediately visible at a glance.

---

## 2. Goals & Non-Goals

### Goals
- Transform the Overview page from a "numbers page" into a true **situational awareness dashboard**
- Enable admin to answer 4 key questions in under 5 seconds without leaving the page:
  1. *"When do most employees arrive?"*
  2. *"How is today's punctuality?"*
  3. *"Is this week better or worse than last week?"*
  4. *"Are all doors operational?"*

### Non-Goals
- Custom date range pickers (default: Today + last 7 days)
- Click-to-drill-down interactions inside charts
- Historical door status logs
- Export/download chart data

---

## 3. Solution

Implement 4 key visualizations in a new **Chart Section** below the existing stat cards on the Overview page.

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Stat Card ×4 — existing, untouched]                           │
├──────────────────────────────────────┬──────────────────────────┤
│                                      │                          │
│   HourlyAreaChart                    │  PunctualityDonutChart   │
│   col-span-8                         │  col-span-4              │
│                                      │                          │
├───────────────────────┬──────────────┴──────────────────────────┤
│                       │                                         │
│   WeeklyBarChart      │  DoorStatusGrid                         │
│   col-span-6          │  col-span-6                             │
│                       │                                         │
└───────────────────────┴─────────────────────────────────────────┘
```

---

## 4. User Stories

| ID | As an admin... | I want... | So that... |
|----|---------------|-----------|------------|
| US-01 | Admin | An area chart showing check-ins by hour of today | I can identify peak arrival times and adjust staffing or door schedules |
| US-02 | Admin | A donut chart of today's attendance statuses | I instantly know the daily compliance health without reading a table |
| US-03 | Admin | A stacked bar chart for the last 7 days | I can spot weekly punctuality trends (e.g. consistent lateness on Mondays) |
| US-04 | Admin | A status grid showing all 8 doors in real-time | I can verify all hardware is operational without checking device logs |

---

## 5. Acceptance Criteria

### US-01 — HourlyAreaChart
- [ ] Renders an area chart with X-axis = hours (07:00 → 19:00, 1-hour intervals)
- [ ] Y-axis = number of check-ins in that hour, minimum tick = 0
- [ ] Area fill uses gradient: `--accent-primary` (top) → `transparent` (bottom)
- [ ] Tooltip on hover shows: hour range, exact count (e.g. "08:00–09:00 · 12 lượt")
- [ ] If zero check-ins for the day, renders empty state (see Section 8)
- [ ] Chart title: "Lưu lượng check-in hôm nay"
- [ ] Subtitle: current date in `dd/MM/yyyy` format
- [ ] Refreshes every 30 seconds (aligned with existing sync interval)
- [ ] Responsive: minimum width 400px, collapses to full-width on screens < 1024px

### US-02 — PunctualityDonutChart
- [ ] Renders a donut chart with 3 segments: Đúng giờ, Trễ, Vắng
- [ ] Colors: Đúng giờ = `--accent-success`, Trễ = `--accent-warning`, Vắng = `--accent-danger`
- [ ] Center of donut displays: large % number (on-time rate) + label "Đúng giờ"
- [ ] Legend below chart: each item shows colored dot + label + count + percentage
- [ ] If total = 0 (no check-ins yet), center shows "--" and segments are all gray
- [ ] Chart title: "Tỷ lệ hôm nay"
- [ ] Tooltip on hover: segment name + count + percentage
- [ ] Does NOT animate on every data refresh (only on initial mount)

### US-03 — WeeklyBarChart
- [ ] Renders a stacked bar chart with X-axis = last 7 days (D-6 → Today)
- [ ] X-axis labels: short day name + date (e.g. "T2 · 07/05")
- [ ] Today's bar is visually distinguished: slightly brighter or with a top border accent
- [ ] Stacked segments per bar: Đúng giờ (bottom), Trễ (middle), Vắng (top)
- [ ] Colors match PunctualityDonutChart segments
- [ ] Y-axis = total employees per day
- [ ] Tooltip on hover shows breakdown: all 3 counts for that day
- [ ] Chart title: "Xu hướng 7 ngày"
- [ ] If a day has no data (weekend/holiday), bar renders empty with label intact

### US-04 — DoorStatusGrid
- [ ] Renders 8 door panels in a 4×2 grid layout
- [ ] Each panel displays: Door number ("Cửa 1"…"Cửa 8"), status dot, status label
- [ ] Status dot states:
  - Online/Open: green dot with `animate-pulse` CSS animation
  - Offline/Closed: gray dot, no animation
  - Error: red dot with faster pulse
- [ ] Status label text: "Hoạt động" / "Đóng" / "Lỗi"
- [ ] Panel background changes subtly per state (green tint / neutral / red tint)
- [ ] Grid title: "Trạng thái cửa" + subtitle "Realtime · cập nhật mỗi 2s"
- [ ] Refreshes every 2 seconds (matching existing system sync)
- [ ] Clicking a door panel does nothing (out of scope, no cursor-pointer)

---

## 6. Data Schema

### 6.1 Source Data (from `useAttendance` hook)
```typescript
// Existing attendance record shape
interface AttendanceRecord {
  uid: string;           // e.g. "NV01"
  name: string;
  shift_start: string;   // ISO time string, e.g. "2026-05-13T08:00:00"
  check_in_time: string; // ISO time string
  check_out_time: string;
  status: 'on_time' | 'late' | 'absent';
  date: string;          // "YYYY-MM-DD"
}
```

### 6.2 Derived Chart Data (pure transformation functions)

```typescript
// For HourlyAreaChart
interface HourlyBucket {
  hour: string;   // "07:00", "08:00", ..., "19:00"
  count: number;
}
// Function: groupCheckInsByHour(records: AttendanceRecord[]): HourlyBucket[]

// For PunctualityDonutChart
interface PunctualitySummary {
  on_time: number;
  late: number;
  absent: number;
  total: number;
  on_time_rate: number; // 0-100
}
// Function: getTodayPunctualitySummary(records: AttendanceRecord[]): PunctualitySummary

// For WeeklyBarChart
interface DailyBreakdown {
  date: string;       // "YYYY-MM-DD"
  label: string;      // "T2 · 07/05"
  on_time: number;
  late: number;
  absent: number;
  isToday: boolean;
}
// Function: getLast7DaysBreakdown(records: AttendanceRecord[]): DailyBreakdown[]

// For DoorStatusGrid
interface DoorStatus {
  id: number;         // 1-8
  label: string;      // "Cửa 1"
  status: 'online' | 'offline' | 'error';
}
// Function: getDoorStatuses(): DoorStatus[]  ← from IoT/hardware state
```

---

## 7. Component Props & TypeScript Interface

```typescript
// HourlyAreaChart.tsx
interface HourlyAreaChartProps {
  data: HourlyBucket[];
  isLoading?: boolean;
  className?: string;
}

// PunctualityDonutChart.tsx
interface PunctualityDonutChartProps {
  summary: PunctualitySummary;
  isLoading?: boolean;
  className?: string;
}

// WeeklyBarChart.tsx
interface WeeklyBarChartProps {
  data: DailyBreakdown[];
  isLoading?: boolean;
  className?: string;
}

// DoorStatusGrid.tsx
interface DoorStatusGridProps {
  doors: DoorStatus[];
  refreshInterval?: number; // default: 2000ms
  isLoading?: boolean;
  className?: string;
}
```

---

## 8. Error & Loading States

### Loading State
- All 4 chart components must render a **skeleton shimmer** while data is fetching
- Skeleton matches the approximate shape of the chart (area = horizontal bars, donut = circle, bar = vertical bars, grid = 8 squares)
- Use CSS animation: `background: linear-gradient(90deg, var(--bg-surface), var(--bg-elevated), var(--bg-surface))` with `background-size: 200%` keyframe sweep
- Loading prop: `isLoading={true}` → shows skeleton, hides chart

### Empty State (data loaded but empty)
| Chart | Empty State Behavior |
|-------|---------------------|
| HourlyAreaChart | Flat line at 0, subtitle: "Chưa có check-in hôm nay" |
| PunctualityDonutChart | Full gray ring, center shows "--", legend shows all zeros |
| WeeklyBarChart | Bars render with 0 height, x-axis labels still visible |
| DoorStatusGrid | All doors show "Đóng" / gray state |

### Error State (fetch failed)
- Each chart card shows an inline error block (not a full-page error)
- Icon: ⚠ + message: "Không thể tải dữ liệu" + button: "Thử lại"
- Error boundary wraps each chart independently — one failed chart does not crash others

---

## 9. Design Tokens (Required)

All chart colors **must** use these CSS variables. No hardcoded hex values in chart components.

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-primary` | `#3B82F6` | Area chart fill, primary bars |
| `--accent-success` | `#10B981` | Đúng giờ segment, door online |
| `--accent-warning` | `#F59E0B` | Trễ segment |
| `--accent-danger` | `#EF4444` | Vắng segment, door error |
| `--bg-surface` | `#111827` | Chart card background |
| `--bg-elevated` | `#1C2537` | Chart internal grid lines, skeleton |
| `--text-primary` | `#F1F5F9` | Chart titles, axis labels |
| `--text-secondary` | `#94A3B8` | Subtitles, tooltips secondary text |
| `--accent-glow` | `rgba(59,130,246,0.15)` | Card hover glow |

---

## 10. Implementation Plan

### Library
- **recharts** — already available in the project's React environment

### File Structure
```
src/
└── components/
    └── dashboard/
        ├── HourlyAreaChart.tsx
        ├── PunctualityDonutChart.tsx
        ├── WeeklyBarChart.tsx
        ├── DoorStatusGrid.tsx
        └── ChartSkeleton.tsx      ← shared skeleton component
└── lib/
    └── chart-transforms.ts        ← pure data transformation functions
└── hooks/
    └── useChartData.ts            ← extends useAttendance with derived data
```

### Implementation Order (recommended)
1. `chart-transforms.ts` — write and unit-test pure functions first
2. `useChartData.ts` — hook wrapping transforms + refresh intervals
3. `ChartSkeleton.tsx` — reusable skeleton
4. `DoorStatusGrid.tsx` — simplest, no recharts dependency
5. `PunctualityDonutChart.tsx`
6. `HourlyAreaChart.tsx`
7. `WeeklyBarChart.tsx`
8. Wire into Overview page with grid layout

---

## 11. Testing Decisions

### Unit Tests (chart-transforms.ts)
- `groupCheckInsByHour`: handles empty array, handles records outside 07-19 window, handles multiple check-ins in same hour
- `getTodayPunctualitySummary`: correctly filters by today's date, handles all-absent day
- `getLast7DaysBreakdown`: returns exactly 7 items, today is flagged `isToday: true`, handles days with no records (returns 0s, not undefined)

### Component Tests
- Shallow render each chart with mock data → no crash
- Render with `isLoading={true}` → skeleton visible, no chart element
- `DoorStatusGrid` with all 3 status variants → correct CSS class applied per door

### Integration
- On Overview page mount: all 4 charts render within 3 seconds on a mocked API
- `DoorStatusGrid` re-renders every 2s without full page refresh

---

## 12. Priority & Timeline

| Priority | Component | Estimated Effort |
|----------|-----------|-----------------|
| 🔴 P0 | `chart-transforms.ts` + `useChartData.ts` | 0.5 day |
| 🔴 P0 | `DoorStatusGrid` | 0.5 day |
| 🟡 P1 | `PunctualityDonutChart` | 0.5 day |
| 🟡 P1 | `HourlyAreaChart` | 1 day |
| 🔵 P2 | `WeeklyBarChart` | 1 day |
| 🔵 P2 | `ChartSkeleton` + error states | 0.5 day |

**Total estimate:** ~4 developer days

---

## 13. Out of Scope

- Custom date range pickers for charts
- Click-to-drill-down interactions inside charts
- Historical door status logs
- Chart data export (CSV/PNG)
- Mobile-specific layout (responsive minimum: 1024px wide)
- Dark/light theme toggle per chart

---

*Document owner: Admin / Tech Lead*
*Review required before implementation begins*